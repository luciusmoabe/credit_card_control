'use client';

import { fmt, fmtPct } from '@/lib/finance';
import { useChartTheme, getChartPalette } from '@/lib/chartTheme';

const ICON_WALLET = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h13A1.5 1.5 0 0 1 19 7.5V9h1.5A1.5 1.5 0 0 1 22 10.5v7A1.5 1.5 0 0 1 20.5 19h-16A1.5 1.5 0 0 1 3 17.5z" />
    <circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const ICON_SPLIT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9h9" />
  </svg>
);
const ICON_CALENDAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="16" rx="1.5" />
    <line x1="3" y1="9.5" x2="21" y2="9.5" />
    <line x1="8" y1="2.5" x2="8" y2="6.5" />
    <line x1="16" y1="2.5" x2="16" y2="6.5" />
  </svg>
);
const ICON_ALERT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5 21.5 20h-19z" />
    <line x1="12" y1="9.5" x2="12" y2="14" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);
const ICON_INCOME = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default function KpiGrid({ analysis, incomeCommitment }) {
  const topCat = analysis.catEntries[0];
  const trendUp = analysis.spendDiffPct > 0;
  const theme = useChartTheme();
  const palette = getChartPalette(theme);

  return (
    <div className="panel">
      <h2>Visão geral</h2>
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-icon">{ICON_WALLET}</span>
          <div className="lbl">Total gasto (compras)</div>
          <div className="val">{fmt(analysis.totalSpend)}</div>
          {analysis.selPeriod !== '__all__' && analysis.previousMonthTotal > 0 && (
            <span className={`kpi-trend ${trendUp ? 'down' : 'up'}`}>
              {trendUp ? '▲' : '▼'} {Math.abs(analysis.spendDiffPct).toFixed(1)}% vs. mês anterior
            </span>
          )}
        </div>

        <div className="kpi" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="kpi-icon">{ICON_SPLIT}</span>
          <div>
            <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: palette.creditCard }} />
              Cartão de Crédito
            </div>
            <div className="val" style={{ fontSize: 16 }}>{fmt(analysis.totalCreditCard)}</div>
          </div>
          <div>
            <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: palette.checking }} />
              Conta-Corrente
            </div>
            <div className="val" style={{ fontSize: 16 }}>{fmt(analysis.totalChecking)}</div>
          </div>
        </div>

        <div className="kpi">
          <span className="kpi-icon">{ICON_CALENDAR}</span>
          <div className="lbl">Média mensal (período selecionado)</div>
          <div className="val">{fmt(analysis.avgMonthly)}</div>
          <div className="note">{analysis.count} lançamentos</div>
        </div>

        <div className="kpi warn">
          <span className="kpi-icon">{ICON_ALERT}</span>
          <div className="lbl">Compromisso futuro (parcelas)</div>
          <div className="val">{fmt(analysis.futureTotal)}</div>
          <div className="note">{analysis.parcRows?.length || 0} parcelamentos ativos</div>
        </div>

        <div className={`kpi${incomeCommitment?.overCommitted ? ' warn' : ''}`}>
          <span className="kpi-icon">{ICON_INCOME}</span>
          <div className="lbl">Renda já comprometida (próx. mês)</div>
          {incomeCommitment ? (
            <>
              <div className="val">{fmtPct(incomeCommitment.pctNextCommitted)}</div>
              <div className="note">
                {fmt(incomeCommitment.nextCommitted)} de {fmt(incomeCommitment.netIncome)}
                {incomeCommitment.source === 'estimate' ? ' (estimado pelo extrato)' : ''}
              </div>
            </>
          ) : (
            <div className="note">Importe seu contracheque para ver este indicador</div>
          )}
        </div>
      </div>
      {analysis.totalSpend > 0 && (
        <div className="alert">
          <div>
            O pagamento mínimo evita o bloqueio do cartão, mas gera juros de crédito rotativo que
            costumam superar 300% ao ano (CET). Priorize pagar o valor cheio da fatura sempre que
            possível.
          </div>
        </div>
      )}
    </div>
  );
}
