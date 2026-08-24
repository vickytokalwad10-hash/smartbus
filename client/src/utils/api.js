import axios from 'axios';

// Detect whether running in local dev or APK
const defaultHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? '10.227.32.52' 
  : window.location.hostname;

export const SERVER_URL = localStorage.getItem('sb_server_url') || `http://${defaultHost}:5000`;
export const API_BASE = `${SERVER_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  config.baseURL = localStorage.getItem('sb_server_url') ? `${localStorage.getItem('sb_server_url')}/api` : API_BASE;
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
