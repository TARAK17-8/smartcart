from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import Report, Alert
from app.routes import auth, reports, alerts, dashboard, system

# ── Database: drop + recreate on every startup for clean state ──
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Rural Health Early Warning System",
    description="Detect water-borne disease outbreaks in rural communities",
    version="1.0.0",
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
