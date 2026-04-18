"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface BuyerData {
  id: string;
  phone: string;
  name: string;
  business_name: string;
  email: string;
  location: string;
  crops_buying: string[];
  price_range: { min: number; max: number };
  max_quantity_kg: number;
  payment_speed: string;
  business_type: string;
  reliability_score: number;
  total_transactions: number;
  description: string;
  active: boolean;
  verified: boolean;
}

interface BuyerContextType {
  buyer: BuyerData | null;
  phone: string;
  setBuyer: (buyer: BuyerData) => void;
  setPhone: (phone: string) => void;
  logout: () => void;
}

const BuyerContext = createContext<BuyerContextType | null>(null);

export function BuyerProvider({ children }: { children: React.ReactNode }) {
  const [buyer, setBuyerState] = useState<BuyerData | null>(null);
  const [phone, setPhoneState] = useState<string>("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("buyer_phone");
    const savedBuyer = localStorage.getItem("buyer_data");
    if (savedPhone) setPhoneState(savedPhone);
    if (savedBuyer) {
      try {
        setBuyerState(JSON.parse(savedBuyer));
      } catch {}
    }
  }, []);

  const setBuyer = (data: BuyerData) => {
    setBuyerState(data);
    localStorage.setItem("buyer_data", JSON.stringify(data));
  };

  const setPhone = (p: string) => {
    setPhoneState(p);
    localStorage.setItem("buyer_phone", p);
  };

  const logout = () => {
    setBuyerState(null);
    setPhoneState("");
    localStorage.removeItem("buyer_phone");
    localStorage.removeItem("buyer_data");
  };

  return (
    <BuyerContext.Provider value={{ buyer, phone, setBuyer, setPhone, logout }}>
      {children}
    </BuyerContext.Provider>
  );
}

export function useBuyer() {
  const context = useContext(BuyerContext);
  if (!context) throw new Error("useBuyer must be used inside BuyerProvider");
  return context;
}
