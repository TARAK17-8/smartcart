import { useState, Fragment } from 'react';

// Precautions for user view — simple, non-technical language
const USER_PRECAUTIONS = {
  HIGH: [
    'Boil drinking water before use',
    'Maintain proper hygiene — wash hands often',
    'Seek medical help immediately if symptoms increase',
    'Use only clean water sources',
    'Avoid eating uncovered or stale food',
    'Keep children and elderly people safe indoors',
  ],
  MEDIUM: [
    'Boil drinking water as a precaution',
    'Maintain hygiene — wash hands regularly',
    'Seek medical help if symptoms appear',
    'Use clean water sources for cooking and drinking',
  ],
  LOW: [
    'Continue following good hygiene practices',
    'Use clean drinking water',
    'Visit a health worker if you feel unwell',
  ],
};

// Status messages for admin view
const ADMIN_STATUS = {
  LOW: 'Monitor situation',
  MEDIUM: 'Reported to local health workers',
  HIGH: 'Reported to authorities (Immediate attention required)',
};

export default function AlertsTable({ alerts, mode = 'admin' }) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  if (!alerts || alerts.length === 0) {
    return (
      <div className="card card-padded" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>✅ No active alerts. All clear!</p>
      </div>
    );
  }

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const statusIcon = (risk) => {
    if (risk === 'HIGH') return '🚨';
    if (risk === 'MEDIUM') return '⚠️';
    return '📋';
  };

  const isUserMode = mode === 'user';

  return (
    <div className="table-wrapper">
      <table className="table" id="alerts-table">
        <thead>
          <tr>
            <th>Village</th>
            <th>Risk Level</th>
            <th>Cases</th>
            <th>Symptoms</th>
            <th>Timestamp</th>
            <th>{isUserMode ? 'Precautions' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const isExpanded = expandedIds.has(alert.id);
            const precautions = USER_PRECAUTIONS[alert.risk_level] || USER_PRECAUTIONS.LOW;
            const status = ADMIN_STATUS[alert.risk_level] || ADMIN_STATUS.LOW;

            return (
              <Fragment key={alert.id}>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {alert.village}
                  </td>
                  <td>
                    <span className={`risk-badge ${alert.risk_level.toLowerCase()}`}>
                      {alert.risk_level === 'HIGH' && '🔴 '}
                      {alert.risk_level === 'MEDIUM' && '🟡 '}
                      {alert.risk_level === 'LOW' && '🟢 '}
                      {alert.risk_level}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {alert.cases_count}
                  </td>
                  <td>{alert.symptoms || '—'}</td>
                  <td>{formatTime(alert.created_at)}</td>
                  <td>
                    {isUserMode ? (
                      /* USER MODE: Show precautions toggle */
                      <button
                        className={`actions-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(alert.id)}
                        title={isExpanded ? 'Hide precautions' : 'View precautions'}
                        id={`precautions-toggle-${alert.id}`}
                      >
                        🛡️ {isExpanded ? 'Hide' : 'View'}
                      </button>
                    ) : (
                      /* ADMIN MODE: Show reporting status */
                      <div className={`status-badge-inline ${alert.risk_level.toLowerCase()}`}>
                        <span className="status-icon">{statusIcon(alert.risk_level)}</span>
                        <span className="status-text">{status}</span>
                      </div>
                    )}
                  </td>
                </tr>

                {/* USER MODE: Expandable precautions panel */}
                {isUserMode && isExpanded && (
                  <tr key={`precautions-${alert.id}`} className="actions-detail-row">
                    <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className={`precautions-panel ${alert.risk_level.toLowerCase()}`}>
                        <div className="precautions-panel-header">
                          <span className="precautions-panel-icon">🛡️</span>
                          <span className="precautions-panel-title">Precautions / Recommended Actions — {alert.village}</span>
                        </div>
                        <ul className="precautions-list">
                          {precautions.map((precaution, idx) => (
                            <li key={idx} className="precaution-item">
                              <span className="precaution-bullet">✔</span>
                              {precaution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
