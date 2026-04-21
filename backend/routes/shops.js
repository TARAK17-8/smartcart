const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");
const { requireAuth, requireAdmin } = require("../middleware/auth");

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

// POST /api/shops — Create a new shop (public — for onboarding)
router.post("/", (req, res) => {
  try {
    const { name, latitude, longitude, shop_type, owner_name, phone, shop_photo, pan_image, aadhaar_image } = req.body;
    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ error: "Name, latitude, and longitude are required" });
    }

    // Check for duplicate shop name
    const existing = prepare("SELECT id FROM shops WHERE LOWER(name) = LOWER(?)").get(name.trim());
    if (existing) {
      return res.status(409).json({ error: "A shop with this name already exists" });
    }

    // Generate defaults for testing
    const defaultOwner = owner_name || ("Owner " + Math.floor(Math.random() * 9000 + 1000));
    const defaultPhone = phone || ("9" + String(Math.floor(Math.random() * 900000000 + 100000000)));

    const result = prepare(
      `INSERT INTO shops (name, latitude, longitude, shop_type, owner_name, phone, shop_photo, pan_image, aadhaar_image, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name.trim(), latitude, longitude,
      shop_type || 'General Store',
      defaultOwner,
      defaultPhone,
      shop_photo || '',
      pan_image || '',
      aadhaar_image || '',
      'validating'
    );
    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shops/:id — Update shop (shopkeeper can edit own shop, admin view-only)
router.put("/:id", requireAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = prepare("SELECT * FROM shops WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Shop not found" });

    // Admin cannot edit shop details (legal restriction)
    if (req.admin.role === "admin") {
      return res.status(403).json({ error: "Admin cannot edit shop details. Only shopkeepers can modify their shops." });
    }

    // Shopkeeper can only edit their own shop
    if (req.admin.role === "shopkeeper" && req.admin.username.toLowerCase() !== existing.name.toLowerCase()) {
      return res.status(403).json({ error: "You can only edit your own shop" });
    }

    const { name, latitude, longitude, shop_type, owner_name, phone } = req.body;

    prepare(
      "UPDATE shops SET name = ?, latitude = ?, longitude = ?, shop_type = ?, owner_name = ?, phone = ? WHERE id = ?"
    ).run(
      name || existing.name,
      latitude ?? existing.latitude,
      longitude ?? existing.longitude,
      shop_type || existing.shop_type,
      owner_name ?? existing.owner_name,
      phone ?? existing.phone,
      id
    );

    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(id);
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shops/:id/status — Change shop status (admin only)
router.put("/:id/status", requireAuth, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "validating", "approval_waiting"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be validating, approval_waiting, approved, or rejected." });
    }

    const id = parseInt(req.params.id);
    const existing = prepare("SELECT * FROM shops WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Shop not found" });

    prepare("UPDATE shops SET status = ? WHERE id = ?").run(status, id);
    const shop = prepare("SELECT * FROM shops WHERE id = ?").get(id);
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/shops/:id — Delete shop (admin only)
router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  try {
    const result = prepare("DELETE FROM shops WHERE id = ?").run(parseInt(req.params.id));
    if (result.changes === 0) return res.status(404).json({ error: "Shop not found" });
    res.json({ message: "Shop deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
