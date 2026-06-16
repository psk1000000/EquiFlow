/**
 * REST API client.
 *
 * Thin wrapper around fetch() with automatic JSON parsing, error handling,
 * and auth token injection.
 */

import { API_BASE } from '../utils/constants';

/**
 * Make an authenticated API request.
 *
 * @param {string} endpoint - Path after /api (e.g., '/auth/login')
 * @param {Object} [options]
 * @param {string} [options.method='GET']
 * @param {Object} [options.body]
 * @param {string} [options.token]
 * @returns {Promise<Object>}
 */
async function apiRequest(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

/** Auth API */
export const authAPI = {
  login: (email) =>
    apiRequest('/auth/login', { method: 'POST', body: { email } }),

  logout: (token) =>
    apiRequest('/auth/logout', { method: 'POST', token }),
};

/** Stock API */
export const stockAPI = {
  getAll: () =>
    apiRequest('/stocks'),

  getOne: (ticker) =>
    apiRequest(`/stocks/${ticker}`),

  getHistory: (ticker) =>
    apiRequest(`/stocks/${ticker}/history`),
};

/** Trade API */
export const tradeAPI = {
  buy: (ticker, quantity, token) =>
    apiRequest('/trades/buy', { method: 'POST', body: { ticker, quantity }, token }),

  sell: (ticker, quantity, token) =>
    apiRequest('/trades/sell', { method: 'POST', body: { ticker, quantity }, token }),

  getPortfolio: (token) =>
    apiRequest('/portfolio', { token }),

  getHistory: (token, limit = 20) =>
    apiRequest(`/trades/history?limit=${limit}`, { token }),
};
