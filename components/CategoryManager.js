'use client';

import { useEffect, useRef, useState } from 'react';
import { sortCategoriesAlpha, CATEGORY_PALETTE, normalizeValue } from '@/lib/finance';

function ColorSwatchPicker({ value, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (disabled) {
    return <span className="color-swatch-fixed" style={{ background: value }} />;
  }

  return (
    <div className="color-picker" ref={ref}>
      <button
        type="button"
        className="color-swatch-btn"
        style={{ background: value }}
        onClick={() => setOpen((o) => !o)}
        title="Trocar cor"
      />
      {open && (
        <div className="color-picker-pop">
          {CATEGORY_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch-opt ${c.toLowerCase() === value.toLowerCase() ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => { onChange(c); setOpen(false); }}
              title={c}
            />
          ))}
          <label className="color-swatch-custom" title="Outra cor">
            <input type="color" value={value} onChange={(e) => { onChange(e.target.value); }} />
          </label>
        </div>
      )}
    </div>
  );
}

function formatBudgetValue(v) {
  if (v === undefined || v === null || v === '') return '';
  const n = Number(v);
  return isNaN(n) ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CategoryManager({ categories, budgets, onCreate, onRename, onRecolor, onDelete, onSetBudget, onClearBudget }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_PALETTE[0]);
  const sortedCategories = sortCategoriesAlpha(categories);

  const budgetMap = {};
  let totalBudget = 0;
  budgets.forEach((b) => {
    budgetMap[b.category] = b.monthly_amount;
    totalBudget += Number(b.monthly_amount) || 0;
  });

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    onCreate(name, newColor);
    setNewName('');
  }

  function commitBudget(catName, rawValue) {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      if (budgetMap[catName] !== undefined) onClearBudget(catName);
      return;
    }
    const v = normalizeValue(trimmed);
    if (v !== null && v > 0) onSetBudget(catName, v);
  }

  return (
    <div className="panel">
      <h2>
        Categorias e metas <span className="sub">personalize categorias e defina um teto mensal por categoria</span>
      </h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr><th>Cor</th><th>Categoria</th><th>Meta mensal</th><th></th></tr>
          </thead>
          <tbody>
            {sortedCategories.map((c) => (
              <tr key={c.name}>
                <td>
                  <ColorSwatchPicker
                    value={c.color}
                    disabled={c.is_system}
                    onChange={(color) => onRecolor(c.name, color)}
                  />
                </td>
                <td>
                  {c.is_system ? (
                    <span>{c.name}</span>
                  ) : (
                    <input
                      className="staging-row-edit"
                      defaultValue={c.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== c.name) onRename(c.name, v);
                        else e.target.value = c.name;
                      }}
                    />
                  )}
                </td>
                <td>
                  <input
                    className="staging-row-edit value"
                    placeholder="Sem meta"
                    defaultValue={formatBudgetValue(budgetMap[c.name])}
                    onBlur={(e) => commitBudget(c.name, e.target.value)}
                  />
                </td>
                <td>
                  {!c.is_system && (
                    <button className="remove-row" title="Excluir categoria" onClick={() => onDelete(c.name)}>
                      &times;
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="2" style={{ textAlign: 'right', fontSize: '12px' }}>Soma das Metas</th>
              <th style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '13px', color: 'var(--ink)' }}>
                {totalBudget > 0 ? formatBudgetValue(totalBudget) : ''}
              </th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <ColorSwatchPicker value={newColor} onChange={setNewColor} />
        <input
          type="text"
          placeholder="Nova categoria"
          style={{ width: 200 }}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="ghost" onClick={handleAdd}>Adicionar categoria</button>
      </div>
      <p className="hint">
        &quot;Pagamento Fatura&quot; e &quot;Outros&quot; são categorias fixas do sistema (não podem ser renomeadas
        ou excluídas). Excluir uma categoria move os lançamentos dela para &quot;Outros&quot;.
      </p>
    </div>
  );
}
