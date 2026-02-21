import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_farmer_by_phone(phone: str):
    response = (
        supabase.table("farmers")
        .select("*")
        .eq("phone", phone)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def get_soil_by_farmer_id(farmer_id: str):
    response = (
        supabase.table("soil_health")
        .select("*")
        .eq("farmer_id", farmer_id)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]
