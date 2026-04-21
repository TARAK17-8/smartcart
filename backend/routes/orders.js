const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");
const { requireAuth } = require("../middleware/auth");

// Valid order status flow: placed → accepted → out_for_delivery → delivered
const STATUS_FLOW = {
  placed: "accepted",
  accepted: "out_for_delivery",
  out_for_delivery: "delivered",
};

// Delivery agent name pool for simulation
const AGENT_NAMES = [
  "Ravi Kumar", "Suresh Reddy", "Venkat Rao", "Anil Babu",
  "Srinivas Murthy", "Prasad Naidu", "Kiran Varma", "Manoj Kumar",
  "Ramesh Chandra", "Vijay Shankar",
];

// Generate a simulated delivery agent
function generateDeliveryAgent() {
  const name = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  const phone = "9" + String(Math.floor(Math.random() * 900000000 + 100000000));
  return { name, phone };
}

// Haversine distance in km
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA in minutes: ~4 min per km + 5 min prep
function calculateETA(shopLat, shopLng, userLat, userLng) {
  if (!userLat || !userLng || !shopLat || !shopLng) return 30; // default 30 min
  const distance = haversineDistance(shopLat, shopLng, userLat, userLng);
  return Math.max(10, Math.round(distance * 4 + 5)); // min 10 minutes
}

// POST /api/orders — Place a new order (public)
router.post("/", (req, res) => {
  try {
    const { customer_name, phone, address, pincode, shop_id, items, total_price, user_lat, user_lng } = req.body;

    if (!customer_name || !phone || !address || !pincode || !shop_id || !items || !total_price) {
      return res.status(400).json({ error: "All fields are required: customer_name, phone, address, pincode, shop_id, items, total_price" });
    }

    // Validate shop exists
    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(shop_id);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Validate & deduct stock for each item
    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;

    for (const item of parsedItems) {
      const sp = prepare(
        "SELECT * FROM shop_products WHERE shop_id = ? AND product_id = ?"
      ).get(shop_id, item.product_id);

      if (!sp) {
        return res.status(400).json({ error: `Product ID ${item.product_id} not found in this shop` });
      }

      if (sp.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.product_name || "product"} (available: ${sp.stock_quantity}, requested: ${item.quantity})`,
        });
      }
    }

    // Deduct stock
    for (const item of parsedItems) {
      prepare(
        "UPDATE shop_products SET stock_quantity = stock_quantity - ?, last_updated = CURRENT_TIMESTAMP WHERE shop_id = ? AND product_id = ?"
      ).run(item.quantity, shop_id, item.product_id);
    }

    // Generate delivery agent & ETA
    const agent = generateDeliveryAgent();
    const eta = calculateETA(shop.latitude, shop.longitude, user_lat, user_lng);

    // Create order with status "placed"
    const itemsStr = typeof items === "string" ? items : JSON.stringify(items);
    const result = prepare(
      `INSERT INTO orders (customer_name, phone, address, pincode, shop_id, shop_name, items, total_price, order_status, estimated_delivery_time, delivery_agent_name, delivery_agent_phone, user_lat, user_lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'placed', ?, ?, ?, ?, ?)`
    ).run(
      customer_name, phone, address, pincode, shop_id, shop.name, itemsStr, total_price,
      eta, agent.name, agent.phone,
      user_lat || null, user_lng || null
    );

    const order = prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);

    res.status(201).json({
      message: "Order placed successfully!",
      order: {
        ...order,
        items: JSON.parse(order.items),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/track — Public order tracking by phone number
router.get("/track", (req, res) => {
  try {
    const { phone, order_id } = req.query;

    if (!phone && !order_id) {
      return res.status(400).json({ error: "Provide phone number or order_id to track" });
    }

    let orders;
    if (order_id) {
      const order = prepare("SELECT * FROM orders WHERE id = ?").get(parseInt(order_id));
      orders = order ? [order] : [];
    } else {
      orders = prepare("SELECT * FROM orders WHERE phone = ? ORDER BY id DESC").all(phone);
    }

    if (orders.length === 0) {
      return res.status(404).json({ error: "No orders found" });
    }

    // Enrich with shop location for map tracking
    const enriched = orders.map((o) => {
      const shop = prepare("SELECT latitude, longitude FROM shops WHERE id = ?").get(o.shop_id);
      return {
        ...o,
        items: JSON.parse(o.items || "[]"),
        shop_lat: shop?.latitude || null,
        shop_lng: shop?.longitude || null,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — List orders (admin sees all, shopkeeper sees only their own)
router.get("/", requireAuth, (req, res) => {
  try {
    const { status, shop_id } = req.query;
    const user = req.admin; // { username, role }

    let query = "SELECT * FROM orders";
    const conditions = [];
    const params = [];

    // Shopkeeper: ONLY see orders for their shop
    if (user.role === "shopkeeper") {
      conditions.push("LOWER(shop_name) = LOWER(?)");
      params.push(user.username);
    }

    if (status) {
      conditions.push("order_status = ?");
      params.push(status);
    }
    if (shop_id) {
      conditions.push("shop_id = ?");
      params.push(parseInt(shop_id));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY id DESC";

    const orders = prepare(query).all(...params);

    res.json(
      orders.map((o) => ({
        ...o,
        items: JSON.parse(o.items || "[]"),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status — Update order status (shopkeeper only for their orders)
router.put("/:id/status", requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    const user = req.admin;

    // Admin cannot modify order status — view only
    if (user.role === "admin") {
      return res.status(403).json({ error: "Admin cannot modify order status. Only the shopkeeper can manage fulfillment." });
    }

    const validStatuses = ["placed", "accepted", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const existing = prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Order not found" });

    // Shopkeeper can only update THEIR orders
    if (user.role === "shopkeeper" && existing.shop_name.toLowerCase() !== user.username.toLowerCase()) {
      return res.status(403).json({ error: "You can only manage orders for your own shop" });
    }

    // Validate status flow: placed → accepted → out_for_delivery → delivered
    if (status !== "cancelled") {
      const expectedNext = STATUS_FLOW[existing.order_status];
      if (expectedNext && status !== expectedNext) {
        return res.status(400).json({
          error: `Cannot change status from "${existing.order_status}" to "${status}". Expected next status: "${expectedNext}"`,
        });
      }
      if (existing.order_status === "delivered") {
        return res.status(400).json({ error: "Order is already delivered. No further changes allowed." });
      }
    }

    // If cancelling, restore stock
    if (status === "cancelled" && existing.order_status !== "cancelled") {
      const items = JSON.parse(existing.items || "[]");
      for (const item of items) {
        prepare(
          "UPDATE shop_products SET stock_quantity = stock_quantity + ? WHERE shop_id = ? AND product_id = ?"
        ).run(item.quantity, existing.shop_id, item.product_id);
      }
    }

    prepare("UPDATE orders SET order_status = ? WHERE id = ?").run(status, id);

    const updated = prepare("SELECT * FROM orders WHERE id = ?").get(id);
    res.json({
      ...updated,
      items: JSON.parse(updated.items || "[]"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — Get single order (public for tracking)
router.get("/:id", (req, res) => {
  try {
    const order = prepare("SELECT * FROM orders WHERE id = ?").get(parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Enrich with shop location
    const shop = prepare("SELECT latitude, longitude FROM shops WHERE id = ?").get(order.shop_id);

    res.json({
      ...order,
      items: JSON.parse(order.items || "[]"),
      shop_lat: shop?.latitude || null,
      shop_lng: shop?.longitude || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
