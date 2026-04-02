import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C, AVATAR_COLORS, MONTH_STR, MONTH_LABEL } from "../styles.js";

const DRAWING_AMT = 100000;

export default function Partners({ openTransfer }) {
  const month = MONTH_STR();
  const qc    = useQueryClient();

  // Personal Cash Out form state
  const [pcoPartner, setPcoPartner] = useState("");
  const [pcoDesc,    setPcoDesc]    = useState("");
  const [pcoAmount,  setPcoAmount]  = useState("");
  const [pcoError,   setPcoError]   = useState("");
  const [pcoSaving,  setPcoSaving]  = useState(false);
  const [pcoSaved,   setPcoSaved]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["partners", month],
    queryFn:  () => api.get(`/partners?month=${month}`).then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn:  () => api.get("/dashboard").then(r => r.data),
  });

  const partners        = data?.partners        || [];
  const paidCount       = data?.paidCount       || 0;
  const unpaidCount     = data?.unpaidCount     || 0;
  const totalPaid       = data?.totalPaid       || 0;
  const personalOuts    = data?.personalOuts    || [];
  const totalPersonalOuts = data?.totalPersonalOuts || 0;
  const sharedCash      = dashData?.sharedCash  || 0;
  const totalDue        = unpaidCount * DRAWING_AMT;

  // Pay all remaining partners
  const payAll = async () => {
    if (!confirm(`Pay all ${unpaidCount} remaining partners ${INR(DRAWING_AMT)} each (total ${INR(totalDue)}) from cash pool?`)) return;
    try {
      await api.post("/transfers/pay-all-partners", { month, amountPerPartner: DRAWING_AMT });
      qc.invalidateQueries(["partners"]);
      qc.invalidateQueries(["dashboard"]);
    } catch (e) { alert(e.response?.data?.error || "Payment failed"); }
  };

  // Save personal cash out
  const savePersonalOut = async () => {
    if (!pcoPartner)                      return setPcoError("Select a partner");
    if (!pcoDesc.trim())                  return setPcoError("Add a description");
    if (!pcoAmount || parseFloat(pcoAmount) <= 0) return setPcoError("Enter a valid amount");

    setPcoSaving(true); setPcoError("");
    try {
      await api.post("/transfers/personal-cash-out", {
        partnerId:   pcoPartner,
        amount:      parseFloat(pcoAmount),
        description: pcoDesc.trim(),
      });
      qc.invalidateQueries(["partners"]);
      qc.invalidateQueries(["dashboard"]);
      setPcoPartner(""); setPcoDesc(""); setPcoAmount("");
      setPcoSaved(true);
      setTimeout(() => setPcoSaved(false), 2500);
    } catch (e) {
      setPcoError(e.response?.data?.error || "Payment failed");
    } finally {
      setPcoSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.header, justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={S.title}>🤝 Partner Drawings</div>
          <div style={S.sub}>{MONTH_LABEL(month)} · {paidCount}/6 paid</div>
        </div>
      </div>

      {/* Monthly Drawing Summary Card */}
      <div style={{ margin: "0 16px", marginTop: -6, ...S.card }}>
        <div style={{ ...S.label, marginBottom: 8 }}>Monthly Drawing Status</div>

        {/* Progress bar */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: C.slate500 }}>{paidCount} of 6 paid</span>
          <span style={{ color: C.purple }}>{Math.round((paidCount / 6) * 100)}%</span>
        </div>
        <div style={{ background: "#E9D5FF", borderRadius: 99, height: 8, marginBottom: 14 }}>
          <div style={{ background: C.purple, borderRadius: 99, height: 8, width: `${(paidCount / 6) * 100}%`, transition: "width 0.4s" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600 }}>DISBURSED</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.purple }}>{INR(totalPaid)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600 }}>REMAINING</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: unpaidCount > 0 ? C.red : C.green }}>{INR(totalDue)}</div>
          </div>
        </div>

        {unpaidCount > 0 ? (
          <button onClick={payAll} style={{ ...S.btn, background: C.purple, color: C.white, marginTop: 0 }}>
            💸 Pay All Remaining ({unpaidCount} partners · {INR(totalDue)})
          </button>
        ) : (
          <div style={{ textAlign: "center", background: "#ECFDF5", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, color: "#065F46" }}>
            ✅ All 6 partners paid for {MONTH_LABEL(month)}
          </div>
        )}
      </div>

      {/* Per-partner list */}
      <div style={{ margin: "18px 16px 0" }}>
        <div style={{ ...S.label, marginBottom: 10 }}>Partner Breakdown</div>
        <div style={S.txList}>
          {isLoading && <div style={{ textAlign: "center", padding: 32, color: C.slate500 }}>Loading...</div>}
          {partners.map((p, i) => {
            const paid    = p.drawing?.paid;
            const paidAmt = p.drawing?.amount || DRAWING_AMT;
            const paidDt  = p.drawing?.paidDate
              ? new Date(p.drawing.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              : null;
            return (
              <div key={p.id} style={{ ...S.txItem, background: paid ? "#FAFFFE" : C.white }}>
                <div style={{ ...S.avatar, width: 40, height: 40, fontSize: 13, background: AVATAR_COLORS[i % 6] }}>{p.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>
                    {p.name}
                    {p.note && <span style={{ fontSize: 10, color: C.purple, marginLeft: 6, background: "#F5F3FF", borderRadius: 5, padding: "1px 6px" }}>{p.note}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: paid ? "#16A34A" : C.slate400 }}>
                    {paid ? `✓ Paid ${paidDt} · ${INR(paidAmt)}` : `Pending for ${MONTH_LABEL(month)}`}
                  </div>
                </div>
                {paid ? (
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.green, flexShrink: 0 }}>{INR(paidAmt)}</div>
                ) : (
                  <button
                    onClick={() => openTransfer("partner")}
                    style={{ background: C.purple, color: C.white, border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    Pay
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PERSONAL CASH OUT WIDGET ───────────────────────────── */}
      <div style={{ margin: "18px 16px 0" }}>
        <div style={{ ...S.label, marginBottom: 10 }}>Personal Cash Out</div>
        <div style={{ background: C.white, borderRadius: 14, border: "1.5px solid #FED7AA", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

          {/* Widget header */}
          <div style={{ background: "#FFF7ED", padding: "12px 16px", borderBottom: "1px solid #FED7AA", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💸</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Ad-hoc Cash Payment to Partner</div>
              <div style={{ fontSize: 11, color: "#B45309" }}>Any extra cash from pool · above monthly drawing</div>
            </div>
          </div>

          <div style={{ padding: "14px 16px" }}>
            {/* Cash pool balance reminder */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFBEB", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>💵 Cash Pool Available</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>{INR(sharedCash)}</span>
            </div>

            {/* Partner picker */}
            <div style={{ ...S.label, marginBottom: 8 }}>Select Partner</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {partners.map((p, i) => (
                <button key={p.id}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${pcoPartner === p.id ? "#EA580C" : C.slate200}`, background: pcoPartner === p.id ? "#FFF7ED" : C.white, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => { setPcoPartner(pcoPartner === p.id ? "" : p.id); setPcoError(""); }}>
                  <div style={{ ...S.avatar, width: 22, height: 22, fontSize: 9, background: AVATAR_COLORS[i % 6] }}>{p.initials}</div>
                  <span style={{ fontSize: 12, fontWeight: pcoPartner === p.id ? 700 : 400, color: pcoPartner === p.id ? "#EA580C" : C.slate700 }}>
                    {p.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Description */}
            <div style={{ ...S.label, marginBottom: 6 }}>Description</div>
            <input
              style={{ ...S.input, marginTop: 0, marginBottom: 14, background: "#FAFAFA" }}
              placeholder="e.g. Medical expense, travel advance, personal loan..."
              value={pcoDesc}
              onChange={e => { setPcoDesc(e.target.value); setPcoError(""); }}
            />

            {/* Amount */}
            <div style={{ ...S.label, marginBottom: 6 }}>Amount</div>
            <input
              type="number"
              style={{ ...S.input, marginTop: 0, marginBottom: 14, fontSize: 20, fontWeight: 800, textAlign: "center", background: "#FAFAFA" }}
              placeholder="₹ 0"
              value={pcoAmount}
              onChange={e => { setPcoAmount(e.target.value); setPcoError(""); }}
            />

            {/* Error */}
            {pcoError && (
              <div style={{ background: "#FEF2F2", color: C.red, borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10 }}>
                ⚠️ {pcoError}
              </div>
            )}

            {/* Success flash */}
            {pcoSaved && (
              <div style={{ background: "#ECFDF5", color: "#065F46", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                ✅ Payment recorded successfully
              </div>
            )}

            <button onClick={savePersonalOut} disabled={pcoSaving}
              style={{ ...S.btn, background: "#EA580C", color: C.white, marginTop: 0, opacity: pcoSaving ? 0.7 : 1 }}>
              {pcoSaving ? "Recording..." : "💸 Record Personal Cash Out"}
            </button>
          </div>
        </div>
      </div>

      {/* Personal Cash Out History */}
      {personalOuts.length > 0 && (
        <div style={{ margin: "18px 16px 0" }}>
          <div style={{ ...S.label, marginBottom: 10 }}>Personal Cash Out History</div>
          <div style={S.txList}>
            {personalOuts.map((e, i) => {
              const pIdx = partners.findIndex(p => p.id === e.partnerId);
              return (
                <div key={e.id} style={S.txItem}>
                  <div style={{ ...S.avatar, width: 36, height: 36, fontSize: 13, background: AVATAR_COLORS[pIdx >= 0 ? pIdx % 6 : i % 6] }}>
                    {e.partner?.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900 }}>{e.partner?.name}</div>
                    <div style={{ fontSize: 12, color: C.slate600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: C.slate400 }}>
                      {new Date(e.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · 💵 Cash Pool
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#EA580C", flexShrink: 0 }}>-{INR(e.amount)}</div>
                </div>
              );
            })}
          </div>

          {/* Personal out total */}
          <div style={{ ...S.rCard, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.slate500, fontWeight: 600 }}>Total personal payouts</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#EA580C" }}>{INR(totalPersonalOuts)}</span>
          </div>
        </div>
      )}

      {/* Cash Pool Impact this month */}
      <div style={{ margin: "18px 16px 0" }}>
        <div style={{ ...S.label, marginBottom: 10 }}>Cash Pool Impact · {MONTH_LABEL(month)}</div>
        <div style={S.rCard}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: C.slate500 }}>Monthly drawings</span>
            <span style={{ fontWeight: 700, color: C.purple }}>{INR(totalPaid)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: C.slate500 }}>Personal cash outs</span>
            <span style={{ fontWeight: 700, color: "#EA580C" }}>{INR(totalPersonalOuts)}</span>
          </div>
          <div style={S.divider} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
            <span style={{ color: C.slate900 }}>Total partner outflows</span>
            <span style={{ color: C.red }}>{INR(totalPaid + totalPersonalOuts)}</span>
          </div>
          {unpaidCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
              <span style={{ color: C.slate500 }}>Still to pay (monthly)</span>
              <span style={{ fontWeight: 700, color: C.red }}>{INR(unpaidCount * DRAWING_AMT)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cash pool note */}
      <div style={{ margin: "12px 16px 24px", background: "#FFFBEB", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
        💵 All partner drawings and personal cash outs are paid from the <strong>shared cash pool</strong>.
      </div>
    </div>
  );
}
