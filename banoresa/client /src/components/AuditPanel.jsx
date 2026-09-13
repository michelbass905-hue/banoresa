export default function AuditPanel({ entries }) {
  return (
    <div className="space-y-2">
      {entries.length === 0 && <p className="text-sm text-stone-400">No activity yet.</p>}
      {entries.map((e) => (
        <div key={e.logId} className="border-b border-stone-100 pb-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{e.action}</span>
            <span className="text-stone-400 text-xs">{new Date(e.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-xs text-stone-500">{e.resId}</p>
        </div>
      ))}
    </div>
  );
}
