import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

const TEMPLATES = [
  { id:"t1", label:"Medicine Sale", sublabel:"Cash", icon:"💊", color:"#10B981", bgColor:"#ECFDF5", borderColor:"#6EE7B7", bizType:"pharmacy", type:"in", mode:"cash", category:"Medicine Sale" },
  { id:"t2", label:"Medicine Sale", sublabel:"GPay", icon:"💊", color:"#2563EB", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"pharmacy", type:"in", mode:"bank", category:"Medicine Sale" },
  { id:"t3", label:"Nursing Home", sublabel:"Cash", icon:"🏥", color:"#3B82F6", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"nursing_home", type:"in", mode:"cash", category:"Collection" },
  { id:"t4", label:"Diagnostic", sublabel:"Cash", icon:"🔬", color:"#8B5CF6", bgColor:"#F5F3FF", borderColor:"#C4B5FD", bizType:"diagnostic", type:"in", mode:"cash", category:"Collection" },
  { id:"t5", label:"Diagnostic", sublabel:"UPI", icon:"🔬", color:"#2563EB", bgColor:"#EFF6FF", borderColor:"#93C5FD", bizType:"diagnostic", type:"in", mode:"bank", category:"Collection" },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const newRow = (id) => ({ id, templateId: "t1", amount: "", note: "" });

let rowCounter = 1;

export default function QuickAdd({ openVoice }) {
  const qc = useQueryClient();

  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([newRow(rowCounter++)]);
  const [saving, setSaving] = useState(false);

  const { data: bizData } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses").then(r => r.data),
  });

  const businesses = bizData?.businesses || [];

  const getBiz = (type) => businesses.find(b => b.type === type);
  const getTpl = (id) => TEMPLATES.find(t => t.id === id);

  const addRow = () => setRows(prev => [...prev, newRow(rowCounter++)]);

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(rows.map(r => {
        const tpl = getTpl(r.templateId);
        const biz = getBiz(tpl.bizType);
        return api.post("/transactions", {
          businessId: biz.id,
          type: tpl.type,
          amount: parseFloat(r.amount),
          mode: tpl.mode,
          category: tpl.category,
          description: r.note,
          txDate: date,
        });
      }));

      qc.invalidateQueries(["dashboard"]);
      qc.invalidateQueries(["reports"]);

      setRows([newRow(rowCounter++)]);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={addRow}>+ Add Row</button>

      {rows.map(row => (
        <div key={row.id}>
          <input
            type="number"
            value={row.amount}
            onChange={e => updateRow(row.id, "amount", e.target.value)}
          />
        </div>
      ))}

      <button onClick={saveAll} disabled={saving}>
        Save All
      </button>
    </div>
  );
}