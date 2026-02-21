"use client";

import { useEffect, useState, useRef } from "react";

// Mandi data for demo — can be replaced with live API later
const MANDI_DATA = [
    { name: "Azadpur Mandi", lat: 28.7041, lng: 77.1025, type: "Wholesale", dist: "5 km", crops: "Vegetables, Fruits" },
    { name: "Ghazipur Mandi", lat: 28.6279, lng: 77.3248, type: "Wholesale", dist: "12 km", crops: "Flowers, Fruits" },
    { name: "Tikri Kalan Mandi", lat: 28.7466, lng: 76.9446, type: "Grain", dist: "18 km", crops: "Wheat, Rice, Pulses" },
    { name: "Narela Mandi", lat: 28.8534, lng: 77.0937, type: "Grain", dist: "22 km", crops: "Wheat, Mustard" },
    { name: "Najafgarh Mandi", lat: 28.6095, lng: 76.9798, type: "Mixed", dist: "15 km", crops: "Vegetables, Grains" },
];

const FARMER_LOCATION = { lat: 28.6139, lng: 77.2090 }; // Default: Delhi NCR region

export default function FarmMapCard() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selectedMandi, setSelectedMandi] = useState<any>(null);
    const leafletMap = useRef<any>(null);

    useEffect(() => {
        // Dynamically load Leaflet CSS and JS
        if (typeof window === "undefined") return;

        const loadLeaflet = async () => {
            // Add CSS
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            // Load Leaflet JS
            if (!(window as any).L) {
                await new Promise<void>((resolve) => {
                    const script = document.createElement("script");
                    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    script.onload = () => resolve();
                    document.head.appendChild(script);
                });
            }

            // Wait a tick for Leaflet to be available
            setTimeout(() => initMap(), 100);
        };

        loadLeaflet();

        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        };
    }, []);

    const initMap = () => {
        const L = (window as any).L;
        if (!L || !mapRef.current || leafletMap.current) return;

        const map = L.map(mapRef.current, {
            center: [FARMER_LOCATION.lat, FARMER_LOCATION.lng],
            zoom: 11,
            zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Tile layer — Clean CartoDB style
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        // Farmer marker — Green
        const farmerIcon = L.divIcon({
            html: `<div style="background: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
            className: "",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });

        L.marker([FARMER_LOCATION.lat, FARMER_LOCATION.lng], { icon: farmerIcon })
            .addTo(map)
            .bindPopup(`<div style="text-align:center; font-weight:bold; padding: 4px;">📍 Your Farm Location</div>`);

        // Mandi markers — Orange
        MANDI_DATA.forEach((mandi) => {
            const mandiIcon = L.divIcon({
                html: `<div style="background: #f97316; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>`,
                className: "",
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });

            L.marker([mandi.lat, mandi.lng], { icon: mandiIcon })
                .addTo(map)
                .bindPopup(`
          <div style="min-width: 160px; padding: 4px;">
            <div style="font-weight:800; font-size:14px; margin-bottom:4px;">🏪 ${mandi.name}</div>
            <div style="font-size:12px; color:#666;">
              <div>📦 ${mandi.type} Market</div>
              <div>🌾 ${mandi.crops}</div>
              <div>📏 ${mandi.dist} away</div>
            </div>
          </div>
        `);
        });

        leafletMap.current = map;
        setMapLoaded(true);
    };

    const flyToMandi = (mandi: any) => {
        setSelectedMandi(mandi);
        if (leafletMap.current) {
            leafletMap.current.flyTo([mandi.lat, mandi.lng], 14, { duration: 1 });
        }
    };

    const flyToFarmer = () => {
        setSelectedMandi(null);
        if (leafletMap.current) {
            leafletMap.current.flyTo([FARMER_LOCATION.lat, FARMER_LOCATION.lng], 11, { duration: 1 });
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <span className="text-2xl text-white">🗺️</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Farm <span className="text-emerald-600">Map</span>
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            Your location & nearby mandis
                        </p>
                    </div>
                </div>
                <button
                    onClick={flyToFarmer}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                    📍 My Location
                </button>
            </div>

            {/* Map Container */}
            <div className="relative rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner">
                <div
                    ref={mapRef}
                    className="w-full h-[350px] bg-gray-100"
                    style={{ zIndex: 1 }}
                />
                {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            <p className="text-gray-400 text-sm font-medium">Loading map...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mandi List */}
            <div className="mt-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                    Nearby Mandis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MANDI_DATA.map((mandi, idx) => (
                        <button
                            key={idx}
                            onClick={() => flyToMandi(mandi)}
                            className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99]
                ${selectedMandi?.name === mandi.name
                                    ? "bg-emerald-50 border-emerald-200 shadow-md"
                                    : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm text-gray-800">🏪 {mandi.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{mandi.crops}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-emerald-600">{mandi.dist}</span>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">{mandi.type}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pulse animation CSS */}
            <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
        </div>
    );
}
