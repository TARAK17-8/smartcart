from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin
from app.models import Report, Alert

router = APIRouter(tags=["System"])


@router.post("/reset")
def reset_system(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin-only — clear all reports and alerts.
    Resets the system to a clean state.
    """
    deleted_reports = db.query(Report).delete()
    deleted_alerts = db.query(Alert).delete()
    db.commit()

    return {
        "message": "System cleared successfully",
        "deleted_reports": deleted_reports,
        "deleted_alerts": deleted_alerts,
    }
