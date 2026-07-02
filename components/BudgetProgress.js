import { fmt, buildBudgetProgress } from '@/lib/finance';

export default function BudgetProgress({ catEntries, budgets, nMonths, catColors }) {
  const rows = buildBudgetProgress(catEntries, budgets, nMonths);

  if (!rows.length) return null;

  return (
    <div className="panel">
      <h2>
        Metas por categoria <span className="sub">gasto mensal médio vs. meta definida</span>
      </h2>
      <div className="budget-list">
        {rows.map((r) => (
          <div className="budget-row" key={r.cat}>
            <div className="budget-row-head">
              <span>{r.cat}</span>
              <span className={r.exceeded ? 'over' : ''}>
                {fmt(r.monthly)} / {fmt(r.goal)}
              </span>
            </div>
            <div className="budget-track">
              <div
                className="budget-fill"
                style={{ width: r.pct + '%', background: r.exceeded ? 'var(--rust)' : (catColors[r.cat] || '#B4B2A9') }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
