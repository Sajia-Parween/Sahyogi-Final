"use client";

import { useState, useEffect, useCallback } from "react";
import { useFarmer } from "../../../context/FarmerContext";

interface Alert {
  id: string;
  type: "rain" | "price" | "disease" | "fertilizer";
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  time: string;
  icon: string;
}

export default function SmartAlertsCard() {
  const { phone, farmer } = useFarmer();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const generateAlerts = useCallback(async () => {
    setLoading(true);
    const newAlerts: Alert[] = [];

    // 1. RAIN ALERTS — from Open-Meteo forecast
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=21.4669&longitude=83.9812&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=5"
      );
      const data = await res.json();
      const dates = data.daily?.time || [];
      const rain = data.daily?.precipitation_sum || [];
      const prob = data.daily?.precipitation_probability_max || [];

      for (let i = 0; i < dates.length; i++) {
        if (rain[i] > 5 || prob[i] > 70) {
          const daysFromNow = Math.ceil(
            (new Date(dates[i]).getTime() - Date.now()) / 86400000
          );
          const label =
            daysFromNow === 0 ? "Today" : daysFromNow === 1 ? "Tomorrow" : `In ${daysFromNow} days`;
          newAlerts.push({
            id: `rain-${dates[i]}`,
            type: "rain",
            title: `🌧️ Rain Expected ${label}`,
            message: `${rain[i]}mm rainfall expected (${prob[i]}% chance) on ${dates[i]}. ${rain[i] > 20 ? "Heavy rain — ensure drainage & delay spraying." : "Light rain — good for crops, delay irrigation."}`,
            severity: rain[i] > 20 ? "critical" : "warning",
            time: label,
            icon: "🌧️",
          });
          break; // Show only nearest rain alert
        }
      }
    } catch {}

    // 2. PRICE ALERTS — check market price trends
    try {
      const res = await fetch("http://localhost:8001/api/v1/market-prices/all");
      const data = await res.json();
      const prices = data?.data || [];
      if (prices.length >= 2) {
        const latest = prices[prices.length - 1];
        const prevWeek = prices[Math.max(0, prices.length - 7)];
        const change = ((latest.price - prevWeek.price) / prevWeek.price) * 100;

        if (Math.abs(change) > 2) {
          newAlerts.push({
            id: "price-change",
            type: "price",
            title: change > 0 ? "📈 Price Increased!" : "📉 Price Decreased",
            message: `Wheat price ${change > 0 ? "rose" : "dropped"} by ${Math.abs(change).toFixed(1)}% this week (₹${prevWeek.price} → ₹${latest.price}/quintal). ${change > 0 ? "Good time to sell!" : "Consider holding — prices may recover."}`,
            severity: change > 5 ? "critical" : Math.abs(change) > 3 ? "warning" : "info",
            time: "This week",
            icon: change > 0 ? "📈" : "📉",
          });
        }
      }
    } catch {}

    // 3. DISEASE ALERT — season-based
    const month = new Date().getMonth();
    if (month >= 3 && month <= 5) {
      // April-June: Hot season
      newAlerts.push({
        id: "disease-heat",
        type: "disease",
        title: "🦠 Heat Stress Alert",
        message: "High temperatures above 38°C can cause heat stress in crops. Irrigate during cooler hours (early morning/evening). Watch for whitefly and aphid outbreaks common in this season.",
        severity: "warning",
        time: "Seasonal",
        icon: "🌡️",
      });
    } else if (month >= 6 && month <= 8) {
      newAlerts.push({
        id: "disease-monsoon",
        type: "disease",
        title: "🦠 Fungal Disease Risk High",
        message: "Monsoon humidity increases risk of blast, blight, and rust diseases. Apply fungicide preventively. Ensure field drainage to prevent waterlogging.",
        severity: "critical",
        time: "Monsoon Season",
        icon: "🍄",
      });
    }

    // 4. FERTILIZER REMINDER — crop stage based
    if (farmer?.sowing_date) {
      const sowDate = new Date(farmer.sowing_date);
      const daysSinceSowing = Math.floor((Date.now() - sowDate.getTime()) / 86400000);

      if (daysSinceSowing >= 20 && daysSinceSowing <= 25) {
        newAlerts.push({
          id: "fert-crown",
          type: "fertilizer",
          title: "🧪 Crown Root Irrigation Due",
          message: `Day ${daysSinceSowing} since sowing — Crown Root Initiation stage! This is the MOST CRITICAL irrigation. Missing it reduces yield by 20-25%. Irrigate immediately if not done.`,
          severity: "critical",
          time: `Day ${daysSinceSowing}`,
          icon: "💧",
        });
      } else if (daysSinceSowing >= 22 && daysSinceSowing <= 45) {
        newAlerts.push({
          id: "fert-urea1",
          type: "fertilizer",
          title: "🧪 First Nitrogen Top-Dressing",
          message: `Day ${daysSinceSowing} — Tillering stage. Apply first top-dressing of Urea (30-35 kg/acre). This promotes tiller development and increases grain heads.`,
          severity: "warning",
          time: `Day ${daysSinceSowing}`,
          icon: "🧪",
        });
      } else if (daysSinceSowing >= 46 && daysSinceSowing <= 75) {
        newAlerts.push({
          id: "fert-urea2",
          type: "fertilizer",
          title: "🧪 Second Nitrogen + Micronutrients",
          message: `Day ${daysSinceSowing} — Flowering stage. Apply second Urea top-dressing (25-30 kg/acre) and foliar spray of Zinc/Iron if deficiency observed.`,
          severity: "info",
          time: `Day ${daysSinceSowing}`,
          icon: "🌾",
        });
      } else if (daysSinceSowing >= 100 && daysSinceSowing <= 115) {
        newAlerts.push({
          id: "fert-harvest",
          type: "fertilizer",
          title: "🌾 Harvest Window Approaching",
          message: `Day ${daysSinceSowing} — Stop all irrigation. Grain should be at dough stage. Begin harvest preparation. Dry grain to 12-14% moisture for storage.`,
          severity: "info",
          time: `Day ${daysSinceSowing}`,
          icon: "🌾",
        });
      }
    }

    // If no specific alerts, add a positive one
    if (newAlerts.length === 0) {
      newAlerts.push({
        id: "all-clear",
        type: "info" as any,
        title: "✅ All Clear!",
        message: "No critical alerts right now. Your crops are in good shape. Keep monitoring regularly.",
        severity: "info",
        time: "Now",
        icon: "✅",
      });
    }

    setAlerts(newAlerts);
    setLoading(false);
  }, [farmer]);

  useEffect(() => { generateAlerts(); }, [generateAlerts]);

  // Refresh every 5 minutes
  useEffect(() => {
    const i = setInterval(generateAlerts, 5 * 60 * 1000);
    return () => clearInterval(i);
  }, [generateAlerts]);

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const activeAlerts = alerts.filter(a => !dismissed.has(a.id));
  const criticalCount = activeAlerts.filter(a => a.severity === "critical").length;
  const warningCount = activeAlerts.filter(a => a.severity === "warning").length;

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case "critical": return "bg-red-50 border-red-200 border-l-red-500";
      case "warning": return "bg-amber-50 border-amber-200 border-l-amber-500";
      default: return "bg-blue-50 border-blue-200 border-l-blue-500";
    }
  };

  return (
    <div className="group relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-xl shadow-lg shadow-red-500/20">
              <span className="text-xl text-white">🔔</span>
            </div>
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {criticalCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Smart Alerts</h3>
            <p className="text-xs text-gray-400">AI-powered farming notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[9px] font-bold">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[9px] font-bold">
              {warningCount} Warning
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-400">Analyzing conditions...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {activeAlerts.map(alert => (
            <div key={alert.id}
              className={`p-4 rounded-xl border border-l-4 ${getSeverityStyle(alert.severity)} transition-all hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{alert.icon}</span>
                    <span className="font-bold text-sm text-gray-800">{alert.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      alert.severity === "critical" ? "bg-red-200 text-red-700" :
                      alert.severity === "warning" ? "bg-amber-200 text-amber-700" :
                      "bg-blue-200 text-blue-700"
                    }`}>{alert.severity.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{alert.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">⏰ {alert.time}</p>
                </div>
                <button onClick={() => handleDismiss(alert.id)}
                  className="text-gray-300 hover:text-gray-500 text-sm ml-2 flex-shrink-0 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ))}

          {activeAlerts.length === 0 && (
            <div className="text-center py-8">
              <span className="text-4xl block mb-2">🔕</span>
              <p className="text-gray-400 text-sm">All alerts dismissed</p>
              <button onClick={generateAlerts} className="text-xs text-red-500 font-bold mt-2 hover:underline">
                🔄 Refresh Alerts
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
        <span>Auto-refreshes every 5 min</span>
        <button onClick={generateAlerts} className="text-red-500 font-bold hover:underline">🔄 Refresh Now</button>
      </div>
    </div>
  );
}
