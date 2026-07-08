'use client';

export default function DangerZone({ txnCount, onClearAll, period, bank }) {
  if (!txnCount) return null;

  const scopeLabel = `do período ${period === '__all__' ? 'completo' : period} (${bank === '__all__' ? 'todos os bancos' : bank})`;

  function handleConfirm() {
    if (window.confirm(`Tem certeza que deseja apagar permanentemente todos os ${txnCount} lançamento(s) ${scopeLabel}?\nCategorias e metas continuarão intactas.\n\nEssa ação não pode ser desfeita.`)) {
      onClearAll();
    }
  }

  return (
    <div className="panel danger-zone">
      <h2>Zona de risco</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Apaga permanentemente todos os {txnCount} lançamento(s) salvos {scopeLabel}. Categorias e metas continuam intactas.
      </p>
      <button className="danger" onClick={handleConfirm}>
        Limpar {txnCount} lançamento(s)
      </button>
    </div>
  );
}
