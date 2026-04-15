const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");
const { requireAuth } = require("../middleware/auth");

// POST /api/orders — Place a new order (public)
router.post("/", (req, res) => {
  try {
    const { customer_name, phone, address, pincode, shop_id, items, total_price } = req.body;

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

    // Create order
    const itemsStr = typeof items === "string" ? items : JSON.stringify(items);
    const result = prepare(
      `INSERT INTO orders (customer_name, phone, address, pincode, shop_id, shop_name, items, total_price, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(customer_name, phone, address, pincode, shop_id, shop.name, itemsStr, total_price);

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

// GET /api/orders — List all orders (admin only)
router.get("/", requireAuth, (req, res) => {
  try {
    const { status, shop_id } = req.query;

    let query = "SELECT * FROM orders";
    const conditions = [];
    const params = [];

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

// PUT /api/orders/:id/status — Update order status (admin only)
router.put("/:id/status", requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);

    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const existing = prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Order not found" });

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

// GET /api/orders/:id — Get single order
router.get("/:id", (req, res) => {
  try {
    const order = prepare("SELECT * FROM orders WHERE id = ?").get(parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({
      ...order,
      items: JSON.parse(order.items || "[]"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
