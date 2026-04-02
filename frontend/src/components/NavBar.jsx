import React from "react";
import { C } from "../styles.js";

const TABS = [
  { id: "dashboard",    icon: "🏠", label: "Home"     },
  { id: "transactions", icon: "📋", label: "Entries"  },
  { id: "reports",      icon: "📊", label: "Reports"  },
  { id: "partners",     icon: "🤝", label: "Partners" },
];

export default function NavBar({ screen, setScreen }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: C.white, borderTop: `1px solid ${C.slate200}`,
      display: "flex", zIndex: 90, height: 64,
      boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => setScreen(t.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 2, cursor: "pointer", border: "none", background: "none",
          fontSize: 11, fontFamily: "inherit",
          color: screen === t.id ? C.blue : C.slate400,
        }}>
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontWeight: screen === t.id ? 700 : 400 }}>{t.label}</span>
          {screen === t.id && <div style={{ position: "absolute", bottom: 0, width: 32, height: 3, background: C.blue, borderRadius: "3px 3px 0 0" }} />}
        </button>
      ))}
    </nav>
  );
}
