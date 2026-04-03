"""
Seed script — populate the database with sample reports to demonstrate
the anomaly detection and alert system.

Usage:  python seed.py
"""
import sys
import os

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta, timezone
from app.database import SessionLocal, engine, Base
from app.models import Report, Alert
from app.services.alert_service import upsert_alert

# Recreate tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🌱 Seeding database...\n")

# ── Sample Reports ────────────────────────────────────────────
now = datetime.now(timezone.utc)

seed_data = [
    # Rampur — 6 reports → should trigger HIGH alert
    {"village": "Rampur", "symptoms": "diarrhea, fever", "num_affected": 3, "hours_ago": 1},
    {"village": "Rampur", "symptoms": "diarrhea, vomiting", "num_affected": 5, "hours_ago": 3},
    {"village": "Rampur", "symptoms": "fever, stomach pain", "num_affected": 2, "hours_ago": 5},
    {"village": "Rampur", "symptoms": "diarrhea, dehydration", "num_affected": 4, "hours_ago": 8},
    {"village": "Rampur", "symptoms": "vomiting, nausea", "num_affected": 2, "hours_ago": 10},
    {"village": "Rampur", "symptoms": "diarrhea, fever, vomiting", "num_affected": 6, "hours_ago": 12},

    # Sundarpur — 4 reports → should trigger HIGH alert
    {"village": "Sundarpur", "symptoms": "fever, diarrhea", "num_affected": 2, "hours_ago": 2},
    {"village": "Sundarpur", "symptoms": "vomiting, stomach pain", "num_affected": 3, "hours_ago": 4},
    {"village": "Sundarpur", "symptoms": "diarrhea, nausea", "num_affected": 1, "hours_ago": 7},
    {"village": "Sundarpur", "symptoms": "fever, dehydration", "num_affected": 4, "hours_ago": 9},
    {"village": "Sundarpur", "symptoms": "diarrhea, fever, vomiting", "num_affected": 2, "hours_ago": 14},

    # Khairpur — 3 reports → should trigger MEDIUM alert
    {"village": "Khairpur", "symptoms": "diarrhea, fever", "num_affected": 1, "hours_ago": 3},
    {"village": "Khairpur", "symptoms": "vomiting, nausea", "num_affected": 2, "hours_ago": 6},
    {"village": "Khairpur", "symptoms": "stomach pain, fever", "num_affected": 1, "hours_ago": 15},

    # Lakshmipur — 2 reports → LOW risk (no alert)
    {"village": "Lakshmipur", "symptoms": "fever", "num_affected": 1, "hours_ago": 5},
    {"village": "Lakshmipur", "symptoms": "nausea", "num_affected": 1, "hours_ago": 18},

    # Govindpur — 1 report → LOW risk
    {"village": "Govindpur", "symptoms": "diarrhea", "num_affected": 1, "hours_ago": 4},
]

for entry in seed_data:
    report = Report(
        village=entry["village"],
        symptoms=entry["symptoms"],
        num_affected=entry["num_affected"],
        timestamp=now - timedelta(hours=entry["hours_ago"]),
        is_duplicate=False,
    )
    db.add(report)

db.commit()
print(f"✅ Inserted {len(seed_data)} reports\n")

# ── Trigger alert engine for each village ─────────────────────
villages = list(set(e["village"] for e in seed_data))
for village in villages:
    alert = upsert_alert(db, village)
    if alert:
        icon = "🔴" if alert.risk_level == "HIGH" else "🟡"
        print(f"  {icon} Alert: {village} → {alert.risk_level} ({alert.cases_count} cases)")
    else:
        print(f"  🟢 No alert: {village} → LOW risk")

db.close()
print("\n🎉 Seeding complete!")
