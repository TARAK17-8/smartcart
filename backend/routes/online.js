const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");

// GET /api/online — Get all online products
router.get("/", (req, res) => {
  try {
    const { product } = req.query;

    let query = "SELECT * FROM online_products";
    if (product) {
      query += ` WHERE LOWER(name) LIKE LOWER('%${product.replace(/'/g, "''")}%')`;
    }
    query += " ORDER BY name, platform";

    const items = prepare(query).all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
