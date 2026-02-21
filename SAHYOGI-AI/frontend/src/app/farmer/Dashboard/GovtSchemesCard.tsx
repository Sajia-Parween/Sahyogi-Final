"use client";
import { useRouter } from "next/navigation";

export default function GovtSchemesCard() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/farmer/schemes")}
      className="group relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Background Decorative Element (Agriculture Pattern) */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="text-8xl">🏛️</span>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* Header Section */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2.5 rounded-xl text-green-700">
              <span className="text-2xl">🏛️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              Govt. Schemes
            </h2>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-[200px]">
            Check eligibility for agricultural welfare schemes.
          </p>

          {/* Added local image link to fill space */}
          <div className="w-full h-32 rounded-2xl overflow-hidden mb-4">
            <img
              src="/schemes/government.png"
              alt="Government Schemes"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Action Button (Styled like the mockup) */}
        <div className="mt-4">
          <button suppressHydrationWarning className="flex items-center justify-center gap-2 w-full bg-[#EAB308] hover:bg-[#CA8A04] text-white font-bold py-3.5 rounded-2xl transition-colors shadow-md active:scale-95">
            <span>Check Now</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-green-600 transition-all duration-500 group-hover:w-full"></div>
    </div>
  );
}