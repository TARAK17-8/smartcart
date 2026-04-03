import { useState, useEffect, useCallback } from 'react';

export default function NotificationToast({ alerts }) {
  const [toasts, setToasts] = useState([]);
  const [seenAlertIds, setSeenAlertIds] = useState(new Set());

  // Check for new HIGH alerts — only triggered by real data
  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    const highAlerts = alerts.filter(
      (a) => a.risk_level === 'HIGH' && !seenAlertIds.has(a.id)
    );

    if (highAlerts.length > 0) {
      const newToasts = highAlerts.map((a) => ({
        id: a.id,
        village: a.village,
        cases: a.cases_count,
        symptoms: a.symptoms,
        timestamp: Date.now(),
      }));

      setToasts((prev) => [...prev, ...newToasts]);
      setSeenAlertIds((prev) => {
        const next = new Set(prev);
        highAlerts.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }, [alerts, seenAlertIds]);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast alert-high">
          <span className="toast-icon">🚨</span>
          <div className="toast-content">
            <h4>HIGH RISK: {toast.village}</h4>
            <p>
              {toast.cases} cases detected — {toast.symptoms}
            </p>
          </div>
          <button className="toast-close" onClick={() => dismiss(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
