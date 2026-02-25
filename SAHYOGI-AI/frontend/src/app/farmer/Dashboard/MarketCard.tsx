"use client";

import { useEffect, useState } from "react";
import { getMarketPrices } from "../../../services/api";

interface CropPrice {
  crop: string;
  price: number;
  previous_price: number;
  daily_change_percent: number;
  trend: string;
  projection_7d_percent: number;
  unit: string;
}

export default function MarketCard() {
  const [crops, setCrops] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await getMarketPrices();
        setCrops(res.crops || []);
      } catch {
        // Fallback to empty — will show placeholders
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fallback data if API call fails
  const marketData: CropPrice[] = crops.length > 0
    ? crops
    : [
      { crop: "Wheat", price: 2450, previous_price: 2420, daily_change_percent: 1.2, trend: "rising", projection_7d_percent: 3.0, unit: "Per Quintal" },
      { crop: "Rice", price: 2350, previous_price: 2340, daily_change_percent: 0.4, trend: "rising", projection_7d_percent: 1.5, unit: "Per Quintal" },
      { crop: "Maize", price: 2100, previous_price: 2080, daily_change_percent: 1.0, trend: "rising", projection_7d_percent: 2.1, unit: "Per Quintal" },
      { crop: "Cotton", price: 7200, previous_price: 7150, daily_change_percent: 0.7, trend: "stable", projection_7d_percent: 0.5, unit: "Per Quintal" },
      { crop: "Sugarcane", price: 340, previous_price: 338, daily_change_percent: 0.6, trend: "rising", projection_7d_percent: 1.0, unit: "Per Quintal" },
    ];

  const getEmoji = (crop: string) => {
    const lower = crop.toLowerCase();
    if (lower.includes("wheat")) return "🌾";
    if (lower.includes("rice")) return "🍚";
    if (lower.includes("maize") || lower.includes("corn")) return "🌽";
    if (lower.includes("cotton")) return "🏵️";
    if (lower.includes("sugarcane")) return "🎋";
    if (lower.includes("soybean") || lower.includes("soy")) return "🫘";
    return "🌿";
  };

  const getTrendBadge = (trend: string) => {
    if (trend === "rising")
      return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">📈 Rising</span>;
    if (trend === "falling")
      return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">📉 Falling</span>;
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">➡️ Stable</span>;
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Price List */}
      <div className="space-y-3">
        {marketData.map((item, index) => {
          const changePercent = item.daily_change_percent;
          const isUp = changePercent > 0;
          const isDown = changePercent < 0;
          const changeColor = isUp ? "text-green-600" : isDown ? "text-red-500" : "text-gray-500";
          const changeArrow = isUp ? "▲" : isDown ? "▼" : "→";

          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-green-200 transition-all"
            >
              {/* Left: Icon, Name, Trend Badge */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-lg">{getEmoji(item.crop)}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.crop}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.unit}</p>
                    {getTrendBadge(item.trend)}
                  </div>
                </div>
              </div>

              {/* Right: Price & Change */}
              <div className="text-right">
                <p className="text-lg font-black text-gray-900 leading-none">
                  ₹{item.price.toLocaleString("en-IN")}
                </p>
                <p className={`text-[10px] font-black mt-1 ${changeColor}`}>
                  {changeArrow} {isUp ? "+" : ""}{changePercent.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Area */}
      <button suppressHydrationWarning className="w-full mt-5 py-4 rounded-2xl bg-gray-900 hover:bg-[#2D5A27] text-white text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95">
        View Full Market Insights
      </button>
    </div>
  );
}