const express = require("express");
const router = express.Router();
const { prepare } = require("../db/database");

// GET /api/analytics — Get comparison analytics
router.get("/", (req, res) => {
  try {
    const total = prepare("SELECT COUNT(*) as count FROM analytics").get();
    const avgSavings = prepare("SELECT AVG(savings) as avg FROM analytics").get();

    const localCheaper = prepare(
      "SELECT COUNT(*) as count FROM analytics WHERE cheapest_type = 'local'"
    ).get();
    const onlineCheaper = prepare(
      "SELECT COUNT(*) as count FROM analytics WHERE cheapest_type = 'online'"
    ).get();

    const totalCount = total?.count || 0;
    const localCount = localCheaper?.count || 0;
    const onlineCount = onlineCheaper?.count || 0;

    // Recent comparisons (last 20)
    const recent = prepare(
      "SELECT product, cheapest_type, cheapest_name, savings, created_at FROM analytics ORDER BY id DESC LIMIT 20"
    ).all();

    res.json({
      total_comparisons: totalCount,
      average_savings: Math.round((avgSavings?.avg || 0) * 100) / 100,
      local_cheaper_count: localCount,
      online_cheaper_count: onlineCount,
      local_cheaper_percent: totalCount > 0 ? Math.round((localCount / totalCount) * 100) : 0,
      online_cheaper_percent: totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0,
      recent_comparisons: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
