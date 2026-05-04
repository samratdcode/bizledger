import axios from "axios";
import { useAuthStore } from "./store.js";

const BASE = import.meta.env.VITE_API_URL || "/api";
const api  = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];

api.interceptors.response.use(
  res => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        // FIX: resolve each queued request with its own retry, not undefined
        return new Promise((res, rej) => queue.push({ res, rej }))
          .then(() => api(original));
      }
      original._retry = true;
      refreshing = true;
      try {
        const rt = localStorage.getItem("refreshToken");
        if (!rt) throw new Error("No refresh token");
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt });
        localStorage.setItem("accessToken", data.accessToken);
        queue.forEach(({ res }) => res());
        queue = [];
        return api(original);
      } catch {
        queue.forEach(({ rej }) => rej());
        queue = [];
        // FIX: Use zustand logout instead of hard page reload
        // This gives a smooth React transition to login screen
        useAuthStore.getState().logout();
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
// NOTE: MONTH_STR removed from here — import from styles.js to avoid duplicate exports
