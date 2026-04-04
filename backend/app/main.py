from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import Report, Alert, SystemMeta
from app.seed_data import seed_demo_data
from app.routes import auth, reports, alerts, dashboard, system, public


# ── Lifespan: create tables + auto-seed on first run ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (non-destructive)
    Base.metadata.create_all(bind=engine)

    # Auto-seed demo data on first run (only if DB is empty & never seeded)
    db = SessionLocal()
    try:
        inserted = seed_demo_data(db)
        if inserted:
            print("🌱 Demo data loaded automatically (first run)")
    finally:
        db.close()

    yield  # App runs here


app = FastAPI(
    title="Rural Health Early Warning System",
    description="Detect water-borne disease outbreaks in rural communities",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(public.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Rural Health Early Warning System",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "submit_report": "POST /api/report",
            "login": "POST /api/login",
            "alerts": "GET /api/alerts",
            "dashboard": "GET /api/dashboard",
            "reset": "POST /api/reset",
        },
    }
