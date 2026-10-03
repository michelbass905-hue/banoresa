export const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "call", label: "Phone call" },
  { id: "email", label: "Email" },
  { id: "social_media", label: "Social media" },
];
export const channelLabel = (id) => CHANNELS.find((c) => c.id === id)?.label ?? id;

const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getRooms: () => fetch(`${BASE}/rooms`).then(handle),
  getReservations: () => fetch(`${BASE}/reservations`).then(handle),
  getAuditLog: () => fetch(`${BASE}/audit-log`).then(handle),
  getDailyReport: () => fetch(`${BASE}/reports/daily`).then(handle),
  createInquiry: (body) => fetch(`${BASE}/reservations`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).then(handle),
  confirm: (resId) => fetch(`${BASE}/reservations/${resId}/confirm`, { method: "POST" }).then(handle),
  cancel: (resId) => fetch(`${BASE}/reservations/${resId}/cancel`, { method: "POST" }).then(handle),
  modify: (resId, body) => fetch(`${BASE}/reservations/${resId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).then(handle),
  checkIn: (resId) => fetch(`${BASE}/reservations/${resId}/checkin`, { method: "POST" }).then(handle),
  checkOut: (resId) => fetch(`${BASE}/reservations/${resId}/checkout`, { method: "POST" }).then(handle),
  markNoShow: (resId) => fetch(`${BASE}/reservations/${resId}/no-show`, { method: "POST" }).then(handle),
  addRoom: (body) => fetch(`${BASE}/rooms`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).then(handle),
  removeRoom: (roomNumber) => fetch(`${BASE}/rooms/${roomNumber}`, { method: "DELETE" }).then(handle),
};
