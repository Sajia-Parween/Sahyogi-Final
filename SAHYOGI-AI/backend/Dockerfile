# ─── Backend Dockerfile ───
# Build from project root: docker build -f backend/Dockerfile .

FROM python:3.13-slim

# System deps for grpcio, crypto, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies (filter Windows-only packages)
COPY backend/requirements.txt ./requirements.txt
RUN grep -ivE "^(pywin32|pypiwin32|comtypes|pyttsx3|pyroaring)" requirements.txt > requirements_linux.txt \
    && pip install --no-cache-dir -r requirements_linux.txt

# Copy backend source code
COPY backend/app ./app

# Copy data directory (market prices CSVs used by engines)
COPY data /app/data

# Create audio directory for TTS output
RUN mkdir -p /app/audio

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
