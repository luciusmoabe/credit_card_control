import { fmt } from '@/lib/finance';

export default function SubscriptionsList({ subs }) {
  const sorted = [...subs].sort((a, b) => b.value - a.value);

  return (
    <div className="panel">
      <h2>
        Assinaturas detectadas <span className="sub">{subs.length ? `(${subs.length})` : ''}</span>
      </h2>
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
