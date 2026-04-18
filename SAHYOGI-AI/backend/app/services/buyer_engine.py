"""
Buyer Management Backend — Supabase-backed buyer store and connection request system.

All data persisted to Supabase tables:
- buyers: buyer profiles and listing info
- connection_requests: farmer↔buyer connection requests
"""

import hashlib
from datetime import datetime
from typing import Optional
from app.services.supabase_service import supabase


# ─── Buyer Registration ───

def register_buyer(data: dict) -> dict:
    """Register a new buyer in Supabase."""
    phone = data["phone"]

    # Check existing
    existing = supabase.table("buyers").select("*").eq("phone", phone).execute()
    if existing.data:
        return {"error": "Buyer already registered with this phone number"}

    buyer = {
        "phone": phone,
        "name": data["name"],
        "business_name": data.get("business_name", data["name"]),
        "email": data.get("email", ""),
        "location": data.get("location", "Sambalpur"),
        "crops_buying": data.get("crops_buying", []),
        "price_min": data.get("price_range", {}).get("min", 10),
        "price_max": data.get("price_range", {}).get("max", 30),
        "max_quantity_kg": data.get("max_quantity_kg", 1000),
        "payment_speed": data.get("payment_speed", "3_days"),
        "business_type": data.get("business_type", "wholesaler"),
        "reliability_score": 3.0,
        "total_transactions": 0,
        "description": data.get("description", ""),
        "active": True,
        "verified": False,
    }

    result = supabase.table("buyers").insert(buyer).execute()
    if result.data:
        return _format_buyer(result.data[0])
    return {"error": "Registration failed"}


def get_buyer(phone: str) -> Optional[dict]:
    """Get buyer by phone from Supabase."""
    result = supabase.table("buyers").select("*").eq("phone", phone).execute()
    if result.data:
        return _format_buyer(result.data[0])
    return None


def get_buyer_by_id(buyer_id: str) -> Optional[dict]:
    """Get buyer by ID."""
    result = supabase.table("buyers").select("*").eq("id", buyer_id).execute()
    if result.data:
        return _format_buyer(result.data[0])
    return None


def update_buyer_listing(phone: str, updates: dict) -> Optional[dict]:
    """Update buyer listing in Supabase."""
    # Map price_range to flat fields
    if "price_range" in updates:
        updates["price_min"] = updates["price_range"].get("min", 10)
        updates["price_max"] = updates["price_range"].get("max", 30)
        del updates["price_range"]

    allowed_fields = [
        "business_name", "email", "location", "crops_buying",
        "price_min", "price_max", "max_quantity_kg", "payment_speed",
        "business_type", "description", "active",
    ]
    safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}

    if not safe_updates:
        return get_buyer(phone)

    result = supabase.table("buyers").update(safe_updates).eq("phone", phone).execute()
    if result.data:
        return _format_buyer(result.data[0])
    return None


def list_active_buyers(crop: Optional[str] = None, location: Optional[str] = None) -> list[dict]:
    """List all active buyers from Supabase, optionally filtered."""
    query = supabase.table("buyers").select("*").eq("active", True)

    if location:
        query = query.ilike("location", location)

    result = query.execute()
    buyers = [_format_buyer(b) for b in (result.data or [])]

    # Filter by crop (array contains)
    if crop:
        crop_lower = crop.lower().strip()
        buyers = [b for b in buyers if crop_lower in [c.lower() for c in b.get("crops_buying", [])]]

    return buyers


def list_registered_farmers() -> list[dict]:
    """List all registered farmers from Supabase (for buyer to browse)."""
    result = supabase.table("farmers").select("id, phone, name, crop, language, sowing_date").execute()
    return result.data or []


# ─── Connection Requests ───

def create_connection_request(
    farmer_phone: str,
    farmer_name: str,
    buyer_phone: str,
    crop: str,
    quantity: int,
    message: str = "",
    direction: str = "farmer_to_buyer",
) -> dict:
    """Create a connection request in Supabase."""
    # Validate buyer exists
    buyer = get_buyer(buyer_phone)
    if not buyer and direction == "farmer_to_buyer":
        return {"error": "Buyer not found"}

    # Validate farmer exists if buyer-to-farmer
    if direction == "buyer_to_farmer":
        farmer_check = supabase.table("farmers").select("*").eq("phone", farmer_phone).execute()
        if not farmer_check.data:
            return {"error": "Farmer not found"}

    request_data = {
        "farmer_phone": farmer_phone,
        "farmer_name": farmer_name,
        "buyer_phone": buyer_phone,
        "buyer_name": buyer.get("business_name", "") if buyer else "",
        "crop": crop,
        "quantity": quantity,
        "message": message,
        "status": "pending",
        "direction": direction,
        "responded_at": None,
        "buyer_response_message": None,
    }

    result = supabase.table("connection_requests").insert(request_data).execute()
    if result.data:
        return result.data[0]
    return {"error": "Failed to create connection request"}


def get_buyer_requests(buyer_phone: str, status: Optional[str] = None) -> list[dict]:
    """Get all connection requests for a buyer from Supabase."""
    query = supabase.table("connection_requests").select("*").eq("buyer_phone", buyer_phone)
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


def get_farmer_requests(farmer_phone: str) -> list[dict]:
    """Get all connection requests involving a farmer."""
    result = (
        supabase.table("connection_requests")
        .select("*")
        .eq("farmer_phone", farmer_phone)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def respond_to_request(request_id: str, buyer_phone: str, accept: bool, response_message: str = "") -> Optional[dict]:
    """Accept or reject a connection request in Supabase."""
    update_data = {
        "status": "accepted" if accept else "rejected",
        "responded_at": datetime.now().isoformat(),
        "buyer_response_message": response_message,
    }

    result = (
        supabase.table("connection_requests")
        .update(update_data)
        .eq("id", request_id)
        .execute()
    )

    if result.data:
        # Increment buyer transactions if accepted
        if accept:
            buyer = get_buyer(buyer_phone)
            if buyer:
                new_count = (buyer.get("total_transactions", 0) or 0) + 1
                supabase.table("buyers").update({"total_transactions": new_count}).eq("phone", buyer_phone).execute()
        return result.data[0]
    return None


def get_buyer_analytics(buyer_phone: str) -> dict:
    """Get analytics for a buyer from Supabase."""
    buyer = get_buyer(buyer_phone)
    if not buyer:
        return {"error": "Buyer not found"}

    requests = get_buyer_requests(buyer_phone)
    pending = [r for r in requests if r["status"] == "pending"]
    accepted = [r for r in requests if r["status"] == "accepted"]
    rejected = [r for r in requests if r["status"] == "rejected"]

    crop_demand: dict[str, int] = {}
    total_qty = 0
    for r in requests:
        c = r.get("crop", "unknown")
        q = r.get("quantity", 0) or 0
        crop_demand[c] = crop_demand.get(c, 0) + q
        total_qty += q

    return {
        "total_requests": len(requests),
        "pending": len(pending),
        "accepted": len(accepted),
        "rejected": len(rejected),
        "acceptance_rate": round(len(accepted) / max(len(requests), 1) * 100, 1),
        "total_quantity_requested_kg": total_qty,
        "crop_demand_breakdown": crop_demand,
        "total_transactions": buyer.get("total_transactions", 0),
        "reliability_score": buyer.get("reliability_score", 3.0),
    }


# ─── Helpers ───

def _format_buyer(raw: dict) -> dict:
    """Format raw Supabase buyer row into the expected shape."""
    return {
        "id": str(raw.get("id", "")),
        "phone": raw.get("phone", ""),
        "name": raw.get("name", ""),
        "business_name": raw.get("business_name", raw.get("name", "")),
        "email": raw.get("email", ""),
        "location": raw.get("location", "Sambalpur"),
        "crops_buying": raw.get("crops_buying", []) or [],
        "price_range": {"min": raw.get("price_min", 10), "max": raw.get("price_max", 30)},
        "max_quantity_kg": raw.get("max_quantity_kg", 1000),
        "payment_speed": raw.get("payment_speed", "3_days"),
        "business_type": raw.get("business_type", "wholesaler"),
        "reliability_score": raw.get("reliability_score", 3.0),
        "total_transactions": raw.get("total_transactions", 0),
        "description": raw.get("description", ""),
        "active": raw.get("active", True),
        "verified": raw.get("verified", False),
        "registered_at": raw.get("created_at", ""),
    }
