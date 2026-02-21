"use client";

import { useState } from "react";
import { useFarmer } from "../../../context/FarmerContext";
import { useSimulation } from "../../../hooks/useSimulation";

export default function SellSimulation() {
  const { phone, farmer } = useFarmer();
  const { data, loading, error, runSimulation } = useSimulation();
  const [days, setDays] = useState(7);
  const [showResult, setShowResult] = useState(false);

  const handleSimulate = async () => {
    await runSimulation(phone, days);
    setShowResult(true);
  };

  const simResult = data?.simulation_result;

  return (
    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-[#2D5A27] p-3 rounded-2xl shadow-lg">
          <span className="text-xl text-white">💰</span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            Sell <span className="text-green-600">Simulation</span>
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            Simulate crop selling and compare rates
          </p>
        </div>
      </div>

      {/* Current Info */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
        <p className="text-gray-800 font-semibold">
          {farmer?.crop || "Wheat"}: ₹{simResult?.predicted_price || "2150"} / quintal
        </p>
        <p className="text-gray-500 text-sm">
          {simResult?.recommendation || "Estimated Profit: ₹8500"}
        </p>
      </div>

      {/* Days Slider */}
      <div className="mb-6">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
          Sell After (Days): {days}
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
          <span>1 day</span>
          <span>30 days</span>
        </div>
      </div>

      {/* Simulation Result */}
      {showResult && data && !error && (
        <div className="bg-green-50/60 p-4 rounded-2xl border border-green-100 mb-4 space-y-3">
          <p className="text-xs font-black text-green-700 uppercase tracking-widest">
            Simulation Result — {days} day forecast
          </p>

          {/* Price comparison */}
          <div className="grid grid-cols-2 gap-2">
            {simResult?.current_price && (
              <div className="bg-white p-2.5 rounded-xl border border-green-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Current</p>
                <p className="text-base font-black text-gray-800">₹{simResult.current_price}</p>
              </div>
            )}
            {simResult?.projected_price && (
              <div className="bg-white p-2.5 rounded-xl border border-green-50">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Projected</p>
                <p className={`text-base font-black ${simResult.expected_profit_change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{simResult.projected_price}
                </p>
              </div>
            )}
          </div>

          {/* Change & Confidence */}
          {simResult?.expected_profit_change_percent !== undefined && (
            <p className="text-sm text-gray-700">
              <span className="font-bold">Expected Change:</span>{' '}
              <span className={simResult.expected_profit_change_percent > 0 ? 'text-green-600' : 'text-red-600'}>
                {simResult.expected_profit_change_percent > 0 ? '+' : ''}{simResult.expected_profit_change_percent}%
              </span>
            </p>
          )}
          {simResult?.adjusted_confidence !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-gray-700">Sell Confidence</span>
                <span className="font-black text-green-700">{Math.round(simResult.adjusted_confidence)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${simResult.adjusted_confidence >= 65 ? 'bg-green-500' :
                      simResult.adjusted_confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${simResult.adjusted_confidence}%` }}
                ></div>
              </div>
            </div>
          )}
          {simResult?.recommendation && (
            <p className="text-sm text-gray-600 italic">
              💡 {simResult.recommendation}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100 mb-4">
          {error}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-auto">
        <button
          onClick={handleSimulate}
          disabled={loading}
          suppressHydrationWarning
          className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95 ${loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] text-white hover:scale-[1.02] shadow-green-900/20"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Simulating...
            </span>
          ) : (
            "Simulate Sell →"
          )}
        </button>
      </div>
    </div>
  );
}