import React, { useState } from “react”;
import { useAuthStore } from “./store.js”;
import Login from “./screens/Login.jsx”;
import Dashboard from “./screens/Dashboard.jsx”;
import QuickAdd from “./screens/QuickAdd.jsx”;
import Transactions from “./screens/Transactions.jsx”;
import Reports from “./screens/Reports.jsx”;
import Partners from “./screens/Partners.jsx”;
import BizDetail from “./screens/BizDetail.jsx”;
import AddEntryModal from “./components/AddEntryModal.jsx”;
import TransferModal from “./components/TransferModal.jsx”;
import VoiceEntryModal from “./components/VoiceEntryModal.jsx”;
import NavBar from “./components/NavBar.jsx”;

export default function App() {
const { user } = useAuthStore();
const [screen,       setScreen]      = useState(“dashboard”);
const [activeBiz,    setActiveBiz]   = useState(null);
const [showAdd,      setShowAdd]     = useState(false);
const [showTransfer, setShowTransfer]= useState(false);
const [showVoice,    setShowVoice]   = useState(false);
const [transferMode, setTransferMode]= useState(“business”);

if (!user) return <Login />;

const openTransfer = (mode = “business”) => {
setTransferMode(mode);
setShowTransfer(true);
};

const goTo = (s, biz = null) => {
setActiveBiz(biz);
setScreen(s);
};

return (
<div style={{ maxWidth: 480, margin: “0 auto”, minHeight: “100dvh”, background: “#F8FAFC”, position: “relative”, paddingBottom: 72 }}>
{screen === “dashboard”    && <Dashboard    goTo={goTo} openTransfer={openTransfer} />}
{screen === “bizDetail”    && <BizDetail    biz={activeBiz} goBack={() => setScreen(“dashboard”)} openTransfer={openTransfer} />}
{screen === “quickadd”     && <QuickAdd     openVoice={() => setShowVoice(true)} />}
{screen === “transactions” && <Transactions />}
{screen === “reports”      && <Reports />}
{screen === “partners”     && <Partners openTransfer={openTransfer} />}

```
  {/* Voice mic FAB — shown on quickadd screen */}
  {screen === "quickadd" && (
    <button onClick={() => setShowVoice(true)} style={{
      position: "fixed", bottom: 80, right: "max(16px, calc(50vw - 224px))",
      width: 56, height: 56, borderRadius: "50%",
      background: "#EF4444", color: "#fff", border: "none",
      fontSize: 24, cursor: "pointer", zIndex: 90,
      boxShadow: "0 4px 20px rgba(239,68,68,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>🎙️</button>
  )}

  {/* Regular + FAB — shown on all other screens */}
  {screen !== "quickadd" && (
    <button onClick={() => setShowAdd(true)} style={{
      position: "fixed", bottom: 80, right: "max(16px, calc(50vw - 224px))",
      width: 56, height: 56, borderRadius: "50%",
      background: "#2563EB", color: "#fff", border: "none",
      fontSize: 28, cursor: "pointer", zIndex: 90,
      boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>+</button>
  )}

  <NavBar screen={screen} setScreen={(s) => goTo(s)} />

  {showAdd      && <AddEntryModal  onClose={() => setShowAdd(false)}      prefillBiz={activeBiz} />}
  {showTransfer && <TransferModal  mode={transferMode} prefillBiz={activeBiz} onClose={() => setShowTransfer(false)} />}
  {showVoice    && <VoiceEntryModal onClose={() => setShowVoice(false)} />}
</div>
```

);
}