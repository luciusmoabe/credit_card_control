'use client';

export default function DangerZone({ txnCount, onClearAll }) {
  if (!txnCount) return null;

  function handleConfirm() {
    if (window.confirm(`Tem certeza que deseja apagar permanentemente todos os ${txnCount} lançamento(s) salvos?\nCategorias e metas continuarão intactas.\n\nEssa ação não pode ser desfeita.`)) {
      onClearAll();
    }
  }

  return (
    <div className="panel danger-zone">
      <h2>Zona de risco</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Apaga permanentemente todos os {txnCount} lançamento(s) salvos. Categorias e metas continuam intactas.
      </p>
      <button className="danger" onClick={handleConfirm}>
        Limpar todos os lançamentos
      </button>
    </div>
  );
}
