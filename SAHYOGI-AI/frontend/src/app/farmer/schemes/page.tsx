"use client";

import { useRouter } from "next/navigation";

const schemes = [
  { id: 1, name: "PM-KISAN Yojana", image: "/schemes/pm-kisan.jpeg" },
  { id: 2, name: "Soil Health Card Scheme", image: "/schemes/soil-card.jpeg" },
  { id: 3, name: "PM Fasal Bima Yojana", image: "/schemes/fasal-bima.jpeg" },
  { id: 4, name: "Kisan Credit Card", image: "/schemes/kcc.jpeg" },
  { id: 5, name: "National Horticulture Mission", image: "/schemes/horticulture.jpeg" },
  { id: 6, name: "Paramparagat Krishi Vikas Yojana", image: "/schemes/organic.jpeg" },
];

export default function SchemesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-green-700 mb-8">
        Government Schemes
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {schemes.map((scheme) => (
          <div
            key={scheme.id}
            onClick={() => router.push(`/farmer/schemes/${scheme.id}`)}
            className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:scale-105 transition"
          >
            <img
              src={scheme.image}
              alt={scheme.name}
              className="w-full h-48 object-cover"
            />

            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {scheme.name}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}