const API_BASE = 'http://localhost:8000/api';

/**
 * Generic fetch wrapper with auth support.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // Attach JWT if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }

  return response.json();
}

// ── Public endpoints ──────────────────────────────

export async function submitReport(data) {
  return request('/report', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Auth endpoints ────────────────────────────────

export async function loginAdmin(username, password) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem('token', data.access_token);
  return data;
}

export function logoutAdmin() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// ── Protected endpoints ───────────────────────────

export async function fetchDashboard() {
  return request('/dashboard');
}

export async function fetchAlerts() {
  return request('/alerts');
}

export async function resetSystem() {
  return request('/reset', { method: 'POST' });
}
