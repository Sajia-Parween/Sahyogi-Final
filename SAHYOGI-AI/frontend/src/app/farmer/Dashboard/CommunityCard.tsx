"use client";

import { useState, useEffect, useCallback } from "react";
import { useFarmer } from "../../../context/FarmerContext";

const API = "http://localhost:8001";

// Categories for discussion
const CATEGORIES = [
  { id: "pest", label: "🐛 Pest Alert", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "price", label: "💰 Price Update", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "rain", label: "🌧️ Rain Update", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "tips", label: "💡 Farming Tips", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

interface Post {
  id: number;
  farmer_name: string;
  farmer_phone: string;
  category: string;
  message: string;
  location: string;
  likes: number;
  created_at: string;
}

export default function CommunityCard() {
  const { phone, farmer } = useFarmer();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [newMsg, setNewMsg] = useState("");
  const [newCategory, setNewCategory] = useState("tips");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const url = activeFilter === "all"
        ? `${API}/api/v1/community/posts`
        : `${API}/api/v1/community/posts?category=${activeFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data?.data || []);
    } catch { }
  }, [activeFilter]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Auto-refresh every 30s
  useEffect(() => {
    const i = setInterval(loadPosts, 30000);
    return () => clearInterval(i);
  }, [loadPosts]);

  const handlePost = async () => {
    if (!newMsg.trim() || !phone) return;
    setLoading(true);
    try {
      await fetch(`${API}/api/v1/community/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_phone: phone,
          farmer_name: farmer?.name || "Anonymous",
          category: newCategory,
          message: newMsg.trim(),
          location: "Sambalpur",
        }),
      });
      setNewMsg("");
      setShowForm(false);
      loadPosts();
    } catch { }
    finally { setLoading(false); }
  };

  const handleLike = async (postId: number) => {
    try {
      await fetch(`${API}/api/v1/community/posts/${postId}/like`, { method: "POST" });
      loadPosts();
    } catch { }
  };

  const getCatStyle = (cat: string) =>
    CATEGORIES.find(c => c.id === cat)?.color || "bg-gray-50 text-gray-700 border-gray-200";
  const getCatLabel = (cat: string) =>
    CATEGORIES.find(c => c.id === cat)?.label || cat;

  const timeAgo = (dt: string) => {
    const diff = Date.now() - new Date(dt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="group relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg shadow-purple-500/20">
            <span className="text-xl text-white">👥</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Community</h3>
            <p className="text-xs text-gray-400">Discuss with nearby farmers</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95">
          {showForm ? "✕ Close" : "+ New Post"}
        </button>
      </div>

      {/* Post Form */}
      {showForm && (
        <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-100 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${newCategory === cat.id ? cat.color + " ring-2 ring-purple-300" : "bg-white text-gray-400 border-gray-200"}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="Share pest alerts, price info, rain updates, or tips..."
            rows={2}
            className="w-full bg-white border border-purple-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none" />
          <button onClick={handlePost} disabled={loading || !newMsg.trim()}
            className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-40">
            {loading ? "Posting..." : "📢 Share with Community"}
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all flex-shrink-0 ${activeFilter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-400 border-gray-200"}`}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all flex-shrink-0 ${activeFilter === cat.id ? cat.color : "bg-white text-gray-400 border-gray-200"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">🌾</span>
            <p className="text-gray-400 text-sm font-medium">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100/70 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-gray-800">👨‍🌾 {post.farmer_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getCatStyle(post.category)}`}>
                      {getCatLabel(post.category)}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{post.message}</p>
                  {post.location && (
                    <p className="text-[10px] text-gray-400 mt-1">📍 {post.location}</p>
                  )}
                </div>
                <button onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:text-red-500 hover:border-red-200 transition-all flex-shrink-0 ml-3">
                  ❤️ {post.likes || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-center">
        <button onClick={loadPosts} className="text-xs text-purple-500 font-bold hover:underline">🔄 Refresh</button>
      </div>
    </div>
  );
}
