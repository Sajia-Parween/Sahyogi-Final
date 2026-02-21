from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, Any
from datetime import datetime

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    error: Optional[Any] = None
    timestamp: datetime


def success_response(data: Any, message: str = "Request successful"):
    return APIResponse(
        success=True,
        message=message,
        data=data,
        error=None,
        timestamp=datetime.utcnow()
    )


def error_response(
    message: str,
    error: Any = None,
    status_code: int = 400
):
    return JSONResponse(
        status_code=status_code,
        content=APIResponse(
            success=False,
            message=message,
            data=None,
            error=error,
            timestamp=datetime.utcnow()
        ).model_dump(mode="json")
    )
