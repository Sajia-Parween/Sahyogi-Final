"use client";

import { useState, useEffect, useCallback } from "react";
import { useFarmer } from "../../../context/FarmerContext";
import { getFarmerConnectionRequests, respondToConnection } from "../../../services/api";

export default function FarmerRequestsCard() {
    const { phone } = useFarmer();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const loadRequests = useCallback(async () => {
        if (!phone) return;
        setLoading(true);
        try {
            const res = await getFarmerConnectionRequests(phone);
            setRequests(res?.data || []);
        } catch { }
        finally { setLoading(false); }
    }, [phone]);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    // Auto-refresh every 20s
    useEffect(() => {
        const interval = setInterval(loadRequests, 20000);
        return () => clearInterval(interval);
    }, [loadRequests]);

    const handleRespond = async (requestId: string, accept: boolean) => {
        setLoading(true);
        try {
            await respondToConnection({
                request_id: String(requestId),
                accept,
                response_message: accept
                    ? "I am available! Let's connect."
                    : "Sorry, not available right now.",
            });
            setToast(accept ? "✅ Accepted buyer's request!" : "❌ Declined");
            setTimeout(() => setToast(null), 3000);
            loadRequests();
        } catch {
            setToast("Failed to respond");
            setTimeout(() => setToast(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const statusIcon = (s: string) =>
        s === "pending" ? "⏳" : s === "accepted" ? "✅" : "❌";
    const statusColor = (s: string) =>
        s === "pending" ? "bg-amber-50 text-amber-700 border-amber-200"
            : s === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200";

    if (requests.length === 0) return null;

    const incoming = requests.filter(r => r.direction === "buyer_to_farmer");
    const outgoing = requests.filter(r => r.direction === "farmer_to_buyer");
    const pendingIncoming = incoming.filter(r => r.status === "pending").length;

    return (
        <div className="group relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl col-span-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                        <span className="text-xl text-white">🔗</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">
                            My Connections
                        </h3>
                        <p className="text-xs text-gray-400">
                            Track buyer connections & respond to buying requests
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pendingIncoming > 0 && (
                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100 animate-pulse">
                            {pendingIncoming} new buyer request{pendingIncoming > 1 ? "s" : ""}!
                        </span>
                    )}
                    <button onClick={() => setExpanded(!expanded)}
                        className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        {expanded ? "Collapse ▲" : `View All (${requests.length}) ▼`}
                    </button>
                </div>
            </div>

            {/* Incoming Buyer Requests — shown first with action buttons */}
            {incoming.length > 0 && (
                <div className="mb-4">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 ml-1">
                        📩 Buyer Requests (sent to you)
                    </p>
                    <div className="space-y-2.5">
                        {(expanded ? incoming : incoming.slice(0, 3)).map((req) => (
                            <div key={req.id} className={`p-4 rounded-xl border transition-all ${statusColor(req.status)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{statusIcon(req.status)}</span>
                                            <span className="font-bold text-sm">{req.buyer_name || "Unknown Buyer"}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                BUYER REQUEST
                                            </span>
                                            <span className="text-[10px] opacity-60">{new Date(req.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {/* Requirements sent by buyer */}
                                        <div className="ml-7 mt-1.5 bg-white/60 rounded-lg p-2.5 border border-current/10">
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Buyer&apos;s Requirements</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="font-bold">🌿 {req.crop}</span>
                                                <span>📦 {req.quantity}kg needed</span>
                                            </div>
                                            {req.message && (
                                                <p className="text-xs mt-1.5 italic opacity-80">
                                                    &ldquo;{req.message}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                        {req.buyer_response_message && req.status !== "pending" && (
                                            <p className="text-[10px] ml-7 mt-1 italic opacity-60">
                                                Your response: &ldquo;{req.buyer_response_message}&rdquo;
                                            </p>
                                        )}
                                    </div>

                                    {/* Accept / Decline for pending incoming */}
                                    {req.status === "pending" && (
                                        <div className="flex gap-2 flex-shrink-0 ml-3">
                                            <button onClick={() => handleRespond(req.id, true)} disabled={loading}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                                ✓ Accept
                                            </button>
                                            <button onClick={() => handleRespond(req.id, false)} disabled={loading}
                                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95">
                                                ✕ Decline
                                            </button>
                                        </div>
                                    )}
                                    {req.status === "accepted" && (
                                        <span className="text-emerald-600 text-xs font-bold">✅ You accepted</span>
                                    )}
                                    {req.status === "rejected" && (
                                        <span className="text-red-500 text-xs font-bold">❌ You declined</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Outgoing Requests — farmer's own sent requests */}
            {outgoing.length > 0 && (
                <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 ml-1">
                        📤 Your Sent Requests (to buyers)
                    </p>
                    <div className="space-y-2">
                        {(expanded ? outgoing : outgoing.slice(0, 3)).map((req) => (
                            <div key={req.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${statusColor(req.status)}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{statusIcon(req.status)}</span>
                                    <div>
                                        <p className="text-sm font-bold">
                                            To: {req.buyer_name || "Unknown Buyer"}
                                        </p>
                                        <p className="text-xs opacity-70">
                                            {req.crop} • {req.quantity}kg • {new Date(req.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wider">
                                        {req.status}
                                    </p>
                                    {req.status === "pending" && (
                                        <p className="text-[10px] opacity-60">Waiting for buyer</p>
                                    )}
                                    {req.status === "accepted" && req.buyer_response_message && (
                                        <p className="text-[10px] italic opacity-70">&ldquo;{req.buyer_response_message}&rdquo;</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center py-2 text-xs text-gray-400">Refreshing...</div>
            )}

            <div className="mt-3 text-center">
                <button onClick={loadRequests} className="text-xs text-blue-500 font-bold hover:underline">
                    🔄 Refresh
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp">
                    <span className="text-sm font-bold">{toast}</span>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}
