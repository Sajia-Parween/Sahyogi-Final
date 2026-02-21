from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import advice, farmer, calls, health
from app.api.v1 import audio
from app.api.v1 import analytics
from app.api.v1 import chat
from app.api.v1 import simulation
from app.api.v1 import disease
from app.api.v1 import calendar
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Sahyogi API",
    description="Voice-first multilingual farming advisory system",
    version="1.0.0"
)

# ✅ ADD CORS HERE (after app creation, before routers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/api/v1/audio",
    StaticFiles(directory="audio"),
    name="audio"
)

# Include routers
app.include_router(advice.router, prefix="/api/v1/advice", tags=["Advice"])
app.include_router(farmer.router, prefix="/api/v1/farmer", tags=["Farmer"])
app.include_router(calls.router, prefix="/api/v1/calls", tags=["Calls"])
app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(audio.router, prefix="/api/v1/audio")
app.include_router(analytics.router, prefix="/api/v1/analytics")
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(simulation.router, prefix="/api/v1/simulate-sell", tags=["Simulation"])
app.include_router(disease.router, prefix="/api/v1/disease", tags=["Disease Detection"])
app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["Crop Calendar"])