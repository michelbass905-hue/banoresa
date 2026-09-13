import { useEffect, useState } from "react";
import { api } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import InquiryForm from "./components/InquiryForm.jsx";
import Timeline from "./components/Timeline.jsx";
import AuditPanel from "./components/AuditPanel.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inquiry", label: "New inquiry" },
  { id: "timeline", label: "Timeline" },
  { id: "audit", label: "Audit log" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  async function refresh() {
    const [r, res, log] = await Promise.all([api.getRooms(), api.getReservations(), api.getAuditLog()]);
    setRooms(r);
    setReservations(res);
    setAuditLog(log);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-stone-50 font-sans">
      <header className="px-4 py-3 border-b border-stone-200 bg-white sticky top-0">
        <p className="text-xs uppercase tracking-wide text-stone-400">Bano Palace Hotel</p>
        <h1 className="text-lg font-semibold text-teal-900">BanoResa</h1>
      </header>

      <main className="p-4 pb-20">
        {tab === "dashboard" && <Dashboard rooms={rooms} reservations={reservations} onAction={refresh} />}
        {tab === "inquiry" && (
          <InquiryForm
            onCreated={() => {
              refresh();
              setTab("dashboard");
            }}
          />
        )}
        {tab === "timeline" && <Timeline rooms={rooms} />}
        {tab === "audit" && <AuditPanel entries={auditLog} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 max-w-sm mx-auto bg-white border-t border-stone-200 flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-medium ${tab === t.id ? "text-teal-700" : "text-stone-400"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
