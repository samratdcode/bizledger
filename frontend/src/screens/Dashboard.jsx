import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C, TODAY, MONTH_STR } from "../styles.js";
import { useAuthStore } from "../store.js";

export default function Dashboard({ goTo, openTransfer }) {
  const { user, logout } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn:  () => api.get("/dashboard").then(r => r.data),
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });
  const { data: pd } = useQuery({
    queryKey: ["partners", MONTH_STR()],
    queryFn:  () => api.get(`/partners?month=${MONTH_STR()}`).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", flexDirection: "column", gap: 12, color: C.slate500 }}>
      <div style={{ fontSize: 32 }}>💼</div>
      <div style={{ fontSize: 14 }}>Loading...</div>
    </div>
  );

  const { sharedCash = 0, totalBalance = 0, today = {}, businesses = [] } = data || {};
  const paidCount   = pd?.paidCount         || 0;
  const unpaidCount = pd?.unpaidCount        || 0;
  // FIX: Use actual partner count from API, not hardcoded "6"
  const totalPartners = pd?.partners?.length || 6;

  return (
    <div>
      <div style={S.header}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 2 }}>Good Morning 👋</div>
          <div style={S.title}>{user?.name}</div>
          <div style={S.sub}>{TODAY()}</div>
        </div>
        <button onClick={logout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Logout</button>
      </div>

      <div style={{ margin: "0 16px", marginTop: -6, ...S.card }}>
        <div style={{ ...S.label, marginBottom: 4 }}>Total Balance — All Businesses</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: C.slate900, margin: "4px 0 14px" }}>{INR(totalBalance)}</div>

        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>💵 Shared Cash Pool</div>
              <div style={{ fontSize: 10, color: "#B45309", marginTop: 1 }}>Single source · funds businesses + partner drawings</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#92400E" }}>{INR(sharedCash)}</div>
          </div>
        </div>

        <div style={{ ...S.label, marginBottom: 8 }}>🏦 Business Bank Accounts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {businesses.length === 0 && (
            <div style={{ fontSize: 13, color: C.slate400, textAlign: "center", padding: 12 }}>No businesses found</div>
          )}
          {businesses.map(b => (
            <div key={b.id} onClick={() => goTo("bizDetail", b)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.slate50, borderRadius: 10, padding: "9px 12px", borderLeft: `3px solid ${b.color}`, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{b.icon} {b.name}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: b.color }}>{INR(b.bankBalance)}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 12, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#5B21B6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>🤝 Partner Drawings</div>
              {/* FIX: Dynamic partner count from API */}
              <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 1 }}>{paidCount} of {totalPartners} paid this month</div>
            </div>
            {unpaidCount > 0
              ? <div style={{ fontSize: 11, background: C.red, color: C.white, borderRadius: 8, padding: "3px 8px", fontWeight: 700 }}>{unpaidCount} pending</div>
              : <div style={{ fontSize: 11, background: C.green, color: C.white, borderRadius: 8, padding: "3px 8px", fontWeight: 700 }}>All paid ✓</div>
            }
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "12px 16px 0" }}>
        <div style={{ ...S.tday, background: "#ECFDF5", color: "#065F46" }}>
          <span style={{ fontSize: 18 }}>↑</span>
          <div><div style={{ fontSize: 11, fontWeight: 600 }}>Today IN</div><div style={{ fontSize: 17, fontWeight: 800 }}>{INR(today.in)}</div></div>
        </div>
        <div style={{ ...S.tday, background: "#FEF2F2", color: "#991B1B" }}>
          <span style={{ fontSize: 18 }}>↓</span>
          <div><div style={{ fontSize: 11, fontWeight: 600 }}>Today OUT</div><div style={{ fontSize: 17, fontWeight: 800 }}>{INR(today.out)}</div></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "12px 16px 0" }}>
        <button onClick={() => openTransfer("business")} style={{ ...S.pill, flex: 1, padding: "12px 0", textAlign: "center", borderColor: C.blue, color: C.blue, fontWeight: 700, fontSize: 13 }}>🏦 Fund Business Bank</button>
        <button onClick={() => openTransfer("partner")}  style={{ ...S.pill, flex: 1, padding: "12px 0", textAlign: "center", borderColor: C.purple, color: C.purple, fontWeight: 700, fontSize: 13 }}>🤝 Pay Partner</button>
      </div>

      <div style={{ margin: "18px 16px 0" }}>
        <div style={{ ...S.label, marginBottom: 10 }}>Recent Entries</div>
        <div style={S.txList}>
          {(today.transactions || []).slice(0, 8).map(t => {
            const b = businesses.find(b => b.id === t.businessId);
            return (
              <div key={t.id} style={S.txItem}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === "in" ? "#ECFDF5" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {t.type === "in" ? "↑" : "↓"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.slate900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.category || "Entry"}</div>
                  <div style={{ fontSize: 12, color: C.slate500 }}>{b?.icon} {b?.name?.split(" ")[0]} · {t.mode === "cash" ? "💵 Pool" : "🏦 Bank"}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.type === "in" ? C.green : C.red, flexShrink: 0 }}>
                  {t.type === "in" ? "+" : "-"}{INR(t.amount)}
                </div>
              </div>
            );
          })}
          {(!today.transactions || today.transactions.length === 0) && (
            <div style={{ textAlign: "center", padding: 32, color: C.slate500, fontSize: 14 }}>No entries today yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
