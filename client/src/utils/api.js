import axios from 'axios';

// In browser or android, determine backend server URL
const isLocal = !window.location.hostname || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultHost = isLocal ? 'localhost' : window.location.hostname;

export const SERVER_URL = localStorage.getItem('sb_server_url') || `http://${defaultHost}:5001`;
export const API_BASE = `${SERVER_URL}/api`;

const api = axios.create({ baseURL: API_BASE, timeout: 5000 });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const customBase = localStorage.getItem('sb_server_url');
  config.baseURL = customBase ? `${customBase}/api` : API_BASE;
  const token = localStorage.getItem('sb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_user');
      window.location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export default api;
