from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.auth import get_current_admin
from app.models import SystemMeta

router = APIRouter(tags=["System"])


@router.post("/reset")
def reset_system(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin-only — clear all reports and alerts.
    Resets the system to a clean state.
    Sets seed_status to 'cleared' so demo data does not re-appear on restart.
    """
    # 1. Clear all reports and alerts using explicit raw SQL
    db.execute(text("DELETE FROM alerts"))
    db.execute(text("DELETE FROM reports"))

    # 2. Mark seed as cleared — prevents auto-seeding on next restart
    db.execute(
        text(
            "INSERT OR REPLACE INTO system_meta (key, value) VALUES ('seed_status', 'cleared')"
        )
    )

    # 3. Commit all deletions and updates in one transaction
    db.commit()

    # 4. Fully clear ORM session cache so no stale data is returned
    db.expire_all()
    db.expunge_all()

    return {
        "message": "System cleared successfully",
    }
