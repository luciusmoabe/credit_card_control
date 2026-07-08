'use client';

import { useState } from 'react';

export default function DangerZone({ txns, periods, banks, categories, onClearAll }) {
  const [delPeriod, setDelPeriod] = useState('__all__');
  const [delBank, setDelBank] = useState('__all__');
  const [delCategory, setDelCategory] = useState('__all__');

  // Calcular quantos seriam apagados
  const affected = txns.filter(t => {
    if (delPeriod !== '__all__' && t.period !== delPeriod) return false;
    if (delBank !== '__all__' && (t.bank || 'Não informado') !== delBank) return false;
    if (delCategory !== '__all__' && t.category !== delCategory) return false;
    return true;
  });
  
  const txnCount = affected.length;

  if (!txns.length) return null;

  const scopeLabel = `do período ${delPeriod === '__all__' ? 'completo' : delPeriod} (${delBank === '__all__' ? 'todos os bancos' : delBank}${delCategory === '__all__' ? '' : `, ${delCategory}`})`;

  function handleConfirm() {
    if (!txnCount) {
      alert('Nenhum lançamento corresponde a esse filtro.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja apagar permanentemente ${txnCount} lançamento(s) ${scopeLabel}?\nCategorias e metas continuarão intactas.\n\nEssa ação não pode ser desfeita.`)) {
      onClearAll(delPeriod, delBank, delCategory);
    }
  }

  return (
    <div className="panel danger-zone">
      <h2>Zona de risco</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Apaga permanentemente os lançamentos selecionados abaixo. Categorias e metas continuam intactas.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={delPeriod} onChange={e => setDelPeriod(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
          <option value="__all__">Todos os períodos</option>
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={delBank} onChange={e => setDelBank(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
          <option value="__all__">Todos os bancos</option>
          {banks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={delCategory} onChange={e => setDelCategory(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
          <option value="__all__">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button className="danger" onClick={handleConfirm} disabled={!txnCount}>
        {txnCount === 0 ? 'Nenhum lançamento' : `Limpar ${txnCount} lançamento(s)`}
      </button>
    </div>
  );
}
