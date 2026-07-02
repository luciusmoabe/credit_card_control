'use client';

import { useState } from 'react';
import { sortCategoriesAlpha } from '@/lib/finance';

export default function CategoryManager({ categories, budgets, onCreate, onRename, onRecolor, onDelete, onSetBudget, onClearBudget }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#7F77DD');
  const sortedCategories = sortCategoriesAlpha(categories);

  const budgetMap = {};
  budgets.forEach((b) => {
    budgetMap[b.category] = b.monthly_amount;
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
    const v = parseFloat(trimmed.replace(',', '.'));
    if (!isNaN(v) && v > 0) onSetBudget(catName, v);
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
                  <input
                    type="color"
                    value={c.color}
                    disabled={c.is_system}
                    onChange={(e) => onRecolor(c.name, e.target.value)}
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
                    defaultValue={budgetMap[c.name] ?? ''}
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
        </table>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
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
