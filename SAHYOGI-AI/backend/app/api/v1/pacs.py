from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.core.pacs_engine import (
    get_pacs_list,
    get_queue_status,
    book_slot,
    get_farmer_bookings,
    cancel_booking,
)
from app.models.api_response import success_response, error_response

router = APIRouter()


class SlotBookingRequest(BaseModel):
    pacs_id: str
    farmer_phone: str
    service: str
    preferred_time: str
    date: Optional[str] = None


# ─── List all PACS ───
@router.get("/")
def list_pacs():
    pacs_list = get_pacs_list()
    return success_response(pacs_list, message="PACS list fetched successfully")


# ─── Get queue status for a PACS ───
@router.get("/{pacs_id}/queue")
def pacs_queue(pacs_id: str):
    queue = get_queue_status(pacs_id)
    if not queue:
        return error_response("PACS not found", error="not_found", status_code=404)
    return success_response(queue, message="Queue status fetched")


# ─── Book a slot ───
@router.post("/book")
def book_pacs_slot(request: SlotBookingRequest):
    result = book_slot(
        pacs_id=request.pacs_id,
        farmer_phone=request.farmer_phone,
        service=request.service,
        preferred_time=request.preferred_time,
        date=request.date,
    )

    if "error" in result:
        return error_response(result["error"], error="booking_failed", status_code=400)

    return success_response(result, message="Slot booked successfully")


# ─── Get farmer's bookings ───
@router.get("/bookings/{phone}")
def farmer_bookings(phone: str):
    bookings = get_farmer_bookings(phone)
    return success_response(bookings, message=f"Found {len(bookings)} booking(s)")


# ─── Cancel a booking ───
@router.delete("/bookings/{booking_id}")
def delete_booking(booking_id: str):
    result = cancel_booking(booking_id)
    if "error" in result:
        return error_response(result["error"], error="cancel_failed", status_code=400)
    return success_response(result, message="Booking cancelled")
