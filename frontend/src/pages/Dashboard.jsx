import { useState, useEffect, useCallback } from 'react';
import { fetchDashboard, resetSystem } from '../api';
import StatsCards from '../components/StatsCards';
import AlertsTable from '../components/AlertsTable';
import RiskChart from '../components/RiskChart';
import VillageHeatmap from '../components/VillageHeatmap';
import NotificationToast from '../components/NotificationToast';

const POLL_INTERVAL = 15000; // 15 seconds

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const result = await fetchDashboard();
      setData(result);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load dashboard data.');
      }
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

  // Reset handler
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the entire system? All reports and alerts will be permanently deleted.')) {
      return;
    }
    setResetting(true);
    setResetSuccess('');
    try {
      const result = await resetSystem();
      setResetSuccess(result.message || 'System cleared successfully');
      await loadDashboard(); // Reload fresh data
      setTimeout(() => setResetSuccess(''), 4000);
    } catch (err) {
      setError('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

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
    <>
      {/* Toast notifications for HIGH alerts */}
      <NotificationToast alerts={data?.alerts} />

      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span className="page-badge">📊 Command Center</span>
            <h1 style={{ marginTop: '0.5rem' }}>Disease Surveillance Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              👋 Welcome, <strong style={{ color: 'var(--text-primary)' }}>Admin</strong> — monitoring active
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="refresh-indicator">
              <span className="refresh-dot"></span>
              <span>
                Live — Updated {lastRefresh ? lastRefresh.toLocaleTimeString('en-IN') : '...'}
              </span>
            </div>
            <button
              className="btn btn-reset"
              onClick={handleReset}
              disabled={resetting}
              id="reset-system-btn"
            >
              {resetting ? '⏳ Resetting...' : '🗑️ Reset System'}
            </button>
          </div>
        </div>

        {/* Reset success banner */}
        {resetSuccess && (
          <div className="reset-banner">
            ✅ {resetSuccess}
          </div>
        )}

        {/* Stat Cards */}
        <StatsCards stats={data} />

        {/* Empty State */}
        {isEmpty && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h2>No Data Available</h2>
            <p>The system is clean. Submit health reports from the public form to start monitoring.</p>
          </div>
        )}

        {/* Only show detailed sections if there is data */}
        {!isEmpty && (
          <>
            {/* Alerts Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="section-title">
                <span className="section-title-icon">⚠️</span>
                Active Alerts
              </div>
              <AlertsTable alerts={data.alerts} />
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

            {/* Recent Reports */}
            <div style={{ marginTop: '1.5rem' }}>
              <div className="section-title">
                <span className="section-title-icon">📋</span>
                Recent Reports
              </div>
              <div className="table-wrapper">
                <table className="table" id="recent-reports-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Village</th>
                      <th>Symptoms</th>
                      <th>Affected</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_reports.map((r) => (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{r.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.village}</td>
                        <td>{r.symptoms}</td>
                        <td style={{ fontWeight: 600 }}>{r.num_affected}</td>
                        <td>
                          {new Date(r.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>
                          {r.is_duplicate ? (
                            <span style={{ color: 'var(--status-medium)', fontSize: '0.82rem' }}>
                              ⚠️ Duplicate
                            </span>
                          ) : (
                            <span style={{ color: 'var(--status-low)', fontSize: '0.82rem' }}>
                              ✅ Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
