from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models import TransitRequest, UpcomingTransitsRequest

router = APIRouter()

ASPECT_COLORS = {
    "conjunction": "#f59e0b",
    "opposition": "#ef4444",
    "square": "#f97316",
    "trine": "#8b5cf6",
    "sextile": "#10b981",
    "quincunx": "#6366f1",
    "semi-sextile": "#14b8a6",
    "semi-square": "#fb7185",
    "sesquiquadrate": "#fb923c",
    "quintile": "#a78bfa",
    "biquintile": "#c084fc",
}


def _make_subject(data):
    from kerykeion import AstrologicalSubjectFactory
    return AstrologicalSubjectFactory.from_birth_data(
        name=data.name,
        year=data.year, month=data.month, day=data.day,
        hour=data.hour, minute=data.minute,
        lng=data.lng, lat=data.lat,
        tz_str=data.tz_str,
        online=False,
    )


def _format_aspect(a):
    return {
        "p1_name": a.p1_name,
        "p2_name": a.p2_name,
        "aspect": a.aspect,
        "orbit": round(a.orbit, 2),
        "aspect_movement": str(a.aspect_movement),
        "color": ASPECT_COLORS.get(str(a.aspect).lower(), "#94a3b8"),
    }


@router.post("/transits")
def current_transits(req: TransitRequest):
    from kerykeion import AstrologicalSubjectFactory, AspectsFactory, ChartDataFactory
    from kerykeion.charts.chart_drawer import ChartDrawer
    from pathlib import Path
    import tempfile

    try:
        natal = _make_subject(req.person)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid birth data: {e}")

    now = datetime.now(timezone.utc)
    transit_subject = AstrologicalSubjectFactory.from_birth_data(
        "Now",
        year=now.year, month=now.month, day=now.day,
        hour=now.hour, minute=now.minute,
        lng=req.observer_lng, lat=req.observer_lat,
        tz_str="UTC", online=False,
    )

    dual = AspectsFactory.dual_chart_aspects(natal, transit_subject)
    aspects = [_format_aspect(a) for a in dual.aspects]

    chart_data = ChartDataFactory.create_transit_chart_data(natal, transit_subject)
    with tempfile.TemporaryDirectory() as tmpdir:
        drawer = ChartDrawer(chart_data=chart_data, theme="dark", chart_language="EN")
        drawer.save_svg(output_path=Path(tmpdir), filename="transit")
        svg_content = (Path(tmpdir) / "transit.svg").read_text()

    return {
        "aspects": aspects,
        "svg_chart": svg_content,
        "as_of": now.isoformat(),
    }


@router.post("/transits/upcoming")
def upcoming_transits(req: UpcomingTransitsRequest):
    from kerykeion import AstrologicalSubjectFactory, AspectsFactory

    if req.days < 1 or req.days > 90:
        raise HTTPException(status_code=400, detail="days must be between 1 and 90")

    try:
        natal = _make_subject(req.person)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid birth data: {e}")

    now = datetime.now(timezone.utc)
    upcoming = []

    for i in range(req.days):
        day = now + timedelta(days=i)
        transit_subject = AstrologicalSubjectFactory.from_birth_data(
            f"Transit-{i}",
            year=day.year, month=day.month, day=day.day,
            hour=12, minute=0,
            lng=req.observer_lng, lat=req.observer_lat,
            tz_str="UTC", online=False,
        )
        dual = AspectsFactory.dual_chart_aspects(natal, transit_subject)
        # Only include exact/close aspects (orbit < 2 degrees)
        close_aspects = [a for a in dual.aspects if abs(a.orbit) < 2.0]
        if close_aspects:
            upcoming.append({
                "date": day.date().isoformat(),
                "aspects": [_format_aspect(a) for a in close_aspects],
            })

    return {"upcoming": upcoming, "days_checked": req.days}
