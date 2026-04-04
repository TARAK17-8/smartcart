"""
Public endpoints — accessible without authentication.
Provides the same dashboard data as the admin endpoint,
but intended for community/user-facing views.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DashboardResponse, AlertResponse, ReportResponse, VillageBreakdown
from app.services.report_service import get_total_reports, get_reports_today, get_recent_reports
from app.services.alert_service import get_active_alerts, get_active_alerts_count, get_high_risk_count
from app.services.detection_service import get_all_village_analyses
from app.services.actions import get_recommendations
from app.seed_data import is_demo_data_active

router = APIRouter(tags=["Public"])


@router.get("/public-dashboard", response_model=DashboardResponse)
def get_public_dashboard(db: Session = Depends(get_db)):
    """Public — aggregated dashboard data for community users (no auth required)."""
    total = get_total_reports(db)
    today = get_reports_today(db)
    active_count = get_active_alerts_count(db)
    high_risk = get_high_risk_count(db)

    alerts = get_active_alerts(db)
    alert_responses = []
    for a in alerts:
        resp = AlertResponse.model_validate(a)
        resp.recommended_actions = get_recommendations(resp.risk_level)
        alert_responses.append(resp)

    analyses = get_all_village_analyses(db)
    village_breakdown = [
        VillageBreakdown(
            village=a["village"],
            report_count=a["report_count"],
            risk_level=a["risk_level"],
            top_symptoms=a["dominant_symptoms"],
            total_affected=a["total_affected"],
        )
        for a in analyses
    ]

    recent = get_recent_reports(db)
    recent_responses = [ReportResponse.model_validate(r) for r in recent]

    demo_active = is_demo_data_active(db)

    return DashboardResponse(
        total_reports=total,
        reports_today=today,
        active_alerts=active_count,
        high_risk_villages=high_risk,
        demo_data_loaded=demo_active,
        alerts=alert_responses,
        village_breakdown=village_breakdown,
        recent_reports=recent_responses,
    )
