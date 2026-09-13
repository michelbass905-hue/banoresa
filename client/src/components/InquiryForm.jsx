import { useState } from "react";
import { api } from "../api.js";

export default function InquiryForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", phone: "", checkIn: "", checkOut: "", roomType: "STD" });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    if (!form.name || !form.phone || !form.checkIn || !form.checkOut) {
      setError("Fill in every field before continuing.");
      return;
    }
    setError("");
    try {
      await api.createInquiry(form);
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-stone-500">Client name</label>
        <input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full mt-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-stone-500">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="w-full mt-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-stone-500">Check-in</label>
          <input
            type="date"
            value={form.checkIn}
            onChange={(e) => update("checkIn", e.target.value)}
            className="w-full mt-1 border border-stone-300 rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500">Check-out</label>
          <input
            type="date"
            value={form.checkOut}
            onChange={(e) => update("checkOut", e.target.value)}
            className="w-full mt-1 border border-stone-300 rounded-lg px-2 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-stone-500">Room type</label>
        <select
          value={form.roomType}
          onChange={(e) => update("roomType", e.target.value)}
          className="w-full mt-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="STD">Standard</option>
          <option value="JSUITE">Junior Suite</option>
          <option value="SSUITE">Senior Suite</option>
        </select>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button onClick={submit} className="w-full bg-teal-700 text-white rounded-lg py-2.5 text-sm font-medium">
        Check availability and lock room
      </button>
    </div>
  );
}
