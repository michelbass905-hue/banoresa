const STATUS_STYLE = {
  available: "text-stone-400 border-stone-200",
  locked: "text-amber-600 border-amber-200",
  confirmed: "text-emerald-700 border-emerald-200",
  maintenance: "text-rose-600 border-rose-200",
};

export default function Timeline({ rooms }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {rooms.map((r) => (
        <div key={r.roomNumber} className={`border rounded-xl p-3 ${STATUS_STYLE[r.status] || ""}`}>
          <p className="font-medium text-stone-900">{r.roomNumber}</p>
          <p className="text-xs text-stone-500">{r.typeId}</p>
          <p className="text-xs capitalize mt-1">{r.status}</p>
        </div>
      ))}
    </div>
  );
}
