import { fmt } from '@/lib/finance';

export default function SubscriptionsList({ subs }) {
  const sorted = [...subs].sort((a, b) => b.value - a.value);

  const totalValue = subs.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>
          Assinaturas detectadas <span className="sub">{subs.length ? `(${subs.length})` : ''}</span>
        </h2>
        {subs.length > 0 && (
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-color)' }}>
            Total: {fmt(totalValue)}
          </div>
        )}
      </div>
      {sorted.length === 0 ? (
        <div className="hint">Nenhuma assinatura identificada neste período.</div>
      ) : (
        <div className="sub-list">
          {sorted.map((s) => (
            <div className="sub-item" key={s.id}>
              <div>
                <div className="desc">{s.description}</div>
                <div className="meta">{s.date}</div>
              </div>
              <div className="amt">{fmt(s.value)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
