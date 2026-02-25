import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Farmer ───
export async function getFarmer(phone: string) {
  const res = await api.get(`/api/v1/farmer/${phone}`);
  return res.data;
}

// ─── Advice ───
export async function getAdvice(phone: string) {
  const res = await api.get(`/api/v1/advice/${phone}`);
  return res.data;
}

// ─── Chat ───
export async function sendChatMessage(phone: string, question: string) {
  const res = await api.post("/api/v1/chat", { phone, question });
  return res.data;
}

// ─── Call Simulation ───
export async function simulateCall(phone: string) {
  const res = await api.post("/api/v1/calls", { phone });
  return res.data;
}

// ─── Sell Simulation ───
export async function simulateSell(phone: string, sell_after_days: number) {
  const res = await api.post("/api/v1/simulate-sell", {
    phone,
    sell_after_days,
  });
  return res.data;
}

// ─── Analytics ───
export async function getAnalyticsSummary() {
  const res = await api.get("/api/v1/analytics/summary");
  return res.data;
}

// ─── Market Prices ───
export async function getMarketPrices() {
  const res = await api.get("/api/v1/market-prices/all");
  return res.data;
}

// ─── Audio URL builder ───
export function getAudioUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export default api;
