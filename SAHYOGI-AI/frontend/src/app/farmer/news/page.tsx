"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getNews,
  refreshNews,
  getArticleSummary,
  getArticleAudio,
  submitNewsReport,
  getCommunityReports,
  bookmarkArticle,
  getBookmarks,
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

interface CommunityReport {
  id?: string;
  phone: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  region: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { id: "all", label: "All News" },
  { id: "msp", label: "MSP Updates" },
  { id: "weather", label: "Weather" },
  { id: "scheme", label: "Govt Schemes" },
  { id: "market", label: "Market Prices" },
  { id: "alert", label: "Alerts" },
];

const REPORT_CATEGORIES = [
  { id: "pest", label: "🐛 Pest" },
  { id: "weather", label: "🌧️ Weather" },
  { id: "market", label: "💰 Market" },
  { id: "other", label: "📝 Other" },
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  msp: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-700" },
  weather: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" },
  scheme: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-700" },
  market: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
  alert: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700" },
  pest: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700" },
  other: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", badge: "bg-gray-100 text-gray-700" },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS["other"];
}

function getCategoryEmoji(cat: string) {
  switch (cat) {
    case "msp": return "💰";
    case "weather": return "🌦️";
    case "scheme": return "🏛️";
    case "market": return "📈";
    case "alert": return "⚠️";
    case "pest": return "🐛";
    default: return "📰";
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewsReaderPage() {
  const MOCK_PHONE = "0000000000"; // Placeholder since context isn't requested here
  const MOCK_LANG = "en";

  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  
  const [activeTab, setActiveTab] = useState<"news" | "community" | "bookmarks">("news");

  // Summary Modal
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Audio Player
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [playingArticleId, setPlayingArticleId] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportCat, setReportCat] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchNewsData = useCallback(async (pageNum: number, category: string, search: string) => {
    setLoading(true);
    try {
      const res = await getNews(category, "all", search, pageNum, 10);
      const data = res?.data;
      if (data) {
        setArticles(data.articles || []);
        setTotalPages(data.total_pages || 1);
        setTotalArticles(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommunityData = useCallback(async () => {
    try {
      const res = await getCommunityReports("all");
      setReports(res?.data || []);
    } catch { }
  }, []);

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await getBookmarks(MOCK_PHONE);
      const bms = res?.data || [];
      setBookmarkedIds(new Set(bms.map((b: any) => b.id)));
    } catch { }
  }, []);

  useEffect(() => {
    if (activeTab === "news") {
      fetchNewsData(page, activeCategory, searchQuery);
    } else if (activeTab === "community") {
      fetchCommunityData();
    } else if (activeTab === "bookmarks") {
      fetchBookmarks();
    }
  }, [page, activeCategory, searchQuery, activeTab, fetchNewsData, fetchCommunityData, fetchBookmarks]);

  // Initial load
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "news" && page === 1 && !searchQuery) {
        fetchNewsData(1, activeCategory, "");
      }
      if (activeTab === "community") {
        fetchCommunityData();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTab, page, searchQuery, activeCategory, fetchNewsData, fetchCommunityData]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
    setActiveTab("news");
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshNews();
      await fetchNewsData(1, activeCategory, searchQuery);
      setPage(1);
    } catch { }
    finally { setLoading(false); }
  };

  const handleBookmark = async (articleId: string) => {
    try {
      const res = await bookmarkArticle(MOCK_PHONE, articleId);
      const isBookmarked = res?.data?.bookmarked;
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (isBookmarked) next.add(articleId);
        else next.delete(articleId);
        return next;
      });
    } catch { }
  };

  const handleSummary = async (article: Article) => {
    setSelectedArticle(article);
    setAiSummary("");
    setSummaryLoading(true);
    try {
      const res = await getArticleSummary(article.id, MOCK_LANG);
      setAiSummary(res?.data?.summary || "Summary not available.");
    } catch {
      setAiSummary("Error generating summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handlePlayAudio = async (article: Article) => {
    if (playingArticleId === article.id) {
      audioRef.current?.pause();
      setPlayingArticleId(null);
      return;
    }
    
    setPlayingArticleId(article.id);
    setPlayingTitle(article.title);
    setAudioLoading(true);
    try {
      const res = await getArticleAudio(article.id, MOCK_LANG);
      if (res?.data?.audio_url) {
        setAudioUrl(getAudioUrl(res.data.audio_url));
      }
    } catch {
      setPlayingArticleId(null);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTitle.trim() || !reportDesc.trim()) return;
    setSubmitting(true);
    try {
      await submitNewsReport(MOCK_PHONE, reportTitle, reportDesc, reportCat, MOCK_LANG);
      setSubmitSuccess(true);
      if (activeTab === "community") {
        fetchCommunityData();
      }
      setTimeout(() => {
        setShowReportModal(false);
        setSubmitSuccess(false);
        setReportTitle("");
        setReportDesc("");
      }, 2000);
    } catch { }
    finally { setSubmitting(false); }
  };

  // ─── Renderers ────────────────────────────────────────────────────────────

  const renderArticleCard = (article: Article) => {
    const isBookmarked = bookmarkedIds.has(article.id);
    const cols = getCategoryColor(article.category);
    const emoji = getCategoryEmoji(article.category);

    return (
      <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative flex flex-col h-full">
        {/* Top color bar */}
        <div className={`h-1.5 w-full ${cols.bg.replace("50", "400")}`} />
        
        <div className="p-5 flex flex-col flex-grow">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cols.badge}`}>
              {emoji} {article.category.toUpperCase()}
            </span>
            {article.region !== "all" && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                📍 {article.region}
              </span>
            )}
            <button 
              onClick={() => handleBookmark(article.id)}
              className="ml-auto text-xl hover:scale-110 transition-transform"
              title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
            >
              {isBookmarked ? "🔖" : "🏷️"}
            </button>
          </div>

          {/* Content */}
          <h3 className="text-lg font-black text-gray-800 leading-tight mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4 flex-grow">
            {article.summary}
          </p>

          {/* Footer & Actions */}
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {article.source}
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                {formatDate(article.published_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePlayAudio(article)}
                className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 flex items-center justify-center transition-colors"
                title="Read Aloud"
              >
                {playingArticleId === article.id ? "⏹️" : "🔊"}
              </button>
              <button 
                onClick={() => handleSummary(article)}
                className="px-4 h-10 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs transition-colors"
              >
                ✨ AI Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeletons = () => (
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 h-64 p-5 flex flex-col animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded-full mb-4" />
        <div className="h-6 w-full bg-gray-200 rounded-lg mb-2" />
        <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
        <div className="h-4 w-2/3 bg-gray-100 rounded mt-auto" />
      </div>
    ))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ─── Header Section ─── */}
      <div className="bg-gradient-to-r from-[#1A3317] via-[#2D5A27] to-[#1A4A1A] pt-8 pb-12 px-6 lg:px-16 text-white shadow-xl">
        <div className="max-w-6xl mx-auto">
          {/* Top nav */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/farmer" className="text-white/80 hover:text-white font-medium text-sm flex items-center gap-2">
              ← Back to Dashboard
            </Link>
            <div className="flex gap-3">
              <button onClick={handleRefresh} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold backdrop-blur-sm transition-all border border-white/10">
                🔄 Refresh News
              </button>
              <button onClick={() => setShowReportModal(true)} className="px-4 py-2 bg-green-500 hover:bg-green-400 rounded-xl text-white text-sm font-bold shadow-lg shadow-green-600/30 transition-all">
                📝 Submit Report
              </button>
            </div>
          </div>

          {/* Title & Search */}
          <div className="flex flex-col md:flex-row items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse">
                  LIVE FEED
                </span>
                <span className="text-green-200 text-sm font-medium">
                  {totalArticles} updates available
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                🌾 Agri News Reader
              </h1>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="w-full md:w-96 relative">
              <input
                type="text"
                placeholder="Search news, crops, schemes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 rounded-2xl py-3 pl-12 pr-12 outline-none focus:ring-2 focus:ring-green-400"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
              {searchQuery && (
                <button type="button" onClick={handleClearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-sm">
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-8">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setActiveTab("news");
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === tab.id && activeTab === "news"
                    ? "bg-white text-green-900 shadow-md"
                    : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                }`}
              >
                {getCategoryEmoji(tab.id)} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-16 -mt-6">
        
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex gap-2 mb-8 mx-auto w-fit">
          <button onClick={() => setActiveTab("news")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "news" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}>
            📰 Latest News
          </button>
          <button onClick={() => setActiveTab("community")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "community" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}>
            👥 Community Reports
          </button>
          <button onClick={() => setActiveTab("bookmarks")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "bookmarks" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"}`}>
            🔖 Bookmarked ({bookmarkedIds.size})
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {/* NEWS TAB */}
          {activeTab === "news" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? renderSkeletons() : articles.length > 0 ? (
                  articles.map(renderArticleCard)
                ) : (
                  <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                    <span className="text-5xl block mb-4">📭</span>
                    <h3 className="text-xl font-bold text-gray-800">No articles found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* COMMUNITY TAB */}
          {activeTab === "community" && (
            <div className="max-w-3xl mx-auto space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <span className="text-5xl block mb-4">👥</span>
                  <h3 className="text-xl font-bold text-gray-800">No community reports yet</h3>
                  <button onClick={() => setShowReportModal(true)} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl font-bold">
                    Be the first to report
                  </button>
                </div>
              ) : (
                reports.map((r, i) => {
                  const cols = getCategoryColor(r.category);
                  const emoji = getCategoryEmoji(r.category);
                  return (
                    <div key={r.id || i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${cols.bg}`}>
                        {emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cols.badge}`}>
                            {r.category.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{timeAgo(r.created_at)}</span>
                          <span className="text-xs text-gray-400">· 📍 {r.region}</span>
                        </div>
                        <h4 className="text-md font-bold text-gray-800 mb-1">{r.title}</h4>
                        <p className="text-sm text-gray-600">{r.description}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono">Reported by: ******{r.phone.slice(-4)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* BOOKMARKS TAB */}
          {activeTab === "bookmarks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookmarkedIds.size === 0 ? (
                <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <span className="text-5xl block mb-4">🔖</span>
                  <h3 className="text-xl font-bold text-gray-800">No bookmarked articles</h3>
                  <p className="text-gray-500 mt-2">Click the 🏷️ icon on any news article to save it here.</p>
                </div>
              ) : (
                // This would ideally be a separate API call to fetch full articles by ID, 
                // but since our engine returns all news, we just refetch and filter locally for simplicity here.
                <BookmarkedList ids={Array.from(bookmarkedIds)} render={renderArticleCard} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      
      {/* AI Summary Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                    ✨ AI Generated Summary
                  </span>
                  <h2 className="text-2xl font-black text-gray-800 leading-tight">
                    {selectedArticle.title}
                  </h2>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  ✕
                </button>
              </div>

              <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6 mb-6">
                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium text-green-800 animate-pulse">Generating simplified summary...</p>
                  </div>
                ) : (
                  <p className="text-lg text-gray-800 leading-relaxed font-medium">
                    {aiSummary}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Original Article Context</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedArticle.summary}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                  <span>Source: {selectedArticle.source}</span>
                  <span>{formatDate(selectedArticle.published_date)}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => handlePlayAudio(selectedArticle)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  {playingArticleId === selectedArticle.id ? "⏹️ Stop Audio" : "🔊 Listen to Article"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <h2 className="text-xl font-black">📝 Submit Local Report</h2>
              <p className="text-green-100 text-sm mt-1">Help the community by sharing field updates</p>
            </div>
            
            <div className="p-6 space-y-4">
              {submitSuccess ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Report Submitted!</h3>
                  <p className="text-gray-500">Thank you for contributing to the community.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                    <div className="flex gap-2 flex-wrap">
                      {REPORT_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setReportCat(cat.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            reportCat === cat.id ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Headline</label>
                    <input
                      type="text"
                      placeholder="E.g. Heavy rain in Sambalpur..."
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Details</label>
                    <textarea
                      placeholder="Provide more context..."
                      value={reportDesc}
                      onChange={e => setReportDesc(e.target.value)}
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">
                      Cancel
                    </button>
                    <button 
                      onClick={handleReportSubmit} 
                      disabled={submitting || !reportTitle.trim() || !reportDesc.trim()}
                      className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Audio Player Footer ─── */}
      {playingArticleId && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-40 flex items-center justify-between">
          <div className="flex items-center gap-4 max-w-6xl mx-auto w-full px-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl animate-pulse">
              🔊
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-0.5">Now Playing</p>
              <p className="font-bold truncate text-sm md:text-base">{playingTitle}</p>
            </div>
            
            {audioLoading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : audioUrl ? (
              <audio 
                ref={audioRef}
                src={audioUrl} 
                autoPlay 
                onEnded={() => setPlayingArticleId(null)}
                className="hidden"
              />
            ) : null}

            <button 
              onClick={() => {
                audioRef.current?.pause();
                setPlayingArticleId(null);
                setAudioUrl("");
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

// A small wrapper to fetch bookmarked articles since we only have IDs in state
function BookmarkedList({ ids, render }: { ids: string[], render: (a: Article) => React.ReactNode }) {
  const [bmarks, setBmarks] = useState<Article[]>([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    getNews("all", "all", "", 1, 50).then(res => {
      const all = res?.data?.articles || [];
      setBmarks(all.filter((a: Article) => ids.includes(a.id)));
      setLoad(false);
    });
  }, [ids]);

  if (load) return <div className="col-span-2 text-center py-10"><span className="animate-spin text-2xl inline-block">⏳</span></div>;
  if (bmarks.length === 0) return null;
  return <>{bmarks.map(render)}</>;
}
