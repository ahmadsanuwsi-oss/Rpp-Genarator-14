import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("rpp_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function apiErr(detail) {
  if (detail == null) return "Terjadi kesalahan. Coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  if (detail && detail.msg) return detail.msg;
  return String(detail);
}

export default api;
