/**
 * Auth middleware for admin and shopkeeper routes.
 * Admin: hardcoded credentials (admin/admin).
 * Shopkeeper: username = shop name, password = shop name (dynamic from DB).
 * Only approved shops can login as shopkeeper.
 */

const { prepare } = require("../db/database");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";
const ADMIN_TOKEN = "smartcart-admin-token-2026";

// In-memory token store for sessions
const tokenStore = new Map();
tokenStore.set(ADMIN_TOKEN, { username: ADMIN_USERNAME, role: "admin" });

function login(username, password) {
  // Admin login — strict check
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return { token: ADMIN_TOKEN, username: ADMIN_USERNAME, role: "admin" };
  }

  // Shopkeeper login: username === password === shop name
  if (username && username === password) {
    // Prevent shopkeeper from using "admin" as shop name
    if (username.toLowerCase() === "admin") {
      return null;
    }

    try {
      const shop = prepare(
        "SELECT id, name, status FROM shops WHERE LOWER(name) = LOWER(?)"
      ).get(username);
      if (shop) {
        if (shop.status !== "approved") {
          const statusLabels = {
            validating: "under validation",
            approval_waiting: "waiting for admin approval",
            rejected: "rejected",
          };
          const label = statusLabels[shop.status] || shop.status || "pending";
          return { error: `Shop "${shop.name}" is ${label}. Only approved shops can login.` };
        }
        const token = `smartcart-shop-${shop.id}-${Date.now()}`;
        tokenStore.set(token, { username: shop.name, role: "shopkeeper" });
        return { token, username: shop.name, role: "shopkeeper" };
      }
    } catch (err) {
      console.error("Shopkeeper login lookup error:", err.message);
    }
  }

  return null;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  const session = tokenStore.get(token);
  if (!session) {
    return res.status(403).json({ error: "Invalid token" });
  }

  req.admin = { username: session.username, role: session.role };
  next();
}

/**
 * Middleware: only allow admin role
 */
function requireAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

/**
 * Middleware: only allow shopkeeper role
 */
function requireShopkeeper(req, res, next) {
  if (!req.admin || req.admin.role !== "shopkeeper") {
    return res.status(403).json({ error: "Shopkeeper access required" });
  }
  next();
}

module.exports = { login, requireAuth, requireAdmin, requireShopkeeper, ADMIN_TOKEN, tokenStore };
