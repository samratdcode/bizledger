import React, { useState } from “react”;
import { useAuthStore } from “../store.js”;
import api from “../api.js”;
import { C } from “../styles.js”;

export default function Login() {
const { setAuth } = useAuthStore();
const [phone,    setPhone]    = useState(””);
const [password, setPassword] = useState(””);
const [error,    setError]    = useState(””);
const [loading,  setLoading]  = useState(false);

const submit = async () => {
if (!phone || !password) return setError(“Enter phone and password”);
setLoading(true); setError(””);
try {
// Send as URL-encoded form data — this is a “simple request”
// and does NOT trigger a CORS preflight OPTIONS request.
// This fixes login on Indian mobile networks (Jio/Vodafone)
// whose transparent proxies block OPTIONS preflight requests.
const params = new URLSearchParams();
params.append(“phone”,    phone.trim());
params.append(“password”, password);

```
  const { data } = await api.post("/auth/login", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  setAuth(data.user, data.accessToken, data.refreshToken);
} catch (e) {
  setError(e.response?.data?.error || "Login failed. Check your credentials.");
} finally {
  setLoading(false);
}
```

};

const inputStyle = {
width: “100%”, padding: “14px 16px”, borderRadius: 12,
border: “1.5px solid rgba(255,255,255,0.15)”,
background: “rgba(255,255,255,0.08)”, color: C.white,
fontSize: 16, outline: “none”, boxSizing: “border-box”,
fontFamily: “inherit”,
};

return (
<div style={{ minHeight: “100dvh”, background: C.dark, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, padding: 24 }}>
<div style={{ textAlign: “center”, marginBottom: 40 }}>
<div style={{ fontSize: 56, marginBottom: 12 }}>💼</div>
<div style={{ fontSize: 28, fontWeight: 900, color: C.white, letterSpacing: -0.5 }}>BizLedger</div>
<div style={{ fontSize: 14, color: “rgba(255,255,255,0.5)”, marginTop: 4 }}>Your businesses. Simplified.</div>
</div>

```
  <div style={{ width: "100%", maxWidth: 360, background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Phone Number
      </label>
      <input
        type="tel"
        placeholder="Enter your phone number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        autoComplete="username"
        style={inputStyle}
      />
    </div>
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Password
      </label>
      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        autoComplete="current-password"
        style={inputStyle}
      />
    </div>

    {error && (
      <div style={{ background: "#FEF2F2", color: C.red, borderRadius: 10, padding: "10px 14px", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
        {error}
      </div>
    )}

    <button onClick={submit} disabled={loading}
      style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.blue, color: C.white, fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
      {loading ? "Logging in..." : "Login →"}
    </button>
  </div>

  <div style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
    Contact admin to reset your password
  </div>
</div>
```

);
}
