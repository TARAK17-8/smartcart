// Use VITE_API_URL for deployed backends; falls back to /api for local Vite proxy
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') + '/api'
  : '/api';

async function fetchJSON(url, options = {}) {
  const token = localStorage.getItem('smartcart_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let errorMsg = 'Request failed';
    try { errorMsg = JSON.parse(text).error || text; } catch { errorMsg = text || res.statusText; }
    throw new Error(errorMsg);
  }
  return res.json();
}

async function postJSON(url, body) {
  return fetchJSON(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function putJSON(url, body) {
  return fetchJSON(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function deleteJSON(url) {
  return fetchJSON(url, { method: 'DELETE' });
}

// ---- Auth ----
export function login(username, password) {
  return postJSON(`${API_BASE}/auth/login`, { username, password });
}

export function verifyAuth() {
  return fetchJSON(`${API_BASE}/auth/verify`);
}

// ---- Products ----
export function getStats() { return fetchJSON(`${API_BASE}/stats`); }
export function getProducts() { return fetchJSON(`${API_BASE}/products`); }
export function searchProducts(q) { return fetchJSON(`${API_BASE}/products/search?q=${encodeURIComponent(q)}`); }
export function createProduct(data) { return postJSON(`${API_BASE}/products`, data); }
export function updateProduct(id, data) { return putJSON(`${API_BASE}/products/${id}`, data); }
export function deleteProduct(id) { return deleteJSON(`${API_BASE}/products/${id}`); }

// ---- Compare ----
export function compareProduct(product, lat, lng, sort = 'cost') {
  return fetchJSON(`${API_BASE}/compare?product=${encodeURIComponent(product)}&lat=${lat}&lng=${lng}&sort=${sort}`);
}

// ---- Shops ----
export function getShops() { return fetchJSON(`${API_BASE}/shops`); }
export function getShop(id) { return fetchJSON(`${API_BASE}/shops/${id}`); }
export function createShop(data) { return postJSON(`${API_BASE}/shops`, data); }
export function updateShop(id, data) { return putJSON(`${API_BASE}/shops/${id}`, data); }
export function deleteShop(id) { return deleteJSON(`${API_BASE}/shops/${id}`); }

// ---- Shop Products ----
export function getShopProducts(shopId) { return fetchJSON(`${API_BASE}/shop-products?shop_id=${shopId}`); }
export function upsertShopProduct(data) { return postJSON(`${API_BASE}/shop-products`, data); }
export function updateShopProduct(id, data) { return putJSON(`${API_BASE}/shop-products/${id}`, data); }
export function deleteShopProduct(id) { return deleteJSON(`${API_BASE}/shop-products/${id}`); }

// ---- Online ----
export function getOnlineProducts(product) {
  const q = product ? `?product=${encodeURIComponent(product)}` : '';
  return fetchJSON(`${API_BASE}/online${q}`);
}

// ---- Orders ----
export function placeOrder(data) { return postJSON(`${API_BASE}/orders`, data); }
export function getOrders(status, shopId) {
  const params = [];
  if (status) params.push(`status=${status}`);
  if (shopId) params.push(`shop_id=${shopId}`);
  const q = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchJSON(`${API_BASE}/orders${q}`);
}
export function getOrder(id) { return fetchJSON(`${API_BASE}/orders/${id}`); }
export function updateOrderStatus(id, status) { return putJSON(`${API_BASE}/orders/${id}/status`, { status }); }

// ---- Analytics ----
export function getAnalytics() { return fetchJSON(`${API_BASE}/analytics`); }
