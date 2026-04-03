export default function VillageHeatmap({ villageBreakdown }) {
  if (!villageBreakdown || villageBreakdown.length === 0) {
    return (
      <div className="card card-padded" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No village data available yet.</p>
      </div>
    );
  }

  return (
    <div className="heatmap-list">
      {villageBreakdown.map((v) => (
        <div key={v.village} className={`heatmap-item ${v.risk_level.toLowerCase()}`}>
          <div>
            <div className="heatmap-village">{v.village}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {v.top_symptoms.join(', ')}
            </div>
          </div>
          <div className="heatmap-details">
            <span>{v.total_affected} affected</span>
            <span className={`risk-badge ${v.risk_level.toLowerCase()}`}>
              {v.risk_level}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
