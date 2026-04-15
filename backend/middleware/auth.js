/**
 * Simple auth middleware for admin routes.
 * Uses a hardcoded token approach for demo purposes.
 */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";
const ADMIN_TOKEN = "smartcart-admin-token-2026";

function login(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return { token: ADMIN_TOKEN, username: ADMIN_USERNAME };
  }
  return null;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: "Invalid token" });
  }

  req.admin = { username: ADMIN_USERNAME };
  next();
}

module.exports = { login, requireAuth, ADMIN_TOKEN };
