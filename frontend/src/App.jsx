import React, { useState, useMemo } from "react";
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

  const [screen, setScreenRaw] = useState("dashboard");
  const [activeBiz, setActiveBiz] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [transferMode, setTransferMode] = useState("business");

  // ✅ Normalize screen values (prevents bugs)
  const setScreen = (s, biz = null) => {
    const normalized = (s || "").trim().toLowerCase();
    setActiveBiz(biz);
    setScreenRaw(normalized);
  };

  if (!user) return <Login />;

  const openTransfer = (mode = "business") => {
    setTransferMode(mode);
    setShowTransfer(true);
  };

  // ✅ SINGLE RENDER SOURCE (no overlap possible)
  const content = useMemo(() => {
    switch (screen) {
      case "dashboard":
        return <Dashboard goTo={setScreen} openTransfer={openTransfer} />;

      case "bizdetail":
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
        return <Dashboard goTo={setScreen} openTransfer={openTransfer} />;
    }
  }, [screen, activeBiz]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100dvh",
        background: "#F8FAFC",
        position: "relative",
        paddingBottom: 72,
      }}
    >
      {/* MAIN SCREEN */}
      {content}

      {/* FABs — ALWAYS AVAILABLE */}
      <>
        {/* + Add */}
        <button
          onClick={() => setShowAdd(true)}
          style={{
            position: "fixed",
            bottom: 80,
            right: "max(16px, calc(50vw - 224px))",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            fontSize: 28,
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
          }}
        >
          +
        </button>

        {/* 🎙 Voice */}
        <button
          onClick={() => setShowVoice(true)}
          style={{
            position: "fixed",
            bottom: 150,
            right: "max(16px, calc(50vw - 224px))",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#EF4444",
            color: "#fff",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(239,68,68,0.45)",
          }}
        >
          🎙️
        </button>
      </>

      {/* NAV */}
      <NavBar screen={screen} setScreen={setScreen} />

      {/* MODALS */}
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