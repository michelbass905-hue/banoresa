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
  createInquiry: (body) =>
    fetch(`${BASE}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  confirm: (resId) => fetch(`${BASE}/reservations/${resId}/confirm`, { method: "POST" }).then(handle),
  cancel: (resId) => fetch(`${BASE}/reservations/${resId}/cancel`, { method: "POST" }).then(handle),
};
