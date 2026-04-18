"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBuyer } from "../../context/BuyerContext";
import {
    getBuyerProfile, updateBuyerListing, getBuyerRequests,
    respondToConnection, getBuyerAnalytics, discoverFarmers,
    sendConnectionRequest,
} from "../../services/api";

const CROP_OPTIONS = ["tomato", "wheat", "rice", "maize", "cotton", "onion", "potato", "sugarcane", "mustard", "soybean", "groundnut", "chilli"];

type Tab = "requests" | "find_farmers" | "listing" | "analytics" | "profile";

export default function BuyerDashboard() {
    const router = useRouter();
    const { buyer, phone, setBuyer, logout } = useBuyer();

    const [activeTab, setActiveTab] = useState<Tab>("requests");
    const [requests, setRequests] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [farmers, setFarmers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("");

    // Find Farmers form state
    const [reqCrop, setReqCrop] = useState("tomato");
    const [reqQty, setReqQty] = useState(100);
    const [reqPrice, setReqPrice] = useState(20);
    const [reqQuality, setReqQuality] = useState("standard");
    const [reqDelivery, setReqDelivery] = useState("buyer_pickup");
    const [reqMessage, setReqMessage] = useState("");

    // Listing edit state
    const [editCrops, setEditCrops] = useState<string[]>([]);
    const [editPriceMin, setEditPriceMin] = useState(10);
    const [editPriceMax, setEditPriceMax] = useState(30);
    const [editMaxQty, setEditMaxQty] = useState(5000);
    const [editPayment, setEditPayment] = useState("3_days");
    const [editDesc, setEditDesc] = useState("");
    const [editActive, setEditActive] = useState(true);

    // Redirect if not logged in
    useEffect(() => {
        if (!phone) router.push("/buyer/login");
    }, [phone, router]);

    // Load data
    const loadRequests = useCallback(async () => {
        if (!phone) return;
        try {
            const res = await getBuyerRequests(phone, statusFilter || undefined);
            setRequests(res?.data || []);
        } catch { }
    }, [phone, statusFilter]);

    const loadAnalytics = useCallback(async () => {
        if (!phone) return;
        try {
            const res = await getBuyerAnalytics(phone);
            setAnalytics(res?.data || null);
        } catch { }
    }, [phone]);

    const loadProfile = useCallback(async () => {
        if (!phone) return;
        try {
            const res = await getBuyerProfile(phone);
            const data = res?.data || res;
            if (data && !data.error) {
                setBuyer(data);
                setEditCrops(data.crops_buying || []);
                setEditPriceMin(data.price_range?.min || 10);
                setEditPriceMax(data.price_range?.max || 30);
                setEditMaxQty(data.max_quantity_kg || 5000);
                setEditPayment(data.payment_speed || "3_days");
                setEditDesc(data.description || "");
                setEditActive(data.active !== false);
            }
        } catch { }
    }, [phone, setBuyer]);

    const loadFarmers = useCallback(async () => {
        try {
            const res = await discoverFarmers();
            setFarmers(res?.data || []);
        } catch { }
    }, []);

    useEffect(() => {
        loadRequests();
        loadAnalytics();
        loadProfile();
        loadFarmers();
    }, [loadRequests, loadAnalytics, loadProfile, loadFarmers]);

    useEffect(() => { loadRequests(); }, [statusFilter, loadRequests]);

    // Handle respond to request
    const handleRespond = async (requestId: string, accept: boolean) => {
        setLoading(true);
        try {
            await respondToConnection({
                request_id: String(requestId),
                accept,
                response_message: accept ? "Accepted! Will contact you soon." : "Sorry, unable to fulfill at this time.",
            });
            showToast(accept ? "✅ Request accepted!" : "❌ Request declined");
            loadRequests();
            loadAnalytics();
        } catch {
            showToast("Failed to respond. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Send request to farmer
    const handleRequestFarmer = async (farmer: any) => {
        if (!phone || !buyer) return;
        setLoading(true);
        try {
            const qualityLabels: Record<string,string> = { premium: "Premium Grade", standard: "Standard Quality", any: "Any Quality" };
            const deliveryLabels: Record<string,string> = { buyer_pickup: "We will pick up", farmer_delivery: "Farmer delivers", negotiable: "Negotiable" };
            const fullMessage = [
                `📋 BUYING REQUEST from ${buyer.business_name || buyer.name}`,
                `🌿 Crop: ${reqCrop.charAt(0).toUpperCase() + reqCrop.slice(1)}`,
                `📦 Quantity: ${reqQty}kg`,
                `💰 Offered Price: ₹${reqPrice}/kg`,
                `⭐ Quality: ${qualityLabels[reqQuality] || reqQuality}`,
                `🚚 Delivery: ${deliveryLabels[reqDelivery] || reqDelivery}`,
                `⚡ Payment: ${buyer.payment_speed?.replace(/_/g, ' ') || '3 days'}`,
                reqMessage ? `📝 Note: ${reqMessage}` : "",
            ].filter(Boolean).join(" | ");

            await sendConnectionRequest({
                farmer_phone: farmer.phone,
                farmer_name: farmer.name,
                buyer_phone: phone,
                crop: reqCrop,
                quantity: reqQty,
                message: fullMessage,
                direction: "buyer_to_farmer",
            });
            showToast(`✅ Request sent to ${farmer.name}!`);
            loadRequests();
        } catch {
            showToast("Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    // Save listing
    const handleSaveListing = async () => {
        if (!phone) return;
        setLoading(true);
        try {
            await updateBuyerListing(phone, {
                crops_buying: editCrops,
                price_range: { min: editPriceMin, max: editPriceMax },
                max_quantity_kg: editMaxQty,
                payment_speed: editPayment,
                description: editDesc,
                active: editActive,
            });
            showToast("✅ Listing updated successfully!");
            loadProfile();
        } catch {
            showToast("Failed to update listing");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogout = () => {
        logout();
        router.push("/buyer/login");
    };

    const paymentLabel = (s: string) => s?.replace(/_/g, " ") || "";
    const statusColor = (s: string) =>
        s === "pending" ? "bg-amber-50 text-amber-700 border-amber-200"
            : s === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200";

    if (!phone || !buyer) return null;

    const pendingCount = requests.filter(r => r.status === "pending").length;

    return (
        <div className="min-h-screen bg-[#E2E8F0] bg-[radial-gradient(circle_at_top,_#F1F5F9_0%,_#E2E8F0_100%)]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white shadow-sm px-8 py-4">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="text-white text-lg font-black">🏪</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-800 tracking-tight">
                                {buyer.business_name || buyer.name}
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Buyer Dashboard • {buyer.location}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {buyer.verified && (
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                ✓ Verified
                            </span>
                        )}
                        <span className="text-sm text-gray-500 font-medium">
                            ⭐ {buyer.reliability_score}/5 • {buyer.total_transactions} deals
                        </span>
                        <button onClick={handleLogout}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1440px] mx-auto px-8 py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-5 mb-8">
                    {[
                        { label: "Pending Requests", value: pendingCount, icon: "📥", bg: "bg-amber-50" },
                        { label: "Total Requests", value: analytics?.total_requests || 0, icon: "📊", bg: "bg-blue-50" },
                        { label: "Acceptance Rate", value: `${analytics?.acceptance_rate || 0}%`, icon: "✅", bg: "bg-emerald-50" },
                        { label: "Farmers Available", value: farmers.length, icon: "🌾", bg: "bg-purple-50" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex items-center gap-4 hover:-translate-y-0.5 transition-all">
                            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center text-xl`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {([
                        { id: "requests" as Tab, label: "Connection Requests", icon: "📥", count: pendingCount },
                        { id: "find_farmers" as Tab, label: "Find Farmers", icon: "🌾" },
                        { id: "listing" as Tab, label: "My Listing", icon: "📝" },
                        { id: "analytics" as Tab, label: "Analytics", icon: "📈" },
                        { id: "profile" as Tab, label: "Profile", icon: "👤" },
                    ]).map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                            {tab.count ? (
                                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-black">
                                    {tab.count}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-5">
                    {/* ─── REQUESTS TAB ─── */}
                    {activeTab === "requests" && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                {["", "pending", "accepted", "rejected"].map((s) => (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${statusFilter === s ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"}`}>
                                        {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {requests.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-md">
                                    <span className="text-5xl mb-4 block">📭</span>
                                    <p className="text-gray-400 font-bold text-lg">No requests yet</p>
                                    <p className="text-gray-300 text-sm mt-1">When farmers want to sell their crop to you, requests will appear here.</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <div key={req.id} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:-translate-y-0.5 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-lg">
                                                        {req.direction === "buyer_to_farmer" ? "📤" : "🌾"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">
                                                            {req.direction === "buyer_to_farmer" ? `You → ${req.farmer_name}` : req.farmer_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{req.farmer_phone} • {new Date(req.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                    {req.direction === "buyer_to_farmer" && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                            Sent by you
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-gray-600 mt-3 ml-13">
                                                    <span className="font-bold">🌿 {req.crop}</span>
                                                    <span>📦 {req.quantity}kg</span>
                                                    {req.message && <span className="text-gray-400 italic">&ldquo;{req.message}&rdquo;</span>}
                                                </div>
                                            </div>

                                            {req.status === "pending" && req.direction !== "buyer_to_farmer" && (
                                                <div className="flex gap-2 flex-shrink-0 ml-4">
                                                    <button onClick={() => handleRespond(req.id, true)} disabled={loading}
                                                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                                        ✓ Accept
                                                    </button>
                                                    <button onClick={() => handleRespond(req.id, false)} disabled={loading}
                                                        className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95">
                                                        ✕ Decline
                                                    </button>
                                                </div>
                                            )}

                                            {req.status === "accepted" && (
                                                <div className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                                                    ✅ Accepted
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ─── FIND FARMERS TAB ─── */}
                    {activeTab === "find_farmers" && (
                        <div className="space-y-5">
                            {/* Requirements Form */}
                            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-white text-lg">📋</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800">Your Buying Requirements</h3>
                                        <p className="text-xs text-gray-400">Set your requirements below, then send to any farmer</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Crop Needed</label>
                                        <select value={reqCrop} onChange={(e) => setReqCrop(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                            {CROP_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quantity (kg)</label>
                                        <input type="number" value={reqQty} onChange={(e) => setReqQty(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Offered Price (₹/kg)</label>
                                        <input type="number" value={reqPrice} onChange={(e) => setReqPrice(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quality Required</label>
                                        <select value={reqQuality} onChange={(e) => setReqQuality(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                            <option value="premium">Premium Grade</option>
                                            <option value="standard">Standard Quality</option>
                                            <option value="any">Any Quality</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Delivery</label>
                                        <select value={reqDelivery} onChange={(e) => setReqDelivery(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                            <option value="buyer_pickup">We will pick up</option>
                                            <option value="farmer_delivery">Farmer delivers</option>
                                            <option value="negotiable">Negotiable</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Additional Notes</label>
                                        <input type="text" value={reqMessage} onChange={(e) => setReqMessage(e.target.value)}
                                            placeholder="e.g. Need organic, pesticide-free"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                </div>
                                {/* Requirements Preview */}
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Requirements Preview (sent to farmer)</p>
                                    <div className="flex flex-wrap gap-3 text-sm text-emerald-700">
                                        <span className="font-bold">🌿 {reqCrop.charAt(0).toUpperCase() + reqCrop.slice(1)}</span>
                                        <span>📦 {reqQty}kg</span>
                                        <span>💰 ₹{reqPrice}/kg</span>
                                        <span>⭐ {reqQuality === "premium" ? "Premium" : reqQuality === "standard" ? "Standard" : "Any"}</span>
                                        <span>🚚 {reqDelivery === "buyer_pickup" ? "Buyer picks up" : reqDelivery === "farmer_delivery" ? "Farmer delivers" : "Negotiable"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Farmer List */}
                            {farmers.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-md">
                                    <span className="text-5xl mb-4 block">🌾</span>
                                    <p className="text-gray-400 font-bold text-lg">No registered farmers found</p>
                                    <p className="text-gray-300 text-sm mt-1">Farmers will appear here when they register on the platform.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500 font-bold">🌾 {farmers.length} registered farmer(s) — click &ldquo;Send Request&rdquo; to send your requirements</p>
                                    {farmers.map((farmer: any, i: number) => (
                                        <div key={farmer.id || i} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:-translate-y-0.5 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">👨‍🌾</div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{farmer.name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                                            <span>📞 +91{farmer.phone}</span>
                                                            {farmer.crop && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-bold">🌿 {farmer.crop}</span>}
                                                            {farmer.language && <span>🗣 {farmer.language.toUpperCase()}</span>}
                                                            {farmer.sowing_date && <span>📅 Sown: {farmer.sowing_date}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRequestFarmer(farmer)} disabled={loading}
                                                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex-shrink-0">
                                                    {loading ? "Sending..." : "📩 Send Requirements"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── LISTING TAB ─── */}
                    {activeTab === "listing" && (
                        <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">My Buyer Listing</h3>
                                    <p className="text-sm text-gray-400">Farmers see this when choosing who to sell to</p>
                                </div>
                                <button onClick={() => setEditActive(!editActive)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${editActive ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                                    {editActive ? "🟢 Active" : "🔴 Inactive"}
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Crops I Buy</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CROP_OPTIONS.map((crop) => (
                                            <button key={crop}
                                                onClick={() => setEditCrops(prev => prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop])}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${editCrops.includes(crop) ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                                                {crop.charAt(0).toUpperCase() + crop.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Min Price (₹/kg)</label>
                                        <input type="number" value={editPriceMin} onChange={(e) => setEditPriceMin(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Max Price (₹/kg)</label>
                                        <input type="number" value={editPriceMax} onChange={(e) => setEditPriceMax(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Max Quantity (kg)</label>
                                        <input type="number" value={editMaxQty} onChange={(e) => setEditMaxQty(Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Payment Speed</label>
                                    <select value={editPayment} onChange={(e) => setEditPayment(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                        <option value="instant">Instant (UPI)</option>
                                        <option value="next_day">Next Day</option>
                                        <option value="3_days">3 Days</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Business Description</label>
                                    <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                                </div>

                                <button onClick={handleSaveListing} disabled={loading}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all">
                                    {loading ? "Saving..." : "Save Listing Changes"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── ANALYTICS TAB ─── */}
                    {activeTab === "analytics" && analytics && (
                        <div className="space-y-5">
                            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                                <h3 className="text-lg font-black text-gray-800 mb-4">Request Analytics</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-black text-amber-600">{analytics.pending}</p>
                                        <p className="text-[10px] font-bold text-amber-500 uppercase">Pending</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-black text-emerald-600">{analytics.accepted}</p>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Accepted</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-black text-red-500">{analytics.rejected}</p>
                                        <p className="text-[10px] font-bold text-red-400 uppercase">Rejected</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-black text-blue-600">{analytics.acceptance_rate}%</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase">Accept Rate</p>
                                    </div>
                                </div>
                            </div>

                            {analytics.crop_demand_breakdown && Object.keys(analytics.crop_demand_breakdown).length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                                    <h3 className="text-lg font-black text-gray-800 mb-4">Crop Demand Breakdown</h3>
                                    <div className="space-y-3">
                                        {Object.entries(analytics.crop_demand_breakdown)
                                            .sort((a: any, b: any) => b[1] - a[1])
                                            .map(([crop, qty]: any) => {
                                                const maxQty = Math.max(...Object.values(analytics.crop_demand_breakdown) as number[]);
                                                const pct = (qty / maxQty) * 100;
                                                return (
                                                    <div key={crop} className="flex items-center gap-3">
                                                        <span className="w-20 text-sm font-bold text-gray-700 capitalize">{crop}</span>
                                                        <div className="flex-grow h-4 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                                                                style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="w-16 text-right text-sm font-black text-gray-800">{qty}kg</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── PROFILE TAB ─── */}
                    {activeTab === "profile" && buyer && (
                        <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-4xl">🏪</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800">{buyer.business_name || buyer.name}</h3>
                                    <p className="text-gray-400 text-sm font-medium">{buyer.name} • {buyer.business_type?.replace(/_/g, " ")}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span>📍 {buyer.location}</span>
                                        <span>📞 +91{buyer.phone}</span>
                                        {buyer.email && <span>✉ {buyer.email}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Crops Buying</p>
                                    <div className="flex flex-wrap gap-2">
                                        {buyer.crops_buying?.map((c: string) => (
                                            <span key={c} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 capitalize">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Business Details</p>
                                    <div className="space-y-1.5 text-sm text-gray-600">
                                        <p>💰 Price: ₹{buyer.price_range?.min}–₹{buyer.price_range?.max}/kg</p>
                                        <p>📦 Max: {buyer.max_quantity_kg}kg</p>
                                        <p>⚡ Payment: {paymentLabel(buyer.payment_speed)}</p>
                                        <p>⭐ Rating: {buyer.reliability_score}/5</p>
                                        <p>🤝 Deals: {buyer.total_transactions}</p>
                                    </div>
                                </div>
                            </div>

                            {buyer.description && (
                                <div className="bg-gray-50 rounded-xl p-5 mt-5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">About</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{buyer.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp">
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
