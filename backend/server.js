const express = require("express");
const cors = require("cors");
const { initDb, prepare } = require("./db/database");
const { seed } = require("./db/seed");
const { router: sseRouter } = require("./routes/sse");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/shops", require("./routes/shops"));
app.use("/api/products", require("./routes/products"));
app.use("/api/shop-products", require("./routes/shopProducts"));
app.use("/api/online", require("./routes/online"));
app.use("/api/compare", require("./routes/compare"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/events", sseRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SmartCart API is running" });
});

// Stats endpoint
app.get("/api/stats", (req, res) => {
  try {
    const shops = prepare("SELECT COUNT(*) as count FROM shops").get();
    const products = prepare("SELECT COUNT(*) as count FROM products").get();
    const shopProducts = prepare("SELECT COUNT(*) as count FROM shop_products").get();
    const onlineProducts = prepare("SELECT COUNT(*) as count FROM online_products").get();
    const orders = prepare("SELECT COUNT(*) as count FROM orders").get();

    res.json({
      shops: shops.count,
      products: products.count,
      shop_products: shopProducts.count,
      online_products: onlineProducts.count,
      orders: orders?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize DB (async), seed, then start server
async function start() {
  await initDb();
  seed();

  app.listen(PORT, () => {
    console.log(`\n🛒 SmartCart API running at http://localhost:${PORT}`);
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log(`   Stats:     http://localhost:${PORT}/api/stats`);
    console.log(`   Analytics: http://localhost:${PORT}/api/analytics`);
    console.log(`   Orders:    http://localhost:${PORT}/api/orders`);
    console.log(`   Auth:      http://localhost:${PORT}/api/auth/login\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
