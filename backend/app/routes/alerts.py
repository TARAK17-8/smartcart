from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin
from app.schemas import AlertResponse
from app.services.alert_service import get_active_alerts
from app.services.actions import get_recommendations

router = APIRouter(tags=["Alerts"])


@router.get("/alerts", response_model=list[AlertResponse])
def list_alerts(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin-only — get all active alerts."""
    alerts = get_active_alerts(db)
    results = []
    for a in alerts:
        resp = AlertResponse.model_validate(a)
        resp.recommended_actions = get_recommendations(resp.risk_level)
        results.append(resp)
    return results

