import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

export default function QuickEntryModal({ template: t, onClose }) {
  const qc = useQueryClient();

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const isBackdated = date !== todayStr();

  const save = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");

    setSaving(true);
    setError("");

    try {
      await api.post("/transactions", {
        businessId: t.businessId,
        type: t.type,
        amount: amt,
        mode: t.mode,
        category: t.category,
        description: desc.trim() || t.sublabel,
        txDate: date,
      });

      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["allTxs"]);
      qc.invalidateQueries(["bizTxs"]);
      qc.invalidateQueries(["reports"]);

      setDone(true);
      setTimeout(() => onClose(), 1200);

    } catch (e) {
      setError(e.response?.data?.error || "Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.mBox, paddingBottom: 48 }}>

        <h2 style={{ marginBottom: 20 }}>{t.label}</h2>

        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
          style={{ ...S.input }}
        />

        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Note"
          style={{ ...S.input, marginTop: 10 }}
        />

        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={e => setDate(e.target.value)}
          style={{ ...S.input, marginTop: 10 }}
        />

        {error && <div style={{ color: "red" }}>{error}</div>}

        {done ? (
          <div style={{ color: "green", marginTop: 10 }}>
            Saved {INR(parseFloat(amount))}
          </div>
        ) : (
          <button onClick={save} disabled={saving} style={{ ...S.btn, marginTop: 10 }}>
            {saving ? "Saving..." : "Save"}
          </button>
        )}

      </div>
    </div>
  );
}