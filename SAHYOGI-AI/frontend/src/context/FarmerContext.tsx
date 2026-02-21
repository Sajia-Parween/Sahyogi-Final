"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface FarmerData {
  id: string;
  phone: string;
  name: string;
  language: string;
  crop: string;
  sowing_date: string;
}

interface FarmerContextType {
  farmer: FarmerData | null;
  phone: string;
  setFarmer: (farmer: FarmerData) => void;
  setPhone: (phone: string) => void;
  logout: () => void;
}

const FarmerContext = createContext<FarmerContextType | null>(null);

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [farmer, setFarmerState] = useState<FarmerData | null>(null);
  const [phone, setPhoneState] = useState<string>("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("farmer_phone");
    const savedFarmer = localStorage.getItem("farmer_data");
    if (savedPhone) setPhoneState(savedPhone);
    if (savedFarmer) {
      try {
        setFarmerState(JSON.parse(savedFarmer));
      } catch {}
    }
  }, []);

  const setFarmer = (data: FarmerData) => {
    setFarmerState(data);
    localStorage.setItem("farmer_data", JSON.stringify(data));
  };

  const setPhone = (p: string) => {
    setPhoneState(p);
    localStorage.setItem("farmer_phone", p);
  };

  const logout = () => {
    setFarmerState(null);
    setPhoneState("");
    localStorage.removeItem("farmer_phone");
    localStorage.removeItem("farmer_data");
  };

  return (
    <FarmerContext.Provider value={{ farmer, phone, setFarmer, setPhone, logout }}>
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) throw new Error("useFarmer must be used inside FarmerProvider");
  return context;
}
