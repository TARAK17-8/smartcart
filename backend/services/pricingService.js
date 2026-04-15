/**
 * Pricing Service Layer
 * 
 * Abstraction for fetching product prices across platforms.
 * Currently uses structured seed data from the database.
 * In production, this would integrate with real platform APIs.
 * 
 * Features:
 * - In-memory cache with TTL (5 minutes)
 * - Fallback to DB when cache misses
 * - Cache stats for monitoring
 */

const { prepare } = require("../db/database");

// In-memory cache (Map with TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a cached value, or null if expired/missing
 */
function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store a value in cache
 */
function cacheSet(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get online pricing for a product across all platforms.
 * Uses cache-first strategy with DB fallback.
 * 
 * @param {string} productName - Product name to look up
 * @returns {Array} Array of platform pricing objects
 */
function getPricing(productName) {
  const cacheKey = `pricing:${productName.toLowerCase().trim()}`;

  // Check cache first
  const cached = cacheGet(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const results = prepare(
    "SELECT * FROM online_products WHERE LOWER(name) = LOWER(?)"
  ).all(productName.trim());

  const pricing = results.map((item) => ({
    platform: item.platform,
    price: item.price,
    delivery_fee: item.delivery_cost,
    delivery_cost: item.delivery_cost, // backward compatibility
    delivery_time: item.delivery_time || "1-2 days",
    buy_link: item.buy_link || `https://www.google.com/search?q=buy+${encodeURIComponent(productName)}`,
    total_cost: Math.round((item.price + item.delivery_cost) * 100) / 100,
  }));

  // Cache the result
  cacheSet(cacheKey, pricing);

  return pricing;
}

/**
 * Clear the entire pricing cache
 */
function clearCache() {
  cache.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  let active = 0;
  let expired = 0;
  const now = Date.now();

  for (const [, entry] of cache) {
    if (now - entry.timestamp > CACHE_TTL) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total_entries: cache.size,
    active_entries: active,
    expired_entries: expired,
    ttl_seconds: CACHE_TTL / 1000,
  };
}

module.exports = { getPricing, clearCache, getCacheStats };
