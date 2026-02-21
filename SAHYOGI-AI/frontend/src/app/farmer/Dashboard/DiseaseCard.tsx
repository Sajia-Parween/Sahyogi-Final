"use client";

import { useState, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DiseaseCard() {
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setImageFile(file);
        setImage(URL.createObjectURL(file));
        setResult(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const analyzeDisease = async () => {
        if (!imageFile) return;

        setLoading(true);
        setProgress(0);
        setResult(null);

        // Simulate progress
        let count = 0;
        const interval = setInterval(() => {
            count += 8;
            if (count <= 85) setProgress(count);
        }, 300);

        try {
            const formData = new FormData();
            formData.append("image", imageFile);
            formData.append("language", "en");

            const res = await fetch(`${API_BASE}/api/v1/disease/detect`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            clearInterval(interval);
            setProgress(100);

            setTimeout(() => {
                setLoading(false);
                if (data.success && data.data) {
                    setResult(data.data);
                } else {
                    setResult({ error: data.message || "Analysis failed" });
                }
            }, 400);
        } catch (err) {
            clearInterval(interval);
            setLoading(false);
            setResult({ error: "Failed to connect to server. Please try again." });
        }
    };

    const clearImage = () => {
        setImage(null);
        setImageFile(null);
        setResult(null);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case "severe": return "bg-red-500 text-white";
            case "moderate": return "bg-amber-500 text-white";
            case "mild": return "bg-yellow-400 text-gray-900";
            case "none": return "bg-green-500 text-white";
            default: return "bg-gray-400 text-white";
        }
    };

    const getUrgencyColor = (urgency: string) => {
        if (urgency?.includes("Immediate")) return "text-red-600";
        if (urgency?.includes("Monitor")) return "text-amber-600";
        return "text-green-600";
    };

    return (
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-2xl shadow-lg shadow-red-500/20">
                    <span className="text-2xl text-white">📸</span>
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                        Crop <span className="text-red-500">Disease</span> Detector
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">
                        Upload a leaf photo for AI-powered diagnosis
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left Column — Upload */}
                <div className="space-y-6">
                    <div
                        className={`relative group overflow-hidden border-2 border-dashed rounded-[2rem] p-4 transition-all cursor-pointer
              ${dragOver ? "border-red-400 bg-red-50/50" : "border-gray-200 bg-gray-50 hover:border-red-300"}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !image && fileInputRef.current?.click()}
                    >
                        {!image ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <span className="text-5xl mb-4 opacity-40">🌿</span>
                                <p className="text-gray-500 font-bold text-center">
                                    Drop leaf image here
                                </p>
                                <p className="text-gray-400 text-xs mt-1">or click to browse</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={image}
                                    alt="Crop Preview"
                                    className="w-full h-64 object-cover rounded-2xl shadow-inner"
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); clearImage(); }}
                                    className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full text-xs hover:bg-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                                {loading && (
                                    <div className="absolute inset-0 bg-red-500/10 animate-pulse rounded-2xl overflow-hidden">
                                        <div className="w-full h-1 bg-red-400 shadow-[0_0_15px_rgba(239,68,68,1)] absolute top-0 animate-scan"></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={analyzeDisease}
                        disabled={!image || loading}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg
              ${!image || loading
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:scale-[1.02] active:scale-95 shadow-red-500/20"}`}
                    >
                        {loading ? "AI Analyzing..." : "Detect Disease"}
                        <span className="text-xl">🔬</span>
                    </button>

                    {loading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-red-700 uppercase tracking-widest">
                                <span>Scanning Leaf Pattern</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column — Results */}
                <div className="min-h-[400px]">
                    {result && !result.error ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 relative">
                                <div className="absolute -top-3 -left-3 bg-white px-4 py-1 rounded-full border border-red-200 shadow-sm text-xs font-black text-red-700 uppercase tracking-tighter">
                                    Diagnosis Complete
                                </div>

                                {/* Disease Name + Badges */}
                                <div className="mt-2 mb-4">
                                    <h3 className="text-2xl font-black text-red-900">{result.disease_name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(result.severity)}`}>
                                            {result.severity}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                            {result.confidence} Confidence
                                        </span>
                                        <span className={`text-xs font-bold ${getUrgencyColor(result.urgency)}`}>
                                            ⚡ {result.urgency}
                                        </span>
                                    </div>
                                </div>

                                {/* Symptoms */}
                                {result.symptoms?.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">Symptoms</h4>
                                        <div className="space-y-1">
                                            {result.symptoms.map((s: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Remedies */}
                                {result.remedies?.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-xs font-black text-green-800 uppercase tracking-widest mb-2">💊 Remedies</h4>
                                        <div className="space-y-1">
                                            {result.remedies.map((r: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-green-500 mt-0.5">✓</span>
                                                    <span>{r}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pesticide */}
                                {result.recommended_pesticide && result.recommended_pesticide !== "Not required" && (
                                    <div className="bg-white/60 p-3 rounded-xl border border-amber-100 mb-4">
                                        <p className="text-xs font-bold text-amber-800 uppercase mb-1">Recommended Pesticide</p>
                                        <p className="text-sm font-semibold text-gray-800">{result.recommended_pesticide}</p>
                                    </div>
                                )}

                                {/* Prevention */}
                                {result.prevention?.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-2">🛡 Prevention</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {result.prevention.map((p: string, i: number) => (
                                                <span key={i} className="bg-white text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 shadow-sm">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : result?.error ? (
                        <div className="h-full border-2 border-dotted border-red-100 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                            <span className="text-5xl mb-4">⚠️</span>
                            <p className="text-red-500 font-medium">{result.error}</p>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dotted border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                            <span className="text-5xl grayscale opacity-20 mb-4">🔬</span>
                            <p className="text-gray-400 font-medium">
                                Upload a leaf photo to get instant AI diagnosis.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
