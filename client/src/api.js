import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export async function refreshAccessToken() {
  const r = await api.post("/api/auth/refresh");
  setAccessToken(r.data.accessToken);
  return r.data;
}

export function fmtMoney(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(v);
}

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
