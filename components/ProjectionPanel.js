'use client';

import 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import { fmt, buildProjection } from '@/lib/finance';

export default function ProjectionPanel({ parcRows, anchorPeriod }) {
  if (!parcRows.length) {
    return (
      <div className="panel">
        <h2>
          Comprometimento futuro <span className="sub">quanto de parcelas ainda vai cair em cada mês</span>
        </h2>
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <div className="kpi"><div className="lbl">Próximo mês</div><div className="val">{fmt(0)}</div></div>
          <div className="kpi"><div className="lbl">Próximos 3 meses</div><div className="val">{fmt(0)}</div></div>
          <div className="kpi"><div className="lbl">Próximos 6 meses</div><div className="val">{fmt(0)}</div></div>
          <div className="kpi good"><div className="lbl">Fica livre de parcelas em</div><div className="val" style={{ fontSize: 16 }}>{anchorPeriod || '—'}</div></div>
        </div>
      </div>
    );
  }

  const { months, committed } = buildProjection(parcRows, anchorPeriod);
  const values = months.map((m) => committed[m] || 0);
  const nextMonth = values[0] || 0;
  const next3m = values.slice(0, 3).reduce((a, b) => a + b, 0);
  const next6m = values.slice(0, 6).reduce((a, b) => a + b, 0);
  const freeMonthIdx = months.findIndex((m, i) => values[i] === 0);
  const freeMonth = freeMonthIdx >= 0 ? months[freeMonthIdx] : '12+ meses';

  const data = {
    labels: months,
    datasets: [{ label: 'Comprometido', data: values, backgroundColor: '#378ADD', borderRadius: 4, maxBarThickness: 32 }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmt(c.raw) } } },
    scales: {
      y: { ticks: { callback: (v) => 'R$ ' + v }, grid: { color: '#E5E7E0' } },
      x: { grid: { display: false } },
    },
  };

  const endingSoon = parcRows.filter((r) => r.remaining > 0 && r.remaining <= 2);

  return (
    <div className="panel">
      <h2>
        Comprometimento futuro <span className="sub">quanto de parcelas ainda vai cair em cada mês</span>
      </h2>
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="lbl">Próximo mês</div><div className="val">{fmt(nextMonth)}</div></div>
        <div className="kpi"><div className="lbl">Próximos 3 meses</div><div className="val">{fmt(next3m)}</div></div>
        <div className="kpi"><div className="lbl">Próximos 6 meses</div><div className="val">{fmt(next6m)}</div></div>
        <div className="kpi good"><div className="lbl">Fica livre de parcelas em</div><div className="val" style={{ fontSize: 16 }}>{freeMonth}</div></div>
      </div>
      <div style={{ position: 'relative', height: 230 }}>
        <Bar data={data} options={options} />
      </div>
      {endingSoon.length > 0 && (
        <div className="alert" style={{ background: 'var(--teal-bg)', color: '#1b4438' }}>
          <div>
            <strong>{endingSoon.length} parcelamento(s)</strong> terminam nos próximos 2 meses (
            {endingSoon.map((r) => r.desc).join(', ')}), liberando {fmt(endingSoon.reduce((s, r) => s + r.valuePerMonth, 0))}/mês.
          </div>
        </div>
      )}
    </div>
  );
}
