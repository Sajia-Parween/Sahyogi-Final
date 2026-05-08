"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useFarmer } from "../../../context/FarmerContext";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getFarmerNews,
  submitNewsReport,
  getAudioUrl,
} from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  region: string;
  source: string;
  published_date: string;
  image_url: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { id: "all", label: "All", emoji: "📰" },
  { id: "msp", label: "MSP", emoji: "💰" },
  { id: "weather", label: "Weather", emoji: "🌦️" },
  { id: "scheme", label: "Scheme", emoji: "🏛️" },
  { id: "market", label: "Market", emoji: "📈" },
  { id: "alert", label: "Alert", emoji: "⚠️" },
];

const REPORT_CATEGORIES = [
  { id: "pest", label: "🐛 Pest" },
  { id: "weather", label: "🌧️ Weather" },
  { id: "market", label: "💰 Market" },
  { id: "other", label: "📝 Other" },
];

const CATEGORY_COLORS: Record<string, { badge: string; dot: string }> = {
  msp:     { badge: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-500" },
  weather: { badge: "bg-blue-100 text-blue-700",      dot: "bg-blue-500" },
  scheme:  { badge: "bg-purple-100 text-purple-700",  dot: "bg-purple-500" },
  market:  { badge: "bg-green-100 text-green-700",    dot: "bg-green-500" },
  alert:   { badge: "bg-red-100 text-red-700",        dot: "bg-red-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewsCard() {
  const { phone } = useFarmer();
  const { language } = useLanguage();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Report form
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportCat, setReportCat] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Fetch news ──────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    if (!phone) return;
    try {
      const res = await getFarmerNews(phone, language);
      const data = res?.data?.articles || res?.data || [];
      setArticles(Array.isArray(data) ? data : []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [phone, language]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = activeCategory === "all"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  const displayed = filtered.slice(0, 5);

  // ── Report submit ───────────────────────────────────────────────────────────
  const handleReportSubmit = async () => {
    if (!reportTitle.trim() || !reportDesc.trim() || !phone) return;
    setSubmitting(true);
    try {
      const { submitNewsReport: submit } = await import("../../../services/api");
      await submit(phone, reportTitle, reportDesc, reportCat, language);
      setSubmitSuccess(true);
      setReportTitle("");
      setReportDesc("");
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowReportForm(false);
      }, 2000);
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cat colors ──────────────────────────────────────────────────────────────
  const getCat = (cat: string) =>
    CATEGORY_COLORS[cat] || { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

  return (
    <div className="group relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#2D5A27] to-[#4A7C44] p-3 rounded-xl shadow-lg shadow-green-900/20">
            <span className="text-xl text-white">📰</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Agri News</h3>
            <p className="text-xs text-gray-400">Live agriculture feed</p>
          </div>
        </div>
        <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
          {loading && <span className="w-2 h-2 border border-green-600/40 border-t-green-600 rounded-full animate-spin" />}
          LIVE
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              activeCategory === tab.id
                ? "bg-[#2D5A27] text-white shadow-md shadow-green-900/20"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : displayed.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-3xl block mb-2">🌾</span>
            <p className="text-gray-400 text-sm">No news for this category</p>
          </div>
        ) : (
          displayed.map((article) => {
            const col = getCat(article.category);
            const isExpanded = expandedId === article.id;
            return (
              <div
                key={article.id}
                className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 cursor-pointer hover:bg-gray-100/80 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${col.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${col.badge}`}>
                        {article.category.toUpperCase()}
                      </span>
                      {article.region !== "all" && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-200 text-gray-500">
                          📍 {article.region}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 ml-auto">{timeAgo(article.published_date)}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">
                      {article.title}
                    </p>
                    {isExpanded && (
                      <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                        {article.summary}
                      </p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1 font-medium">
                      {article.source} · {article.published_date}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Collapsible Report Form */}
      {showReportForm && (
        <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100 space-y-3">
          <p className="text-[10px] font-black text-[#2D5A27] uppercase tracking-widest">Submit Local Report</p>
          <input
            type="text"
            placeholder="Report title..."
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="w-full bg-white border border-green-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-400/20"
          />
          <textarea
            placeholder="Describe what you observed in your field..."
            value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
            rows={2}
            className="w-full bg-white border border-green-200 rounded-xl p-2.5 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-green-400/20 resize-none"
          />
          <div className="flex gap-2 flex-wrap">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setReportCat(cat.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  reportCat === cat.id
                    ? "bg-[#2D5A27] text-white border-[#2D5A27]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-green-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {submitSuccess ? (
            <p className="text-center text-green-600 font-bold text-xs py-2">✅ Report submitted!</p>
          ) : (
            <button
              onClick={handleReportSubmit}
              disabled={submitting || !reportTitle.trim() || !reportDesc.trim()}
              className="w-full py-2.5 rounded-xl bg-[#2D5A27] text-white font-bold text-xs hover:bg-[#3a6e32] transition-all disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "📢 Submit Report"}
            </button>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setShowReportForm(!showReportForm)}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all"
        >
          {showReportForm ? "✕ Close Form" : "📝 Report"}
        </button>
        <Link href="/farmer/news" className="flex-1">
          <button className="w-full py-2.5 rounded-xl bg-[#2D5A27] text-white font-bold text-xs hover:bg-[#3a6e32] transition-all shadow-lg shadow-green-900/20">
            View All News →
          </button>
        </Link>
      </div>
    </div>
  );
}
