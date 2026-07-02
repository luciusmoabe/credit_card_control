import { fmt } from '@/lib/finance';

export default function KpiGrid({ analysis }) {
  const topCat = analysis.catEntries[0];

  return (
    <div className="panel">
      <h2>Visão geral</h2>
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
          <div className="val">{fmt(analysis.subsTotal / analysis.nMonths)}</div>
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
