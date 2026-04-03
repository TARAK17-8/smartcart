export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Reports',
      value: stats.total_reports,
      icon: '📋',
      color: 'blue',
    },
    {
      label: 'Reports (24h)',
      value: stats.reports_today,
      icon: '📈',
      color: 'cyan',
    },
    {
      label: 'Active Alerts',
      value: stats.active_alerts,
      icon: '⚠️',
      color: 'amber',
    },
    {
      label: 'High Risk Villages',
      value: stats.high_risk_villages,
      icon: '🔴',
      color: 'red',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div className={`stat-card-icon ${card.color}`}>{card.icon}</div>
          <div className="stat-card-info">
            <h3>{card.label}</h3>
            <div className="stat-card-value">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
