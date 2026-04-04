import { useState, useEffect, useCallback } from 'react';
import { fetchPublicDashboard } from '../api';
import StatsCards from '../components/StatsCards';
import AlertsTable from '../components/AlertsTable';
import RiskChart from '../components/RiskChart';
import VillageHeatmap from '../components/VillageHeatmap';

const POLL_INTERVAL = 15000; // 15 seconds

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await fetchPublicDashboard();
      setData(result);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Polling
  useEffect(() => {
    const interval = setInterval(loadDashboard, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2 style={{ color: 'var(--status-high)', marginBottom: '1rem' }}>⚠️ Error</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={loadDashboard}>
          Retry
        </button>
      </div>
    );
  }

  const isEmpty = data && data.total_reports === 0 && data.active_alerts === 0;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span className="page-badge user-badge">👥 User Dashboard</span>
          {data?.demo_data_loaded && (
            <span className="demo-badge" id="demo-data-indicator-user">
              <span className="demo-badge-dot"></span>
              Demo Data Loaded
            </span>
          )}
          <h1 style={{ marginTop: '0.5rem' }}>User Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
            📢 Stay informed — follow precautions to keep your family safe
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="refresh-indicator">
            <span className="refresh-dot"></span>
            <span>
              Live — Updated {lastRefresh ? lastRefresh.toLocaleTimeString('en-IN') : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <StatsCards stats={data} />

      {/* Empty State */}
      {isEmpty && (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h2>All Clear!</h2>
          <p>No active health alerts at this time. Stay safe and continue following good hygiene practices.</p>
        </div>
      )}

      {/* Only show detailed sections if there is data */}
      {!isEmpty && (
        <>
          {/* Alerts Table with precautions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="section-title">
              <span className="section-title-icon">⚠️</span>
              Active Health Alerts
            </div>
            <AlertsTable alerts={data.alerts} mode="user" />
          </div>

          {/* Charts + Heatmap Grid */}
          <div className="dashboard-grid">
            <div>
              <div className="section-title">
                <span className="section-title-icon">📊</span>
                Reports by Village (24h)
              </div>
              <div className="card">
                <RiskChart villageBreakdown={data.village_breakdown} />
              </div>
            </div>

            <div>
              <div className="section-title">
                <span className="section-title-icon">🗺️</span>
                Village Risk Heatmap
              </div>
              <VillageHeatmap villageBreakdown={data.village_breakdown} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
