import { fmt } from '@/lib/finance';

export default function KpiGrid({
  analysis,
  periods,
  banks,
  filterPeriod,
  onFilterPeriodChange,
  filterBank,
  onFilterBankChange,
}) {
  const topCat = analysis.catEntries[0];

  return (
    <div className="panel">
      <h2>Visão geral</h2>
      <div className="filters">
        <select value={filterPeriod} onChange={(e) => onFilterPeriodChange(e.target.value)}>
          <option value="__all__">Todos os períodos</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={filterBank} onChange={(e) => onFilterBankChange(e.target.value)}>
          <option value="__all__">Todos os bancos</option>
          {banks.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="lbl">Total gasto (compras)</div>
          <div className="val">{fmt(analysis.totalSpend)}</div>
        </div>
        <div className="kpi">
          <div className="lbl">Maior categoria</div>
          <div className="val" style={{ fontSize: 16 }}>{topCat ? topCat.cat : '—'}</div>
          <div className="note">{topCat ? fmt(topCat.val) : ''}</div>
        </div>
        <div className="kpi">
          <div className="lbl">Assinaturas / mês</div>
          <div className="val">{fmt(analysis.subsTotal)}</div>
        </div>
        <div className="kpi warn">
          <div className="lbl">Compromisso futuro (parcelas)</div>
          <div className="val">{fmt(analysis.futureTotal)}</div>
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
