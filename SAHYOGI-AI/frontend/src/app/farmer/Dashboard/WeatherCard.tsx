"use client";

import { useEffect, useState } from "react";
import { useFarmer } from "../../../context/FarmerContext";
import { useAdvice } from "../../../hooks/useAdvice";

export default function WeatherCard() {
  const { phone } = useFarmer();
  const { data, loading, fetchAdvice } = useAdvice();

  useEffect(() => {
    if (phone) fetchAdvice(phone);
  }, [phone, fetchAdvice]);

  // Extract weather data from structured advice, fallback to defaults
  const weather = data?.structured?.weather || null;
  const temp = weather?.temperature ?? "32°";
  const humidity = weather?.humidity ?? "45%";
  const rainfall = weather?.rainfall ?? "0 mm";
  const wind = weather?.wind_speed ?? "11 km/h";
  const condition = weather?.condition ?? "Mostly Sunny";
  const high = weather?.high ?? "34°";
  const low = weather?.low ?? "26°";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#2D5A27] to-[#4A7c44] text-white p-8 rounded-[2rem] shadow-2xl border border-white/10">

      {/* Decorative background sun glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>

      {loading && (
        <div className="absolute top-4 right-4 z-20">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-white/80 uppercase tracking-widest text-xs font-bold mb-1">
            Real-time Insight
          </p>
          <h2 className="text-2xl font-semibold mb-6">
            Weather Analysis
          </h2>

          <div className="flex items-baseline gap-2">
            <h1 className="text-7xl font-extrabold tracking-tighter">
              {typeof temp === "number" ? `${temp}°` : temp}
            </h1>
            <span className="text-xl text-white/70 font-medium">{condition}</span>
          </div>

          {/* Detailed Stats with Glassmorphism pill style */}
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
              <span className="text-white/60 text-xs uppercase font-bold">Humidity</span>
              <span className="font-semibold text-sm">{humidity}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
              <span className="text-white/60 text-xs uppercase font-bold">Rainfall</span>
              <span className="font-semibold text-sm">{rainfall}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
              <span className="text-white/60 text-xs uppercase font-bold">Wind</span>
              <span className="font-semibold text-sm">{wind}</span>
            </div>
          </div>
        </div>

        {/* Large Sun Icon with a slight pulse effect */}
        <div className="text-8xl filter drop-shadow-lg animate-pulse">
          ☀️
        </div>
      </div>

      {/* Bottom subtle indicator */}
      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
        <span>High: {typeof high === "number" ? `${high}°` : high} • Low: {typeof low === "number" ? `${low}°` : low}</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
          {loading ? "Fetching..." : "Live Updates"}
        </span>
      </div>
    </div>
  );
}