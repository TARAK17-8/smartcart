const { getDb, prepare, saveDb } = require("./database");

// Base location: Gajuwaka, Visakhapatnam
const BASE_LAT = 17.6868;
const BASE_LNG = 83.2185;

const SHOP_NAMES = [
  "Sri Lakshmi Kirana Store", "Annapurna Mart", "Sai Ram Groceries",
  "Venkateshwara Super Market", "Gajuwaka Fresh Mart", "Durga General Stores",
  "Mahalakshmi Provisions", "Balaji Kirana & General", "Rama Krishna Stores",
  "Srinivasa Groceries", "Visakha Daily Needs", "Jagadamba Provisions",
  "Parvathi General Store", "Naidu Kirana Bazaar", "Ravi Teja Mart",
  "Sri Ganesh Groceries", "Padmavathi Stores", "Gopala Krishna Mart",
  "Ayyappa General Stores", "MVR Super Market", "Tirumala Provisions",
  "Sai Baba Kirana Store", "Lakshmi Narasimha Mart", "Peddapuram Groceries",
  "Andhra Kirana Store", "Swathi Super Bazaar", "Hari Om Provisions",
  "Bhavani General Store", "Chaitanya Mart", "Suresh Kirana Center",
  "Madhavi Groceries", "Prakash Provisions", "Arun Daily Fresh",
  "Komali Super Store", "Devi Kirana House", "Sarada Provisions",
  "KLM Grocery Mart", "Nandini General Store", "Vijaya Lakshmi Mart",
  "Royal Kirana Bazaar",
];

// ============================================================
// 32 unique products across 10 balanced categories
// ============================================================
const PRODUCTS = [
  // Grains (4)
  { name: "Rice",         category: "Grains",      unit_type: "kg",    default_price: 55 },
  { name: "Wheat Flour",  category: "Grains",      unit_type: "kg",    default_price: 42 },
  { name: "Poha",         category: "Grains",      unit_type: "kg",    default_price: 48 },
  { name: "Rava",         category: "Grains",      unit_type: "kg",    default_price: 44 },

  // Dairy (4)
  { name: "Milk",         category: "Dairy",       unit_type: "litre", default_price: 30 },
  { name: "Eggs",         category: "Dairy",       unit_type: "unit",  default_price: 6 },
  { name: "Curd",         category: "Dairy",       unit_type: "kg",    default_price: 50 },
  { name: "Paneer",       category: "Dairy",       unit_type: "kg",    default_price: 320 },

  // Cooking (3)
  { name: "Oil",          category: "Cooking",     unit_type: "litre", default_price: 140 },
  { name: "Ghee",         category: "Cooking",     unit_type: "kg",    default_price: 550 },
  { name: "Butter",       category: "Cooking",     unit_type: "unit",  default_price: 55 },

  // Essentials (4)
  { name: "Sugar",        category: "Essentials",  unit_type: "kg",    default_price: 45 },
  { name: "Salt",         category: "Essentials",  unit_type: "kg",    default_price: 20 },
  { name: "Tea",          category: "Essentials",  unit_type: "kg",    default_price: 280 },
  { name: "Coffee",       category: "Essentials",  unit_type: "kg",    default_price: 420 },

  // Vegetables (4)
  { name: "Onions",       category: "Vegetables",  unit_type: "kg",    default_price: 35 },
  { name: "Tomatoes",     category: "Vegetables",  unit_type: "kg",    default_price: 30 },
  { name: "Potatoes",     category: "Vegetables",  unit_type: "kg",    default_price: 28 },
  { name: "Green Chillies", category: "Vegetables", unit_type: "kg",   default_price: 60 },

  // Pulses (3)
  { name: "Dal",          category: "Pulses",      unit_type: "kg",    default_price: 110 },
  { name: "Chana Dal",    category: "Pulses",      unit_type: "kg",    default_price: 95 },
  { name: "Rajma",        category: "Pulses",      unit_type: "kg",    default_price: 130 },

  // Fruits (3)
  { name: "Bananas",      category: "Fruits",      unit_type: "unit",  default_price: 5 },
  { name: "Apples",       category: "Fruits",      unit_type: "kg",    default_price: 180 },
  { name: "Oranges",      category: "Fruits",      unit_type: "kg",    default_price: 80 },

  // Spices (3)
  { name: "Turmeric",     category: "Spices",      unit_type: "kg",    default_price: 160 },
  { name: "Red Chilli Powder", category: "Spices", unit_type: "kg",    default_price: 200 },
  { name: "Cumin Seeds",  category: "Spices",      unit_type: "kg",    default_price: 320 },

  // Bakery & Snacks (2)
  { name: "Bread",        category: "Bakery",      unit_type: "unit",  default_price: 40 },
  { name: "Biscuits",     category: "Snacks",      unit_type: "unit",  default_price: 30 },

  // Beverages (2)
  { name: "Juice",        category: "Beverages",   unit_type: "litre", default_price: 90 },
  { name: "Mineral Water", category: "Beverages",  unit_type: "litre", default_price: 20 },
];

// 6 online platforms with realistic pricing characteristics
const ONLINE_PLATFORMS = [
  {
    name: "Blinkit",
    delivery_time: "10-15 min",
    markup_range: [0.05, 0.25],     // quick-delivery premium
    delivery_range: [25, 50],
    buy_link_template: "https://blinkit.com/s/?q=",
  },
  {
    name: "Swiggy Instamart",
    delivery_time: "15-25 min",
    markup_range: [0.03, 0.20],
    delivery_range: [20, 45],
    buy_link_template: "https://www.swiggy.com/instamart/search?q=",
  },
  {
    name: "BigBasket",
    delivery_time: "2-4 hours",
    markup_range: [-0.05, 0.15],    // competitive
    delivery_range: [30, 60],
    buy_link_template: "https://www.bigbasket.com/ps/?q=",
  },
  {
    name: "JioMart",
    delivery_time: "3-5 hours",
    markup_range: [-0.08, 0.12],    // aggressive pricing
    delivery_range: [25, 55],
    buy_link_template: "https://www.jiomart.com/search/",
  },
  {
    name: "Amazon",
    delivery_time: "1-2 days",
    markup_range: [-0.05, 0.20],
    delivery_range: [40, 80],
    buy_link_template: "https://www.amazon.in/s?k=",
  },
  {
    name: "Flipkart",
    delivery_time: "1-2 days",
    markup_range: [-0.03, 0.18],
    delivery_range: [35, 70],
    buy_link_template: "https://www.flipkart.com/search?q=",
  },
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateShopCoordinates(index) {
  const angle = (index / 40) * 2 * Math.PI + Math.random() * 0.5;
  const radiusDeg = randomBetween(0.005, 0.08);
  return {
    latitude: BASE_LAT + radiusDeg * Math.sin(angle),
    longitude: BASE_LNG + radiusDeg * Math.cos(angle),
  };
}

/**
 * Ensure a product exists in the DB. If it already exists (case-insensitive),
 * optionally update its fields. Returns the product ID.
 */
function ensureProduct(product) {
  const existing = prepare(
    "SELECT * FROM products WHERE LOWER(name) = LOWER(?)"
  ).get(product.name.trim());

  if (existing) {
    // Update fields if they differ
    prepare(
      "UPDATE products SET category = ?, unit_type = ?, default_price = ? WHERE id = ?"
    ).run(
      product.category || existing.category,
      product.unit_type || existing.unit_type,
      product.default_price ?? existing.default_price,
      existing.id
    );
    return existing.id;
  }

  // Insert new product
  const res = prepare(
    "INSERT INTO products (name, category, unit_type, default_price) VALUES (?, ?, ?, ?)"
  ).run(product.name.trim(), product.category, product.unit_type, product.default_price);

  return res.lastInsertRowid;
}

/**
 * Ensure online pricing exists for a product on a given platform.
 * Deduplicates by product name + platform (case-insensitive).
 */
function ensureOnlineProduct(productName, platform, price, deliveryCost, deliveryTime, buyLink) {
  const existing = prepare(
    "SELECT id FROM online_products WHERE LOWER(name) = LOWER(?) AND LOWER(platform) = LOWER(?)"
  ).get(productName.trim(), platform);

  if (existing) {
    // Update price data
    prepare(
      "UPDATE online_products SET price = ?, delivery_cost = ?, delivery_time = ?, buy_link = ? WHERE id = ?"
    ).run(price, deliveryCost, deliveryTime, buyLink, existing.id);
    return;
  }

  prepare(
    "INSERT INTO online_products (name, platform, price, delivery_cost, delivery_time, buy_link) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(productName.trim(), platform, price, deliveryCost, deliveryTime, buyLink);
}

function seed() {
  const db = getDb();

  // Check if shops already seeded
  const shopCount = prepare("SELECT COUNT(*) as count FROM shops").get();
  const shopsExist = shopCount && shopCount.count > 0;

  if (!shopsExist) {
    console.log("🌱 Seeding database...\n");

    // ---- SHOPS ----
    for (let i = 0; i < SHOP_NAMES.length; i++) {
      const coords = generateShopCoordinates(i);
      const ownerName = "Owner " + Math.floor(Math.random() * 9000 + 1000);
      const phoneNumber = "9" + String(Math.floor(Math.random() * 900000000 + 100000000));
      prepare(
        "INSERT INTO shops (name, latitude, longitude, owner_name, phone, status) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(
        SHOP_NAMES[i], coords.latitude, coords.longitude,
        ownerName, phoneNumber, 'approved'
      );
    }
    console.log(`✅ Inserted ${SHOP_NAMES.length} shops (all approved for testing)`);
  }

  // ---- PRODUCTS (with deduplication) ----
  const existingCount = prepare("SELECT COUNT(*) as count FROM products").get();
  const beforeCount = existingCount?.count || 0;

  const productIds = {};
  let newProductCount = 0;
  let updatedProductCount = 0;

  for (const product of PRODUCTS) {
    const existing = prepare("SELECT * FROM products WHERE LOWER(name) = LOWER(?)").get(product.name.trim());
    if (existing) {
      updatedProductCount++;
    } else {
      newProductCount++;
    }
    productIds[product.name] = ensureProduct(product);
  }

  const afterCount = prepare("SELECT COUNT(*) as count FROM products").get()?.count || 0;
  console.log(`✅ Products: ${afterCount} total (${newProductCount} new, ${updatedProductCount} updated, was ${beforeCount})`);

  // ---- SHOP-PRODUCTS (only for shops without products) ----
  if (!shopsExist) {
    const shops = prepare("SELECT id FROM shops").all();
    for (const shop of shops) {
      const numProducts = Math.floor(randomBetween(8, Math.min(PRODUCTS.length + 1, 18)));
      const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
      const shopProducts = shuffled.slice(0, numProducts);

      for (const product of shopProducts) {
        const basePrice = product.default_price;
        const priceVariation = basePrice * randomBetween(-0.2, 0.2);
        const price = Math.round((basePrice + priceVariation) * 100) / 100;
        const available = Math.random() > 0.08 ? 1 : 0;
        const stockQuantity = Math.round(randomBetween(10, 200));
        const minThreshold = Math.round(randomBetween(5, 20));

        let originalPrice = null;
        let discountedPrice = null;
        if (Math.random() < 0.3) {
          originalPrice = price;
          discountedPrice = Math.round(price * (1 - randomBetween(0.10, 0.25)) * 100) / 100;
        }

        const pId = productIds[product.name];
        // Check for duplicates
        const exists = prepare(
          "SELECT id FROM shop_products WHERE shop_id = ? AND product_id = ?"
        ).get(shop.id, pId);

        if (!exists) {
          prepare(
            `INSERT INTO shop_products (shop_id, product_id, price, original_price, discounted_price, available, stock_quantity, min_threshold)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(shop.id, pId, discountedPrice || price, originalPrice, discountedPrice, available, stockQuantity, minThreshold);
        }
      }
    }
    console.log(`✅ Assigned products to ${shops.length} shops (8-17 per shop)`);
  } else {
    // For existing shops, add newly added products to ~60% of shops
    const shops = prepare("SELECT id FROM shops").all();
    let assignmentCount = 0;

    for (const product of PRODUCTS) {
      const pId = productIds[product.name];

      // Check how many shops already carry this product
      const carrying = prepare("SELECT COUNT(*) as count FROM shop_products WHERE product_id = ?").get(pId);
      const targetShops = Math.max(Math.floor(shops.length * 0.5), 15); // at least 50% of shops

      if (carrying.count < targetShops) {
        const deficit = targetShops - carrying.count;
        // Find shops NOT carrying this product
        const availableShops = prepare(
          `SELECT s.id FROM shops s WHERE s.id NOT IN (SELECT shop_id FROM shop_products WHERE product_id = ?) ORDER BY RANDOM() LIMIT ?`
        ).all(pId, deficit);

        for (const shop of availableShops) {
          const basePrice = product.default_price;
          const price = Math.round((basePrice + basePrice * randomBetween(-0.2, 0.2)) * 100) / 100;
          const stockQuantity = Math.round(randomBetween(10, 200));
          const minThreshold = Math.round(randomBetween(5, 20));

          let originalPrice = null;
          let discountedPrice = null;
          if (Math.random() < 0.3) {
            originalPrice = price;
            discountedPrice = Math.round(price * (1 - randomBetween(0.10, 0.25)) * 100) / 100;
          }

          prepare(
            `INSERT INTO shop_products (shop_id, product_id, price, original_price, discounted_price, available, stock_quantity, min_threshold)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(shop.id, pId, discountedPrice || price, originalPrice, discountedPrice, 1, stockQuantity, minThreshold);
          assignmentCount++;
        }
      }
    }

    if (assignmentCount > 0) {
      console.log(`✅ Assigned ${assignmentCount} new product-shop associations`);
    }
  }

  // ---- ONLINE PRODUCTS (with deduplication) ----
  const onlineBefore = prepare("SELECT COUNT(*) as count FROM online_products").get()?.count || 0;

  for (const product of PRODUCTS) {
    for (const platform of ONLINE_PLATFORMS) {
      const basePrice = product.default_price;
      const onlineMarkup = basePrice * randomBetween(platform.markup_range[0], platform.markup_range[1]);
      const price = Math.round((basePrice + onlineMarkup) * 100) / 100;
      const deliveryCost = Math.round(randomBetween(platform.delivery_range[0], platform.delivery_range[1]) * 100) / 100;
      const buyLink = platform.buy_link_template + encodeURIComponent(product.name);

      ensureOnlineProduct(product.name, platform.name, price, deliveryCost, platform.delivery_time, buyLink);
    }
  }

  const onlineAfter = prepare("SELECT COUNT(*) as count FROM online_products").get()?.count || 0;
  console.log(`✅ Online products: ${onlineAfter} total (was ${onlineBefore})`);

  // ---- SUMMARY ----
  const categorySummary = prepare(
    "SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC"
  ).all();
  console.log("\n📊 Category Distribution:");
  for (const cat of categorySummary) {
    console.log(`   ${cat.category}: ${cat.count} products`);
  }

  saveDb();
  console.log(`\n🎉 Database ready! ${afterCount} products × ${ONLINE_PLATFORMS.length} platforms = ${afterCount * ONLINE_PLATFORMS.length} online entries`);
}

// Run if called directly
if (require.main === module) {
  const { initDb } = require("./database");
  initDb().then(() => seed());
}

module.exports = { seed };
