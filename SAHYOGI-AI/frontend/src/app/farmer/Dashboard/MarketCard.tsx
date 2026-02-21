"use client";

import { useEffect, useState } from "react";
import { useFarmer } from "../../../context/FarmerContext";
import { useAdvice } from "../../../hooks/useAdvice";

export default function MarketCard() {
  const { phone, farmer } = useFarmer();
  const { data, loading, fetchAdvice } = useAdvice();

  useEffect(() => {
    if (phone) fetchAdvice(phone);
  }, [phone, fetchAdvice]);

  // Extract market data from structured advice if available
  const structured = data?.structured;
  const marketTrend = structured?.market_trend;
  const marketPrice = structured?.market_price;

  // Build market data — real data if available, else fallback
  const marketData = marketPrice
    ? [
      {
        crop: farmer?.crop || "Wheat",
        price: typeof marketPrice === "number"
          ? marketPrice.toLocaleString()
          : String(marketPrice),
        status: marketTrend?.toLowerCase()?.includes("up") ? "up" : "down",
        change: marketTrend?.toLowerCase()?.includes("up") ? "+12" : "-05",
        color: marketTrend?.toLowerCase()?.includes("up")
          ? "text-green-600"
          : "text-red-500",
      },
    ]
    : [
      { crop: "Wheat", price: "2,150", status: "up", change: "+12", color: "text-green-600" },
      { crop: "Rice", price: "3,150", status: "down", change: "-05", color: "text-red-500" },
      { crop: "Maize", price: "1,980", status: "up", change: "+08", color: "text-green-600" },
    ];

  const getEmoji = (crop: string) => {
    const lower = crop.toLowerCase();
    if (lower.includes("wheat")) return "🌾";
    if (lower.includes("rice")) return "🍚";
    if (lower.includes("maize") || lower.includes("corn")) return "🌽";
    if (lower.includes("cotton")) return "🏵️";
    if (lower.includes("soybean") || lower.includes("soy")) return "🫘";
    return "🌿";
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-[#2D5A27] p-3 rounded-2xl shadow-lg">
            <span className="text-xl text-white">📊</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            Market <span className="text-green-600">Pulse</span>
          </h2>
        </div>
        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
          {loading && (
            <span className="w-2 h-2 border border-green-600/40 border-t-green-600 rounded-full animate-spin"></span>
          )}
          Live: Mandi
        </span>
      </div>

      {/* Market Trend from advice */}
      {marketTrend && (
        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 mb-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Market Trend</p>
          <p className="text-sm font-bold text-gray-800 mt-1">{marketTrend}</p>
        </div>
      )}

      {/* Price List Frame */}
      <div className="space-y-4">
        {marketData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-green-200 transition-all"
          >
            {/* Left Side: Icon & Name */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <span className="text-lg">{getEmoji(item.crop)}</span>
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.crop}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Per Quintal</p>
              </div>
            </div>

            {/* Right Side: Price & Trend */}
            <div className="text-right">
              <p className="text-lg font-black text-gray-900 leading-none">₹{item.price}</p>
              <p className={`text-[10px] font-black mt-1 ${item.color}`}>
                {item.status === "up" ? "▲" : "▼"} {item.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Area */}
      <button suppressHydrationWarning className="w-full mt-6 py-4 rounded-2xl bg-gray-900 hover:bg-[#2D5A27] text-white text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95">
        View Full Market Insights
      </button>
    </div>
  );
}