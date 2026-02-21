from app.services.supabase_service import supabase
from collections import Counter
from datetime import datetime, timedelta
from dateutil import parser


def get_analytics_summary():

    response = supabase.table("calls").select("*").execute()
    calls = response.data if response.data else []

    total_calls = len(calls)

    languages = Counter()
    crops = Counter()
    stages = Counter()
    trends = Counter()
    hourly_distribution = Counter()

    now = datetime.utcnow()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    calls_today = 0
    calls_this_week = 0
    calls_this_month = 0

    for call in calls:
        languages[call.get("language")] += 1
        crops[call.get("crop")] += 1
        stages[call.get("crop_stage")] += 1
        trends[call.get("market_trend")] += 1

        created_at = call.get("created_at")
        if created_at:
            dt = parser.parse(created_at)

            hourly_distribution[dt.hour] += 1

            if dt.date() == today:
                calls_today += 1

            if dt >= week_ago:
                calls_this_week += 1

            if dt >= month_ago:
                calls_this_month += 1

    peak_hour = None
    if hourly_distribution:
        peak_hour = hourly_distribution.most_common(1)[0][0]

    return {
        "total_calls": total_calls,
        "calls_today": calls_today,
        "calls_this_week": calls_this_week,
        "calls_this_month": calls_this_month,
        "peak_call_hour": peak_hour,
        "calls_by_language": dict(languages),
        "calls_by_crop": dict(crops),
        "crop_stage_distribution": dict(stages),
        "market_trend_distribution": dict(trends),
    }
