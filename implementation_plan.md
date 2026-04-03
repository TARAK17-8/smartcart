# Rural Health Early Warning System — Implementation Plan

## Overview

A full-stack web application that collects health reports from rural communities, detects abnormal symptom spikes, and generates early warnings for possible water-borne disease outbreaks.

**Stack**: FastAPI (Python) + React (Vite) + SQLite  
**Auth**: Session-based JWT with hardcoded admin credentials  
**Deployment target**: Local development (scalable to prod)

---

## Project Structure

```
c:\prac hos\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app, CORS, startup
│   │   ├── config.py               # Settings (DB URL, JWT secret, thresholds)
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   ├── models.py               # ORM models (Report, Alert)
│   │   ├── schemas.py              # Pydantic request/response models
│   │   ├── auth.py                 # Login + JWT token helpers
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── report_service.py   # Ingest reports, deduplicate
│   │   │   ├── detection_service.py# Anomaly detection engine
│   │   │   └── alert_service.py    # Alert generation + retrieval
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── reports.py          # POST /api/report
│   │       ├── alerts.py           # GET /api/alerts
│   │       ├── dashboard.py        # GET /api/dashboard
│   │       └── auth.py             # POST /api/login
│   ├── seed.py                     # Sample test data seeder
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css               # Global styles + design system
│       ├── api.js                  # Axios/fetch wrapper
│       ├── context/
│       │   └── AuthContext.jsx     # Auth state management
│       ├── pages/
│       │   ├── ReportForm.jsx      # Public report submission
│       │   ├── Login.jsx           # Admin login
│       │   └── Dashboard.jsx       # Protected admin dashboard
│       └── components/
│           ├── Navbar.jsx
│           ├── AlertCard.jsx
│           ├── StatsCards.jsx
│           ├── AlertsTable.jsx
│           ├── RiskChart.jsx       # Chart.js bar/pie chart
│           ├── VillageHeatmap.jsx  # Color-coded village risk list
│           ├── NotificationToast.jsx
│           └── ProtectedRoute.jsx
└── README.md                       # Top-level run instructions
```

---

## Database Schema

### Table: `reports`
| Column       | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | INTEGER PK| Auto-increment                 |
| village     | TEXT      | Normalized (lowercase, trimmed)|
| symptoms    | TEXT      | Comma-separated symptom list   |
| num_affected| INTEGER   | Default 1                      |
| timestamp   | DATETIME  | UTC, auto-set on creation      |
| is_duplicate| BOOLEAN   | Flagged by dedup logic          |

### Table: `alerts`
| Column       | Type      | Notes                          |
|-------------|-----------|--------------------------------|
| id          | INTEGER PK| Auto-increment                 |
| village     | TEXT      | Village that triggered alert   |
| risk_level  | TEXT      | LOW / MEDIUM / HIGH            |
| cases_count | INTEGER   | Number of reports in window    |
| symptoms    | TEXT      | Dominant symptoms              |
| created_at  | DATETIME  | UTC                            |
| is_active   | BOOLEAN   | True until manually resolved   |

---

## Backend Details

### API Endpoints

| Method | Path            | Auth     | Description                        |
|--------|----------------|----------|------------------------------------|
| POST   | `/api/report`  | Public   | Submit a health report             |
| GET    | `/api/alerts`  | Admin    | Get active alerts                  |
| GET    | `/api/dashboard`| Admin   | Aggregated stats for dashboard     |
| POST   | `/api/login`   | Public   | Authenticate admin, return JWT     |

### Anomaly Detection Logic (`detection_service.py`)

```
For each incoming report:
  1. Normalize village name
  2. Check for duplicates (same village + overlapping symptoms within 30 min)
     → If duplicate, flag is_duplicate=True but still store
  3. Count non-duplicate reports for this village in last 24 hours
  4. Apply thresholds:
     - 1-2 reports  → LOW risk
     - 3-4 reports  → MEDIUM risk
     - 5+ reports   → HIGH risk
  5. If risk ≥ MEDIUM:
     → Upsert alert for this village (update if exists, create if not)
     → Mark is_active=True
```

### Dashboard Aggregation (`GET /api/dashboard`)

Returns:
- `total_reports` (all time)
- `reports_today` (last 24h)
- `active_alerts` (count + list)
- `village_breakdown` — per-village: report count, risk level, top symptoms
- `recent_reports` — last 20 reports

---

## Frontend Details

### Pages

1. **Report Form** (`/`) — Public
   - Village name input (text, with autocomplete suggestions from common village names)
   - Symptoms multi-select dropdown (Diarrhea, Fever, Vomiting, Nausea, Stomach Pain, Dehydration, Other)
   - Optional: number of affected people
   - Large, touch-friendly submit button
   - Success animation on submit

2. **Login** (`/login`) — Public
   - Username + password fields
   - Error toast on failure
   - Redirect to `/dashboard` on success

3. **Dashboard** (`/dashboard`) — Protected
   - **Stats Cards**: Total Reports, Today's Reports, Active Alerts, High Risk Villages
   - **Alerts Table**: Sortable, color-coded rows (red=HIGH, orange=MEDIUM, green=LOW)
   - **Bar Chart**: Reports by village (last 7 days) — using Chart.js
   - **Village Heatmap**: Color-coded list showing risk levels
   - **Notification Toast**: Animated popup when new HIGH alert detected
   - Auto-refresh every 15 seconds via polling

### Design System

- **Color Palette**: Dark theme with accent colors
  - Background: `#0f1729` (deep navy)
  - Surface: `#1a2332` 
  - Primary: `#3b82f6` (vibrant blue)
  - Danger/HIGH: `#ef4444`
  - Warning/MEDIUM: `#f59e0b`
  - Success/LOW: `#10b981`
- **Typography**: Inter from Google Fonts
- **Effects**: Glassmorphism cards, subtle hover animations, gradient accents
- **Responsive**: Mobile-first, works on all screen sizes

---

## User Review Required

> [!IMPORTANT]
> **TailwindCSS**: You mentioned "React (preferred) OR simple HTML + Tailwind". I will use **React (Vite)** with **vanilla CSS** (custom design system) for maximum visual polish and control. TailwindCSS will NOT be used unless you explicitly want it.

> [!IMPORTANT]  
> **Authentication**: Using JWT tokens stored in localStorage for simplicity. This is fine for a demo but would need HttpOnly cookies for production.

> [!NOTE]
> **No real map library**: Instead of adding a heavy map dependency (Leaflet/Mapbox), I'll build a visually compelling **village risk heatmap** — a color-coded, interactive list/grid showing severity. This keeps the app lightweight while still providing clear spatial visualization.

---

## Verification Plan

### Automated Tests
1. Run `seed.py` to populate 15–20 sample reports across 4–5 villages
2. Verify anomaly detection triggers alerts correctly
3. Test all API endpoints via browser/curl
4. Verify dashboard loads with correct aggregated data

### Manual / Browser Verification
1. Submit 3+ reports for the same village → verify HIGH risk alert appears
2. Login as admin → verify dashboard shows stats, charts, alerts table
3. Test on mobile viewport → verify responsive layout
4. Verify duplicate detection works (submit same village + same symptoms rapidly)
5. Record a demo walkthrough video using the browser tool
