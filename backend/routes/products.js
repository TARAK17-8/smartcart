const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");
const { requireAuth } = require("../middleware/auth");

// GET /api/products — List all products (public)
router.get("/", (req, res) => {
  try {
    const products = prepare("SELECT * FROM products ORDER BY name").all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/search?q= — Search products by name (public)
router.get("/search", (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const products = prepare("SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?) ORDER BY name").all(`%${q}%`);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — Create product (admin)
router.post("/", requireAuth, (req, res) => {
  try {
    const { name, category, unit_type, default_price } = req.body;
    if (!name) return res.status(400).json({ error: "Product name is required" });

    const result = prepare(
      "INSERT INTO products (name, category, unit_type, default_price) VALUES (?, ?, ?, ?)"
    ).run(name.trim(), category || "Grocery", unit_type || "kg", default_price || 0);

    const product = prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Product already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — Update product (admin)
router.put("/:id", requireAuth, (req, res) => {
  try {
    const { name, category, unit_type, default_price } = req.body;
    const id = parseInt(req.params.id);

    const existing = prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Product not found" });

    prepare(
      "UPDATE products SET name = ?, category = ?, unit_type = ?, default_price = ? WHERE id = ?"
    ).run(
      name || existing.name,
      category || existing.category,
      unit_type || existing.unit_type,
      default_price ?? existing.default_price,
      id
    );

    const updated = prepare("SELECT * FROM products WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — Delete product (admin)
router.delete("/:id", requireAuth, (req, res) => {
  try {
    const result = prepare("DELETE FROM products WHERE id = ?").run(parseInt(req.params.id));
    if (result.changes === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
