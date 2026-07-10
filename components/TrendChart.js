'use client';

import 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import { fmt } from '@/lib/finance';
import { useChartTheme, getChartPalette } from '@/lib/chartTheme';

export default function TrendChart({ perPeriod }) {
  const theme = useChartTheme();
  const palette = getChartPalette(theme);

  const data = {
    labels: perPeriod.map((p) => p.period),
    datasets: [
      { label: 'Gasto', data: perPeriod.map((p) => p.total), backgroundColor: palette.trendBar, borderRadius: 4, maxBarThickness: 36 },
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
      y: { ticks: { callback: (v) => 'R$ ' + v }, grid: { color: palette.gridLine } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="panel">
      <h2>
        Evolução mensal <span className="pill-btn">Projeção →</span>
      </h2>
      {perPeriod.length === 0 ? (
        <div className="hint">Nenhum dado suficiente ainda.</div>
      ) : (
        <>
          <div style={{ position: 'relative', height: 230 }}>
            <Bar data={data} options={options} />
          </div>
          <p className="chart-hint">Passe o mouse sobre as barras para ver os valores</p>
        </>
      )}
    </div>
  );
}
