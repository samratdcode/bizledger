import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("accessToken") || null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("accessToken",  accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user",         JSON.stringify(user));
    set({ user, token: accessToken });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
}));
