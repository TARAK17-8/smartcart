import { useState, useRef, useEffect } from 'react';
import { submitReport } from '../api';

const SUGGESTED_VILLAGES = ['Duvvada', 'Gantyada', 'Gangavaram'];

const SYMPTOMS = [
  'Diarrhea',
  'Fever',
  'Vomiting',
  'Nausea',
  'Stomach Pain',
  'Dehydration',
  'Headache',
  'Body Ache',
];

export default function ReportForm() {
  const [village, setVillage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [numAffected, setNumAffected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Filter suggestions based on current input
  const filteredSuggestions = village.trim()
    ? SUGGESTED_VILLAGES.filter((v) =>
        v.toLowerCase().includes(village.toLowerCase())
      )
    : SUGGESTED_VILLAGES;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (name) => {
    setVillage(name);
    setShowSuggestions(false);
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!village.trim()) {
      setError('Please enter a village name');
      return;
    }

    const allSymptoms = [...selectedSymptoms];
    if (otherSymptom.trim()) allSymptoms.push(otherSymptom.trim());
    if (allSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport({
        village: village.trim(),
        symptoms: allSymptoms.join(', '),
        num_affected: numAffected ? parseInt(numAffected) : 1,
      });

      setSuccessData(result);
      setShowSuccess(true);

      // Reset form
      setVillage('');
      setSelectedSymptoms([]);
      setOtherSymptom('');
      setNumAffected('');

      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>Report Submitted!</h2>
            <p>{successData?.message}</p>
            {successData?.is_duplicate && (
              <p style={{ color: 'var(--status-medium)', fontSize: '0.85rem' }}>
                ⚠️ Similar report already recorded — flagged for review
              </p>
            )}
            {successData?.alert_triggered && (
              <div
                style={{
                  background: 'var(--status-high-bg)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '0.5rem',
                }}
              >
                <span style={{ color: 'var(--status-high)', fontWeight: 700 }}>
                  🚨 Alert Triggered: {successData.alert_triggered.village} — {successData.alert_triggered.risk_level}
                </span>
              </div>
            )}
            <button
              className="btn btn-secondary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => setShowSuccess(false)}
            >
              Submit Another Report
            </button>
          </div>
        </div>
      )}

      <div className="container-narrow">
        <div className="page-header">
          <span className="page-badge">📥 Public Health Reporting</span>
          <h1>Report Health Symptoms</h1>
          <p>
            Help protect your community. Report any unusual health symptoms in your village —
            your input helps detect outbreaks early.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card card-padded" id="report-form">
          {error && (
            <div className="login-error" style={{ marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {/* Village with Autocomplete */}
          <div className="form-group">
            <label className="form-label" htmlFor="village">
              🏘️ Village Name
            </label>
            <div className="autocomplete-wrapper">
              <input
                ref={inputRef}
                id="village"
                type="text"
                className="form-input"
                placeholder="Enter or select village"
                value={village}
                onChange={(e) => {
                  setVillage(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="autocomplete-list" ref={suggestionsRef}>
                  {filteredSuggestions.map((name) => (
                    <li
                      key={name}
                      className={`autocomplete-item ${name.toLowerCase() === village.toLowerCase() ? 'active' : ''}`}
                      onMouseDown={() => selectSuggestion(name)}
                    >
                      <span className="autocomplete-icon">📍</span>
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span className="form-hint">Type to search or enter any village name</span>
          </div>

          {/* Symptoms */}
          <div className="form-group">
            <label className="form-label">🩺 Symptoms Observed</label>
            <div className="symptom-grid">
              {SYMPTOMS.map((symptom) => (
                <label
                  key={symptom}
                  className={`symptom-chip ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(symptom)}
                    onChange={() => toggleSymptom(symptom)}
                  />
                  <span>{selectedSymptoms.includes(symptom) ? '✓' : '○'}</span>
                  {symptom}
                </label>
              ))}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Other symptoms (optional)"
                value={otherSymptom}
                onChange={(e) => setOtherSymptom(e.target.value)}
              />
            </div>
          </div>

          {/* Number Affected */}
          <div className="form-group">
            <label className="form-label" htmlFor="numAffected">
              👥 Number of People Affected (optional)
            </label>
            <input
              id="numAffected"
              type="number"
              className="form-input"
              placeholder="1"
              min="1"
              max="9999"
              value={numAffected}
              onChange={(e) => setNumAffected(e.target.value)}
            />
            <span className="form-hint">Approximate count of people showing symptoms</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-large btn-block"
            disabled={submitting}
            id="submit-report-btn"
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                Submitting...
              </>
            ) : (
              '📤 Submit Report'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            🔒 Your report is anonymous and helps health authorities respond faster.
          </p>
        </div>
      </div>
    </>
  );
}
