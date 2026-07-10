'use client';

import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import { fmt } from '@/lib/finance';
import { useChartTheme, getChartPalette } from '@/lib/chartTheme';

export default function AccountTypeChart({ analysis }) {
  const theme = useChartTheme();
  const palette = getChartPalette(theme);

  if (analysis.totalSpend === 0) return null;

  const data = {
    labels: ['Cartão de Crédito', 'Conta-Corrente'],
    datasets: [{
      data: [analysis.totalCreditCard, analysis.totalChecking],
      backgroundColor: [palette.creditCard, palette.checking],
      borderWidth: 2,
      borderColor: 'transparent',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw;
            const pct = analysis.totalSpend > 0 ? ((val / analysis.totalSpend) * 100).toFixed(1) : 0;
            return ` ${fmt(val)} (${pct}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="panel">
      <h2>Origem dos Gastos</h2>
      <div style={{ position: 'relative', height: 230, marginTop: '1rem' }}>
        <Doughnut data={data} options={options} />
        
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Total</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>{fmt(analysis.totalSpend)}</div>
        </div>
      </div>
    </div>
  );
}
