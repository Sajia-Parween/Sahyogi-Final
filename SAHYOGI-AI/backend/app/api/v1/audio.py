from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path
from app.models.api_response import error_response

router = APIRouter()

@router.get("/{filename}")
def get_audio(filename: str):
    file_path = Path("audio") / filename

    if not file_path.exists():
        return error_response("File not found", error="not_found", status_code=404)

    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",
        filename=filename
    )

