const express = require("express");
const router = express.Router();
const { login, requireAuth } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = login(username, password);
    if (!result) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Handle shop-not-approved errors
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }

    res.json({
      message: "Login successful",
      token: result.token,
      username: result.username,
      role: result.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/verify — Check if token is valid
router.get("/verify", requireAuth, (req, res) => {
  res.json({ valid: true, username: req.admin.username, role: req.admin.role });
});

module.exports = router;
