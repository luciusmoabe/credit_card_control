'use client';

import { fmt, fmtPct } from '@/lib/finance';
import { useChartTheme, getChartPalette } from '@/lib/chartTheme';

export default function KpiGrid({ analysis, incomeCommitment, expenseVsIncome }) {
  const topCat = analysis.catEntries[0];
  const trendUp = analysis.spendDiffPct > 0;
  const theme = useChartTheme();
  const palette = getChartPalette(theme);

  return (
    <div className="panel">
      <h2>Visão geral</h2>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="lbl">Total gasto (compras)</div>
          <div className="val">{fmt(analysis.totalSpend)}</div>
          {analysis.selPeriod !== '__all__' && analysis.previousMonthTotal > 0 && (
            <span className={`kpi-trend ${trendUp ? 'down' : 'up'}`}>
              {trendUp ? '▲' : '▼'} {Math.abs(analysis.spendDiffPct).toFixed(1)}% vs. mês anterior
            </span>
          )}
        </div>

        <div className="kpi" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <div className="lbl">Média mensal (período selecionado)</div>
          <div className="val">{fmt(analysis.avgMonthly)}</div>
          <div className="note">{analysis.count} lançamentos</div>
        </div>

        <div className="kpi warn">
          <div className="lbl">Compromisso futuro (parcelas)</div>
          <div className="val">{fmt(analysis.futureTotal)}</div>
          <div className="note">{analysis.parcRows?.length || 0} parcelamentos ativos</div>
        </div>

        <div className={`kpi${incomeCommitment?.overCommitted ? ' warn' : ''}`}>
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

        <div className={`kpi${expenseVsIncome?.tier === 'over' ? ' warn' : ''}`}>
          <div className="lbl">Gasto do mês vs. renda</div>
          {expenseVsIncome ? (
            <>
              <div className="val">{fmtPct(expenseVsIncome.pctOfIncome)}</div>
              <div className="note">
                {fmt(expenseVsIncome.totalSpend)} de {fmt(expenseVsIncome.netIncome)}
                {expenseVsIncome.source === 'estimate' ? ' (estimado pelo extrato)' : ''}
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
