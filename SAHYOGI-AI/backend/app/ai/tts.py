from gtts import gTTS
from pathlib import Path
import uuid
import time
from typing import Optional


def generate_audio(text: str, language: str, max_retries: int = 3) -> Optional[str]:
    """
    Generate audio from text using gTTS.
    Returns file path on success, None on failure.
    Retries up to max_retries times on network errors.
    """

    # gTTS language mapping
    LANGUAGE_MAP = {
        "en": "en",
        "hi": "hi",
        "or": "hi"  # fallback to Hindi voice for Odia
    }

    tts_lang = LANGUAGE_MAP.get(language, "en")

    audio_folder = Path("audio")
    audio_folder.mkdir(exist_ok=True)

    filename = f"{uuid.uuid4()}.mp3"
    file_path = audio_folder / filename

    for attempt in range(max_retries):
        try:
            tts = gTTS(text=text, lang=tts_lang)
            tts.save(str(file_path))
            return str(file_path)
        except Exception as e:
            print(f"TTS attempt {attempt + 1}/{max_retries} failed: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait 1 second before retry

    print("TTS failed after all retries — returning without audio")
    return None
