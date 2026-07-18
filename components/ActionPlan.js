'use client';

import { useMemo, useState } from 'react';
import { catColorMap, FALLBACK_CATEGORY_COLOR, normalizeValue } from '@/lib/finance';
import Modal from '@/components/Modal';

const STATUS_LABEL = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };

function formatDueDate(due_date) {
  if (!due_date) return '—';
  const [y, m, d] = String(due_date).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function formatAmount(v) {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ActionPlan({ items, categories, onCreate, onUpdate, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const catColors = useMemo(() => catColorMap(categories), [categories]);

  const openItems = items.filter((i) => i.status !== 'done');
  const doneItems = items.filter((i) => i.status === 'done');

  const isEditing = editingId !== null;
  const isModalOpen = isAdding || isEditing;

  function resetForm() {
    setTitle('');
    setCategory('');
    setTargetAmount('');
    setDueDate('');
  }

  function closeModal() {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  }

  function openEdit(item) {
    setTitle(item.title || '');
    setCategory(item.category || '');
    setTargetAmount(item.target_amount !== null && item.target_amount !== undefined ? String(item.target_amount) : '');
    setDueDate(item.due_date ? String(item.due_date).slice(0, 10) : '');
    setEditingId(item.id);
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const payload = {
      title: trimmed,
      category: category || null,
      target_amount: targetAmount.trim() ? normalizeValue(targetAmount.trim()) : null,
      due_date: dueDate || null,
    };
    try {
      if (isEditing) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      closeModal();
    } catch (e) {
      // erro já é exibido no banner da página
    }
  }

  function renderRow(item) {
    const color = item.category ? catColors[item.category] || FALLBACK_CATEGORY_COLOR : null;
    const isDone = item.status === 'done';
    return (
      <tr key={item.id}>
        <td style={isDone ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{item.title}</td>
        <td>
          {item.category ? (
            <div className="cat-name"><span className="cat-swatch" style={{ background: color }} />{item.category}</div>
          ) : '—'}
        </td>
        <td className="mono" style={{ textAlign: 'right' }}>{formatAmount(item.target_amount)}</td>
        <td className="mono">{formatDueDate(item.due_date)}</td>
        <td>
          <select
            className="cat-select"
            value={item.status}
            onChange={(e) => onUpdate(item.id, { status: e.target.value })}
          >
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="done">Concluído</option>
          </select>
        </td>
        <td>
          <button className="btn-text" title="Editar item" onClick={() => openEdit(item)}>
            Editar
          </button>
        </td>
        <td>
          <button className="remove-row" title="Excluir item" onClick={() => onDelete(item.id)}>
            &times;
          </button>
        </td>
      </tr>
    );
  }

  return (
    <div className="panel">
      <h2>
        <span>
          Plano de ação <span className="sub">metas e cortes que você decidiu perseguir, com acompanhamento de status</span>
        </span>
        <button className="btn-accent" onClick={() => { resetForm(); setIsAdding(true); }}>+ Novo item de ação</button>
      </h2>

      {openItems.length === 0 && doneItems.length === 0 ? (
        <div className="empty">
          <div className="big">Nenhum item ainda</div>
          <div>Adicione uma meta manualmente ou use o botão &quot;Adicionar ao plano&quot; nas sugestões do parecer.</div>
        </div>
      ) : (
        <>
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th style={{ textAlign: 'right' }}>Valor-alvo</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {openItems.length > 0 ? openItems.map(renderRow) : (
                  <tr><td colSpan="7" className="hint">Nenhum item em aberto.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {doneItems.length > 0 && (
            <details style={{ marginTop: 18 }}>
              <summary className="hint" style={{ cursor: 'pointer' }}>Concluídos ({doneItems.length})</summary>
              <div className="scroll-x" style={{ marginTop: 10 }}>
                <table>
                  <tbody>
                    {doneItems.map(renderRow)}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}

      <Modal open={isModalOpen} onClose={closeModal} eyebrow="Plano de ação" title={isEditing ? 'Editar item de ação' : 'Novo item de ação'}>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Título</label>
            <input
              type="text"
              placeholder="Ex: Reduzir gasto em Restaurantes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Nenhuma</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Valor-alvo (R$)</label>
            <input
              type="text"
              placeholder="Opcional"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Prazo</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" className="btn-text" onClick={closeModal}>Cancelar</button>
          <button onClick={handleSave}>{isEditing ? 'Salvar alterações' : 'Adicionar item'}</button>
        </div>
      </Modal>
    </div>
  );
}
