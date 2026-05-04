import { create } from "zustand";

// FIX: Wrap JSON.parse in try-catch — corrupted localStorage crashes the app otherwise
const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { localStorage.clear(); return null; }
};

export const useAuthStore = create((set) => ({
  user:  getStoredUser(),
  token: localStorage.getItem("accessToken") || null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("accessToken",  accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user",         JSON.stringify(user));
    set({ user, token: accessToken });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, token: null });
  },
}));
