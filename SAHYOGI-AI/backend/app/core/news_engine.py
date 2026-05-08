"""
News Engine — Agriculture News for Sahyogi Farmers.

Features:
- Loads seed articles from data/news/agriculture_news.json
- Generates fresh AI articles using Gemini 2.0 Flash
- 30-minute in-memory cache
- Filter, search, paginate, bookmark
- Supabase-backed community reports with in-memory fallback
- TTS read-aloud via existing gTTS module
"""

import json
import os
import time
import math
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from google import genai

logger = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
_gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

BASE_DIR = Path(__file__).resolve().parents[3]
NEWS_FILE = BASE_DIR / "data" / "news" / "agriculture_news.json"

VALID_CATEGORIES = {"msp", "weather", "scheme", "market", "alert"}

# ─── In-Memory State ─────────────────────────────────────────────────────────

_cache: list[dict] = []
_cache_time: float = 0.0
_CACHE_TTL = 30 * 60  # 30 minutes in seconds

# Bookmarks: phone → set of article_ids
_bookmarks: dict[str, set[str]] = {}

# Community reports fallback (used when Supabase fails)
_community_reports_fallback: list[dict] = []


# ─── Core: Load & Cache ───────────────────────────────────────────────────────

def load_news() -> list[dict]:
    """Load news articles from seed file + AI-generated ones. Uses 30-min cache."""
    global _cache, _cache_time

    now = time.time()
    if _cache and (now - _cache_time) < _CACHE_TTL:
        return _cache

    seed = _load_seed_news()
    fresh = _generate_fresh_news()

    combined = fresh + seed  # Fresh articles appear first
    _cache = combined
    _cache_time = now
    return combined


def _load_seed_news() -> list[dict]:
    """Read seed JSON and spread dates across last 7 days relative to today."""
    if not NEWS_FILE.exists():
        logger.warning("Seed news file not found: %s", NEWS_FILE)
        return []

    try:
        with open(NEWS_FILE, "r", encoding="utf-8") as f:
            articles: list[dict] = json.load(f)
    except Exception as exc:
        logger.error("Failed to load seed news: %s", exc)
        return []

    today = datetime.now().date()
    count = len(articles)
    for i, article in enumerate(articles):
        # Spread across 0-6 days ago
        days_ago = i % 7
        article["published_date"] = str(today - timedelta(days=days_ago))

    return articles


def _generate_fresh_news() -> list[dict]:
    """Use Gemini 2.0 Flash to generate 5 fresh agriculture news articles."""
    if not _gemini_client:
        logger.warning("Gemini API key not set — skipping AI news generation")
        return []

    today_str = datetime.now().strftime("%Y-%m-%d")
    prompt = f"""Generate exactly 5 fresh Indian agriculture news articles as a valid JSON array.
Each article must have these exact fields:
- id: string starting with "ai_" followed by a unique number (e.g. "ai_001")
- title: string — a realistic, specific news headline about Indian agriculture
- summary: string — 2-3 sentences with specific details (include realistic ₹ prices, Indian city names, Indian crop names, government scheme names)
- category: one of exactly: msp, weather, scheme, market, alert
- region: an Indian state name OR "all" for national news
- source: a realistic Indian agriculture news source (e.g. "NABARD", "IMD Pune", "Punjab Mandi Board", "Ministry of Agriculture", "ICAR-CRRI")
- published_date: "{today_str}"
- image_url: null

Include realistic details:
- Specific mandi prices in ₹ per quintal (e.g. Ludhiana, Indore, Nashik, Sambalpur, Bargarh mandis)
- Actual Indian crops: wheat, paddy, cotton, maize, mustard, tur, moong, groundnut, soybean, chilli, onion
- Government scheme names: PM-KISAN, PMFBY, KCC, eNAM, PKVY, Soil Health Card, PM Kisan MAN-DHAN
- Indian states: Punjab, Haryana, UP, MP, Maharashtra, Odisha, Karnataka, AP, Rajasthan, Bihar
- Cover all 5 categories across the 5 articles (one of each: msp, weather, scheme, market, alert)

Return ONLY the raw JSON array. No markdown, no code blocks, no explanation."""

    try:
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        raw = response.text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        articles = json.loads(raw)
        if not isinstance(articles, list):
            return []

        # Validate and sanitize
        validated = []
        for art in articles:
            if not isinstance(art, dict):
                continue
            cat = art.get("category", "")
            if cat not in VALID_CATEGORIES:
                art["category"] = "market"
            if not art.get("id", "").startswith("ai_"):
                art["id"] = f"ai_{len(validated)+1:03d}"
            art["image_url"] = None
            art["published_date"] = art.get("published_date", today_str)
            validated.append(art)

        return validated

    except Exception as exc:
        logger.error("AI news generation failed: %s", exc)
        return []


def force_refresh_news() -> list[dict]:
    """Invalidate cache and reload news."""
    global _cache_time
    _cache_time = 0.0
    return load_news()


# ─── Filtering & Search ───────────────────────────────────────────────────────

def filter_news(category: Optional[str] = None, region: Optional[str] = None) -> list[dict]:
    """Filter articles by category and/or region. Always includes region='all' articles."""
    articles = load_news()

    if category and category != "all":
        articles = [a for a in articles if a.get("category") == category]

    if region and region.lower() != "all":
        region_lower = region.lower()
        articles = [
            a for a in articles
            if a.get("region", "all").lower() == "all"
            or region_lower in a.get("region", "").lower()
        ]

    return articles


def search_news(query: str) -> list[dict]:
    """Full-text search across title, summary, category, source fields."""
    articles = load_news()
    q = query.lower().strip()
    if not q:
        return articles

    results = []
    for art in articles:
        haystack = " ".join([
            art.get("title", ""),
            art.get("summary", ""),
            art.get("category", ""),
            art.get("source", ""),
            art.get("region", ""),
        ]).lower()
        if q in haystack:
            results.append(art)

    return results


def paginate_news(articles: list[dict], page: int = 1, per_page: int = 10) -> dict:
    """Return paginated slice of articles with metadata."""
    per_page = min(per_page, 50)
    page = max(page, 1)
    total = len(articles)
    total_pages = max(math.ceil(total / per_page), 1)
    page = min(page, total_pages)

    start = (page - 1) * per_page
    end = start + per_page
    return {
        "articles": articles[start:end],
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
    }


def get_article_by_id(article_id: str) -> Optional[dict]:
    """Return one article dict or None."""
    for art in load_news():
        if art.get("id") == article_id:
            return art
    return None


def get_farmer_news(farmer_dict: dict) -> list[dict]:
    """Return news filtered by farmer's region/state."""
    region = (
        farmer_dict.get("region")
        or farmer_dict.get("state")
        or farmer_dict.get("location")
        or "all"
    )
    return filter_news(region=region)


# ─── AI Summary & Audio ───────────────────────────────────────────────────────

def summarize_article(article_id: str, language: str = "en") -> str:
    """Generate a 2-3 sentence plain-language summary in the given language."""
    article = get_article_by_id(article_id)
    if not article:
        return "Article not found."

    if not _gemini_client:
        return article.get("summary", "AI summary unavailable — Gemini API key not configured.")

    lang_map = {
        "en": "English",
        "hi": "Hindi (हिन्दी) using Devanagari script",
        "od": "Odia (ଓଡ଼ିଆ) using Odia script",
    }
    lang_name = lang_map.get(language, "English")

    prompt = f"""Summarize this Indian agriculture news article in 2-3 short sentences in {lang_name}.
Use very simple, plain language suitable for a farmer with basic school education.
Avoid complex words. Focus on what the farmer should DO based on this news.
Do NOT use any markdown formatting.

Title: {article.get('title', '')}
Summary: {article.get('summary', '')}
Category: {article.get('category', '')}
Region: {article.get('region', '')}
Source: {article.get('source', '')}"""

    try:
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as exc:
        logger.error("Article summarize failed: %s", exc)
        return article.get("summary", "Summary unavailable.")


def read_article_aloud(article_id: str, language: str = "en") -> Optional[str]:
    """Generate TTS audio for an article. Returns file path or None."""
    article = get_article_by_id(article_id)
    if not article:
        return None

    # Map "od" → "or" which is what gTTS module expects
    tts_lang = "or" if language == "od" else language

    text = ". ".join(filter(None, [
        article.get("title", ""),
        article.get("summary", ""),
        f"Source: {article.get('source', '')}",
        f"Region: {article.get('region', '')}",
    ]))

    try:
        from app.ai.tts import generate_audio
        return generate_audio(text, tts_lang)
    except Exception as exc:
        logger.error("TTS generation failed: %s", exc)
        return None


# ─── Community Reports ────────────────────────────────────────────────────────

def submit_report(phone: str, title: str, description: str, category: str) -> dict:
    """Save a community report to Supabase, with in-memory fallback."""
    report = {
        "phone": phone,
        "title": title,
        "description": description,
        "category": category,
        "created_at": datetime.now().isoformat(),
        "region": "all",
    }

    try:
        from app.services.supabase_service import supabase
        result = supabase.table("news_reports").insert(report).execute()
        if result.data:
            return result.data[0]
        raise ValueError("Empty response from Supabase")
    except Exception as exc:
        logger.warning("Supabase insert failed, using fallback: %s", exc)
        _community_reports_fallback.append(report)
        return report


def get_community_reports(region: Optional[str] = None) -> list[dict]:
    """Fetch community reports from Supabase with in-memory fallback."""
    try:
        from app.services.supabase_service import supabase
        query = supabase.table("news_reports").select("*").order("created_at", desc=True)
        if region and region.lower() != "all":
            query = query.eq("region", region)
        result = query.limit(50).execute()
        db_reports = result.data or []
        # Merge with in-memory fallback (in case of partial failures)
        return db_reports + _community_reports_fallback
    except Exception:
        return list(reversed(_community_reports_fallback))


# ─── Bookmarks ────────────────────────────────────────────────────────────────

def bookmark_article(phone: str, article_id: str) -> dict:
    """Toggle a bookmark. Returns {bookmarked: bool, article_id: str}."""
    if phone not in _bookmarks:
        _bookmarks[phone] = set()

    if article_id in _bookmarks[phone]:
        _bookmarks[phone].discard(article_id)
        bookmarked = False
    else:
        _bookmarks[phone].add(article_id)
        bookmarked = True

    return {"bookmarked": bookmarked, "article_id": article_id}


def get_bookmarks(phone: str) -> list[dict]:
    """Return list of bookmarked article dicts for a phone number."""
    ids = _bookmarks.get(phone, set())
    all_articles = load_news()
    return [a for a in all_articles if a.get("id") in ids]
