from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import date
from app.services.supabase_service import supabase
from app.models.api_response import success_response, error_response

router = APIRouter()


class FarmerRegistration(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    name: str
    language: str = "en"
    crop: str
    sowing_date: date

    nitrogen: str
    phosphorus: str
    potassium: str
    ph: float


@router.post("/")
def register_farmer(data: FarmerRegistration):

    # Check if farmer already exists
    existing = (
        supabase.table("farmers")
        .select("*")
        .eq("phone", data.phone)
        .execute()
    )

    if existing.data:
        return error_response("Farmer already exists", error="duplicate", status_code=400)

    # Insert farmer
    farmer_response = (
        supabase.table("farmers")
        .insert({
            "phone": data.phone,
            "name": data.name,
            "language": data.language,
            "crop": data.crop,
            "sowing_date": str(data.sowing_date)
        })
        .execute()
    )

    farmer = farmer_response.data[0]

    # Insert soil data
    supabase.table("soil_health").insert({
        "farmer_id": farmer["id"],
        "nitrogen": data.nitrogen,
        "phosphorus": data.phosphorus,
        "potassium": data.potassium,
        "ph": data.ph
    }).execute()

    return success_response({
        "farmer_id": farmer["id"]
    }, message="Farmer registered successfully")


@router.get("/{phone}")
def get_farmer(phone: str):

    response = (
        supabase.table("farmers")
        .select("*")
        .eq("phone", phone)
        .execute()
    )

    if not response.data:
        return error_response("Farmer not found", error="not_found", status_code=404)

    return success_response(response.data[0])
