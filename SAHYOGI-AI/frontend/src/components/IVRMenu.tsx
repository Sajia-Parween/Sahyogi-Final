"use client";

import { useState } from "react";
import type { IVRState, IVRData } from "../hooks/useIVR";

interface IVRMenuProps {
    state: IVRState;
    data: IVRData;
    loading: boolean;
    error: string | null;
    isPlaying: boolean;
    phone: string;
    onSendChat: (phone: string, question: string) => void;
    onRunSimulation: (phone: string, days: number) => void;
    onBack: () => void;
    onPlayAudio: (url: string) => void;
    onStopAudio: () => void;
}

export default function IVRMenu({
    state,
    data,
    loading,
    error,
    isPlaying,
    phone,
    onSendChat,
    onRunSimulation,
    onBack,
    onPlayAudio,
    onStopAudio,
}: IVRMenuProps) {
    const [chatInput, setChatInput] = useState("");
    const [simDays, setSimDays] = useState(7);

    // ─── Advisory View ───
    if (state === "advisory") {
        const call = data.callData;
        const summary = call?.summary || {};
        const risk = call?.risk_analysis || {};

        return (
            <div className="w-full max-w-lg mx-auto space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-lg">🌾</span>
                    </div>
                    <h3 className="text-xl font-black text-white">Crop Advisory</h3>
                </div>

                {/* Advisory narrative */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                    {call?.enhanced_advisory && (
                        <p className="text-white/80 text-sm leading-relaxed">
                            {call.enhanced_advisory}
                        </p>
                    )}

                    {summary.crop_stage && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Stage</span>
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                                {summary.crop_stage}
                            </span>
                        </div>
                    )}

                    {summary.market_trend && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Market</span>
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                                {summary.market_trend}
                            </span>
                        </div>
                    )}
                </div>

                {/* Risk Score */}
                {risk.risk_score !== undefined && (
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                            Risk Score
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex-grow bg-white/10 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${risk.risk_score > 70
                                            ? "bg-red-500"
                                            : risk.risk_score > 40
                                                ? "bg-amber-500"
                                                : "bg-green-500"
                                        }`}
                                    style={{ width: `${Math.min(risk.risk_score, 100)}%` }}
                                />
                            </div>
                            <span className="text-white font-black text-sm">{risk.risk_score}%</span>
                        </div>
                        {risk.sell_confidence !== undefined && (
                            <p className="text-white/50 text-xs mt-2">
                                Sell Confidence: <span className="text-white font-bold">{Math.round(risk.sell_confidence)}%</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Audio controls */}
                {call?.audio_file && (
                    <button
                        onClick={() =>
                            isPlaying ? onStopAudio() : onPlayAudio(call.audio_file)
                        }
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                    >
                        {isPlaying ? "⏸ Stop Audio" : "▶ Play Advisory Audio"}
                    </button>
                )}

                <BackButton onClick={onBack} />
            </div>
        );
    }

    // ─── Market View ───
    if (state === "market") {
        const projection = data.callData?.market_projection || {};
        const mandi = data.callData?.mandi_comparison || {};
        const fair = data.callData?.fair_price_indicator || {};

        return (
            <div className="w-full max-w-lg mx-auto space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-lg">📊</span>
                    </div>
                    <h3 className="text-xl font-black text-white">Market Prices</h3>
                </div>

                {/* Current Price */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                        Current Price
                    </p>
                    <p className="text-3xl font-black text-white">
                        ₹{projection.current_price || "—"}
                        <span className="text-sm text-white/40 font-medium ml-2">per quintal</span>
                    </p>
                </div>

                {/* Projection details */}
                <div className="grid grid-cols-2 gap-3">
                    {projection.predicted_next && (
                        <StatCard label="7-Day Prediction" value={`₹${projection.predicted_next}`} />
                    )}
                    {projection.trend && (
                        <StatCard
                            label="Trend"
                            value={projection.trend}
                            valueColor={
                                projection.trend?.toLowerCase()?.includes("up")
                                    ? "text-green-400"
                                    : "text-red-400"
                            }
                        />
                    )}
                    {projection.moving_average_7 && (
                        <StatCard label="7-Day Average" value={`₹${Math.round(projection.moving_average_7)}`} />
                    )}
                    {projection.volatility !== undefined && (
                        <StatCard label="Volatility" value={`${projection.volatility?.toFixed(1)}%`} />
                    )}
                </div>

                {/* Fair Price */}
                {fair.verdict && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                            Fair Price Indicator
                        </p>
                        <p className="text-white/80 text-sm font-bold">{fair.verdict}</p>
                    </div>
                )}

                {/* Mandi Comparison */}
                {mandi.nearby_mandis && Array.isArray(mandi.nearby_mandis) && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">
                            Mandi Comparison
                        </p>
                        <div className="space-y-2">
                            {mandi.nearby_mandis.slice(0, 4).map((m: any, i: number) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-white/60 text-sm">{m.mandi || m.name}</span>
                                    <span className="text-white font-bold text-sm">₹{m.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <BackButton onClick={onBack} />
            </div>
        );
    }

    // ─── Chat View ───
    if (state === "chat") {
        return (
            <div className="w-full max-w-lg mx-auto space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                    </div>
                    <h3 className="text-xl font-black text-white">AI Chat Assistant</h3>
                </div>

                {/* Chat input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask your question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && chatInput.trim() && !loading) {
                                onSendChat(phone, chatInput.trim());
                                setChatInput("");
                            }
                        }}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-14 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all font-medium"
                    />
                    <button
                        onClick={() => {
                            if (chatInput.trim() && !loading) {
                                onSendChat(phone, chatInput.trim());
                                setChatInput("");
                            }
                        }}
                        disabled={loading || !chatInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm hover:bg-purple-700 transition-colors disabled:opacity-30"
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "→"
                        )}
                    </button>
                </div>

                {/* Chat response */}
                {data.chatResponse && (
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
                        <p className="text-white/80 text-sm leading-relaxed">
                            {data.chatResponse.text}
                        </p>

                        {data.chatResponse.audioUrl && (
                            <button
                                onClick={() =>
                                    isPlaying
                                        ? onStopAudio()
                                        : onPlayAudio(data.chatResponse!.audioUrl!)
                                }
                                className="w-full py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-all active:scale-95"
                            >
                                {isPlaying ? "⏸ Stop Audio" : "▶ Play Response"}
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <BackButton onClick={onBack} />
            </div>
        );
    }

    // ─── Simulation View ───
    if (state === "simulation") {
        const sim = data.simulationData;

        return (
            <div className="w-full max-w-lg mx-auto space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <span className="text-lg">💰</span>
                    </div>
                    <h3 className="text-xl font-black text-white">Sell Simulation</h3>
                </div>

                {/* Days slider */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-3">
                        Sell After: <span className="text-amber-400 text-sm">{simDays} days</span>
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={30}
                        value={simDays}
                        onChange={(e) => setSimDays(Number(e.target.value))}
                        className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-white/30 font-bold mt-1">
                        <span>1 day</span>
                        <span>30 days</span>
                    </div>
                </div>

                <button
                    onClick={() => onRunSimulation(phone, simDays)}
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${loading
                            ? "bg-white/5 text-white/30 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:scale-[1.02] shadow-amber-500/20"
                        }`}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Simulating...
                        </>
                    ) : (
                        "Run Simulation"
                    )}
                </button>

                {/* Simulation Result */}
                {sim?.simulation_result && (
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Simulation Result
                        </p>

                        {sim.simulation_result.predicted_price && (
                            <div className="flex justify-between items-center">
                                <span className="text-white/50 text-sm">Predicted Price</span>
                                <span className="text-white font-black text-lg">
                                    ₹{sim.simulation_result.predicted_price}
                                </span>
                            </div>
                        )}

                        {sim.simulation_result.expected_profit_percent !== undefined && (
                            <div className="flex justify-between items-center">
                                <span className="text-white/50 text-sm">Expected Profit</span>
                                <span
                                    className={`font-black text-lg ${sim.simulation_result.expected_profit_percent >= 0
                                            ? "text-green-400"
                                            : "text-red-400"
                                        }`}
                                >
                                    {sim.simulation_result.expected_profit_percent > 0 ? "+" : ""}
                                    {sim.simulation_result.expected_profit_percent?.toFixed(1)}%
                                </span>
                            </div>
                        )}

                        {sim.simulation_result.recommendation && (
                            <div className="pt-2 border-t border-white/5">
                                <p className="text-white/70 text-sm leading-relaxed">
                                    {sim.simulation_result.recommendation}
                                </p>
                            </div>
                        )}

                        {sim.base_risk_confidence !== undefined && (
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-white/50 text-sm">Confidence</span>
                                <span className="text-white font-bold">{Math.round(sim.base_risk_confidence)}%</span>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <BackButton onClick={onBack} />
            </div>
        );
    }

    return null;
}

// ─── Shared Components ───

function StatCard({
    label,
    value,
    valueColor = "text-white",
}: {
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className={`text-lg font-black ${valueColor}`}>{value}</p>
        </div>
    );
}

function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-bold text-sm hover:bg-white/10 hover:text-white/70 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            ← Back to Menu
        </button>
    );
}
