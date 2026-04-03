export default function AlertsTable({ alerts }) {
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
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
