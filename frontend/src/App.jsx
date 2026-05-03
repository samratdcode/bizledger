import React, { useState } from "react";
import { useAuthStore } from "./store.js";

import Login from "./screens/Login.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import QuickAdd from "./screens/QuickAdd.jsx";
import Transactions from "./screens/Transactions.jsx";
import Reports from "./screens/Reports.jsx";
import Partners from "./screens/Partners.jsx";
import BizDetail from "./screens/BizDetail.jsx";

import AddEntryModal from "./components/AddEntryModal.jsx";
import TransferModal from "./components/TransferModal.jsx";
import VoiceEntryModal from "./components/VoiceEntryModal.jsx";

import NavBar from "./components/NavBar.jsx";

export default function App() {
  const { user } = useAuthStore();

  const [screen, setScreen] = useState("dashboard");
  const [activeBiz, setActiveBiz] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [transferMode, setTransferMode] = useState("business");

  if (!user) return <Login />;

  const goTo = (s, biz = null) => {
    setActiveBiz(biz);
    setScreen(s);
  };

  const openTransfer = (mode = "business") => {
    setTransferMode(mode);
    setShowTransfer(true);
  };

  // 🧠 SINGLE SCREEN RENDERER
  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard goTo={goTo} openTransfer={openTransfer} />;

      case "bizDetail":
        return (
          <BizDetail
            biz={activeBiz}
            goBack={() => setScreen("dashboard")}
            openTransfer={openTransfer}
          />
        );

      case "quickadd":
        return <QuickAdd openVoice={() => setShowVoice(true)} />;

      case "transactions":
        return <Transactions />;

      case "reports":
        return <Reports />;

      case "partners":
        return <Partners openTransfer={openTransfer} />;

      default:
        return <Dashboard goTo={goTo} openTransfer={openTransfer} />;
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100dvh",
        background: "#F8FAFC",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* ✅ SCREEN LAYER */}
      <div style={{ paddingBottom: 80 }}>
        {renderScreen()}
      </div>

      {/* ✅ FLOATING LAYER */}
      {screen === "quickadd" ? (
        <button
          onClick={() => setShowVoice(true)}
          style={fabStyle("#EF4444")}
        >
          🎙️
        </button>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={fabStyle("#2563EB")}
        >
          +
        </button>
      )}

      {/* ✅ NAVBAR */}
      <NavBar screen={screen} setScreen={goTo} />

      {/* ✅ MODAL LAYER */}
      {showAdd && (
        <AddEntryModal
          onClose={() => setShowAdd(false)}
          prefillBiz={activeBiz}
        />
      )}

      {showTransfer && (
        <TransferModal
          mode={transferMode}
          prefillBiz={activeBiz}
          onClose={() => setShowTransfer(false)}
        />
      )}

      {showVoice && (
        <VoiceEntryModal onClose={() => setShowVoice(false)} />
      )}
    </div>
  );
}

// ✅ FAB STYLE (centralized)
const fabStyle = (color) => ({
  position: "fixed",
  bottom: 80,
  right: "max(16px, calc(50vw - 224px))",
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: color,
  color: "#fff",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  zIndex: 100,
  boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});