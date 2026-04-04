from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ReportCreate, ReportSubmitResponse, AlertResponse
from app.services.report_service import create_report
from app.services.alert_service import upsert_alert

router = APIRouter(tags=["Reports"])


@router.post("/report", response_model=ReportSubmitResponse)
def submit_report(data: ReportCreate, db: Session = Depends(get_db)):
    """
    Public endpoint — submit a health report.
    Accepts any village name. Normalization handled by report_service.
    """
    # 1. Ingest report (with normalization)
    report = create_report(db, data)

    # 2. Run detection + alert engine for this village
    alert = None
    alert_obj = upsert_alert(db, report.village)
    if alert_obj:
        alert = AlertResponse.model_validate(alert_obj)

    return ReportSubmitResponse(
        message="Report submitted successfully. Thank you for helping your community!",
        report_id=report.id,
        is_duplicate=report.is_duplicate,
        alert_triggered=alert,
    )
