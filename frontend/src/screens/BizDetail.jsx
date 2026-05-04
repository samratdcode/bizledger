import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";
import { useAuthStore } from "../store.js";

export default function BizDetail({ biz, goBack, openTransfer }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState("today");
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");
  const now = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const yStr     = new Date(now-86400000).toISOString().slice(0,10);
  const monthStr = now.toISOString().slice(0,7);
  const dateRange = {
    today:     { startDate:todayStr,         endDate:todayStr },
    yesterday: { startDate:yStr,             endDate:yStr     },
    month:     { startDate:`${monthStr}-01`, endDate:todayStr },
    all:       {},
  };
  const { data, isLoading } = useQuery({
    queryKey:["bizTxs", biz.id, tab],
    queryFn: ()=>{ const p=new URLSearchParams({businessId:biz.id,limit:100,...dateRange[tab]}); return api.get(`/transactions?${p}`).then(r=>r.data); },
    placeholderData:(prev)=>prev,
  });
  const txs=data?.transactions||[];
  const sumIn=txs.filter(t=>t.type==="in").reduce((s,t)=>s+t.amount,0);
  const sumOut=txs.filter(t=>t.type==="out").reduce((s,t)=>s+t.amount,0);
  const [confirmDelete, setConfirmDelete] = useState(null); // id of tx pending confirmation
  const deleteTx = async(id)=>{
    setDeleting(id);
    try{ await api.delete(`/transactions/${id}`); qc.invalidateQueries(["bizTxs"]); qc.invalidateQueries(["dashboard"]); }
    catch(e){ setError(e.response?.data?.error||"Delete failed"); }
    finally{ setDeleting(null); setConfirmDelete(null); }
  };
  return (
    <div>
      <div style={{ ...S.header, background:biz.color }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button style={{ background:"none", border:"none", color:C.white, fontSize:22, cursor:"pointer", paddingRight:8 }} onClick={goBack}>←</button>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:C.white }}>{biz.icon} {biz.name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</div>
          </div>
        </div>
      </div>
      <div style={{ margin:"0 16px", marginTop:-6, ...S.card, borderTop:`4px solid ${biz.color}` }}>
        <div style={{ ...S.label, marginBottom:4 }}>🏦 Bank Account</div>
        <div style={{ fontSize:30, fontWeight:900, color:biz.color, margin:"4px 0 12px" }}>{INR(biz.bankBalance)}</div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ ...S.tday, background:"#ECFDF5" }}><span>↑</span><div style={{ fontSize:13, fontWeight:700, color:"#065F46" }}>{INR(sumIn)}</div></div>
          <div style={{ ...S.tday, background:"#FEF2F2" }}><span>↓</span><div style={{ fontSize:13, fontWeight:700, color:"#991B1B" }}>{INR(sumOut)}</div></div>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, padding:"12px 16px 0", overflowX:"auto" }}>
        {["today","yesterday","month","all"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...S.chip, ...(tab===t?{background:biz.color+"18",borderColor:biz.color,color:biz.color}:{}) }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ margin:"12px 16px 0" }}>
        <div style={S.txList}>
          {isLoading&&<div style={{ textAlign:"center", padding:32, color:C.slate500 }}>Loading...</div>}
          {!isLoading&&txs.map(t=>(
            <div key={t.id} style={{ ...S.txItem, background:deleting===t.id?C.slate50:C.white }}>
              <div style={{ width:36, height:36, borderRadius:10, background:t.type==="in"?"#ECFDF5":"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{t.type==="in"?"↑":"↓"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.slate900 }}>{t.category||"Entry"}</div>
                <div style={{ fontSize:12, color:C.slate500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description||"—"}</div>
                <div style={{ fontSize:11, color:C.slate400 }}>{new Date(t.txDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} · {t.mode==="cash"?"💵 Pool":"🏦 Bank"}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:t.type==="in"?C.green:C.red }}>{t.type==="in"?"+":"-"}{INR(t.amount)}</div>
                {user?.role==="admin"&&(
                  confirmDelete===t.id ? (
                    <div style={{display:"flex",gap:4,marginTop:2}}>
                      <button onClick={()=>deleteTx(t.id)} style={{fontSize:11,color:"#fff",background:C.red,border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Delete</button>
                      <button onClick={()=>setConfirmDelete(null)} style={{fontSize:11,color:C.slate500,background:"none",border:`1px solid ${C.slate200}`,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={()=>setConfirmDelete(t.id)} style={{fontSize:11,color:C.slate400,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",marginTop:2}}>delete</button>
                  )
                )}
              </div>
            </div>
          ))}
          {!isLoading&&txs.length===0&&<div style={{ textAlign:"center", padding:40, color:C.slate500 }}>No entries for this period</div>}
        </div>
      </div>
      <div style={{ margin:"12px 16px 0" }}>
        <button onClick={()=>openTransfer("business")} style={{ ...S.pill, width:"100%", padding:"13px 0", textAlign:"center", borderColor:biz.color, color:biz.color, fontWeight:700 }}>
          💱 Fund from Cash Pool → {biz.name.split(" ")[0]} Bank
        </button>
      </div>
    </div>
  );
}
