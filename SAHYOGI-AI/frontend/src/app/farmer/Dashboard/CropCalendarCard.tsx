"use client";

import { useEffect, useState } from "react";
import { useFarmer } from "../../../context/FarmerContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CropStage {
    stage_name: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    activities: string[];
    tips: string;
    status: "completed" | "current" | "upcoming";
    progress: number;
    is_current: boolean;
}

export default function CropCalendarCard() {
    const { phone } = useFarmer();
    const [calendar, setCalendar] = useState<CropStage[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedStage, setExpandedStage] = useState<number | null>(null);
    const [cropName, setCropName] = useState("");
    const [currentStage, setCurrentStage] = useState<CropStage | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (phone) fetchCalendar();
    }, [phone]);

    const fetchCalendar = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/v1/calendar/${phone}`);
            const data = await res.json();

            if (data.success && data.data) {
                setCalendar(data.data.calendar || []);
                setCropName(data.data.crop || "");
                setCurrentStage(data.data.current_stage || null);

                // Auto-expand current stage
                const currentIdx = (data.data.calendar || []).findIndex(
                    (s: CropStage) => s.is_current
                );
                if (currentIdx !== -1) setExpandedStage(currentIdx);
            } else {
                setError(data.message || "Failed to fetch calendar");
            }
        } catch (err) {
            setError("Could not connect to server");
        }
        setLoading(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return "✅";
            case "current": return "🔄";
            case "upcoming": return "⏳";
            default: return "•";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-green-500";
            case "current": return "bg-amber-500 animate-pulse";
            case "upcoming": return "bg-gray-300";
            default: return "bg-gray-300";
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-green-50 border-green-200";
            case "current": return "bg-amber-50 border-amber-200 shadow-md";
            case "upcoming": return "bg-gray-50 border-gray-100";
            default: return "bg-gray-50 border-gray-100";
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    // Calculate overall progress
    const completedStages = calendar.filter((s) => s.status === "completed").length;
    const overallProgress = calendar.length > 0 ? Math.round(((completedStages + (currentStage ? currentStage.progress / 100 : 0)) / calendar.length) * 100) : 0;

    return (
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-violet-500/20">
                        <span className="text-2xl text-white">📅</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Crop <span className="text-violet-600">Calendar</span>
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            {cropName ? `${cropName.charAt(0).toUpperCase() + cropName.slice(1)} growing timeline` : "Personalized crop timeline"}
                        </p>
                    </div>
                </div>
                {loading && (
                    <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                )}
            </div>

            {/* Overall Progress Bar */}
            {calendar.length > 0 && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Overall Progress</span>
                        <span className="text-sm font-bold text-violet-600">{overallProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-violet-500 to-purple-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${overallProgress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">
                            {completedStages} of {calendar.length} stages complete
                        </span>
                        {currentStage && (
                            <span className="text-[10px] text-amber-600 font-bold">
                                Now: {currentStage.stage_name}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <p className="text-gray-500 font-medium">{error}</p>
                    <button onClick={fetchCalendar} className="mt-3 text-violet-600 font-bold text-sm hover:underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && calendar.length === 0 && !error && (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 font-medium">Loading crop calendar...</p>
                </div>
            )}

            {/* Timeline */}
            {calendar.length > 0 && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {calendar.map((stage, idx) => (
                        <div key={idx} className="relative">
                            {/* Connecting line */}
                            {idx < calendar.length - 1 && (
                                <div
                                    className={`absolute left-[19px] top-[48px] w-0.5 h-[calc(100%-24px)] ${stage.status === "completed" ? "bg-green-300" : "bg-gray-200"
                                        }`}
                                ></div>
                            )}

                            <button
                                onClick={() => setExpandedStage(expandedStage === idx ? null : idx)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.005] ${getStatusBgColor(stage.status)}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status dot */}
                                    <div className={`w-[14px] h-[14px] rounded-full flex-shrink-0 ${getStatusColor(stage.status)}`}></div>

                                    {/* Stage info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-gray-800 truncate">
                                                {getStatusIcon(stage.status)} {stage.stage_name}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 ml-2">
                                                {formatDate(stage.start_date)} – {formatDate(stage.end_date)}
                                            </span>
                                        </div>

                                        {/* Stage progress bar for current stage */}
                                        {stage.is_current && (
                                            <div className="mt-2">
                                                <div className="w-full bg-amber-100 rounded-full h-1.5">
                                                    <div
                                                        className="bg-amber-500 h-full rounded-full transition-all"
                                                        style={{ width: `${stage.progress}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[10px] text-amber-600 font-medium mt-1">
                                                    {stage.progress}% complete • {stage.duration_days} day stage
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expand arrow */}
                                    <span className={`text-gray-400 transition-transform ${expandedStage === idx ? "rotate-180" : ""}`}>
                                        ▾
                                    </span>
                                </div>
                            </button>

                            {/* Expanded details */}
                            {expandedStage === idx && (
                                <div className="ml-9 mt-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Activities */}
                                    <div className="mb-3">
                                        <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Activities</h5>
                                        <div className="space-y-1.5">
                                            {stage.activities.map((a, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                                                    <span>{a}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100">
                                        <p className="text-[10px] font-black text-violet-600 uppercase mb-1">💡 Tip</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{stage.tips}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Scrollbar style */}
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
        </div>
    );
}
