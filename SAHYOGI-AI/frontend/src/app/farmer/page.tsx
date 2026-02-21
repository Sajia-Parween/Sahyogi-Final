"use client";

import Link from "next/link";
import Header from "./Dashboard/Header";
import WeatherCard from "./Dashboard/WeatherCard";
import VoiceAssistant from "./Dashboard/VoiceAssistant";
import SellCard from "./Dashboard/SellCard";
import MarketCard from "./Dashboard/MarketCard";
import GovtSchemesCard from "./Dashboard/GovtSchemesCard";
import SoilCard from "./Dashboard/SoilCard";
import DiseaseCard from "./Dashboard/DiseaseCard";
import FarmMapCard from "./Dashboard/FarmMapCard";
import CropCalendarCard from "./Dashboard/CropCalendarCard";

export default function FarmerPage() {
  return (
    // Updated with a Deep Slate/Grey radial gradient for more character
    <div className="min-h-screen bg-[#E2E8F0] bg-[radial-gradient(circle_at_top,_#F1F5F9_0%,_#E2E8F0_100%)] px-16 py-10">

      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Header />
        </div>

        {/* Weather - Full Width */}
        <div className="mb-10 drop-shadow-sm">
          <WeatherCard />
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-5 mb-10">
          <Link href="/ivr">
            <div className="group relative overflow-hidden bg-[#1A3317] text-white p-6 rounded-2xl shadow-xl border border-white/5 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer h-full">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-2xl">
                  📞
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">IVR Voice Call</h3>
                  <p className="text-white/50 text-xs font-medium">Start an interactive voice advisory session</p>
                </div>
              </div>
              <span className="relative z-10 bg-green-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 group-hover:bg-green-400 transition-colors">
                Start Call →
              </span>
            </div>
          </Link>

          <Link href="/analytics">
            <div className="group relative overflow-hidden bg-[#17233D] text-white p-6 rounded-2xl shadow-xl border border-white/5 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer h-full">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Analytics Dashboard</h3>
                  <p className="text-white/50 text-xs font-medium">View call stats, crop distribution & market trends</p>
                </div>
              </div>
              <span className="relative z-10 bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:bg-blue-400 transition-colors">
                View Charts →
              </span>
            </div>
          </Link>
        </div>

        {/* 2 Column Grid for Laptop */}
        <div className="grid grid-cols-2 gap-10">
          <VoiceAssistant />
          <SellCard />

          <MarketCard />
          <GovtSchemesCard />

          <SoilCard />
          <DiseaseCard />

          <FarmMapCard />
          <CropCalendarCard />
        </div>
      </div>

    </div>
  );
}