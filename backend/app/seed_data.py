"""
Shared seed logic — inserts static demo data into the database.
Called by main.py on first startup and by seed.py for manual re-seeding.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Report, Alert, SystemMeta
from app.services.alert_service import upsert_alert


# ── Static Demo Reports ──────────────────────────────────────────
# 16 realistic reports across 4 villages, timestamps spread over last 24h.
# Distribution:
#   Duvvada    → 6 reports → HIGH risk
#   Gantyada   → 5 reports → HIGH risk
#   Gangavaram → 3 reports → MEDIUM risk
#   Lakshmipur → 2 reports → LOW risk

DEMO_REPORTS = [
    # Duvvada — 6 reports → HIGH risk
    {"village": "Duvvada",    "symptoms": "diarrhea, fever",              "num_affected": 4, "hours_ago": 1},
    {"village": "Duvvada",    "symptoms": "diarrhea, vomiting",           "num_affected": 6, "hours_ago": 2},
    {"village": "Duvvada",    "symptoms": "fever, dehydration",           "num_affected": 3, "hours_ago": 4},
    {"village": "Duvvada",    "symptoms": "diarrhea, stomach pain",       "num_affected": 5, "hours_ago": 6},
    {"village": "Duvvada",    "symptoms": "vomiting, nausea",             "num_affected": 2, "hours_ago": 9},
    {"village": "Duvvada",    "symptoms": "diarrhea, fever, vomiting",    "num_affected": 7, "hours_ago": 12},

    # Gantyada — 5 reports → HIGH risk
    {"village": "Gantyada",   "symptoms": "fever, diarrhea",              "num_affected": 3, "hours_ago": 1.5},
    {"village": "Gantyada",   "symptoms": "vomiting, stomach pain",       "num_affected": 4, "hours_ago": 3},
    {"village": "Gantyada",   "symptoms": "diarrhea, nausea",             "num_affected": 2, "hours_ago": 5},
    {"village": "Gantyada",   "symptoms": "fever, dehydration",           "num_affected": 5, "hours_ago": 8},
    {"village": "Gantyada",   "symptoms": "diarrhea, fever, vomiting",    "num_affected": 3, "hours_ago": 11},

    # Gangavaram — 3 reports → MEDIUM risk
    {"village": "Gangavaram", "symptoms": "diarrhea, fever",              "num_affected": 2, "hours_ago": 2},
    {"village": "Gangavaram", "symptoms": "vomiting, nausea",             "num_affected": 3, "hours_ago": 5},
    {"village": "Gangavaram", "symptoms": "stomach pain, fever",          "num_affected": 1, "hours_ago": 10},

    # Lakshmipur — 2 reports → LOW risk
    {"village": "Lakshmipur", "symptoms": "fever, headache",              "num_affected": 1, "hours_ago": 3},
    {"village": "Lakshmipur", "symptoms": "nausea, body ache",            "num_affected": 1, "hours_ago": 7},
]


def is_demo_data_active(db: Session) -> bool:
    """Check if demo data is currently loaded."""
    meta = db.query(SystemMeta).filter(SystemMeta.key == "seed_status").first()
    return meta is not None and meta.value == "active"


def should_seed(db: Session) -> bool:
    """
    Returns True only if:
      1. No seed_status marker exists (truly first run)
      2. The reports table is empty
    """
    meta = db.query(SystemMeta).filter(SystemMeta.key == "seed_status").first()
    if meta is not None:
        return False  # Already seeded (or cleared) — don't seed again
    report_count = db.query(Report).count()
    return report_count == 0


def seed_demo_data(db: Session, force: bool = False) -> bool:
    """
    Insert static demo data into the database.
    Returns True if data was inserted, False if skipped.

    Args:
        db: SQLAlchemy session
        force: If True, clear existing data and re-seed regardless of markers
    """
    if force:
        db.query(Report).delete()
        db.query(Alert).delete()
        db.query(SystemMeta).filter(SystemMeta.key == "seed_status").delete()
        db.commit()
    elif not should_seed(db):
        return False

    now = datetime.now(timezone.utc)

    # Insert reports
    for entry in DEMO_REPORTS:
        report = Report(
            village=entry["village"],
            symptoms=entry["symptoms"],
            num_affected=entry["num_affected"],
            timestamp=now - timedelta(hours=entry["hours_ago"]),
            is_duplicate=False,
        )
        db.add(report)

    db.commit()

    # Trigger alert engine for each village
    villages = list(set(e["village"] for e in DEMO_REPORTS))
    for village in villages:
        upsert_alert(db, village)

    # Manually create a LOW alert for demo completeness.
    # upsert_alert() deactivates LOW-risk alerts by design, but for demo
    # purposes we want all 3 risk levels (LOW / MEDIUM / HIGH) visible.
    from app.models import Alert as AlertModel
    low_village = "Lakshmipur"
    existing_low = (
        db.query(AlertModel)
        .filter(AlertModel.village == low_village, AlertModel.is_active == True)
        .first()
    )
    if not existing_low:
        low_alert = AlertModel(
            village=low_village,
            risk_level="LOW",
            cases_count=2,
            symptoms="fever, headache, nausea, body ache",
            is_active=True,
        )
        db.add(low_alert)
        db.commit()

    # Mark seed as active
    meta = db.query(SystemMeta).filter(SystemMeta.key == "seed_status").first()
    if meta:
        meta.value = "active"
    else:
        db.add(SystemMeta(key="seed_status", value="active"))
    db.commit()

    return True
