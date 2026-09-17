import { useState } from "react";
import { api } from "../api.js";

export default function Rooms({ rooms, onAction }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [typeId, setTypeId] = useState("STD");
  const [error, setError] = useState("");

  async function add() {
    if (!roomNumber) {
      setError("Enter a room number first.");
      return;
    }
    setError("");
    try {
      await api.addRoom({ roomNumber: Number(roomNumber), typeId });
      setRoomNumber("");
      onAction();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(n) {
    try {
      await api.removeRoom(n);
      onAction();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Add a room</h2>
        <div className="flex gap-2">
          <input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Room number"
            inputMode="numeric"
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="border border-stone-300 rounded-lg px-2 py-2 text-sm">
            <option value="STD">Standard</option>
            <option value="JSUITE">Junior Suite</option>
            <option value="SSUITE">Senior Suite</option>
          </select>
        </div>
        {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
        <button onClick={add} className="w-full mt-2 bg-teal-700 text-white rounded-lg py-2 text-sm font-medium">Add room</button>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">All rooms</h2>
        <div className="space-y-1">
          {rooms.map((r) => (
            <div key={r.roomNumber} className="flex justify-between items-center text-sm py-2 border-b border-stone-100">
              <span>{r.roomNumber} · {r.typeId} · <span className="text-stone-400 capitalize">{r.status}</span></span>
              {r.status === "available" && (
                <button onClick={() => remove(r.roomNumber)} className="text-rose-600 text-xs">Remove</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
