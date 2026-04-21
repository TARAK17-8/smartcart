const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "smartcart.db");

let db = null;
let SQL = null;

async function initDb() {
  if (db) return db;

  SQL = await initSqlJs();

  // Load existing DB file if exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON;");
  initSchema();
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      shop_type TEXT DEFAULT 'General Store',
      owner_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      shop_photo TEXT DEFAULT '',
      pan_image TEXT DEFAULT '',
      aadhaar_image TEXT DEFAULT '',
      status TEXT DEFAULT 'validating',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: add new shop columns for existing DBs
  try { db.run("ALTER TABLE shops ADD COLUMN shop_type TEXT DEFAULT 'General Store';"); } catch (e) {}
  try { db.run("ALTER TABLE shops ADD COLUMN owner_name TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE shops ADD COLUMN phone TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE shops ADD COLUMN shop_photo TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE shops ADD COLUMN pan_image TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE shops ADD COLUMN aadhaar_image TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE shops ADD COLUMN status TEXT DEFAULT 'validating';"); } catch (e) {}
  // Only fix NULL statuses for backwards compat — do NOT mass-approve
  try { db.run("UPDATE shops SET status = 'approved' WHERE status IS NULL;"); } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT DEFAULT 'Grocery',
      unit_type TEXT DEFAULT 'kg',
      default_price REAL DEFAULT 0
    );
  `);

  // Migration: add new product columns
  try { db.run("ALTER TABLE products ADD COLUMN unit_type TEXT DEFAULT 'kg';"); } catch (e) {}
  try { db.run("ALTER TABLE products ADD COLUMN default_price REAL DEFAULT 0;"); } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS shop_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      price REAL NOT NULL,
      original_price REAL DEFAULT NULL,
      discounted_price REAL DEFAULT NULL,
      available INTEGER DEFAULT 1,
      stock_quantity REAL DEFAULT 100,
      min_threshold REAL DEFAULT 10,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(shop_id, product_id)
    );
  `);

  // Migration: add discount & stock columns
  try { db.run("ALTER TABLE shop_products ADD COLUMN original_price REAL DEFAULT NULL;"); } catch (e) {}
  try { db.run("ALTER TABLE shop_products ADD COLUMN discounted_price REAL DEFAULT NULL;"); } catch (e) {}
  try { db.run("ALTER TABLE shop_products ADD COLUMN stock_quantity REAL DEFAULT 100;"); } catch (e) {}
  try { db.run("ALTER TABLE shop_products ADD COLUMN min_threshold REAL DEFAULT 10;"); } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS online_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      price REAL NOT NULL,
      delivery_cost REAL NOT NULL,
      delivery_time TEXT DEFAULT NULL,
      buy_link TEXT DEFAULT NULL,
      image_url TEXT DEFAULT NULL
    );
  `);

  try { db.run("ALTER TABLE online_products ADD COLUMN delivery_time TEXT DEFAULT NULL;"); } catch (e) {}
  try { db.run("ALTER TABLE online_products ADD COLUMN buy_link TEXT DEFAULT NULL;"); } catch (e) {}

  // Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      pincode TEXT NOT NULL,
      shop_id INTEGER NOT NULL,
      shop_name TEXT DEFAULT '',
      items TEXT NOT NULL,
      total_price REAL NOT NULL,
      order_status TEXT DEFAULT 'placed',
      estimated_delivery_time REAL DEFAULT NULL,
      delivery_agent_name TEXT DEFAULT '',
      delivery_agent_phone TEXT DEFAULT '',
      user_lat REAL DEFAULT NULL,
      user_lng REAL DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
    );
  `);

  // Migration: add delivery tracking columns for existing DBs
  try { db.run("ALTER TABLE orders ADD COLUMN estimated_delivery_time REAL DEFAULT NULL;"); } catch (e) {}
  try { db.run("ALTER TABLE orders ADD COLUMN delivery_agent_name TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE orders ADD COLUMN delivery_agent_phone TEXT DEFAULT '';"); } catch (e) {}
  try { db.run("ALTER TABLE orders ADD COLUMN user_lat REAL DEFAULT NULL;"); } catch (e) {}
  try { db.run("ALTER TABLE orders ADD COLUMN user_lng REAL DEFAULT NULL;"); } catch (e) {}

  // Analytics tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT NOT NULL,
      cheapest_type TEXT NOT NULL,
      cheapest_name TEXT NOT NULL,
      savings REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Helper methods to match better-sqlite3 API style
function prepare(sql) {
  return {
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      const results = [];
      const stmt = db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    run(...params) {
      db.run(sql, params);
      const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0];
      const changes = db.getRowsModified();
      saveDb();
      return { lastInsertRowid: lastId, changes };
    },
  };
}

module.exports = { initDb, getDb, saveDb, prepare };
