import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Supervisor({ reservations, onAction }) {
  const [report, setReport] = useState({ arrivals: [], overdue: [], summary: {} });

  async function loadReport() {
    setReport(await api.getDailyReport());
  }

  useEffect(() => {
    loadReport();
    const id = setInterval(loadReport, 5000);
    return () => clearInterval(id);
  }, []);

  const checkedIn = reservations.filter((r) => r.status === "checked_in");

  async function act(fn, resId) {
    await fn(resId);
    await loadReport();
    onAction();
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Today's arrivals</h2>
        {report.arrivals.length === 0 && <p className="text-sm text-stone-400">No confirmed arrivals expected today.</p>}
        <div className="space-y-2">
          {report.arrivals.map((r) => (
            <div key={r.resId} className="bg-white rounded-xl border border-stone-200 p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-stone-900">Room {r.roomNumber}</p>
                <p className="text-xs text-stone-500">{r.resId}</p>
              </div>
              <button onClick={() => act(api.checkIn, r.resId)} className="bg-teal-700 text-white text-sm rounded-lg px-3 py-1.5">Check in</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Overdue (not checked in)</h2>
        {report.overdue.length === 0 && <p className="text-sm text-stone-400">Nothing overdue.</p>}
        <div className="space-y-2">
          {report.overdue.map((r) => (
            <div key={r.resId} className="bg-white rounded-xl border border-amber-200 p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-stone-900">Room {r.roomNumber}</p>
                <p className="text-xs text-stone-500">{r.resId}</p>
              </div>
              <button onClick={() => act(api.markNoShow, r.resId)} className="border border-rose-300 text-rose-600 text-sm rounded-lg px-3 py-1.5">Mark no-show</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Currently checked in</h2>
        {checkedIn.length === 0 && <p className="text-sm text-stone-400">No guests checked in.</p>}
        <div className="space-y-2">
          {checkedIn.map((r) => (
            <div key={r.resId} className="bg-white rounded-xl border border-stone-200 p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-stone-900">Room {r.roomNumber}</p>
                <p className="text-xs text-stone-500">{r.resId}</p>
              </div>
              <button onClick={() => act(api.checkOut, r.resId)} className="border border-stone-300 text-stone-600 text-sm rounded-lg px-3 py-1.5">Check out</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Daily report</h2>
        <div className="bg-white rounded-xl border border-stone-200 p-3 text-sm space-y-1">
          <p className="flex justify-between"><span>Confirmed arrivals today</span><span>{report.summary.confirmedToday ?? 0}</span></p>
          <p className="flex justify-between"><span>Currently checked in</span><span>{report.summary.checkedInToday ?? 0}</span></p>
          <p className="flex justify-between"><span>No-shows (all time)</span><span>{report.summary.noShowToday ?? 0}</span></p>
          <p className="flex justify-between"><span>Cancelled (all time)</span><span>{report.summary.cancelledToday ?? 0}</span></p>
        </div>
      </section>
    </div>
  );
}
