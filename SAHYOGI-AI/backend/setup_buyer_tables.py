"""
Run this script ONCE to create the buyers and connection_requests tables in Supabase.
Also seeds 5 demo buyers.

Usage:
    python setup_buyer_tables.py
"""

import os
import sys
from dotenv import load_dotenv

# Load env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Create Tables via Supabase SQL ───
# Note: Supabase Python client can't run raw SQL directly.
# You need to run this SQL in the Supabase Dashboard > SQL Editor.

SQL = """
-- Buyers Table
CREATE TABLE IF NOT EXISTS buyers (
    id BIGSERIAL PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    business_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    location TEXT DEFAULT 'Sambalpur',
    crops_buying TEXT[] DEFAULT '{}',
    price_min NUMERIC DEFAULT 10,
    price_max NUMERIC DEFAULT 30,
    max_quantity_kg INTEGER DEFAULT 1000,
    payment_speed TEXT DEFAULT '3_days',
    business_type TEXT DEFAULT 'wholesaler',
    reliability_score NUMERIC DEFAULT 3.0,
    total_transactions INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection Requests Table
CREATE TABLE IF NOT EXISTS connection_requests (
    id BIGSERIAL PRIMARY KEY,
    farmer_phone TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_name TEXT DEFAULT '',
    crop TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    direction TEXT DEFAULT 'farmer_to_buyer' CHECK (direction IN ('farmer_to_buyer', 'buyer_to_farmer')),
    responded_at TIMESTAMPTZ,
    buyer_response_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on buyers" ON buyers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on connection_requests" ON connection_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buyers_phone ON buyers(phone);
CREATE INDEX IF NOT EXISTS idx_buyers_active ON buyers(active);
CREATE INDEX IF NOT EXISTS idx_conn_req_buyer ON connection_requests(buyer_phone);
CREATE INDEX IF NOT EXISTS idx_conn_req_farmer ON connection_requests(farmer_phone);
CREATE INDEX IF NOT EXISTS idx_conn_req_status ON connection_requests(status);
"""

print("=" * 60)
print("SAHYOGI — Database Setup for Buyer Dashboard")
print("=" * 60)
print()
print("STEP 1: Run the following SQL in Supabase Dashboard > SQL Editor:")
print()
print(SQL)
print()
print("=" * 60)
print("STEP 2: Seeding demo buyers...")
print()

# ─── Seed Demo Buyers ───

DEMO_BUYERS = [
    {
        "phone": "9000000001",
        "name": "Rajesh Agarwal",
        "business_name": "GreenHarvest Exports",
        "email": "rajesh@greenharvest.com",
        "location": "Sambalpur",
        "crops_buying": ["tomato", "onion", "potato", "chilli"],
        "price_min": 15,
        "price_max": 25,
        "max_quantity_kg": 5000,
        "payment_speed": "next_day",
        "business_type": "exporter",
        "reliability_score": 4.8,
        "total_transactions": 164,
        "description": "Premium export-grade produce buyer. We specialize in international markets and offer competitive prices for quality produce.",
        "active": True,
        "verified": True,
    },
    {
        "phone": "9000000002",
        "name": "Priya Mohanty",
        "business_name": "Odisha FreshMart",
        "email": "priya@freshmart.in",
        "location": "Bargarh",
        "crops_buying": ["rice", "wheat", "maize", "soybean"],
        "price_min": 18,
        "price_max": 30,
        "max_quantity_kg": 10000,
        "payment_speed": "instant",
        "business_type": "retail_chain",
        "reliability_score": 4.5,
        "total_transactions": 89,
        "description": "Direct retail chain supplier. Instant payments via UPI. Looking for consistent quality supply from verified farmers.",
        "active": True,
        "verified": True,
    },
    {
        "phone": "9000000003",
        "name": "Amit Patel",
        "business_name": "KisanDirect Pvt Ltd",
        "email": "amit@kisandirect.com",
        "location": "Jharsuguda",
        "crops_buying": ["tomato", "wheat", "rice", "cotton", "mustard"],
        "price_min": 12,
        "price_max": 35,
        "max_quantity_kg": 20000,
        "payment_speed": "3_days",
        "business_type": "aggregator",
        "reliability_score": 4.2,
        "total_transactions": 312,
        "description": "India's growing farm-to-consumer platform. We buy in bulk and ensure fair prices. 300+ successful transactions.",
        "active": True,
        "verified": True,
    },
    {
        "phone": "9000000004",
        "name": "Sunita Behera",
        "business_name": "NatureFresh Wholesale",
        "email": "sunita@naturefresh.com",
        "location": "Sambalpur",
        "crops_buying": ["onion", "potato", "groundnut", "sugarcane"],
        "price_min": 10,
        "price_max": 28,
        "max_quantity_kg": 8000,
        "payment_speed": "weekly",
        "business_type": "wholesaler",
        "reliability_score": 4.6,
        "total_transactions": 203,
        "description": "Organic and premium produce wholesaler. We pay premium prices for organically grown crops.",
        "active": True,
        "verified": True,
    },
    {
        "phone": "9000000005",
        "name": "Vikram Singh",
        "business_name": "AgriConnect Co.",
        "email": "vikram@agriconnect.in",
        "location": "Rairakhol",
        "crops_buying": ["rice", "wheat", "maize", "chilli", "soybean"],
        "price_min": 14,
        "price_max": 32,
        "max_quantity_kg": 15000,
        "payment_speed": "next_day",
        "business_type": "b2b_marketplace",
        "reliability_score": 4.3,
        "total_transactions": 178,
        "description": "B2B marketplace connecting farmers with restaurants, hotels, and food processing units across Odisha.",
        "active": True,
        "verified": True,
    },
]


seeded = 0
for buyer in DEMO_BUYERS:
    try:
        existing = supabase.table("buyers").select("id").eq("phone", buyer["phone"]).execute()
        if existing.data:
            print(f"  [SKIP] {buyer['business_name']} (already exists)")
            continue
        supabase.table("buyers").insert(buyer).execute()
        print(f"  [OK]   {buyer['business_name']} ({buyer['phone']})")
        seeded += 1
    except Exception as e:
        print(f"  [ERR]  {buyer['business_name']}: {e}")

print()
print(f"Seeded {seeded} new demo buyers.")
print()
print("Done! Run the backend with: uvicorn app.main:app --reload --port 8001")
