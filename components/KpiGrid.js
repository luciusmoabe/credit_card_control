import { fmt, fmtPct } from '@/lib/finance';

export default function KpiGrid({ analysis, incomeCommitment }) {
  const topCat = analysis.catEntries[0];

  return (
    <div className="panel">
      <h2>Visão geral</h2>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="lbl">Total gasto (compras)</div>
          <div className="val">{fmt(analysis.totalSpend)}</div>
          {analysis.selPeriod !== '__all__' && analysis.previousMonthTotal > 0 && (
            <div className="note" style={{ color: analysis.spendDiffPct > 0 ? 'var(--rust)' : 'var(--teal)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              {analysis.spendDiffPct > 0 ? '▲' : '▼'} {Math.abs(analysis.spendDiffPct).toFixed(1)}% vs. mês anterior
            </div>
          )}
        </div>
        
        <div className="kpi" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#378ADD' }} />
              Cartão de Crédito
            </div>
            <div className="val" style={{ fontSize: 16 }}>{fmt(analysis.totalCreditCard)}</div>
          </div>
          <div>
            <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B8E23' }} />
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
