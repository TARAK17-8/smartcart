from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Request Schemas ──────────────────────────────────────────────

class ReportCreate(BaseModel):
    village: str = Field(..., min_length=1, max_length=255, description="Village name")
    symptoms: str = Field(..., min_length=1, description="Comma-separated symptoms")
    num_affected: Optional[int] = Field(1, ge=1, description="Number of affected people")


class LoginRequest(BaseModel):
    username: str
    password: str


# ── Response Schemas ─────────────────────────────────────────────

class ReportResponse(BaseModel):
    id: int
    village: str
    symptoms: str
    num_affected: int
    timestamp: datetime
    is_duplicate: bool

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    village: str
    risk_level: str
    cases_count: int
    symptoms: Optional[str] = None
    created_at: datetime
    is_active: bool
    recommended_actions: Optional[List[str]] = None

    class Config:
        from_attributes = True


class ReportSubmitResponse(BaseModel):
    message: str
    report_id: int
    is_duplicate: bool
    alert_triggered: Optional[AlertResponse] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VillageBreakdown(BaseModel):
    village: str
    report_count: int
    risk_level: str
    top_symptoms: List[str]
    total_affected: int


class DashboardResponse(BaseModel):
    total_reports: int
    reports_today: int
    active_alerts: int
    high_risk_villages: int
    demo_data_loaded: bool = False
    alerts: List[AlertResponse]
    village_breakdown: List[VillageBreakdown]
    recent_reports: List[ReportResponse]
