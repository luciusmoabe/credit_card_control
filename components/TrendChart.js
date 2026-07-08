'use client';

import 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import { fmt } from '@/lib/finance';

export default function TrendChart({ perPeriod }) {
  const data = {
    labels: perPeriod.map((p) => p.period),
    datasets: [
      { label: 'Gasto', data: perPeriod.map((p) => p.total), backgroundColor: '#2F6F5E', borderRadius: 4, maxBarThickness: 36 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => fmt(c.raw) } },
    },
    scales: {
      y: { ticks: { callback: (v) => 'R$ ' + v }, grid: { color: 'rgba(150, 150, 150, 0.2)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="panel">
      <h2>Evolução mensal</h2>
      {perPeriod.length === 0 ? (
        <div className="hint">Nenhum dado suficiente ainda.</div>
      ) : (
        <div style={{ position: 'relative', height: 230 }}>
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
}
