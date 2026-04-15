const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");
const { haversine } = require("../utils/haversine");
const { getPricing } = require("../services/pricingService");

const TRAVEL_COST_PER_KM = 5;

function parseDeliveryMinutes(timeStr) {
  if (!timeStr) return 9999;
  const lower = timeStr.toLowerCase();
  const nums = lower.match(/(\d+)/g);
  if (!nums || nums.length === 0) return 9999;
  const firstNum = parseInt(nums[0]);
  if (lower.includes("min")) return firstNum;
  if (lower.includes("hour")) return firstNum * 60;
  if (lower.includes("day")) return firstNum * 24 * 60;
  return firstNum;
}

// GET /api/compare?product=Rice&lat=17.6868&lng=83.2185&sort=cost
router.get("/", (req, res) => {
  try {
    const { product, lat, lng, sort } = req.query;
    if (!product) return res.status(400).json({ error: "Product name is required" });

    const userLat = parseFloat(lat) || 17.6868;
    const userLng = parseFloat(lng) || 83.2185;
    const sortBy = sort || "cost";

    const productRow = prepare("SELECT * FROM products WHERE LOWER(name) = LOWER(?)").get(product.trim());
    if (!productRow) return res.status(404).json({ error: `Product "${product}" not found` });

    // Get all shops selling this product (with stock info)
    const shopResults = prepare(
      `SELECT s.id, s.name, s.latitude, s.longitude,
              sp.price, sp.original_price, sp.discounted_price, sp.available,
              sp.stock_quantity, sp.min_threshold
       FROM shop_products sp
       JOIN shops s ON sp.shop_id = s.id
       WHERE sp.product_id = ? AND sp.available = 1
       ORDER BY sp.price`
    ).all(productRow.id);

    // Calculate offline options
    const offlineOptions = shopResults.map((shop) => {
      const effectivePrice = shop.discounted_price || shop.price;
      const distance = haversine(userLat, userLng, shop.latitude, shop.longitude);
      const distanceKm = Math.round(distance * 100) / 100;
      const travelCost = Math.round(distanceKm * TRAVEL_COST_PER_KM * 100) / 100;
      const totalCost = Math.round((effectivePrice + travelCost) * 100) / 100;

      const discountPercent = shop.original_price && shop.discounted_price
        ? Math.round(((shop.original_price - shop.discounted_price) / shop.original_price) * 100)
        : 0;

      // Stock status
      let stock_status = "in_stock";
      if (shop.stock_quantity <= 0) stock_status = "out_of_stock";
      else if (shop.stock_quantity <= (shop.min_threshold || 10)) stock_status = "low_stock";

      return {
        type: "offline",
        shop_id: shop.id,
        shop_name: shop.name,
        price: effectivePrice,
        original_price: shop.original_price || null,
        discounted_price: shop.discounted_price || null,
        discount_percent: discountPercent,
        distance_km: distanceKm,
        travel_cost: travelCost,
        total_cost: totalCost,
        latitude: shop.latitude,
        longitude: shop.longitude,
        unit_type: productRow.unit_type || "kg",
        stock_quantity: shop.stock_quantity,
        stock_status,
        product_id: productRow.id,
      };
    }).filter(o => o.stock_status !== "out_of_stock"); // exclude out of stock

    // Get online options via pricing service
    const pricingData = getPricing(product.trim());
    const onlineOptions = pricingData.map((item) => ({
      type: "online",
      platform: item.platform,
      price: item.price,
      delivery_fee: item.delivery_fee,
      delivery_cost: item.delivery_cost,
      delivery_time: item.delivery_time,
      buy_link: item.buy_link,
      total_cost: item.total_cost,
      unit_type: productRow.unit_type || "kg",
    }));

    // Combine & sort
    let allOptions = [...offlineOptions, ...onlineOptions];
    switch (sortBy) {
      case "distance":
        allOptions.sort((a, b) => {
          if (a.type === "online" && b.type === "online") return a.total_cost - b.total_cost;
          if (a.type === "online") return 1;
          if (b.type === "online") return -1;
          return a.distance_km - b.distance_km;
        });
        break;
      case "platform":
        allOptions.sort((a, b) => {
          if (a.type !== b.type) return a.type === "online" ? -1 : 1;
          return a.total_cost - b.total_cost;
        });
        break;
      default:
        allOptions.sort((a, b) => a.total_cost - b.total_cost);
    }

    // Best option
    const sortedByCost = [...allOptions].sort((a, b) => a.total_cost - b.total_cost);
    const bestOption = sortedByCost[0] || null;
    const secondBest = sortedByCost[1] || null;
    let savings = 0;
    if (bestOption && secondBest) {
      savings = Math.round((secondBest.total_cost - bestOption.total_cost) * 100) / 100;
    }

    // Cheapest online specifically
    const onlineSortedByCost = [...onlineOptions].sort((a, b) => a.total_cost - b.total_cost);
    const cheapestOnline = onlineSortedByCost[0] || null;

    // Fastest option
    const onlineSortedBySpeed = [...onlineOptions].sort(
      (a, b) => parseDeliveryMinutes(a.delivery_time) - parseDeliveryMinutes(b.delivery_time)
    );
    const nearestOffline = [...offlineOptions].sort((a, b) => a.distance_km - b.distance_km)[0];
    let fastestOption = onlineSortedBySpeed[0] || null;
    if (nearestOffline && nearestOffline.distance_km <= 1.0) {
      fastestOption = { ...nearestOffline, delivery_time: "Instant (walk-in)" };
    }

    // Best value
    const bestValueScored = allOptions.map((opt) => {
      const deliveryMin = opt.type === "online"
        ? parseDeliveryMinutes(opt.delivery_time)
        : Math.max(opt.distance_km * 5, 2);
      return { ...opt, _score: opt.total_cost + deliveryMin * 0.5 };
    });
    bestValueScored.sort((a, b) => a._score - b._score);
    const bestValueOption = bestValueScored[0] || null;

    // Explanation
    let explanation = "";
    if (bestOption) {
      const cheapName = bestOption.type === "offline" ? bestOption.shop_name : bestOption.platform;
      const comparisons = sortedByCost.slice(1, 4).map((opt) => {
        const name = opt.type === "offline" ? opt.shop_name : opt.platform;
        const diff = Math.round((opt.total_cost - bestOption.total_cost) * 100) / 100;
        return `₹${diff} compared to ${name}`;
      });
      explanation = comparisons.length > 0
        ? `Buy from ${cheapName} and save ${comparisons.join(" and ")}.`
        : `${cheapName} offers the best price at ₹${bestOption.total_cost}.`;
    }

    // Analytics tracking
    try {
      if (bestOption) {
        const cheapName = bestOption.type === "offline" ? bestOption.shop_name : bestOption.platform;
        prepare(
          "INSERT INTO analytics (product, cheapest_type, cheapest_name, savings) VALUES (?, ?, ?, ?)"
        ).run(productRow.name, bestOption.type === "offline" ? "local" : "online", cheapName, savings);
      }
    } catch (e) {}

    res.json({
      product: productRow.name,
      product_id: productRow.id,
      unit_type: productRow.unit_type || "kg",
      user_location: { lat: userLat, lng: userLng },
      travel_rate_per_km: TRAVEL_COST_PER_KM,
      disclaimer: "Prices are indicative and may vary slightly.",
      offline_options: offlineOptions.sort((a, b) => a.total_cost - b.total_cost),
      online_options: onlineOptions.sort((a, b) => a.total_cost - b.total_cost),
      all_options_sorted: allOptions,
      best_option: bestOption ? {
        ...bestOption,
        savings,
        recommendation: bestOption.type === "offline"
          ? `Buy from ${bestOption.shop_name} — Save ₹${savings}`
          : `Buy from ${bestOption.platform} Online — Save ₹${savings}`,
      } : null,
      total_offline: offlineOptions.length,
      total_online: onlineOptions.length,
      recommendations: {
        cheapest_option: bestOption ? {
          name: bestOption.type === "offline" ? bestOption.shop_name : bestOption.platform,
          type: bestOption.type, total_cost: bestOption.total_cost,
        } : null,
        cheapest_online: cheapestOnline ? {
          name: cheapestOnline.platform, type: "online",
          total_cost: cheapestOnline.total_cost,
        } : null,
        fastest_option: fastestOption ? {
          name: fastestOption.type === "offline" ? fastestOption.shop_name : fastestOption.platform,
          type: fastestOption.type, total_cost: fastestOption.total_cost,
          delivery_time: fastestOption.delivery_time,
        } : null,
        best_value: bestValueOption ? {
          name: bestValueOption.type === "offline" ? bestValueOption.shop_name : bestValueOption.platform,
          type: bestValueOption.type, total_cost: bestValueOption.total_cost,
          delivery_time: bestValueOption.delivery_time || "Walk-in",
        } : null,
        explanation,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
