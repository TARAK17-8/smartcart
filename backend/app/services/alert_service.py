"""
Alert Service — generates, updates, and retrieves alerts.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import Alert
from app.services.detection_service import analyze_village


def upsert_alert(db: Session, village: str) -> Alert | None:
    """
    After a new report comes in, analyze the village and
    create or update an alert if risk >= MEDIUM.
    Returns the Alert if triggered, None otherwise.
    """
    analysis = analyze_village(db, village)

    if analysis["risk_level"] == "LOW":
        # Deactivate any existing alert for this village if risk dropped
        existing = (
            db.query(Alert)
            .filter(and_(Alert.village == village, Alert.is_active == True))
            .first()
        )
        if existing:
            existing.is_active = False
            db.commit()
        return None

    # Check if an active alert already exists
    existing = (
        db.query(Alert)
        .filter(and_(Alert.village == village, Alert.is_active == True))
        .first()
    )

    symptoms_str = ", ".join(analysis["dominant_symptoms"])

    if existing:
        # Update existing alert
        existing.risk_level = analysis["risk_level"]
        existing.cases_count = analysis["report_count"]
        existing.symptoms = symptoms_str
        existing.created_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new alert
        alert = Alert(
            village=village,
            risk_level=analysis["risk_level"],
            cases_count=analysis["report_count"],
            symptoms=symptoms_str,
            is_active=True,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert


def get_active_alerts(db: Session) -> list[Alert]:
    """Get all currently active alerts, ordered by risk level."""
    alerts = (
        db.query(Alert)
        .filter(Alert.is_active == True)
        .order_by(Alert.created_at.desc())
        .all()
    )
    # Sort by risk severity
    risk_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda a: risk_order.get(a.risk_level, 3))
    return alerts


def get_active_alerts_count(db: Session) -> int:
    return db.query(Alert).filter(Alert.is_active == True).count()


def get_high_risk_count(db: Session) -> int:
    return (
        db.query(Alert)
        .filter(and_(Alert.is_active == True, Alert.risk_level == "HIGH"))
        .count()
    )
