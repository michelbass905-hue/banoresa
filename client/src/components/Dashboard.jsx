import { useEffect, useState } from "react";
import { api } from "../api.js";

function timeLeft(lockExpiry) {
  const ms = new Date(lockExpiry).getTime() - Date.now();
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Dashboard({ rooms, reservations, onAction }) {
  const [, forceTick] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editDates, setEditDates] = useState({ checkIn: "", checkOut: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const locked = reservations.filter((r) => r.status === "locked");
  const confirmed = reservations.filter((r) => r.status === "confirmed");
  const roomLabel = (n) => rooms.find((r) => r.roomNumber === n)?.roomNumber ?? n;

  function startEdit(r) {
    setEditingId(r.resId);
    setEditDates({ checkIn: r.checkIn.slice(0, 10), checkOut: r.checkOut.slice(0, 10) });
    setError("");
  }

  async function saveEdit(resId) {
    try {
      await api.modify(resId, editDates);
      setEditingId(null);
      onAction();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Locked rooms</h2>
        {locked.length === 0 && <p className="text-sm text-stone-400">No rooms locked right now.</p>}
        <div className="space-y-2">
          {locked.map((r) => (
            <div key={r.resId} className="bg-white rounded-xl border border-stone-200 p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-stone-900">Room {roomLabel(r.roomNumber)}</p>
                  <p className="text-xs text-stone-500">{r.resId}</p>
                </div>
                <span className="font-mono text-amber-600 font-semibold">{timeLeft(r.lockExpiry)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => api.confirm(r.resId).then(onAction)} className="flex-1 bg-teal-700 text-white text-sm rounded-lg py-1.5">Confirm deposit</button>
                <button onClick={() => api.cancel(r.resId).then(onAction)} className="flex-1 border border-stone-300 text-stone-600 text-sm rounded-lg py-1.5">Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Confirmed</h2>
        {confirmed.length === 0 && <p className="text-sm text-stone-400">No confirmed bookings yet.</p>}
        <div className="space-y-2">
          {confirmed.map((r) => (
            <div key={r.resId} className="bg-white rounded-xl border border-stone-200 p-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-stone-900">Room {roomLabel(r.roomNumber)}</span>
                  <p className="text-xs text-stone-500">{r.resId}</p>
                </div>
                <span className="text-emerald-700 text-sm">Confirmed</span>
              </div>

              {editingId === r.resId ? (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={editDates.checkIn}
                      onChange={(e) => setEditDates((d) => ({ ...d, checkIn: e.target.value }))}
                      className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm" />
                    <input type="date" value={editDates.checkOut}
                      onChange={(e) => setEditDates((d) => ({ ...d, checkOut: e.target.value }))}
                      className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  {error && <p className="text-xs text-rose-600">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(r.resId)} className="flex-1 bg-teal-700 text-white text-sm rounded-lg py-1.5">Save dates</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-stone-300 text-stone-600 text-sm rounded-lg py-1.5">Cancel edit</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => startEdit(r)} className="flex-1 border border-stone-300 text-stone-600 text-sm rounded-lg py-1.5">Modify dates</button>
                  <button onClick={() => api.cancel(r.resId).then(onAction)} className="flex-1 border border-rose-300 text-rose-600 text-sm rounded-lg py-1.5">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
  } 
