import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RiskChart({ villageBreakdown }) {
  if (!villageBreakdown || villageBreakdown.length === 0) return null;

  const riskColors = {
    HIGH: { bg: 'rgba(239, 68, 68, 0.7)', border: '#ef4444' },
    MEDIUM: { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },
    LOW: { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
  };

  const data = {
    labels: villageBreakdown.map((v) => v.village),
    datasets: [
      {
        label: 'Reports (24h)',
        data: villageBreakdown.map((v) => v.report_count),
        backgroundColor: villageBreakdown.map(
          (v) => riskColors[v.risk_level]?.bg || riskColors.LOW.bg
        ),
        borderColor: villageBreakdown.map(
          (v) => riskColors[v.risk_level]?.border || riskColors.LOW.border
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          afterLabel: (ctx) => {
            const v = villageBreakdown[ctx.dataIndex];
            return `Risk: ${v.risk_level}\nAffected: ${v.total_affected}\nSymptoms: ${v.top_symptoms.join(', ')}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter' } },
        grid: { color: 'rgba(148, 163, 184, 0.06)' },
      },
      y: {
        ticks: {
          color: '#64748b',
          font: { family: 'Inter' },
          stepSize: 1,
        },
        grid: { color: 'rgba(148, 163, 184, 0.06)' },
      },
    },
  };

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  );
}
