const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");
const { broadcast } = require("./sse");

// GET /api/shop-products — List all shop-product mappings
router.get("/", (req, res) => {
  try {
    const { shop_id } = req.query;

    let query = `
      SELECT sp.*, s.name as shop_name, p.name as product_name, p.category, p.unit_type
      FROM shop_products sp
      JOIN shops s ON sp.shop_id = s.id
      JOIN products p ON sp.product_id = p.id
    `;

    if (shop_id) {
      query += ` WHERE sp.shop_id = ${parseInt(shop_id)}`;
    }

    query += " ORDER BY s.name, p.name";
    const items = prepare(query).all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shop-products — Add product to shop
router.post("/", (req, res) => {
  try {
    const { shop_id, product_id, price, available, original_price, discounted_price, stock_quantity, min_threshold } = req.body;
    if (!shop_id || !product_id || price == null) {
      return res.status(400).json({ error: "shop_id, product_id, and price are required" });
    }

    // Check if mapping exists
    const existing = prepare("SELECT * FROM shop_products WHERE shop_id = ? AND product_id = ?").get(shop_id, product_id);

    if (existing) {
      prepare(
        `UPDATE shop_products SET price = ?, original_price = ?, discounted_price = ?, available = ?,
         stock_quantity = ?, min_threshold = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(
        price,
        original_price ?? null,
        discounted_price ?? null,
        available ?? 1,
        stock_quantity ?? existing.stock_quantity ?? 100,
        min_threshold ?? existing.min_threshold ?? 10,
        existing.id
      );
      const updated = prepare(
        `SELECT sp.*, p.name as product_name, p.unit_type FROM shop_products sp
         JOIN products p ON sp.product_id = p.id WHERE sp.id = ?`
      ).get(existing.id);

      broadcast("price-update", {
        shop_product_id: existing.id,
        shop_id,
        product_id,
        product_name: updated.product_name,
        price,
        original_price: original_price ?? null,
        discounted_price: discounted_price ?? null,
      });

      return res.json(updated);
    }

    const result = prepare(
      `INSERT INTO shop_products (shop_id, product_id, price, original_price, discounted_price, available, stock_quantity, min_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      shop_id, product_id, price,
      original_price ?? null,
      discounted_price ?? null,
      available ?? 1,
      stock_quantity ?? 100,
      min_threshold ?? 10
    );

    const item = prepare(
      `SELECT sp.*, p.name as product_name, p.unit_type FROM shop_products sp
       JOIN products p ON sp.product_id = p.id WHERE sp.id = ?`
    ).get(result.lastInsertRowid);

    broadcast("price-update", {
      shop_product_id: result.lastInsertRowid,
      shop_id,
      product_id,
      product_name: item.product_name,
      price,
      original_price: original_price ?? null,
      discounted_price: discounted_price ?? null,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/shop-products/:id — Update price/discount/stock
router.put("/:id", (req, res) => {
  try {
    const { price, available, original_price, discounted_price, stock_quantity, min_threshold } = req.body;
    const id = parseInt(req.params.id);

    const existing = prepare("SELECT * FROM shop_products WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Shop product not found" });

    const finalPrice = price ?? existing.price;
    const finalOriginal = original_price !== undefined ? original_price : existing.original_price;
    const finalDiscounted = discounted_price !== undefined ? discounted_price : existing.discounted_price;
    const finalStock = stock_quantity !== undefined ? stock_quantity : existing.stock_quantity;
    const finalThreshold = min_threshold !== undefined ? min_threshold : existing.min_threshold;

    prepare(
      `UPDATE shop_products SET price = ?, original_price = ?, discounted_price = ?, available = ?,
       stock_quantity = ?, min_threshold = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(finalPrice, finalOriginal, finalDiscounted, available ?? existing.available, finalStock, finalThreshold, id);

    const updated = prepare(
      `SELECT sp.*, p.name as product_name, p.unit_type FROM shop_products sp
       JOIN products p ON sp.product_id = p.id WHERE sp.id = ?`
    ).get(id);

    broadcast("price-update", {
      shop_product_id: id,
      shop_id: existing.shop_id,
      product_id: existing.product_id,
      product_name: updated.product_name,
      price: finalPrice,
      original_price: finalOriginal,
      discounted_price: finalDiscounted,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/shop-products/:id
router.delete("/:id", (req, res) => {
  try {
    const result = prepare("DELETE FROM shop_products WHERE id = ?").run(parseInt(req.params.id));
    if (result.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
