from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from datetime import datetime, timezone
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    village = Column(String(255), nullable=False, index=True)
    symptoms = Column(Text, nullable=False)
    num_affected = Column(Integer, default=1)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_duplicate = Column(Boolean, default=False)

    def __repr__(self):
        return f"<Report(id={self.id}, village='{self.village}', symptoms='{self.symptoms}')>"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    village = Column(String(255), nullable=False, index=True)
    risk_level = Column(String(10), nullable=False)  # LOW, MEDIUM, HIGH
    cases_count = Column(Integer, nullable=False)
    symptoms = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Alert(id={self.id}, village='{self.village}', risk='{self.risk_level}')>"
