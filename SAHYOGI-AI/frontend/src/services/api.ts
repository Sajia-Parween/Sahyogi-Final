import axios from "axios";

const API_BASE = "http://localhost:8001";

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

// ─── PACS Queue & Booking ───
export async function getPacsList() {
  const res = await api.get("/api/v1/pacs/");
  return res.data;
}

export async function getPacsQueue(pacsId: string) {
  const res = await api.get(`/api/v1/pacs/${pacsId}/queue`);
  return res.data;
}

export async function bookPacsSlot(
  pacsId: string,
  phone: string,
  service: string,
  preferredTime: string
) {
  const res = await api.post("/api/v1/pacs/book", {
    pacs_id: pacsId,
    farmer_phone: phone,
    service: service,
    preferred_time: preferredTime,
  });
  return res.data;
}

export async function getMyPacsBookings(phone: string) {
  const res = await api.get(`/api/v1/pacs/bookings/${phone}`);
  return res.data;
}

export async function cancelPacsBooking(bookingId: string) {
  const res = await api.delete(`/api/v1/pacs/bookings/${bookingId}`);
  return res.data;
}

// ─── Supply Intelligence ───
export async function getSupplyPrices(crop: string, location: string) {
  const res = await api.get(`/api/v1/supply/prices`, {
    params: { crop, location },
  });
  return res.data;
}

export async function getSupplyDemand(crop: string) {
  const res = await api.get(`/api/v1/supply/demand`, {
    params: { crop },
  });
  return res.data;
}

export async function getPricePrediction(crop: string) {
  const res = await api.get(`/api/v1/supply/predict`, {
    params: { crop },
  });
  return res.data;
}

export async function getSellingRecommendation(payload: {
  crop: string;
  quantity: number;
  location: string;
  storage_available: boolean;
}) {
  const res = await api.post("/api/v1/supply/recommend", payload);
  return res.data;
}

// ─── IVR Intelligence ───
export async function sendIvrQuery(text: string, sessionData?: Record<string, any>) {
  const res = await api.post("/api/v1/ivr-intelligence/query", {
    text,
    session_data: sessionData || null,
  });
  return res.data;
}

// ─── Buyer APIs ───
export async function registerBuyer(data: {
  phone: string;
  name: string;
  business_name?: string;
  email?: string;
  location?: string;
  crops_buying?: string[];
  price_range?: { min: number; max: number };
  max_quantity_kg?: number;
  payment_speed?: string;
  business_type?: string;
  description?: string;
}) {
  const res = await api.post("/api/v1/buyer/register", data);
  return res.data;
}

export async function loginBuyer(phone: string) {
  const res = await api.get(`/api/v1/buyer/login/${phone}`);
  return res.data;
}

export async function getBuyerProfile(phone: string) {
  const res = await api.get(`/api/v1/buyer/profile/${phone}`);
  return res.data;
}

export async function updateBuyerListing(phone: string, updates: Record<string, any>) {
  const res = await api.put(`/api/v1/buyer/profile/${phone}`, updates);
  return res.data;
}

export async function discoverBuyers(crop?: string, location?: string) {
  const res = await api.get("/api/v1/buyer/discover", {
    params: { crop: crop || undefined, location: location || undefined },
  });
  return res.data;
}

export async function sendConnectionRequest(data: {
  farmer_phone: string;
  farmer_name: string;
  buyer_phone: string;
  crop: string;
  quantity: number;
  message?: string;
  direction?: string;
}) {
  const res = await api.post("/api/v1/buyer/connect", data);
  return res.data;
}

export async function getBuyerRequests(buyerPhone: string, status?: string) {
  const res = await api.get(`/api/v1/buyer/requests/${buyerPhone}`, {
    params: { status: status || undefined },
  });
  return res.data;
}

export async function getFarmerConnectionRequests(farmerPhone: string) {
  const res = await api.get(`/api/v1/buyer/farmer-requests/${farmerPhone}`);
  return res.data;
}

export async function respondToConnection(data: {
  request_id: string;
  accept: boolean;
  response_message?: string;
}) {
  const res = await api.post("/api/v1/buyer/respond", data);
  return res.data;
}

export async function getBuyerAnalytics(buyerPhone: string) {
  const res = await api.get(`/api/v1/buyer/analytics/${buyerPhone}`);
  return res.data;
}

export async function discoverFarmers() {
  const res = await api.get("/api/v1/buyer/farmers");
  return res.data;
}

// ─── News APIs ───
export async function getNews(
  category?: string,
  region?: string,
  search?: string,
  page: number = 1,
  perPage: number = 10
) {
  const params: Record<string, any> = { page, per_page: perPage };
  if (category && category !== "all") params.category = category;
  if (region && region !== "all") params.region = region;
  if (search) params.search = search;
  const res = await api.get("/api/v1/news/", { params });
  return res.data;
}

export async function refreshNews() {
  const res = await api.post("/api/v1/news/refresh");
  return res.data;
}

export async function getFarmerNews(phone: string, language: string = "en") {
  const res = await api.get(`/api/v1/news/${phone}`, { params: { language } });
  return res.data;
}

export async function getArticleSummary(articleId: string, language: string = "en") {
  const res = await api.get(`/api/v1/news/article/${articleId}/summary`, {
    params: { language },
  });
  return res.data;
}

export async function getArticleAudio(articleId: string, language: string = "en") {
  const res = await api.get(`/api/v1/news/article/${articleId}/audio`, {
    params: { language },
  });
  return res.data;
}

export async function submitNewsReport(
  phone: string,
  title: string,
  description: string,
  category: string,
  language: string = "en"
) {
  const res = await api.post("/api/v1/news/report", {
    phone,
    title,
    description,
    category,
    language,
  });
  return res.data;
}

export async function getCommunityReports(region?: string) {
  const params: Record<string, any> = {};
  if (region && region !== "all") params.region = region;
  const res = await api.get("/api/v1/news/reports/community", { params });
  return res.data;
}

export async function bookmarkArticle(phone: string, articleId: string) {
  const res = await api.post("/api/v1/news/bookmarks", {
    phone,
    article_id: articleId,
  });
  return res.data;
}

export async function getBookmarks(phone: string) {
  const res = await api.get(`/api/v1/news/bookmarks/${phone}`);
  return res.data;
}

export default api;
