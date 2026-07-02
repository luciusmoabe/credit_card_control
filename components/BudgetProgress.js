import { fmt, buildBudgetProgress, FALLBACK_CATEGORY_COLOR } from '@/lib/finance';

const TIER_FILL = { over: 'var(--rust)', near: 'var(--mustard)' };
const TIER_LABEL_CLASS = { over: 'over', near: 'near' };

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
              <span className={TIER_LABEL_CLASS[r.tier] || ''}>
                {fmt(r.monthly)} / {fmt(r.goal)}
              </span>
            </div>
            <div className="budget-track">
              <div
                className="budget-fill"
                style={{ width: r.pct + '%', background: TIER_FILL[r.tier] || catColors[r.cat] || FALLBACK_CATEGORY_COLOR }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
