import Link from "next/link";

export default function Home() {
  return (
    // Updated to Slate-Grey radial gradient to match the Dashboard and Login visuals
    <div className="min-h-screen bg-[#E2E8F0] bg-[radial-gradient(circle_at_top,_#F1F5F9_0%,_#E2E8F0_100%)]">

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 bg-white/80 backdrop-blur-md shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          {/* Logo with Forest Green gradient */}
          <div className="w-8 h-8 bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] rounded-full shadow-lg"></div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            Sahyogi<span className="text-green-600">.</span>
          </h1>
        </div>

        <Link
          href="/login"
          className="bg-[#1A3317] text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-900 transition-all shadow-md active:scale-95"
        >
          Login
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-200/20 blur-[120px] pointer-events-none rounded-full" />
        
        <h2 className="relative z-10 text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tighter">
          AI-Powered Voice Advisory <br />
          <span className="text-green-600">For Smart Farming</span>
        </h2>

        <p className="mt-8 max-w-2xl text-lg text-gray-500 font-medium leading-relaxed">
          Empowering farmers with real-time weather updates, soil insights,
          market predictions, and multilingual voice assistance.
        </p>

        <div className="mt-10 flex gap-4 relative z-10">
          <Link
            href="/login"
            className="bg-gradient-to-r from-[#2D5A27] to-[#4A7c44] text-white px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition-all shadow-xl shadow-green-900/20"
          >
            Get Started
          </Link>

          <a
            href="#features"
            className="bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="px-8 py-24 bg-white/40 backdrop-blur-sm border-t border-white"
      >
        <div className="max-w-[1200px] mx-auto">
          <h3 className="text-[10px] font-black text-center text-green-700 uppercase tracking-[0.3em] mb-4">
            Capabilities
          </h3>
          <h2 className="text-4xl font-black text-center text-gray-900 mb-16 tracking-tight">
            Key Features
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            <div className="p-8 rounded-[2rem] shadow-xl bg-white border border-gray-100 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mb-6">🌤</div>
              <h4 className="text-xl font-black text-gray-800 mb-3">
                Weather Analysis
              </h4>
              <p className="text-gray-500 font-medium leading-relaxed">
                Real-time weather forecasts and crop-friendly advisory insights.
              </p>
            </div>

            <div className="p-8 rounded-[2rem] shadow-xl bg-white border border-gray-100 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl mb-6">🌱</div>
              <h4 className="text-xl font-black text-gray-800 mb-3">
                Soil & Crop Insights
              </h4>
              <p className="text-gray-500 font-medium leading-relaxed">
                Soil moisture, pH levels, and crop health recommendations.
              </p>
            </div>

            <div className="p-8 rounded-[2rem] shadow-xl bg-white border border-gray-100 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-6">🎙</div>
              <h4 className="text-xl font-black text-gray-800 mb-3">
                Multilingual Voice
              </h4>
              <p className="text-gray-500 font-medium leading-relaxed">
                Ask questions in Hindi, English, or Odia and get instant advice.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 bg-white/60 backdrop-blur-md text-gray-400 text-[11px] font-black uppercase tracking-widest border-t border-white">
        © 2026 Sahyogi AI • Empowering Farmers Digitally
      </footer>
    </div>
  );
}