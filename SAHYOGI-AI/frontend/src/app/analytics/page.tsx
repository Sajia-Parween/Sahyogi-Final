"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../../services/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    AreaChart, Area,
    RadialBarChart, RadialBar,
} from "recharts";
import Link from "next/link";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

interface AnalyticsData {
    total_calls: number;
    calls_today: number;
    calls_this_week: number;
    calls_this_month: number;
    peak_call_hour: number | null;
    calls_by_language: Record<string, number>;
    calls_by_crop: Record<string, number>;
    crop_stage_distribution: Record<string, number>;
    market_trend_distribution: Record<string, number>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await getAnalyticsSummary();
                setData(res.data || res);
            } catch (err: any) {
                setError(err?.response?.data?.detail || err.message || "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="w-10 h-10 border-3 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-white/40 font-bold text-sm">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
                    <p className="text-red-400 font-bold text-lg mb-2">Failed to load</p>
                    <p className="text-red-400/60 text-sm">{error}</p>
                    <Link href="/farmer" className="inline-block mt-4 text-white/40 text-xs font-bold hover:text-white/70">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Transform data for charts
    const languageData = Object.entries(data.calls_by_language || {})
        .filter(([k]) => k && k !== "null")
        .map(([name, value]) => ({ name, value }));

    const cropData = Object.entries(data.calls_by_crop || {})
        .filter(([k]) => k && k !== "null")
        .map(([name, value]) => ({ name, value }));

    const stageData = Object.entries(data.crop_stage_distribution || {})
        .filter(([k]) => k && k !== "null")
        .map(([name, value]) => ({ name, value }));

    const trendData = Object.entries(data.market_trend_distribution || {})
        .filter(([k]) => k && k !== "null")
        .map(([name, value]) => ({ name, value }));

    const callVolumeData = [
        { name: "Today", calls: data.calls_today },
        { name: "This Week", calls: data.calls_this_week },
        { name: "This Month", calls: data.calls_this_month },
        { name: "Total", calls: data.total_calls },
    ];

    const peakHour = data.peak_call_hour !== null
        ? `${data.peak_call_hour}:00 - ${data.peak_call_hour + 1}:00`
        : "N/A";

    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_#0f1f0a_0%,_#0a0a0a_60%)]">
            {/* Header */}
            <header className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg shadow-green-500/20" />
                    <h1 className="text-xl font-black text-white tracking-tight">
                        Sahyogi<span className="text-green-500">.</span>{" "}
                        <span className="text-white/40 font-medium">Analytics</span>
                    </h1>
                </div>
                <Link
                    href="/farmer"
                    className="text-white/40 text-xs font-bold uppercase tracking-wider hover:text-white/70 transition-colors"
                >
                    ← Dashboard
                </Link>
            </header>

            <main className="max-w-[1400px] mx-auto px-8 py-10 space-y-8">
                {/* ─── Stats Overview ─── */}
                <div className="grid grid-cols-4 gap-5">
                    <StatCard label="Total Calls" value={data.total_calls} icon="📞" color="from-green-500 to-green-600" />
                    <StatCard label="Today" value={data.calls_today} icon="📅" color="from-blue-500 to-blue-600" />
                    <StatCard label="This Week" value={data.calls_this_week} icon="📊" color="from-purple-500 to-purple-600" />
                    <StatCard label="Peak Hour" value={peakHour} icon="⏰" color="from-amber-500 to-amber-600" />
                </div>

                {/* ─── Row 1: Call Volume + Language Distribution ─── */}
                <div className="grid grid-cols-2 gap-5">
                    <ChartCard title="Call Volume" subtitle="Calls over different periods">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={callVolumeData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }}
                                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                />
                                <Bar dataKey="calls" radius={[8, 8, 0, 0]}>
                                    {callVolumeData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Language Distribution" subtitle="Calls by language preference">
                        {languageData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={languageData}
                                        cx="50%" cy="50%"
                                        innerRadius={70} outerRadius={110}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {languageData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        formatter={(value: string) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700 }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState />
                        )}
                    </ChartCard>
                </div>

                {/* ─── Row 2: Crop Distribution + Crop Stage ─── */}
                <div className="grid grid-cols-2 gap-5">
                    <ChartCard title="Crop Distribution" subtitle="Most queried crops">
                        {cropData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={cropData} layout="vertical" barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
                                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                        {cropData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState />
                        )}
                    </ChartCard>

                    <ChartCard title="Crop Stage Distribution" subtitle="Growth phases of queried crops">
                        {stageData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={stageData}
                                        cx="50%" cy="50%"
                                        innerRadius={70} outerRadius={110}
                                        paddingAngle={3}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {stageData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }} />
                                    <Legend
                                        iconType="circle"
                                        formatter={(value: string) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700 }}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState />
                        )}
                    </ChartCard>
                </div>

                {/* ─── Row 3: Market Trend ─── */}
                <div className="grid grid-cols-2 gap-5">
                    <ChartCard title="Market Trend Distribution" subtitle="How market trends are distributed">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={trendData} barSize={50}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {trendData.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={
                                                    entry.name?.toLowerCase().includes("up") || entry.name?.toLowerCase().includes("rising")
                                                        ? "#22c55e"
                                                        : entry.name?.toLowerCase().includes("down") || entry.name?.toLowerCase().includes("falling")
                                                            ? "#ef4444"
                                                            : "#f59e0b"
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState />
                        )}
                    </ChartCard>

                    {/* Monthly Summary Card */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 flex flex-col justify-between">
                        <div>
                            <h3 className="text-white font-black text-lg mb-1">Monthly Summary</h3>
                            <p className="text-white/30 text-xs font-medium mb-8">Key metrics at a glance</p>
                        </div>

                        <div className="space-y-5">
                            <SummaryRow
                                label="Total Calls" value={String(data.total_calls)}
                                sub={`${data.calls_this_month} this month`}
                                color="bg-green-500"
                            />
                            <SummaryRow
                                label="Most Used Language"
                                value={languageData.length > 0 ? languageData.sort((a, b) => b.value - a.value)[0].name : "N/A"}
                                sub={languageData.length > 0 ? `${languageData[0].value} calls` : ""}
                                color="bg-blue-500"
                            />
                            <SummaryRow
                                label="Most Queried Crop"
                                value={cropData.length > 0 ? cropData.sort((a, b) => b.value - a.value)[0].name : "N/A"}
                                sub={cropData.length > 0 ? `${cropData[0].value} calls` : ""}
                                color="bg-purple-500"
                            />
                            <SummaryRow
                                label="Peak Activity"
                                value={peakHour}
                                sub="Busiest hour"
                                color="bg-amber-500"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ─── Shared Components ───

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-lg`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-white mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
            <div className="mb-6">
                <h3 className="text-white font-black text-lg">{title}</h3>
                <p className="text-white/30 text-xs font-medium">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function SummaryRow({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`w-2 h-10 rounded-full ${color}`} />
            <div className="flex-grow">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                <p className="text-white font-black text-lg">{value}</p>
            </div>
            <span className="text-white/20 text-xs font-bold">{sub}</span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="h-[280px] flex items-center justify-center">
            <p className="text-white/20 text-sm font-bold">No data available yet</p>
        </div>
    );
}
