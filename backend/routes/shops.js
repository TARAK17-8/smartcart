const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");

// GET /api/shops — List all shops
router.get("/", (req, res) => {
  try {
    const shops = prepare("SELECT * FROM shops ORDER BY name").all();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shops/:id — Get single shop with products
router.get("/:id", (req, res) => {
  try {
    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(parseInt(req.params.id));
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    const products = prepare(
      `SELECT sp.*, p.name as product_name, p.category 
       FROM shop_products sp 
       JOIN products p ON sp.product_id = p.id 
       WHERE sp.shop_id = ? 
       ORDER BY p.name`
    ).all(parseInt(req.params.id));

    res.json({ ...shop, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shops — Create a new shop
router.post("/", (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ error: "Name, latitude, and longitude are required" });
    }

    const result = prepare("INSERT INTO shops (name, latitude, longitude) VALUES (?, ?, ?)").run(name, latitude, longitude);
    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shops/:id — Update shop
router.put("/:id", (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    const id = parseInt(req.params.id);

    const existing = prepare("SELECT * FROM shops WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Shop not found" });

    prepare("UPDATE shops SET name = ?, latitude = ?, longitude = ? WHERE id = ?").run(
      name || existing.name,
      latitude ?? existing.latitude,
      longitude ?? existing.longitude,
      id
    );

    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(id);
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/shops/:id — Delete shop
router.delete("/:id", (req, res) => {
  try {
    const result = prepare("DELETE FROM shops WHERE id = ?").run(parseInt(req.params.id));
    if (result.changes === 0) return res.status(404).json({ error: "Shop not found" });
    res.json({ message: "Shop deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
