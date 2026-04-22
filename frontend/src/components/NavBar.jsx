import React from "react";
import { C } from "../styles.js";

const TABS = [
  { id: "dashboard",    icon: "🏠", label: "Home"      },
  { id: "quickadd",     icon: "⚡", label: "Quick Add" },
  { id: "transactions", icon: "📋", label: "Entries"   },
  { id: "partners",     icon: "🤝", label: "Partners"  },
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
      {TABS.map(t => {
        const active = screen === t.id;
        return (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 2, cursor: "pointer", border: "none",
            background: t.id === "quickadd" && active ? "#EFF6FF" : "none",
            fontSize: 11, fontFamily: "inherit",
            color: active ? (t.id === "quickadd" ? C.blue : C.blue) : C.slate400,
            position: "relative",
          }}>
            <span style={{ fontSize: t.id === "quickadd" ? 22 : 20 }}>{t.icon}</span>
            <span style={{ fontWeight: active ? 700 : 400 }}>{t.label}</span>
            {active && (
              <div style={{
                position: "absolute", bottom: 0,
                width: t.id === "quickadd" ? 40 : 32,
                height: 3,
                background: C.blue,
                borderRadius: "3px 3px 0 0",
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
