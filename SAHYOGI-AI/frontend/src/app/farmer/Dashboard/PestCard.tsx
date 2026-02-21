"use client";

import { useState, useEffect } from "react";

export default function CropDisease() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [typedText, setTypedText] = useState("");

  // 🔥 AI Image Analyzer (Logic kept exactly as provided)
  const analyzeCrop = (imgSrc: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imgSrc;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(healthyCrop);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let r = 0, g = 0, b = 0;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const total = data.length / 4;
        r /= total;
        g /= total;
        b /= total;

        // 🌿 Detection Logic (Logic kept exactly as provided)
        if (g > r + 20 && g > b + 20) {
          resolve(healthyCrop);
        } else if (r > g + 15 && b < 80) {
          resolve(leafBlight);
        } else if (r > 150 && g > 120) {
          resolve(nutrientDeficiency);
        } else {
          resolve(severeDisease);
        }
      };
    });
  };

  // Updated to handle file selection only
  const handleFileSelect = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageURL = URL.createObjectURL(file);
    setImage(imageURL);
    setResult(null);
    setTypedText("");
  };

  // Dedicated Analyze Button Function
  const handleStartAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setProgress(0);
    setTypedText("");

    let count = 0;
    const interval = setInterval(() => {
      count += 8;
      if (count <= 100) setProgress(count);
    }, 200);

    const detected = await analyzeCrop(image);

    clearInterval(interval);
    setProgress(100);
    setLoading(false);
    setResult(detected);
  };

  // Typing animation (Logic kept exactly as provided)
  useEffect(() => {
    if (result) {
      let i = 0;
      const text = result.recommendation;
      const typing = setInterval(() => {
        setTypedText(text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(typing);
      }, 35);
      return () => clearInterval(typing);
    }
  }, [result]);

  return (
    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl mt-10 border border-gray-100 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#2D5A27] p-3 rounded-2xl shadow-lg">
          <span className="text-2xl text-white">🌿</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            AI Crop Health <span className="text-green-600">Scanner</span>
          </h2>
          <p className="text-gray-500 text-sm font-medium">Instantly detect diseases using leaf pattern analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Upload & Actions */}
        <div className="space-y-6">
          <div className="relative group overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-4 transition-all hover:border-green-400">
            {!image ? (
              <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                <span className="text-4xl mb-4 opacity-50">📸</span>
                <p className="text-gray-500 font-bold">Upload Leaf Image</p>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <img src={image} alt="Crop Preview" className="w-full h-64 object-cover rounded-2xl shadow-inner" />
                <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full text-xs">✕</button>
              </div>
            )}
          </div>

          {/* ANALYZE BUTTON */}
          <button
            onClick={handleStartAnalysis}
            disabled={!image || loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg 
              ${!image || loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] text-white hover:scale-[1.02] active:scale-95 shadow-green-900/20'}`}
          >
            {loading ? 'AI Scanning...' : 'Start Analysis'}
            <span className="text-xl">⚡</span>
          </button>

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-green-700 uppercase tracking-widest">
                <span>Processing Patterns</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Section */}
        <div className="min-h-[300px]">
          {result ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
              <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 relative">
                <div className="absolute -top-3 -left-2 bg-white px-4 py-1 rounded-full border border-green-200 shadow-sm text-[10px] font-black text-green-700 uppercase">Analysis Report</div>
                
                <h3 className="text-2xl font-black text-green-900 mb-4">{result.status}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-green-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Probability</p>
                    <p className="text-lg font-black text-gray-800">{result.probability}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-green-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Health Score</p>
                    <p className="text-lg font-black text-gray-800">{result.healthScore}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl font-bold text-sm mb-4 border ${result.severity === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                  Severity Level: {result.severity}
                </div>

                <div className="bg-white/60 p-4 rounded-2xl border border-white text-gray-700 text-sm leading-relaxed mb-6 italic">
                  "{typedText}"
                </div>

                <div>
                  <h4 className="text-xs font-black text-green-800 uppercase tracking-widest mb-3">Suggested Treatment</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.treatment.map((item: string, index: number) => (
                      <span key={index} className="bg-white text-green-700 px-4 py-2 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dotted border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
              <span className="text-5xl grayscale opacity-20 mb-4">🧪</span>
              <p className="text-gray-400 font-medium">Awaiting image for diagnosis...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🟢 Healthy Crop (Constants kept exactly as provided)
const healthyCrop = {
  status: "Healthy Crop 🌱",
  probability: "5%",
  healthScore: "92 / 100",
  severity: "None",
  recommendation: "No major disease detected. Maintain regular irrigation and fertilizer schedule.",
  treatment: ["Organic Spray (Optional)", "Routine Monitoring"],
};

// 🟡 Nutrient Deficiency
const nutrientDeficiency = {
  status: "Nutrient Deficiency Detected 🍂",
  probability: "35%",
  healthScore: "70 / 100",
  severity: "Mild",
  recommendation: "Leaves show yellowing. Likely nitrogen deficiency.",
  treatment: ["Urea Spray", "NPK Fertilizer", "Micronutrient Mix"],
};

// 🟤 Leaf Blight
const leafBlight = {
  status: "Leaf Blight Disease ⚠️",
  probability: "65%",
  healthScore: "55 / 100",
  severity: "Moderate",
  recommendation: "Brown patches detected. Possible fungal infection.",
  treatment: ["Copper Fungicide", "Remove Infected Leaves", "Improve Air Circulation"],
};

// ⚫ Severe Disease
const severeDisease = {
  status: "Severe Disease Detected ❗",
  probability: "85%",
  healthScore: "40 / 100",
  severity: "High",
  recommendation: "Significant discoloration observed. Immediate action required.",
  treatment: ["Systemic Fungicide", "Crop Isolation", "Soil Treatment"],
};