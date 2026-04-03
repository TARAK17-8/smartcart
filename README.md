# 🛡️ Rural Health Early Warning System

> Detect water-borne disease outbreaks in rural communities through intelligent community health reporting and anomaly detection.

## 🚀 Quick Start

### 1. Start Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python seed.py          # Populate sample data
uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### 3. Admin Login

- **Username:** `admin`
- **Password:** `admin`

---

## 📋 API Documentation

| Method | Endpoint         | Auth   | Description               |
|--------|-----------------|--------|---------------------------|
| POST   | `/api/report`   | Public | Submit a health report    |
| POST   | `/api/login`    | Public | Admin authentication      |
| GET    | `/api/alerts`   | Admin  | Get active alerts         |
| GET    | `/api/dashboard`| Admin  | Aggregated dashboard data |

### POST /api/report
```json
{
  "village": "Rampur",
  "symptoms": "diarrhea, fever, vomiting",
  "num_affected": 3
}
```

### POST /api/login
```json
{
  "username": "admin",
  "password": "admin"
}
```

---

## 🧠 Detection Logic

1. **Normalization** — Village names are normalized (trimmed, title-cased)
2. **Deduplication** — Reports with 50%+ symptom overlap from the same village within 30 minutes are flagged as duplicates
3. **Anomaly Detection** — Reports grouped by village in a 24-hour sliding window:
   - 1-2 reports → **LOW** risk
   - 3-4 reports → **MEDIUM** risk (alert generated)
   - 5+ reports → **HIGH** risk (alert + notification)
4. **Alert Upsert** — Alerts are created or updated automatically. De-escalated when risk drops.

---

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings & thresholds
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models.py            # ORM models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT auth
│   │   ├── services/
│   │   │   ├── report_service.py    # Ingest + dedup
│   │   │   ├── detection_service.py # Anomaly detection
│   │   │   └── alert_service.py     # Alert generation
│   │   └── routes/
│   │       ├── auth.py          # POST /login
│   │       ├── reports.py       # POST /report
│   │       ├── alerts.py        # GET /alerts
│   │       └── dashboard.py     # GET /dashboard
│   ├── seed.py                  # Sample data seeder
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx              # Router setup
│       ├── api.js               # API client
│       ├── index.css            # Design system
│       ├── context/AuthContext.jsx
│       ├── pages/
│       │   ├── ReportForm.jsx   # Public report form
│       │   ├── Login.jsx        # Admin login
│       │   └── Dashboard.jsx    # Admin dashboard
│       └── components/
│           ├── Navbar.jsx
│           ├── StatsCards.jsx
│           ├── AlertsTable.jsx
│           ├── RiskChart.jsx
│           ├── VillageHeatmap.jsx
│           ├── NotificationToast.jsx
│           └── ProtectedRoute.jsx
└── README.md
```

---

## 🧪 Demo Flow

1. Open **http://localhost:5173** → Submit reports for "Rampur" with symptoms like diarrhea, fever
2. Submit 3+ reports → System detects spike → Alert generated
3. Navigate to **/login** → Enter `admin` / `admin`
4. Dashboard shows: stats cards, active alerts (highlighted in red), bar chart, village heatmap
5. HIGH risk alerts trigger toast notifications with simulated SMS dispatch

---

## ⚙️ Tech Stack

- **Frontend:** React 19 + Vite + Chart.js
- **Backend:** Python FastAPI + SQLAlchemy
- **Database:** SQLite (scalable to PostgreSQL)
- **Auth:** JWT tokens
- **Real-time:** 15-second polling
