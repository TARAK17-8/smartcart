from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin
from app.schemas import DashboardResponse, AlertResponse, ReportResponse, VillageBreakdown
from app.services.report_service import get_total_reports, get_reports_today, get_recent_reports
from app.services.alert_service import get_active_alerts, get_active_alerts_count, get_high_risk_count
from app.services.detection_service import get_all_village_analyses

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin-only — aggregated dashboard data."""
    # Stats
    total = get_total_reports(db)
    today = get_reports_today(db)
    active_count = get_active_alerts_count(db)
    high_risk = get_high_risk_count(db)

    # Alerts
    alerts = get_active_alerts(db)
    alert_responses = [AlertResponse.model_validate(a) for a in alerts]

    # Village breakdown from detection engine
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

    # Recent reports
    recent = get_recent_reports(db)
    recent_responses = [ReportResponse.model_validate(r) for r in recent]

    return DashboardResponse(
        total_reports=total,
        reports_today=today,
        active_alerts=active_count,
        high_risk_villages=high_risk,
        alerts=alert_responses,
        village_breakdown=village_breakdown,
        recent_reports=recent_responses,
    )
