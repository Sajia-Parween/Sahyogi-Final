from app.services.supabase_service import supabase


def log_call(
    farmer_id: str,
    phone: str,
    language: str,
    crop: str,
    crop_stage: str,
    market_trend: str,
    audio_path: str,
    advisory_snapshot: dict
):

    supabase.table("calls").insert({
        "farmer_id": farmer_id,
        "phone": phone,
        "language": language,
        "crop": crop,
        "crop_stage": crop_stage,
        "market_trend": market_trend,
        "audio_path": audio_path,
        "advisory_snapshot": advisory_snapshot
    }).execute()
