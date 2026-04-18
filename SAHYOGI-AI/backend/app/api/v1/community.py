"""
Community API — Discussion board for nearby farmers.
Categories: pest, price, rain, tips
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.api_response import success_response, error_response

router = APIRouter()


# ─── In-memory store (upgrade to Supabase if needed) ───
_posts: list[dict] = [
    {
        "id": 1,
        "farmer_name": "Suresh Patel",
        "farmer_phone": "9888000001",
        "category": "pest",
        "message": "Heavy aphid attack in my wheat field near Bargarh. Applied Imidacloprid yesterday — seems to be working. Watch out if you're nearby!",
        "location": "Bargarh",
        "likes": 12,
        "created_at": (datetime.now()).isoformat(),
    },
    {
        "id": 2,
        "farmer_name": "Anita Devi",
        "farmer_phone": "9888000002",
        "category": "rain",
        "message": "Light rain happened in Jharsuguda area this morning. My paddy field has standing water. Anyone else facing waterlogging?",
        "location": "Jharsuguda",
        "likes": 8,
        "created_at": (datetime.now()).isoformat(),
    },
    {
        "id": 3,
        "farmer_name": "Mahesh Kumar",
        "farmer_phone": "9888000003",
        "category": "price",
        "message": "Wheat mandi rate in Sambalpur crossed ₹2,350/quintal today! If anyone is planning to sell, now is a good time. MSP is ₹2,275.",
        "location": "Sambalpur",
        "likes": 24,
        "created_at": (datetime.now()).isoformat(),
    },
    {
        "id": 4,
        "farmer_name": "Geeta Sahu",
        "farmer_phone": "9888000004",
        "category": "tips",
        "message": "Pro tip: Mix Neem oil (5ml/L) with water and spray in evening to control whitefly naturally. No chemical cost and works great on tomato and chilli!",
        "location": "Rairakhol",
        "likes": 31,
        "created_at": (datetime.now()).isoformat(),
    },
    {
        "id": 5,
        "farmer_name": "Rajesh Singh",
        "farmer_phone": "9888000005",
        "category": "pest",
        "message": "Termite problem in sugarcane near Jujumara area. Used Chlorpyrifos treatment on soil. Neighbour farmers should check their fields too.",
        "location": "Sambalpur",
        "likes": 6,
        "created_at": (datetime.now()).isoformat(),
    },
]

_next_id = 6


class PostRequest(BaseModel):
    farmer_phone: str
    farmer_name: str
    category: str  # pest, price, rain, tips
    message: str
    location: str = "Sambalpur"


@router.get("/posts")
def list_posts(category: Optional[str] = None):
    """List community posts, optionally filtered by category."""
    filtered = _posts
    if category and category != "all":
        filtered = [p for p in _posts if p["category"] == category]
    # Return newest first
    return success_response(
        sorted(filtered, key=lambda x: x["created_at"], reverse=True),
        message=f"{len(filtered)} post(s) found"
    )


@router.post("/posts")
def create_post(data: PostRequest):
    """Create a new community post."""
    global _next_id
    if not data.message.strip():
        return error_response("Message is required", error="empty_message", status_code=400)
    if data.category not in ("pest", "price", "rain", "tips"):
        return error_response("Invalid category", error="invalid_category", status_code=400)

    post = {
        "id": _next_id,
        "farmer_name": data.farmer_name,
        "farmer_phone": data.farmer_phone,
        "category": data.category,
        "message": data.message.strip(),
        "location": data.location,
        "likes": 0,
        "created_at": datetime.now().isoformat(),
    }
    _next_id += 1
    _posts.append(post)

    return success_response(post, message="Post created successfully")


@router.post("/posts/{post_id}/like")
def like_post(post_id: int):
    """Like a community post."""
    for p in _posts:
        if p["id"] == post_id:
            p["likes"] = p.get("likes", 0) + 1
            return success_response(p, message="Post liked")

    return error_response("Post not found", error="not_found", status_code=404)
