"""
News API Router — Agriculture News for Sahyogi.

Prefix: /api/v1/news
⚠️  ROUTE ORDER MATTERS — specific paths must be registered BEFORE /{phone}
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.core.news_engine import (
    load_news,
    force_refresh_news,
    filter_news,
    search_news,
    paginate_news,
    get_article_by_id,
    get_farmer_news,
    summarize_article,
    read_article_aloud,
    submit_report,
    get_community_reports,
    bookmark_article,
    get_bookmarks,
)
from app.models.api_response import success_response, error_response

router = APIRouter()


# ─── Request Models ────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    phone: str
    title: str
    description: str
    category: str
    language: str = "en"


class BookmarkRequest(BaseModel):
    phone: str
    article_id: str


# ─── GET / — News Feed ─────────────────────────────────────────────────────────

@router.get("/")
def get_news(
    category: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 10,
):
    """
    Fetch paginated news feed.
    If 'search' is provided, searches first then applies category/region filter.
    """
    per_page = min(per_page, 50)

    if search:
        articles = search_news(search)
        # Apply additional filters on search results
        if category and category != "all":
            articles = [a for a in articles if a.get("category") == category]
        if region and region.lower() != "all":
            region_lower = region.lower()
            articles = [
                a for a in articles
                if a.get("region", "all").lower() == "all"
                or region_lower in a.get("region", "").lower()
            ]
    else:
        articles = filter_news(category, region)

    paginated = paginate_news(articles, page, per_page)
    return success_response(paginated, message=f"Found {paginated['total']} articles")


# ─── POST /refresh ─────────────────────────────────────────────────────────────

@router.post("/refresh")
def refresh_news():
    """Force-regenerate fresh news from Gemini AI and reload seed articles."""
    articles = force_refresh_news()
    return success_response(
        {"count": len(articles)},
        message=f"News refreshed successfully — {len(articles)} articles loaded"
    )


# ─── GET /article/{article_id} ─────────────────────────────────────────────────

@router.get("/article/{article_id}")
def get_article(article_id: str):
    """Get a single article by ID."""
    article = get_article_by_id(article_id)
    if not article:
        return error_response("Article not found", error="not_found", status_code=404)
    return success_response(article)


# ─── GET /article/{article_id}/summary ────────────────────────────────────────

@router.get("/article/{article_id}/summary")
def article_summary(article_id: str, language: str = "en"):
    """Get an AI-generated plain-language summary of an article."""
    article = get_article_by_id(article_id)
    if not article:
        return error_response("Article not found", error="not_found", status_code=404)

    summary = summarize_article(article_id, language)
    return success_response({
        "article_id": article_id,
        "language": language,
        "summary": summary,
        "title": article.get("title", ""),
    })


# ─── GET /article/{article_id}/audio ──────────────────────────────────────────

@router.get("/article/{article_id}/audio")
def article_audio(article_id: str, language: str = "en"):
    """Generate TTS audio for an article. Returns audio URL."""
    article = get_article_by_id(article_id)
    if not article:
        return error_response("Article not found", error="not_found", status_code=404)

    file_path = read_article_aloud(article_id, language)
    if not file_path:
        return error_response(
            "Audio generation failed. Please try again.",
            error="tts_failed",
            status_code=500
        )

    # Convert "audio/filename.mp3" → "/api/v1/audio/filename.mp3"
    filename = file_path.replace("\\", "/").split("/")[-1]
    audio_url = f"/api/v1/audio/{filename}"

    return success_response({
        "audio_url": audio_url,
        "article_id": article_id,
        "language": language,
    })


# ─── GET /reports/community ────────────────────────────────────────────────────

@router.get("/reports/community")
def community_reports(region: Optional[str] = None):
    """Fetch community-submitted agriculture reports."""
    reports = get_community_reports(region)
    return success_response(reports, message=f"{len(reports)} report(s) found")


# ─── POST /bookmarks ───────────────────────────────────────────────────────────

@router.post("/bookmarks")
def toggle_bookmark(data: BookmarkRequest):
    """Toggle bookmark for a phone/article pair."""
    result = bookmark_article(data.phone, data.article_id)
    msg = "Bookmarked" if result["bookmarked"] else "Removed from bookmarks"
    return success_response(result, message=msg)


# ─── GET /bookmarks/{phone} ────────────────────────────────────────────────────

@router.get("/bookmarks/{phone}")
def get_farmer_bookmarks(phone: str):
    """Get all bookmarked articles for a farmer."""
    articles = get_bookmarks(phone)
    return success_response(articles, message=f"{len(articles)} bookmarked article(s)")


# ─── POST /report ──────────────────────────────────────────────────────────────

@router.post("/report")
def submit_news_report(data: ReportRequest):
    """Submit a community field report."""
    if not data.phone or not data.title or not data.description:
        return error_response("Phone, title, and description are required", error="missing_fields", status_code=400)

    result = submit_report(data.phone, data.title, data.description, data.category)
    return success_response(result, message="Report submitted successfully")


# ─── GET /{phone} — Personalized News (MUST BE LAST) ──────────────────────────

@router.get("/{phone}")
def farmer_news(phone: str, language: str = "en"):
    """Get personalized news feed for a farmer based on their region."""
    from app.services.supabase_service import get_farmer_by_phone
    farmer = get_farmer_by_phone(phone)

    if not farmer:
        # Fall back to all news if farmer not found
        articles = load_news()
    else:
        articles = get_farmer_news(farmer)

    paginated = paginate_news(articles, page=1, per_page=20)
    return success_response(paginated, message=f"Personalized feed: {paginated['total']} articles")
