"""
PACS Queue Management & Slot Booking Engine
Simulates queue status and manages slot bookings for Primary Agricultural Cooperative Societies.
"""

import uuid
import random
from datetime import datetime, timedelta
from typing import Optional

# ─── PACS Registry (Sambalpur Region, Odisha) ───

PACS_REGISTRY = [
    {
        "id": "pacs_001",
        "name": "Sambalpur Central PACS",
        "address": "Main Road, Sambalpur, Odisha - 768001",
        "district": "Sambalpur",
        "services": ["Crop Loan", "Fertilizer Purchase", "Crop Insurance", "Seed Distribution", "Soil Testing"],
        "operating_hours": "9:00 AM - 4:00 PM",
        "contact": "0663-2520001",
    },
    {
        "id": "pacs_002",
        "name": "Bargarh Krushak PACS",
        "address": "Station Road, Bargarh, Odisha - 768028",
        "district": "Bargarh",
        "services": ["Crop Loan", "Fertilizer Purchase", "Seed Distribution", "Pesticide Supply"],
        "operating_hours": "9:30 AM - 3:30 PM",
        "contact": "0683-2310002",
    },
    {
        "id": "pacs_003",
        "name": "Jharsuguda Farmers PACS",
        "address": "College Road, Jharsuguda, Odisha - 768201",
        "district": "Jharsuguda",
        "services": ["Crop Loan", "Crop Insurance", "Soil Testing", "Farm Equipment Rental"],
        "operating_hours": "10:00 AM - 4:00 PM",
        "contact": "0664-2540003",
    },
    {
        "id": "pacs_004",
        "name": "Rairakhol Rural PACS",
        "address": "Bus Stand Road, Rairakhol, Odisha - 768106",
        "district": "Sambalpur",
        "services": ["Crop Loan", "Fertilizer Purchase", "Seed Distribution", "Soil Testing"],
        "operating_hours": "9:00 AM - 3:00 PM",
        "contact": "0664-2470004",
    },
    {
        "id": "pacs_005",
        "name": "Attabira Cooperative PACS",
        "address": "Market Road, Attabira, Odisha - 768027",
        "district": "Bargarh",
        "services": ["Crop Loan", "Fertilizer Purchase", "Crop Insurance", "Pesticide Supply", "Seed Distribution"],
        "operating_hours": "9:00 AM - 4:00 PM",
        "contact": "0683-2380005",
    },
]

# ─── In-Memory Booking Store ───

_bookings: dict[str, dict] = {}

# ─── Time Slots ───

TIME_SLOTS = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM",
]


def get_pacs_list() -> list[dict]:
    """Return all registered PACS."""
    return PACS_REGISTRY


def get_pacs_by_id(pacs_id: str) -> Optional[dict]:
    """Find a PACS by its ID."""
    for pacs in PACS_REGISTRY:
        if pacs["id"] == pacs_id:
            return pacs
    return None


def get_queue_status(pacs_id: str) -> Optional[dict]:
    """
    Get simulated real-time queue status for a PACS.
    Generates realistic queue data based on time of day.
    """
    pacs = get_pacs_by_id(pacs_id)
    if not pacs:
        return None

    # Simulate queue based on time of day
    hour = datetime.now().hour
    if 9 <= hour <= 11:
        # Morning rush
        base_queue = random.randint(8, 20)
    elif 11 < hour <= 14:
        # Midday moderate
        base_queue = random.randint(4, 12)
    elif 14 < hour <= 16:
        # Afternoon low
        base_queue = random.randint(1, 6)
    else:
        # Outside working hours
        base_queue = 0

    # Count booked slots for today at this PACS
    today = datetime.now().strftime("%Y-%m-%d")
    booked_today = sum(
        1 for b in _bookings.values()
        if b["pacs_id"] == pacs_id and b["date"] == today and b["status"] == "confirmed"
    )

    # Estimated wait per person (minutes)
    avg_service_time = random.randint(8, 15)
    estimated_wait = base_queue * avg_service_time

    # Available slots for today
    booked_times_today = [
        b["preferred_time"] for b in _bookings.values()
        if b["pacs_id"] == pacs_id and b["date"] == today and b["status"] == "confirmed"
    ]
    available_slots = [t for t in TIME_SLOTS if t not in booked_times_today]

    return {
        "pacs_id": pacs_id,
        "pacs_name": pacs["name"],
        "current_queue": base_queue,
        "estimated_wait_minutes": estimated_wait,
        "booked_slots_today": booked_today,
        "available_slots": available_slots,
        "services": pacs["services"],
        "operating_hours": pacs["operating_hours"],
        "last_updated": datetime.now().isoformat(),
    }


def book_slot(
    pacs_id: str,
    farmer_phone: str,
    service: str,
    preferred_time: str,
    date: Optional[str] = None,
) -> dict:
    """
    Book a slot at a PACS for a farmer.
    Returns booking confirmation with token number.
    """
    pacs = get_pacs_by_id(pacs_id)
    if not pacs:
        return {"error": "PACS not found"}

    # Validate service
    if service not in pacs["services"]:
        return {"error": f"Service '{service}' is not available at {pacs['name']}"}

    # Validate time slot
    if preferred_time not in TIME_SLOTS:
        return {"error": f"Invalid time slot. Available: {', '.join(TIME_SLOTS)}"}

    # Use today's date if not specified
    booking_date = date or datetime.now().strftime("%Y-%m-%d")

    # Check if slot is already booked
    for b in _bookings.values():
        if (
            b["pacs_id"] == pacs_id
            and b["date"] == booking_date
            and b["preferred_time"] == preferred_time
            and b["status"] == "confirmed"
        ):
            return {"error": f"Slot at {preferred_time} is already booked. Please choose another time."}

    # Check for duplicate booking by same farmer at same PACS on same date
    for b in _bookings.values():
        if (
            b["farmer_phone"] == farmer_phone
            and b["pacs_id"] == pacs_id
            and b["date"] == booking_date
            and b["status"] == "confirmed"
        ):
            return {"error": "You already have a booking at this PACS for today."}

    # Generate booking
    booking_id = str(uuid.uuid4())[:8].upper()
    token_number = random.randint(100, 999)

    booking = {
        "booking_id": booking_id,
        "token_number": token_number,
        "pacs_id": pacs_id,
        "pacs_name": pacs["name"],
        "farmer_phone": farmer_phone,
        "service": service,
        "preferred_time": preferred_time,
        "date": booking_date,
        "status": "confirmed",
        "booked_at": datetime.now().isoformat(),
    }

    _bookings[booking_id] = booking

    return {
        "success": True,
        "booking": booking,
        "message": f"Slot booked! Token #{token_number} at {pacs['name']} for {service} at {preferred_time}",
    }


def get_farmer_bookings(farmer_phone: str) -> list[dict]:
    """Get all bookings for a farmer."""
    return [
        b for b in _bookings.values()
        if b["farmer_phone"] == farmer_phone
    ]


def cancel_booking(booking_id: str) -> dict:
    """Cancel a booking by its ID."""
    booking = _bookings.get(booking_id)
    if not booking:
        return {"error": "Booking not found"}

    if booking["status"] == "cancelled":
        return {"error": "Booking is already cancelled"}

    booking["status"] = "cancelled"
    return {
        "success": True,
        "message": f"Booking {booking_id} cancelled successfully",
        "booking": booking,
    }


def get_pacs_summary_for_voice(pacs_id: str = "pacs_001") -> str:
    """
    Generate a voice-friendly summary of PACS queue status for IVR.
    """
    queue = get_queue_status(pacs_id)
    if not queue:
        return "Sorry, PACS information is currently unavailable."

    pacs = get_pacs_by_id(pacs_id)
    text = (
        f"PACS Queue Status for {pacs['name']}. "
        f"Currently {queue['current_queue']} people are waiting in the queue. "
        f"Estimated wait time is {queue['estimated_wait_minutes']} minutes. "
        f"There are {len(queue['available_slots'])} time slots available for booking today. "
        f"Available services include {', '.join(pacs['services'][:3])}. "
        f"Operating hours are {pacs['operating_hours']}. "
        "You can book a slot from the website dashboard."
    )
    return text
