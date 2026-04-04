"""
Detection Service — anomaly detection engine.
Groups reports by village within a time window, computes risk levels,
and triggers alert generation.
"""
from datetime import datetime, timedelta, timezone
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import Report
from app.config import DETECTION_WINDOW_HOURS, RISK_THRESHOLDS
from app.services.report_service import normalize_symptoms


def compute_risk_level(report_count: int) -> str:
    """Determine risk level based on report count in the detection window."""
    if report_count >= RISK_THRESHOLDS["HIGH"]:
        return "HIGH"
    elif report_count >= RISK_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    else:
        return "LOW"


def get_village_reports_in_window(db: Session, village: str) -> list[Report]:
    """Get all reports for a village in the detection window."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=DETECTION_WINDOW_HOURS)
    return (
        db.query(Report)
        .filter(
            and_(
                Report.village == village,
                Report.timestamp >= cutoff,
            )
        )
        .all()
    )


def get_dominant_symptoms(reports: list[Report], top_n: int = 3) -> list[str]:
    """Find the most common symptoms across a set of reports."""
    symptom_counter = Counter()
    for report in reports:
        for s in normalize_symptoms(report.symptoms):
            symptom_counter[s] += 1
    return [s for s, _ in symptom_counter.most_common(top_n)]


def analyze_village(db: Session, village: str) -> dict:
    """
    Core detection logic for a single village:
      1. Pull all reports in the 24h window
      2. Count them
      3. Compute risk level
      4. Extract dominant symptoms
      5. Sum total affected people
    """
    reports = get_village_reports_in_window(db, village)
    count = len(reports)
    risk_level = compute_risk_level(count)
    dominant_symptoms = get_dominant_symptoms(reports)
    total_affected = sum(r.num_affected for r in reports)

    return {
        "village": village,
        "report_count": count,
        "risk_level": risk_level,
        "dominant_symptoms": dominant_symptoms,
        "total_affected": total_affected,
    }


def get_all_village_analyses(db: Session) -> list[dict]:
    """
    Analyze ALL villages that have reports in the current detection window.
    Returns a list of analysis dicts sorted by risk (HIGH first).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=DETECTION_WINDOW_HOURS)

    # Get distinct villages with recent reports
    villages = (
        db.query(Report.village)
        .filter(
            Report.timestamp >= cutoff,
        )
        .distinct()
        .all()
    )

    analyses = []
    for (village,) in villages:
        analysis = analyze_village(db, village)
        analyses.append(analysis)

    # Sort: HIGH > MEDIUM > LOW, then by report count desc
    risk_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    analyses.sort(key=lambda a: (risk_order.get(a["risk_level"], 3), -a["report_count"]))

    return analyses
