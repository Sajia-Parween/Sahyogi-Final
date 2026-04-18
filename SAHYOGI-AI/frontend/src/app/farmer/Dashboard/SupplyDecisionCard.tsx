"use client";

import { useState } from "react";
import { getSellingRecommendation, sendConnectionRequest, discoverBuyers } from "../../../services/api";
import { useFarmer } from "../../../context/FarmerContext";

interface RecommendedAction {
    action: string;
    quantity: number;
    target: string;
    price: number;
}

interface PriceComparison {
    mandi: { price: number; score: number };
    pacs: { price: number; score: number };
    best_buyer: {
        name: string;
        price: number;
        score: number;
        reliability: number;
        payment_speed: string;
    };
}

interface RecommendedBuyer {
    id: string;
    name: string;
    specialty: string;
    price_per_kg: number;
    reliability_score: number;
    payment_speed: string;
    past_transactions: number;
    distance_km: number;
}

interface Recommendation {
    best_channel: string;
    recommended_actions: RecommendedAction[];
    expected_profit: number;
    price_comparison: PriceComparison;
    reasoning: string;
    risk_alert: string | null;
    recommended_buyer: RecommendedBuyer | null;
    trend: {
        direction: string;
        confidence: number;
        forecast_3d: number[];
    };
    scoring_breakdown: {
        mandi_score: number;
        pacs_score: number;
        top_buyer_score: number;
    };
}

export default function SupplyDecisionCard() {
    // Form state
    const [crop, setCrop] = useState("tomato");
    const [quantity, setQuantity] = useState(100);
    const [location, setLocation] = useState("Sambalpur");
    const [storageAvailable, setStorageAvailable] = useState(false);

    // Result state
    const [result, setResult] = useState<Recommendation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showBuyerToast, setShowBuyerToast] = useState(false);
    const [connectLoading, setConnectLoading] = useState(false);
    const { farmer, phone: farmerPhone } = useFarmer();

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await getSellingRecommendation({
                crop,
                quantity,
                location,
                storage_available: storageAvailable,
            });
            const data = res?.data || res;
            setResult(data);
        } catch (err: any) {
            setError(
                err?.response?.data?.message || "Analysis failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleConnectBuyer = async () => {
        if (!result?.recommended_buyer) return;
        setConnectLoading(true);
        try {
            // Look up real registered buyers from DB
            const buyersRes = await discoverBuyers(crop);
            const registeredBuyers = buyersRes?.data || [];

            // Find the matching buyer by name
            const matched = registeredBuyers.find(
                (b: any) => b.business_name === result.recommended_buyer?.name
            );

            if (!matched) {
                // No matching registered buyer found
                setShowBuyerToast(true);
                setTimeout(() => setShowBuyerToast(false), 4000);
                return;
            }

            await sendConnectionRequest({
                farmer_phone: farmerPhone || "9999999999",
                farmer_name: farmer?.name || "Anonymous Farmer",
                buyer_phone: matched.phone,
                crop: crop,
                quantity: quantity,
                message: `AI recommended: ${result.reasoning?.substring(0, 100)}`,
                direction: "farmer_to_buyer",
            });

            setShowBuyerToast(true);
            setTimeout(() => setShowBuyerToast(false), 4000);
        } catch (err) {
            console.error("Connection failed:", err);
            setShowBuyerToast(true);
            setTimeout(() => setShowBuyerToast(false), 4000);
        } finally {
            setConnectLoading(false);
        }
    };

    const channelLabel = (ch: string) =>
        ch === "mandi" ? "Mandi" : ch === "pacs" ? "PACS" : "Private Buyer";

    const trendIcon = (dir: string) =>
        dir === "increasing" ? "📈" : dir === "decreasing" ? "📉" : "➡️";

    const trendColor = (dir: string) =>
        dir === "increasing"
            ? "text-emerald-500"
            : dir === "decreasing"
                ? "text-red-500"
                : "text-amber-500";

    return (
        <div className="group relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 col-span-2">
            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-100/40 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-100/60 transition-all" />

            <div className="relative z-10 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3.5 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <span className="text-2xl text-white">🧠</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                                Supply <span className="text-emerald-600">Intelligence</span>
                            </h2>
                            <p className="text-gray-400 text-xs font-medium">
                                AI-powered selling decision engine
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            AI Active
                        </span>
                    </div>
                </div>

                {/* Input Form */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Crop */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Crop
                        </label>
                        <select
                            id="supply-crop-input"
                            value={crop}
                            onChange={(e) => setCrop(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        >
                            {["tomato", "wheat", "rice", "maize", "cotton", "onion", "potato", "sugarcane", "mustard", "soybean", "groundnut", "chilli"].map((c) => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Quantity (kg)
                        </label>
                        <input
                            id="supply-quantity-input"
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Location
                        </label>
                        <select
                            id="supply-location-input"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        >
                            {["Sambalpur", "Bargarh", "Jharsuguda", "Rairakhol", "Attabira"].map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Storage Toggle */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Storage Available
                        </label>
                        <button
                            id="supply-storage-toggle"
                            onClick={() => setStorageAvailable(!storageAvailable)}
                            className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all border ${storageAvailable
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                        >
                            {storageAvailable ? "✅ Yes, I have storage" : "❌ No storage"}
                        </button>
                    </div>
                </div>

                {/* Analyze Button */}
                <button
                    id="supply-analyze-button"
                    onClick={handleAnalyze}
                    disabled={loading || !crop || quantity <= 0}
                    className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:scale-[1.01] shadow-emerald-500/20"
                        }`}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing Market...
                        </>
                    ) : (
                        <>
                            🧠 Analyze & Recommend
                        </>
                    )}
                </button>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-5 animate-fadeIn">
                        {/* Strategy Badge */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        Recommended
                                    </span>
                                    <span className="text-sm font-bold text-gray-700">
                                        {channelLabel(result.best_channel)}
                                    </span>
                                </div>
                                <div className={`flex items-center gap-1 ${trendColor(result.trend.direction)}`}>
                                    <span>{trendIcon(result.trend.direction)}</span>
                                    <span className="text-xs font-bold capitalize">
                                        {result.trend.direction}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-1">
                                        ({result.trend.confidence}% conf.)
                                    </span>
                                </div>
                            </div>

                            {/* Recommended Actions */}
                            <div className="space-y-2">
                                {result.recommended_actions.map((action, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-3 rounded-xl border ${action.action === "sell_now"
                                            ? "bg-white border-emerald-100"
                                            : "bg-amber-50/50 border-amber-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${action.action === "sell_now"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                                }`}>
                                                {action.action === "sell_now" ? "💰" : "📦"}
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {action.action === "sell_now" ? "Sell Now" : "Hold"}: {action.quantity}kg
                                                </p>
                                                <p className="text-xs text-gray-400">{action.target}</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-gray-800">
                                            ₹{action.price}<span className="text-xs text-gray-400 font-medium">/kg</span>
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Expected Profit */}
                            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Expected Total Revenue
                                </span>
                                <span className="text-2xl font-black text-emerald-700">
                                    ₹{result.expected_profit.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>

                        {/* Price Comparison */}
                        <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                                📊 Channel Comparison (Score-Based Ranking)
                            </p>
                            <div className="space-y-3">
                                {[
                                    {
                                        label: "Mandi",
                                        price: result.price_comparison.mandi.price,
                                        score: result.price_comparison.mandi.score,
                                        color: "bg-blue-500",
                                        bg: "bg-blue-50",
                                    },
                                    {
                                        label: "PACS",
                                        price: result.price_comparison.pacs.price,
                                        score: result.price_comparison.pacs.score,
                                        color: "bg-indigo-500",
                                        bg: "bg-indigo-50",
                                    },
                                    {
                                        label: result.price_comparison.best_buyer.name,
                                        price: result.price_comparison.best_buyer.price,
                                        score: result.price_comparison.best_buyer.score,
                                        color: "bg-emerald-500",
                                        bg: "bg-emerald-50",
                                        extra: `⭐ ${result.price_comparison.best_buyer.reliability}/5 · ${result.price_comparison.best_buyer.payment_speed.replace(/_/g, " ")}`,
                                    },
                                ]
                                    .sort((a, b) => b.score - a.score)
                                    .map((ch, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-28 flex-shrink-0">
                                                <p className="text-xs font-bold text-gray-700 truncate">{ch.label}</p>
                                                {ch.extra && (
                                                    <p className="text-[10px] text-gray-400">{ch.extra}</p>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${ch.color} rounded-full transition-all duration-700`}
                                                        style={{ width: `${Math.min(ch.score, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-20 text-right flex-shrink-0">
                                                <span className="text-sm font-black text-gray-800">₹{ch.price}</span>
                                                <span className="text-[10px] text-gray-400 ml-1">{ch.score}%</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Reasoning */}
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">
                                💡 AI Reasoning
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                {result.reasoning}
                            </p>
                        </div>

                        {/* Risk Alert */}
                        {result.risk_alert && (
                            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${result.risk_alert.includes("⚠")
                                ? "bg-amber-50 border-amber-200"
                                : "bg-blue-50 border-blue-200"
                                }`}>
                                <span className="text-xl mt-0.5">
                                    {result.risk_alert.includes("⚠") ? "⚠️" : "💡"}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Risk Alert
                                    </p>
                                    <p className={`text-sm font-bold ${result.risk_alert.includes("⚠")
                                        ? "text-amber-700"
                                        : "text-blue-700"
                                        }`}>
                                        {result.risk_alert}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Connect to Buyer — Monetization Hook */}
                        {result.recommended_buyer && (
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                                            Top Recommended Buyer
                                        </p>
                                        <p className="text-lg font-black">
                                            {result.recommended_buyer.name}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/70">
                                            <span>⭐ {result.recommended_buyer.reliability_score}/5</span>
                                            <span>•</span>
                                            <span>₹{result.recommended_buyer.price_per_kg}/kg</span>
                                            <span>•</span>
                                            <span>{result.recommended_buyer.distance_km}km away</span>
                                            <span>•</span>
                                            <span>{result.recommended_buyer.past_transactions} deals</span>
                                        </div>
                                        <p className="text-[10px] text-white/50 mt-1">
                                            {result.recommended_buyer.specialty} · Payment: {result.recommended_buyer.payment_speed.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                    <button
                                        id="supply-connect-buyer-button"
                                        onClick={handleConnectBuyer}
                                        className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-black/10 active:scale-95 flex-shrink-0"
                                    >
                                        Connect to Buyer →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Buyer Toast */}
                {showBuyerToast && (
                    <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3 animate-slideUp">
                        <span className="text-xl">✅</span>
                        <div>
                            <p className="font-bold text-sm">Connection Request Sent!</p>
                            <p className="text-xs text-white/70">
                                {result?.recommended_buyer?.name} will contact you shortly.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Accent line */}
            <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 group-hover:w-full" />

            {/* Toast animation style */}
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}
