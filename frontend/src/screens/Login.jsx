import React, { useState } from "react";
import { useAuthStore } from "../store.js";
import api from "../api.js";
import { C } from "../styles.js";

export default function Login() {
  const { setAuth } = useAuthStore();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone || !password) {
      return setError("Enter phone and password");
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("phone", phone.trim());
      params.append("password", password);

      const { data } = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setAuth(data.user, data.accessToken, data.refreshToken);

    } catch (e) {
      setError(e.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: C.white,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: C.dark,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }}>

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>💼</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.white }}>BizLedger</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          Your businesses. Simplified.
        </div>
      </div>

      <div style={{
        width: "100%",
        maxWidth: 360,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 20,
        padding: 24
      }}>

        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ ...inputStyle, marginTop: 12 }}
        />

        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={loading} style={{
          marginTop: 16,
          width: "100%",
          padding: 14,
          background: C.blue,
          color: "#fff",
          border: "none",
          borderRadius: 10
        }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}