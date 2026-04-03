import os

# ----- Database -----
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rural_health.db")

# ----- JWT Auth -----
JWT_SECRET = os.getenv("JWT_SECRET", "rural-health-ews-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = 60 * 8  # 8 hours

# ----- Admin credentials -----
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

# ----- Detection thresholds -----
DETECTION_WINDOW_HOURS = 24
DUPLICATE_WINDOW_MINUTES = 30
RISK_THRESHOLDS = {
    "LOW": 1,
    "MEDIUM": 3,
    "HIGH": 5,
}

# ----- Allowed villages -----
ALLOWED_VILLAGES = ["Duvvada", "Gantyada", "Gangavaram"]
