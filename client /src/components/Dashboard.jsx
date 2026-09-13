import { useEffect, useState } from "react";
import { api } from "../api.js";

function timeLeft(lockExpiry) {
  const ms = new Date(lockExpiry).getTime() - Date.now();
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Dashboard({ rooms, reservations, onAction }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const locked = reservations.filter((r) => r.status === "locked");
  const confirmed = reservations.filter((r) => r.status === "confirmed");
  const roomLabel = (n) => rooms.find((r) => r.roomNumber === n)?.roomNumber ?? n;

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
                <button
                  onClick={() => api.confirm(r.resId).then(onAction)}
                  className="flex-1 bg-teal-700 text-white text-sm rounded-lg py-1.5"
                >
                  Confirm deposit
                </button>
                <button
                  onClick={() => api.cancel(r.resId).then(onAction)}
                  className="flex-1 border border-stone-300 text-stone-600 text-sm rounded-lg py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Confirmed</h2>
        {confirmed.length === 0 && <p className="text-sm text-stone-400">No confirmed bookings yet.</p>}
        <div className="space-y-1">
          {confirmed.map((r) => (
            <div key={r.resId} className="flex justify-between text-sm py-2 border-b border-stone-100">
              <span>Room {roomLabel(r.roomNumber)}</span>
              <span className="text-emerald-700">Confirmed</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
