'use client';

import { useState } from 'react';

export default function DangerZone({ txnCount, onClearAll }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  function handleOpen() {
    setOpen(true);
    setConfirmText('');
  }

  function handleCancel() {
    setOpen(false);
    setConfirmText('');
  }

  function handleConfirm() {
    if (confirmText.trim() !== String(txnCount)) return;
    onClearAll();
    setOpen(false);
    setConfirmText('');
  }

  if (!txnCount) return null;

  return (
    <div className="panel danger-zone">
      <h2>Zona de risco</h2>
      {!open ? (
        <>
          <p className="hint" style={{ marginTop: 0 }}>
            Apaga permanentemente todos os {txnCount} lançamento(s) salvos. Categorias e metas continuam intactas.
          </p>
          <button className="danger" onClick={handleOpen}>Limpar todos os lançamentos</button>
        </>
      ) : (
        <>
          <p className="hint" style={{ marginTop: 0 }}>
            Essa ação não pode ser desfeita. Para confirmar, digite <strong>{txnCount}</strong> — o
            número atual de lançamentos salvos — no campo abaixo.
          </p>
          <div className="row">
            <input
              type="text"
              inputMode="numeric"
              placeholder={String(txnCount)}
              style={{ width: 120 }}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
            />
            <button className="danger" disabled={confirmText.trim() !== String(txnCount)} onClick={handleConfirm}>
              Apagar {txnCount} lançamento(s)
            </button>
            <button className="ghost" onClick={handleCancel}>Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}
