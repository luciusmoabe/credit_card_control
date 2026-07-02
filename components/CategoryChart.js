'use client';

import 'chart.js/auto';
import { Doughnut } from 'react-chartjs-2';
import { FALLBACK_CATEGORY_COLOR, fmt } from '@/lib/finance';

export default function CategoryChart({ catEntries, catColors }) {
  const labels = catEntries.map((e) => e.cat);
  const values = catEntries.map((e) => e.val);
  const colors = labels.map((l) => catColors[l] || FALLBACK_CATEGORY_COLOR);
  const total = values.reduce((a, b) => a + b, 0) || 1;

  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderColor: '#FFFFFF', borderWidth: 2 }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => c.label + ': ' + fmt(c.raw) } },
    },
  };

  return (
    <div className="panel">
      <h2>Gastos por categoria</h2>
      {catEntries.length === 0 ? (
        <div className="hint">Nenhum gasto no período selecionado.</div>
      ) : (
        <>
          <div style={{ position: 'relative', height: 230 }}>
            <Doughnut data={data} options={options} />
          </div>
          <div className="legend">
            {catEntries.map((e) => (
              <span key={e.cat}>
                <span className="sw" style={{ background: catColors[e.cat] || FALLBACK_CATEGORY_COLOR }} />
                {e.cat} {Math.round((e.val / total) * 100)}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
