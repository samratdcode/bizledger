import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";
import QuickEntryModal from "../components/QuickEntryModal.jsx";

export const QUICK_TEMPLATES = [
  {
    id: "t1",
    label: "Medicine Sale",
    sublabel: "Cash payment",
    icon: "💊",
    color: "#10B981",
    bgColor: "#ECFDF5",
    borderColor: "#6EE7B7",
    bizType: "pharmacy",
    type: "in",
    mode: "cash",
    category: "Medicine Sale",
  },
  {
    id: "t2",
    label: "Medicine Sale",
    sublabel: "GPay / UPI",
    icon: "💊",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#93C5FD",
    bizType: "pharmacy",
    type: "in",
    mode: "bank",
    category: "Medicine Sale",
  },
  {
    id: "t3",
    label: "Nursing Home",
    sublabel: "Collection · Cash",
    icon: "🏥",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#93C5FD",
    bizType: "nursing_home",
    type: "in",
    mode: "cash",
    category: "Collection",
  },
  {
    id: "t4",
    label: "Diagnostic",
    sublabel: "Collection · Cash",
    icon: "🔬",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    borderColor: "#C4B5FD",
    bizType: "diagnostic",
    type: "in",
    mode: "cash",
    category: "Collection",
  },
  {
    id: "t5",
    label: "Diagnostic",
    sublabel: "Collection · UPI",
    icon: "🔬",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    borderColor: "#93C5FD",
    bizType: "diagnostic",
    type: "in",
    mode: "bank",
    category: "Collection",
  },
];

export default function QuickAdd() {
  const [activeTemplate, setActiveTemplate] = useState(null);

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn:  () => api.get("/dashboard").then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: bizData } = useQuery({
    queryKey: ["businesses"],
    queryFn:  () => api.get("/businesses").then(r => r.data),
  });

  const businesses  = bizData?.businesses || [];
  const sharedCash  = dashData?.sharedCash || 0;
  const todayIn     = dashData?.today?.in   || 0;
  const todayOut    = dashData?.today?.out  || 0;
  const todayTxs    = dashData?.today?.transactions || [];

  // Match template to actual business by type
  const getBiz = (bizType) => businesses.find(b => b.type === bizType);

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>⚡ Quick Add</div>
          <div style={S.sub}>One tap · enter amount · done</div>
        </div>
      </div>

      {/* Today snapshot */}
      <div style={{ margin: "0 16px", marginTop: -6, ...S.card }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "#FFFBEB", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#92400E", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>💵 Cash Pool</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#92400E", marginTop: 2 }}>{INR(sharedCash)}</div>
          </div>
          <div style={{ flex: 1, background: "#ECFDF5", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#065F46", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>↑ Today IN</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#065F46", marginTop: 2 }}>{INR(todayIn)}</div>
          </div>
          <div style={{ flex: 1, background: "#FEF2F2", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#991B1B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>↓ Today OUT</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#991B1B", marginTop: 2 }}>{INR(todayOut)}</div>
          </div>
        </div>
      </div>

      {/* Template cards */}
      <div style={{ margin: "18px 16px 0" }}>
        <div style={{ ...S.label, marginBottom: 12 }}>Tap a template to log instantly</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {QUICK_TEMPLATES.map(t => {
            const bizObj = getBiz(t.bizType);
            return (
              <button key={t.id}
                onClick={() => bizObj && setActiveTemplate({ ...t, businessId: bizObj.id, businessName: bizObj.name, businessIcon: bizObj.icon, businessColor: bizObj.color })}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px", borderRadius: 16,
                  border: `2px solid ${t.borderColor}`,
                  background: t.bgColor,
                  cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", width: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  opacity: bizObj ? 1 : 0.5,
                }}>
                {/* Icon */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                  {t.icon}
                </div>
                {/* Labels */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.slate900 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: C.slate500, marginTop: 2 }}>{t.sublabel}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, background: "#fff", borderRadius: 20, padding: "2px 8px", color: bizObj?.color || C.slate400, border: `1px solid ${bizObj?.color || C.slate200}`, fontWeight: 600 }}>
                      {bizObj?.icon} {bizObj?.name || "Loading..."}
                    </span>
                    <span style={{ fontSize: 11, background: "#fff", borderRadius: 20, padding: "2px 8px", color: t.type === "in" ? C.green : C.red, border: `1px solid ${t.type === "in" ? C.green : C.red}`, fontWeight: 600 }}>
                      {t.type === "in" ? "↑ Cash IN" : "↓ Cash OUT"}
                    </span>
                    <span style={{ fontSize: 11, background: "#fff", borderRadius: 20, padding: "2px 8px", color: t.mode === "cash" ? "#92400E" : "#1E40AF", border: `1px solid ${t.mode === "cash" ? "#FDE68A" : "#93C5FD"}`, fontWeight: 600 }}>
                      {t.mode === "cash" ? "💵 Cash Pool" : "🏦 Bank/UPI"}
                    </span>
                  </div>
                </div>
                {/* Arrow */}
                <div style={{ fontSize: 24, color: t.color, flexShrink: 0 }}>›</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's entries */}
      {todayTxs.length > 0 && (
        <div style={{ margin: "18px 16px 0" }}>
          <div style={{ ...S.label, marginBottom: 10 }}>Today's Entries</div>
          <div style={S.txList}>
            {todayTxs.slice(0, 8).map(t => {
              const b = t.business;
              return (
                <div key={t.id} style={S.txItem}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === "in" ? "#ECFDF5" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {t.type === "in" ? "↑" : "↓"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.category || "Entry"}</div>
                    <div style={{ fontSize: 12, color: C.slate500 }}>{b?.icon} {b?.name?.split(" ")[0]} · {t.mode === "cash" ? "💵" : "🏦"}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.type === "in" ? C.green : C.red, flexShrink: 0 }}>
                    {t.type === "in" ? "+" : "-"}{INR(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Entry Modal */}
      {activeTemplate && (
        <QuickEntryModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
        />
      )}
    </div>
  );
}
