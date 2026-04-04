"""
Report Service — ingestion, normalization, and deduplication.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models import Report
from app.schemas import ReportCreate
from app.config import DUPLICATE_WINDOW_MINUTES


def normalize_village(name: str) -> str:
    """Normalize village name for consistent matching."""
    return name.strip().lower().title()


def normalize_symptoms(symptoms: str) -> list[str]:
    """Parse and normalize symptom string into sorted list."""
    parts = [s.strip().lower() for s in symptoms.split(",") if s.strip()]
    return sorted(set(parts))


def check_duplicate(db: Session, village: str, symptoms_list: list[str]) -> bool:
    """
    Check if a very similar report was submitted recently.
    A duplicate = same village + overlapping symptoms within DUPLICATE_WINDOW_MINUTES.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=DUPLICATE_WINDOW_MINUTES)

    recent_reports = (
        db.query(Report)
        .filter(
            and_(
                Report.village == village,
                Report.timestamp >= cutoff,
                Report.is_duplicate == False,
            )
        )
        .all()
    )

    for report in recent_reports:
        existing_symptoms = set(normalize_symptoms(report.symptoms))
        new_symptoms = set(symptoms_list)
        # If 50%+ overlap, consider duplicate
        if len(existing_symptoms & new_symptoms) >= max(1, len(new_symptoms) * 0.5):
            return True

    return False


def create_report(db: Session, data: ReportCreate) -> Report:
    """
    Ingest a new health report:
      1. Normalize village name and symptoms
      2. Store in DB (every report is treated as a valid new entry)
    """
    village = normalize_village(data.village)
    symptoms_list = normalize_symptoms(data.symptoms)
    symptoms_str = ", ".join(symptoms_list)

    report = Report(
        village=village,
        symptoms=symptoms_str,
        num_affected=data.num_affected or 1,
        is_duplicate=False,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_recent_reports(db: Session, limit: int = 20) -> list[Report]:
    """Get most recent reports."""
    return (
        db.query(Report)
        .order_by(Report.timestamp.desc())
        .limit(limit)
        .all()
    )


def get_total_reports(db: Session) -> int:
    return db.query(func.count(Report.id)).scalar()


def get_reports_today(db: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    return (
        db.query(func.count(Report.id))
        .filter(Report.timestamp >= cutoff)
        .scalar()
    )
