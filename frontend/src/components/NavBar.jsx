import React from "react";
import { C } from "../styles.js";

const TABS = [
  { id: "dashboard",    icon: "🏠", label: "Home"     },
  { id: "quickadd",     icon: "⚡", label: "Bulk Add"  },
  { id: "transactions", icon: "📋", label: "Entries"   },
  { id: "reports",      icon: "📊", label: "Reports"   },
  { id: "partners",     icon: "🤝", label: "Partners"  },
];

export default function NavBar({ screen, setScreen }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: C.white, borderTop: `1px solid ${C.slate200}`,
      display: "flex", zIndex: 90, // FIX: FAB uses 95 so always above NavBar
      height: 60,
      paddingBottom: "env(safe-area-inset-bottom, 0px)", // FIX: iOS home indicator
      boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}>
      {TABS.map(t => {
        const active = screen === t.id;
        return (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 1, cursor: "pointer", border: "none",
            background: "none", fontFamily: "inherit",
            color: active ? C.blue : C.slate400,
            position: "relative", padding: "4px 0",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontWeight: active ? 700 : 400, fontSize: 10 }}>{t.label}</span>
            {active && (
              <div style={{
                position: "absolute", bottom: 0,
                width: 28, height: 3,
                background: C.blue, borderRadius: "3px 3px 0 0",
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
