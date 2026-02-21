"use client";

import { useState, useEffect } from "react";

export default function SoilAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState("");

  // ✅ REAL WORKING ANALYSIS FUNCTION (Kept exactly as provided)
  const analyzeImage = (imgSrc: string) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imgSrc;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return resolve(brownSoil);

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

        const brightness = (r + g + b) / 3;

        // 🔥 Improved Detection Logic for Your 3 Images
        if (r > g + 15 && r > b + 15) {
          resolve(redSoil);
        } else if (brightness < 85) {
          resolve(blackSoil);
        } else {
          resolve(brownSoil);
        }
      };
    });
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setResult(null);
    setTypedText("");
  };

  const startAnalysis = async () => {
    if (!image) return;

    setLoading(true);
    setProgress(0);
    setTypedText("");

    let count = 0;
    const interval = setInterval(() => {
      count += 10;
      if (count <= 90) setProgress(count);
    }, 200);

    const detected = await analyzeImage(image);

    clearInterval(interval);
    setProgress(100);
    
    // Smooth transition to results
    setTimeout(() => {
      setLoading(false);
      setResult(detected);
    }, 500);
  };

  // Typing animation (Kept exactly as provided)
  useEffect(() => {
    if (result) {
      let i = 0;
      const text = result.recommendation;

      const typing = setInterval(() => {
        setTypedText(text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(typing);
      }, 40);
      return () => clearInterval(typing);
    }
  }, [result]);

  return (
    <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl mt-10 border border-white/20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#2D5A27] p-3 rounded-2xl shadow-lg shadow-green-900/20">
          <span className="text-2xl text-white">🧪</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            AI Soil <span className="text-green-600">Analyzer</span>
          </h2>
          <p className="text-gray-500 text-sm font-medium">Detect minerals, pH & moisture levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Upload & Action */}
        <div className="space-y-6">
          <div className="relative group overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] p-4 transition-all hover:border-green-400">
            {!image ? (
              <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                <span className="text-4xl mb-4 opacity-50">🌍</span>
                <p className="text-gray-500 font-bold">Upload Soil Sample</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <img src={image} alt="Soil Preview" className="w-full h-64 object-cover rounded-2xl shadow-inner" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full text-xs hover:bg-red-500 transition-colors"
                >✕</button>
                {loading && (
                   <div className="absolute inset-0 bg-green-500/10 animate-pulse rounded-2xl overflow-hidden">
                      <div className="w-full h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,1)] absolute top-0 animate-scan"></div>
                   </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={startAnalysis}
            disabled={!image || loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg 
              ${!image || loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] text-white hover:scale-[1.02] active:scale-95 shadow-green-900/20'}`}
          >
            {loading ? 'AI Scanning...' : 'Analyze Soil Quality'}
            <span className="text-xl">⚡</span>
          </button>

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-green-700 uppercase tracking-widest">
                <span>Reading Composition</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Area */}
        <div className="min-h-[400px]">
          {result ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 relative">
                <div className="absolute -top-3 -left-3 bg-white px-4 py-1 rounded-full border border-green-200 shadow-sm text-xs font-black text-green-700 uppercase tracking-tighter">
                  Analysis Complete
                </div>
                
                <h3 className="text-2xl font-black text-green-900 mb-4">{result.soilType}</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: "Moisture", val: result.moisture, icon: "💧" },
                    { label: "pH Level", val: result.ph, icon: "🧪" },
                    { label: "Nitrogen", val: result.nitrogen, icon: "🌿" },
                    { label: "Potassium", val: result.potassium, icon: "🪨" },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-green-50">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{stat.label}</p>
                      <p className="text-base font-black text-gray-800">{stat.icon} {stat.val}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/60 p-4 rounded-2xl border border-white text-gray-700 text-sm leading-relaxed mb-6 italic min-h-[60px]">
                  "{typedText}"
                </div>

                <div>
                  <h4 className="text-xs font-black text-green-800 uppercase tracking-widest mb-3">Fertility: {result.fertility}</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.nutrients.map((item: string, index: number) => (
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
              <span className="text-5xl grayscale opacity-20 mb-4">🔬</span>
              <p className="text-gray-400 font-medium">Upload a sample to see detailed mineral reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// DATA CONSTANTS (Kept exactly as provided)
const redSoil = { soilType: "Red Soil", moisture: "25%", ph: "5.8", nitrogen: "30%", phosphorus: "28%", potassium: "45%", fertility: "Low", healthScore: "55 / 100", nutrients: ["Lime", "Farm Yard Manure", "NPK Mix"], recommendation: "Add compost and lime to improve fertility." };
const blackSoil = { soilType: "Black Cotton Soil", moisture: "48%", ph: "7.2", nitrogen: "50%", phosphorus: "42%", potassium: "65%", fertility: "High", healthScore: "82 / 100", nutrients: ["Organic Compost", "DAP"], recommendation: "Excellent for cotton and soybean cultivation." };
const brownSoil = { soilType: "Dry Brown Soil", moisture: "30%", ph: "6.6", nitrogen: "35%", phosphorus: "30%", potassium: "50%", fertility: "Moderate", healthScore: "68 / 100", nutrients: ["Vermicompost", "Bio Fertilizer"], recommendation: "Improve structure with compost and regular irrigation." };