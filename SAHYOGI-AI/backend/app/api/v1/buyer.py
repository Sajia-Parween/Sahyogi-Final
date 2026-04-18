"""
Buyer API Router — Registration, listing management, connection requests.
All data persisted to Supabase.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.buyer_engine import (
    register_buyer, get_buyer, update_buyer_listing,
    list_active_buyers, create_connection_request,
    get_buyer_requests, get_farmer_requests,
    respond_to_request, get_buyer_analytics,
    list_registered_farmers,
)
from app.models.api_response import success_response, error_response

router = APIRouter()


# ─── Request Models ───

class BuyerRegisterRequest(BaseModel):
    phone: str
    name: str
    business_name: str = ""
    email: str = ""
    location: str = "Sambalpur"
    crops_buying: list[str] = []
    price_range: dict = {"min": 10, "max": 30}
    max_quantity_kg: int = 1000
    payment_speed: str = "3_days"
    business_type: str = "wholesaler"
    description: str = ""


class BuyerUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    crops_buying: Optional[list[str]] = None
    price_range: Optional[dict] = None
    max_quantity_kg: Optional[int] = None
    payment_speed: Optional[str] = None
    business_type: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class ConnectionRequest(BaseModel):
    farmer_phone: str
    farmer_name: str
    buyer_phone: str
    crop: str
    quantity: int
    message: str = ""
    direction: str = "farmer_to_buyer"


class ConnectionResponse(BaseModel):
    request_id: str
    accept: bool
    response_message: str = ""


# ─── Buyer Registration & Login ───

@router.post("/register")
def buyer_register(data: BuyerRegisterRequest):
    """Register a new buyer."""
    if not data.phone or len(data.phone) < 10:
        return error_response("Valid phone number required", error="invalid_phone", status_code=400)
    if not data.name:
        return error_response("Name is required", error="missing_name", status_code=400)

    result = register_buyer(data.model_dump())
    if "error" in result:
        return error_response(result["error"], error="registration_failed", status_code=400)

    return success_response(result, message="Buyer registered successfully")


@router.get("/login/{phone}")
def buyer_login(phone: str):
    """Login buyer by phone."""
    buyer = get_buyer(phone)
    if not buyer:
        return error_response("Buyer not found. Please register first.", error="not_found", status_code=404)

    return success_response(buyer, message="Login successful")


# ─── Buyer Profile ───

@router.get("/profile/{phone}")
def buyer_profile(phone: str):
    """Get buyer profile."""
    buyer = get_buyer(phone)
    if not buyer:
        return error_response("Buyer not found", error="not_found", status_code=404)

    return success_response(buyer)


@router.put("/profile/{phone}")
def update_profile(phone: str, data: BuyerUpdateRequest):
    """Update buyer listing/profile."""
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    result = update_buyer_listing(phone, updates)
    if not result:
        return error_response("Buyer not found", error="not_found", status_code=404)

    return success_response(result, message="Listing updated successfully")


# ─── Buyer Discovery (for farmers) ───

@router.get("/discover")
def discover_buyers(crop: Optional[str] = None, location: Optional[str] = None):
    """List active registered buyers, optionally filtered by crop and location."""
    buyers = list_active_buyers(crop, location)
    safe_buyers = []
    for b in buyers:
        safe_buyers.append({
            "id": b["id"],
            "business_name": b.get("business_name", b["name"]),
            "location": b["location"],
            "crops_buying": b["crops_buying"],
            "price_range": b["price_range"],
            "max_quantity_kg": b["max_quantity_kg"],
            "payment_speed": b["payment_speed"],
            "business_type": b["business_type"],
            "reliability_score": b["reliability_score"],
            "total_transactions": b["total_transactions"],
            "description": b["description"],
            "phone": b["phone"],
        })

    return success_response(safe_buyers, message=f"Found {len(safe_buyers)} active buyers")


# ─── Farmer Discovery (for buyers) ───

@router.get("/farmers")
def discover_farmers():
    """List registered farmers for buyers to browse."""
    farmers = list_registered_farmers()
    return success_response(farmers, message=f"Found {len(farmers)} registered farmer(s)")


# ─── Connection Requests ───

@router.post("/connect")
def connect(data: ConnectionRequest):
    """Create a connection request (farmer→buyer or buyer→farmer)."""
    if not data.farmer_phone or not data.buyer_phone:
        return error_response("Phone numbers required", error="missing_phones", status_code=400)

    result = create_connection_request(
        farmer_phone=data.farmer_phone,
        farmer_name=data.farmer_name,
        buyer_phone=data.buyer_phone,
        crop=data.crop,
        quantity=data.quantity,
        message=data.message,
        direction=data.direction,
    )

    if "error" in result:
        return error_response(result["error"], error="connect_failed", status_code=400)

    return success_response(result, message="Connection request sent")


@router.get("/requests/{buyer_phone}")
def get_requests(buyer_phone: str, status: Optional[str] = None):
    """Get all connection requests for a buyer."""
    requests = get_buyer_requests(buyer_phone, status)
    return success_response(requests, message=f"{len(requests)} request(s) found")


@router.get("/farmer-requests/{farmer_phone}")
def get_farmer_reqs(farmer_phone: str):
    """Get all connection requests involving a farmer."""
    requests = get_farmer_requests(farmer_phone)
    return success_response(requests, message=f"{len(requests)} request(s) found")


@router.post("/respond")
def respond(data: ConnectionResponse):
    """Buyer responds to a connection request (accept/reject)."""
    from app.services.buyer_engine import supabase as sb

    # Find the request to get the buyer_phone
    req_result = sb.table("connection_requests").select("*").eq("id", int(data.request_id)).execute()
    if not req_result.data:
        return error_response("Request not found", error="not_found", status_code=404)

    req = req_result.data[0]
    result = respond_to_request(
        request_id=data.request_id,
        buyer_phone=req["buyer_phone"],
        accept=data.accept,
        response_message=data.response_message,
    )

    if not result:
        return error_response("Failed to respond", error="respond_failed", status_code=400)

    status_text = "accepted" if data.accept else "rejected"
    return success_response(result, message=f"Request {status_text}")


# ─── Buyer Analytics ───

@router.get("/analytics/{buyer_phone}")
def analytics(buyer_phone: str):
    """Get buyer analytics."""
    result = get_buyer_analytics(buyer_phone)
    if "error" in result:
        return error_response(result["error"], error="not_found", status_code=404)

    return success_response(result)
