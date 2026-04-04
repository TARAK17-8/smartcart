"""
Seed script — populate the database with demo data.
Can be run standalone to force re-seed the database.

Usage:  python seed.py          # Seed only if empty
        python seed.py --force  # Clear and re-seed
"""
import sys
import os

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Report, Alert, SystemMeta
from app.seed_data import seed_demo_data, DEMO_REPORTS

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

force = "--force" in sys.argv

print("🌱 Seeding database...\n")

inserted = seed_demo_data(db, force=force)

if inserted:
    print(f"✅ Inserted {len(DEMO_REPORTS)} demo reports\n")

    # Print alert summary
    alerts = db.query(Alert).filter(Alert.is_active == True).all()
    for alert in alerts:
        icon = "🔴" if alert.risk_level == "HIGH" else "🟡"
        print(f"  {icon} Alert: {alert.village} → {alert.risk_level} ({alert.cases_count} cases)")

    print("\n🎉 Seeding complete!")
else:
    print("ℹ️  Database already has data or was previously seeded. Skipping.")
    print("   Use --force to clear and re-seed: python seed.py --force")

db.close()
