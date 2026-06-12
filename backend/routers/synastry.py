from fastapi import APIRouter, HTTPException
from pathlib import Path
import tempfile
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models import SynastryRequest

router = APIRouter()


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


@router.post("/synastry")
def synastry(req: SynastryRequest):
    from kerykeion import AspectsFactory, RelationshipScoreFactory, ChartDataFactory
    from kerykeion.charts.chart_drawer import ChartDrawer

    try:
        p1 = _make_subject(req.person1)
        p2 = _make_subject(req.person2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid birth data: {e}")

    dual = AspectsFactory.dual_chart_aspects(p1, p2)
    aspects = [
        {
            "p1_name": a.p1_name,
            "p2_name": a.p2_name,
            "p1_owner": a.p1_owner,
            "p2_owner": a.p2_owner,
            "aspect": a.aspect,
            "orbit": round(a.orbit, 2),
            "aspect_movement": str(a.aspect_movement),
        }
        for a in dual.aspects
    ]

    score = RelationshipScoreFactory(p1, p2).get_relationship_score()

    chart_data = ChartDataFactory.create_synastry_chart_data(p1, p2)
    with tempfile.TemporaryDirectory() as tmpdir:
        drawer = ChartDrawer(chart_data=chart_data, theme="dark", chart_language="EN")
        drawer.save_svg(output_path=Path(tmpdir), filename="synastry")
        svg_content = (Path(tmpdir) / "synastry.svg").read_text()

    return {
        "score_value": score.score_value,
        "score_description": str(score.score_description),
        "is_destiny_sign": score.is_destiny_sign,
        "aspects": aspects,
        "svg_chart": svg_content,
    }
