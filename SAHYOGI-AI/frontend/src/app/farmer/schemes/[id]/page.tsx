"use client";

import { useState } from "react";

export default function SchemeDetails() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const aadhar = e.target.aadhar.value.trim();
    const income = Number(e.target.income.value);
    const land = Number(e.target.land.value);

    // ✅ Aadhar Validation (12 digits, numbers only)
    const aadharRegex = /^\d{12}$/;

    if (!aadharRegex.test(aadhar)) {
      setError("❌ Aadhar must be exactly 12 digits.");
      setResult(null);
      return;
    }

    setError(null);

    if (income <= 300000 && land <= 5) {
      setResult("✅ You are eligible for this scheme!");
    } else {
      setResult("❌ You are not eligible for this scheme.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">

        <h1 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Scheme Application Form
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="name"
            placeholder="Full Name"
            className="w-full p-3 border rounded-lg"
            required
          />

          <input
            name="aadhar"
            placeholder="Aadhar Number"
            maxLength={12}
            className="w-full p-3 border rounded-lg"
            required
          />

          <input
            name="income"
            type="number"
            placeholder="Annual Income"
            className="w-full p-3 border rounded-lg"
            required
          />

          <input
            name="land"
            type="number"
            placeholder="Land Holding (in acres)"
            className="w-full p-3 border rounded-lg"
            required
          />

          <textarea
            name="address"
            placeholder="Address"
            className="w-full p-3 border rounded-lg"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            Check Eligibility
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div className="mt-4 p-3 bg-yellow-100 text-center rounded-lg font-semibold">
            {result}
          </div>
        )}

      </div>
    </div>
  );
}