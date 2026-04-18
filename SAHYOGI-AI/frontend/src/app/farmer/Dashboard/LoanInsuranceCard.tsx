"use client";

import { useState } from "react";
import { useFarmer } from "../../../context/FarmerContext";

const SCHEMES = [
  {
    id: "kcc",
    title: "Kisan Credit Card (KCC)",
    icon: "💳",
    type: "loan",
    color: "from-emerald-500 to-green-600",
    interest: "4% p.a. (with subsidy)",
    maxAmount: "₹3,00,000",
    details: [
      "Short-term crop loans at subsidized 4% interest",
      "Credit limit based on landholding and crop grown",
      "Covers crop production, post-harvest, and allied activities",
      "Repayment: 12 months from disbursement",
      "Insurance coverage under PMFBY included",
    ],
    howToApply: "Visit nearest bank branch (SBI, PNB, Canara Bank) with land records, Aadhaar, and passport photo.",
    helpline: "1800-180-1551",
  },
  {
    id: "pmfby",
    title: "PM Fasal Bima Yojana (PMFBY)",
    icon: "🛡️",
    type: "insurance",
    color: "from-blue-500 to-indigo-600",
    interest: "Premium: 2% Kharif, 1.5% Rabi",
    maxAmount: "Full crop value covered",
    details: [
      "Comprehensive crop insurance against natural calamities",
      "Premium: 2% for Kharif, 1.5% for Rabi, 5% for horticulture",
      "Covers flood, drought, hailstorm, pest/disease",
      "Claim within 72 hours of crop damage",
      "Available for all crop-growing farmers",
    ],
    howToApply: "Enroll through bank, CSC center, or online at pmfby.gov.in before sowing deadline.",
    helpline: "1800-200-7710",
  },
  {
    id: "mudra",
    title: "PM MUDRA Yojana",
    icon: "🏦",
    type: "loan",
    color: "from-orange-500 to-amber-600",
    interest: "7-9% p.a.",
    maxAmount: "₹10,00,000",
    details: [
      "Shishu: Up to ₹50,000 | Kishor: ₹50K-5L | Tarun: ₹5L-10L",
      "For farm equipment, irrigation, processing units",
      "No collateral needed up to ₹10 lakh",
      "Available at all scheduled banks and MFIs",
      "Special benefits for women and SC/ST farmers",
    ],
    howToApply: "Apply at any bank branch or through udyamimitra.in portal.",
    helpline: "1800-180-1111",
  },
  {
    id: "pmkisan",
    title: "PM-KISAN Income Support",
    icon: "💰",
    type: "subsidy",
    color: "from-teal-500 to-cyan-600",
    interest: "Direct benefit",
    maxAmount: "₹6,000/year",
    details: [
      "₹6,000 per year in 3 installments of ₹2,000 each",
      "Direct transfer to Aadhaar-linked bank account",
      "For all land-holding farmer families",
      "No loan repayment — it's a grant!",
      "Check status at pmkisan.gov.in",
    ],
    howToApply: "Register at pmkisan.gov.in or through local Patwari/CSC.",
    helpline: "011-24300606",
  },
];

interface EMI {
  name: string;
  amount: number;
  dueDate: string;
  status: "upcoming" | "overdue" | "paid";
}

export default function LoanInsuranceCard() {
  const { farmer } = useFarmer();
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [showEMI, setShowEMI] = useState(false);

  // Demo EMI data
  const emis: EMI[] = [
    { name: "KCC Crop Loan", amount: 4500, dueDate: "2026-05-01", status: "upcoming" },
    { name: "Equipment Loan EMI", amount: 3200, dueDate: "2026-04-25", status: "upcoming" },
    { name: "KCC Interest", amount: 1800, dueDate: "2026-04-15", status: "paid" },
  ];

  const scheme = SCHEMES.find(s => s.id === selectedScheme);
  const filteredSchemes = activeType === "all" ? SCHEMES : SCHEMES.filter(s => s.type === activeType);

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  return (
    <div className="group relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg shadow-amber-500/20">
            <span className="text-xl text-white">🏦</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Loan & Insurance</h3>
            <p className="text-xs text-gray-400">Government schemes, loans & EMI tracker</p>
          </div>
        </div>
        <button onClick={() => setShowEMI(!showEMI)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showEMI ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          {showEMI ? "← Schemes" : "📅 EMI Tracker"}
        </button>
      </div>

      {showEMI ? (
        /* EMI Tracker View */
        <div className="space-y-3">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Upcoming EMI Payments</p>
          {emis.map((emi, i) => {
            const days = daysUntil(emi.dueDate);
            return (
              <div key={i} className={`p-4 rounded-xl border transition-all ${emi.status === "paid" ? "bg-green-50 border-green-200" : days <= 3 ? "bg-red-50 border-red-200 animate-pulse" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{emi.name}</p>
                    <p className="text-xs text-gray-500">Due: {emi.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-gray-800">₹{emi.amount.toLocaleString()}</p>
                    {emi.status === "paid" ? (
                      <span className="text-[10px] font-bold text-green-600">✅ Paid</span>
                    ) : (
                      <span className={`text-[10px] font-bold ${days <= 3 ? "text-red-600" : "text-amber-600"}`}>
                        {days <= 0 ? "⚠️ OVERDUE" : `⏳ ${days} days left`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">Total Upcoming: <span className="font-bold text-gray-700">₹{emis.filter(e => e.status !== "paid").reduce((s, e) => s + e.amount, 0).toLocaleString()}</span></p>
          </div>
        </div>
      ) : (
        /* Schemes View */
        <>
          {/* Type Filter */}
          <div className="flex gap-2 mb-4">
            {[
              { id: "all", label: "All" },
              { id: "loan", label: "💳 Loans" },
              { id: "insurance", label: "🛡️ Insurance" },
              { id: "subsidy", label: "💰 Subsidy" },
            ].map(t => (
              <button key={t.id} onClick={() => { setActiveType(t.id); setSelectedScheme(null); }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${activeType === t.id ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-400 border-gray-200"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Scheme Detail */}
          {scheme ? (
            <div className="space-y-3">
              <button onClick={() => setSelectedScheme(null)} className="text-xs text-amber-600 font-bold hover:underline">← Back to schemes</button>
              <div className={`bg-gradient-to-r ${scheme.color} rounded-xl p-5 text-white`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{scheme.icon}</span>
                  <div>
                    <h4 className="font-black text-lg">{scheme.title}</h4>
                    <p className="text-white/70 text-xs">Interest: {scheme.interest} | Max: {scheme.maxAmount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Key Benefits</p>
                <ul className="space-y-1.5">
                  {scheme.details.map((d, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">How to Apply</p>
                <p className="text-sm text-amber-800">{scheme.howToApply}</p>
                <p className="text-xs text-amber-600 mt-2 font-bold">📞 Helpline: {scheme.helpline}</p>
              </div>
            </div>
          ) : (
            /* Scheme List */
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {filteredSchemes.map(s => (
                <button key={s.id} onClick={() => setSelectedScheme(s.id)}
                  className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100/70 transition-all text-left flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
                    {s.icon}
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.interest} • Max {s.maxAmount}</p>
                  </div>
                  <span className="text-gray-300 text-lg">→</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
