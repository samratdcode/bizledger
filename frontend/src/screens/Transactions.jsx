import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import { INR, S, C } from "../styles.js";

export default function Transactions() {
  const [search,setSearch]=useState(""); const [bizId,setBizId]=useState(""); const [type,setType]=useState(""); const [page,setPage]=useState(1);
  const { data:bizData } = useQuery({ queryKey:["businesses"], queryFn:()=>api.get("/businesses").then(r=>r.data) });
  const businesses = bizData?.businesses||[];
  const params = new URLSearchParams({page,limit:50});
  if(bizId)  params.set("businessId",bizId);
  if(type)   params.set("type",type);
  if(search) params.set("search",search);
  const { data, isLoading } = useQuery({ queryKey:["allTxs",bizId,type,search,page], queryFn:()=>api.get(`/transactions?${params}`).then(r=>r.data), placeholderData:(prev)=>prev });
  const txs=data?.transactions||[], total=data?.total||0;
  return (
    <div>
      <div style={S.header}><div style={S.title}>All Entries</div></div>
      <div style={{ padding:"12px 16px 0" }}>
        <input style={{ ...S.input, background:C.slate50 }} placeholder="🔍 Search..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
      </div>
      <div style={{ display:"flex", gap:6, padding:"10px 16px", overflowX:"auto" }}>
        <button style={{ ...S.chip, ...(bizId===""?{background:"#EFF6FF",borderColor:C.blue,color:C.blue}:{}) }} onClick={()=>{ setBizId(""); setPage(1); }}>All</button>
        {businesses.map(b=>(
          <button key={b.id} style={{ ...S.chip, ...(bizId===b.id?{background:b.color+"18",borderColor:b.color,color:b.color}:{}) }} onClick={()=>{ setBizId(b.id); setPage(1); }}>{b.icon} {b.name.split(" ")[0]}</button>
        ))}
        <button style={{ ...S.chip, ...(type==="in"?{background:"#ECFDF5",borderColor:C.green,color:C.green}:{}) }} onClick={()=>{ setType(type==="in"?"":"in"); setPage(1); }}>↑ In</button>
        <button style={{ ...S.chip, ...(type==="out"?{background:"#FEF2F2",borderColor:C.red,color:C.red}:{}) }} onClick={()=>{ setType(type==="out"?"":"out"); setPage(1); }}>↓ Out</button>
      </div>
      <div style={{ margin:"0 16px" }}>
        <div style={{ ...S.label, marginBottom:8 }}>{total} entries found</div>
        <div style={S.txList}>
          {isLoading&&<div style={{ textAlign:"center", padding:32, color:C.slate500 }}>Loading...</div>}
          {txs.map(t=>{ const b=t.business; return (
            <div key={t.id} style={S.txItem}>
              <div style={{ width:36, height:36, borderRadius:10, background:t.type==="in"?"#ECFDF5":"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{t.type==="in"?"↑":"↓"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.slate900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.category||"Entry"}</div>
                <div style={{ fontSize:12, color:C.slate500 }}>{b?.icon} {b?.name?.split(" ")[0]} · {new Date(t.txDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                {t.description&&<div style={{ fontSize:11, color:C.slate400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description}</div>}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:t.type==="in"?C.green:C.red }}>{t.type==="in"?"+":"-"}{INR(t.amount)}</div>
                <div style={{ fontSize:11, color:C.slate400, background:C.slate100, borderRadius:4, padding:"1px 5px", display:"inline-block", marginTop:2 }}>{t.mode==="cash"?"💵":"🏦"}</div>
              </div>
            </div>
          ); })}
          {!isLoading&&txs.length===0&&<div style={{ textAlign:"center", padding:40, color:C.slate500 }}>No entries found</div>}
        </div>
        {total>50&&(
          <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"center" }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ ...S.chip, opacity:page===1?0.4:1 }}>← Prev</button>
            <span style={{ padding:"6px 12px", fontSize:13, color:C.slate500 }}>Page {page} of {Math.ceil(total/50)}</span>
            <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/50)} style={{ ...S.chip, opacity:page>=Math.ceil(total/50)?0.4:1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
