import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { S, C, INR, AVATAR_COLORS, MONTH_STR } from "../styles.js";
const DRAWING_AMT = 100000;
export default function TransferModal({ mode:initMode, prefillBiz, onClose }) {
  const qc=useQueryClient(); const [to,setTo]=useState(initMode||"business"); const [bizId,setBizId]=useState(prefillBiz?.id||""); const [ptnId,setPtnId]=useState(""); const [amt,setAmt]=useState(""); const [saving,setSaving]=useState(false); const [error,setError]=useState(""); const month=MONTH_STR();
  const { data:bizData }    =useQuery({queryKey:["businesses"],queryFn:()=>api.get("/businesses").then(r=>r.data)});
  const { data:dashData }   =useQuery({queryKey:["dashboard"], queryFn:()=>api.get("/dashboard").then(r=>r.data)});
  const { data:partnerData }=useQuery({queryKey:["partners",month],queryFn:()=>api.get(`/partners?month=${month}`).then(r=>r.data)});
  const businesses=bizData?.businesses||[]; const partners=partnerData?.partners||[]; const sharedCash=dashData?.sharedCash||0; const chosenBiz=businesses.find(b=>b.id===bizId); const chosenPtn=partners.find(p=>p.id===ptnId);
  const confirm=async()=>{
    const amount=parseFloat(amt); if(isNaN(amount)||amount<=0) return setError("Enter a valid amount");
    setSaving(true); setError("");
    try{
      if(to==="business"){ if(!bizId){setSaving(false);return setError("Select a business");} await api.post("/transfers/to-business",{businessId:bizId,amount}); }
      else{ if(!ptnId){setSaving(false);return setError("Select a partner");} await api.post("/transfers/to-partner",{partnerId:ptnId,amount,month}); }
      qc.invalidateQueries(["dashboard"]); qc.invalidateQueries(["businesses"]); qc.invalidateQueries(["partners"]); onClose();
    } catch(e){setError(e.response?.data?.error||"Transfer failed");}
    finally{setSaving(false);}
  };
  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.mBox}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><h2 style={{fontSize:20,fontWeight:700,color:C.slate900}}>Transfer from Cash Pool</h2><button onClick={onClose} style={{background:"none",border:"none",fontSize:26,cursor:"pointer",color:C.slate500}}>×</button></div>
        <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:12,color:"#92400E",fontWeight:700}}>💵 Shared Cash Pool Available</div><div style={{fontSize:17,fontWeight:900,color:"#92400E"}}>{INR(sharedCash)}</div></div>
        <div style={{...S.label,marginBottom:8}}>Transfer To</div>
        <div style={S.toggle}>
          <button style={{...S.tBtn,background:to==="business"?C.blue:"transparent",color:to==="business"?C.white:C.slate500}} onClick={()=>{setTo("business");setPtnId("");}}>🏦 Business Bank</button>
          <button style={{...S.tBtn,background:to==="partner"?C.purple:"transparent",color:to==="partner"?C.white:C.slate500}} onClick={()=>{setTo("partner");setBizId("");}}>🤝 Partner Drawing</button>
        </div>
        {to==="business"&&(<><span style={S.fLabel}>Select Business</span><div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>{businesses.map(b=>(<button key={b.id} onClick={()=>setBizId(b.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${bizId===b.id?b.color:C.slate200}`,background:bizId===b.id?b.color+"10":C.white,cursor:"pointer",fontFamily:"inherit"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{b.icon}</span><div style={{textAlign:"left"}}><div style={{fontSize:14,fontWeight:700,color:C.slate900}}>{b.name}</div><div style={{fontSize:11,color:C.slate400}}>Bank: {INR(b.bankBalance)}</div></div></div>{bizId===b.id&&<span style={{color:b.color,fontSize:18}}>✓</span>}</button>))}</div></>)}
        {to==="partner"&&(<><span style={S.fLabel}>Select Partner</span><div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>{partners.map((p,i)=>{ const isPaid=p.drawing?.paid; return (<button key={p.id} onClick={()=>!isPaid&&(setPtnId(p.id),setAmt(String(DRAWING_AMT)))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${ptnId===p.id?C.purple:C.slate200}`,background:ptnId===p.id?"#F5F3FF":isPaid?"#F0FDF4":C.white,cursor:isPaid?"default":"pointer",opacity:isPaid?0.65:1,fontFamily:"inherit"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{...S.avatar,width:34,height:34,fontSize:12,background:AVATAR_COLORS[i%6]}}>{p.initials}</div><div style={{textAlign:"left"}}><div style={{fontSize:14,fontWeight:700,color:C.slate900}}>{p.name}{p.note&&<span style={{fontSize:10,color:C.purple,marginLeft:6,background:"#F5F3FF",borderRadius:5,padding:"1px 5px"}}>{p.note}</span>}</div><div style={{fontSize:11,color:isPaid?"#16A34A":C.slate400}}>{isPaid?"✓ Already paid this month":"Not paid this month"}</div></div></div>{ptnId===p.id&&<span style={{color:C.purple,fontSize:18}}>✓</span>}{isPaid&&<span style={{fontSize:16}}>✅</span>}</button>); })}</div></>)}
        {((to==="business"&&bizId)||(to==="partner"&&ptnId))&&(<div style={{display:"flex",alignItems:"center",gap:8,background:C.slate50,borderRadius:12,padding:"12px 14px",marginTop:14}}><span style={{fontSize:20}}>💵</span><span style={{fontSize:12,color:C.slate500}}>Cash Pool</span><span style={{fontSize:16,color:C.slate300}}>→</span><span style={{fontSize:20}}>{to==="business"?chosenBiz?.icon:"🤝"}</span><div><div style={{fontSize:13,fontWeight:700,color:C.slate900}}>{to==="business"?chosenBiz?.name:chosenPtn?.name}</div>{amt&&<div style={{fontSize:12,color:C.red,fontWeight:700}}>{INR(parseFloat(amt)||0)} leaves cash pool</div>}</div></div>)}
        <span style={S.fLabel}>Amount</span>
        <input style={{...S.input,fontSize:22,fontWeight:800,textAlign:"center",marginTop:8}} type="number" placeholder="₹ 0" value={amt} onChange={e=>setAmt(e.target.value)} />
        {error&&<div style={{background:"#FEF2F2",color:C.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginTop:12}}>{error}</div>}
        <button onClick={confirm} disabled={saving} style={{...S.btn,background:to==="business"?C.blue:C.purple,color:C.white,opacity:saving?0.7:1}}>{saving?"Processing...":"✓ Confirm Transfer"}</button>
      </div>
    </div>
  );
}
