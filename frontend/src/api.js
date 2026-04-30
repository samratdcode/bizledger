import axios from "axios";

const BASE = "/api";

const api = axios.create({ baseURL: BASE });

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh
let refreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original));
      }

      original._retry = true;
      refreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await api.post("/auth/refresh", { refreshToken });

        localStorage.setItem("accessToken", data.accessToken);

        queue.forEach(({ resolve }) => resolve());
        queue = [];

        return api(original);

      } catch {
        queue.forEach(({ reject }) => reject());
        queue = [];

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";

      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;

// helpers
export const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};