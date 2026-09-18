import { useEffect, useState } from "react";
import { api } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import InquiryForm from "./components/InquiryForm.jsx";
import Timeline from "./components/Timeline.jsx";
import AuditPanel from "./components/AuditPanel.jsx";
import Supervisor from "./components/Supervisor.jsx";
import Rooms from "./components/Rooms.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inquiry", label: "New" },
  { id: "timeline", label: "Timeline" },
  { id: "supervisor", label: "Supervisor" },
  { id: "rooms", label: "Rooms" },
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
      <header className="px-4 py-3 border-b border-stone-200 bg-white sticky top-0 z-10">
        <p className="text-xs uppercase tracking-wide text-stone-400">Bano Palace Hotel</p>
        <h1 className="text-lg font-semibold text-teal-900">BanoResa</h1>
      </header>

      <nav className="flex overflow-x-auto whitespace-nowrap bg-white border-b border-stone-200 sticky top-[57px] z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2.5 text-xs font-medium ${tab === t.id ? "text-teal-700 border-b-2 border-teal-700" : "text-stone-400"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-4 pb-10">
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
        {tab === "supervisor" && <Supervisor reservations={reservations} onAction={refresh} />}
        {tab === "rooms" && <Rooms rooms={rooms} onAction={refresh} />}
        {tab === "audit" && <AuditPanel entries={auditLog} />}
      </main>
    </div>
  );
} 
