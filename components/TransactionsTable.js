'use client';

import { useState } from 'react';
import { fmt, sortCategoriesAlpha } from '@/lib/finance';

export default function TransactionsTable({
  scoped,
  categories,
  banks,
  filterCat,
  onFilterCatChange,
  filterBank,
  onFilterBankChange,
  filterSearch,
  onFilterSearchChange,
  onCategoryChange,
  onFieldChange,
  onDelete,
}) {
  const [editing, setEditing] = useState(null); // { id, field } | null
  const [sortKey, setSortKey] = useState('date'); // 'date' | 'description' | 'value'
  const [sortDir, setSortDir] = useState('desc');

  const search = filterSearch.trim().toUpperCase();
  const sortedCategories = sortCategoriesAlpha(categories);

  let rows = [...scoped];
  if (filterCat !== '__all__') rows = rows.filter((t) => t.category === filterCat);
  if (search) rows = rows.filter((t) => t.description.toUpperCase().includes(search));
  rows.sort((a, b) => {
    let diff = 0;
    if (sortKey === 'date') diff = (a.period + a.date) < (b.period + b.date) ? -1 : 1;
    else if (sortKey === 'description') diff = a.description.localeCompare(b.description, 'pt-BR');
    else if (sortKey === 'value') diff = a.value - b.value;
    return sortDir === 'asc' ? diff : -diff;
  });

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'value' ? 'desc' : 'asc');
    }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return null;
    return <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  function commitDate(t, value) {
    setEditing(null);
    if (value !== t.date) onFieldChange(t, { date: value });
  }

  function commitDescription(t, value) {
    setEditing(null);
    if (value !== t.description) onFieldChange(t, { description: value });
  }

  function commitValue(t, value) {
    setEditing(null);
    const v = parseFloat(String(value).replace(',', '.'));
    if (!isNaN(v) && v !== t.value) onFieldChange(t, { value: v });
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') setEditing(null);
  }

  function EditableField({ txn, field, display, inputClassName, align, onCommit }) {
    const isEditing = editing && editing.id === txn.id && editing.field === field;
    if (isEditing) {
      return (
        <input
          className={inputClassName}
          defaultValue={txn[field]}
          autoFocus
          onFocus={(e) => e.target.select()}
          onBlur={(e) => onCommit(txn, e.target.value)}
          onKeyDown={handleEditKeyDown}
        />
      );
    }
    return (
      <span
        className="cell-text"
        style={align ? { textAlign: align, display: 'block' } : undefined}
        onClick={() => setEditing({ id: txn.id, field })}
        title="Clique para editar"
      >
        {display}
      </span>
    );
  }

  const filterRow = (
    <div className="filters">
      <select value={filterCat} onChange={(e) => onFilterCatChange(e.target.value)}>
        <option value="__all__">Todas as categorias</option>
        {sortedCategories.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      <select value={filterBank} onChange={(e) => onFilterBankChange(e.target.value)}>
        <option value="__all__">Todos os bancos</option>
        {banks.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Buscar descrição..."
        value={filterSearch}
        onChange={(e) => onFilterSearchChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="panel">
      <h2>
        Lançamentos <span className="sub">({scoped.length})</span>
      </h2>
      {filterRow}

      {/* Desktop / wide screens: table */}
      <div className="scroll-x txn-table-wrap">
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('date')}>Data{sortIndicator('date')}</th>
              <th className="sortable" onClick={() => toggleSort('description')}>Descrição{sortIndicator('description')}</th>
              <th>Banco</th>
              <th>Categoria</th>
              <th className="sortable" style={{ textAlign: 'right' }} onClick={() => toggleSort('value')}>Valor{sortIndicator('value')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="hint" style={{ padding: '14px 8px' }}>
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="mono">
                  <EditableField txn={t} field="date" display={t.date} inputClassName="staging-row-edit date" onCommit={commitDate} />
                </td>
                <td>
                  <EditableField txn={t} field="description" display={t.description} inputClassName="staging-row-edit" onCommit={commitDescription} />
                </td>
                <td><span className="tag">{t.bank || 'Não informado'}</span></td>
                <td>
                  <select
                    className="cat-select"
                    value={t.category}
                    onChange={(e) => onCategoryChange(t, e.target.value)}
                  >
                    {sortedCategories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </td>
                <td className={`mono ${t.value < 0 ? 'neg' : ''}`} style={{ textAlign: 'right' }}>
                  <EditableField txn={t} field="value" display={fmt(t.value)} inputClassName="staging-row-edit value" align="right" onCommit={commitValue} />
                </td>
                <td>
                  <button className="remove-row" title="Excluir lançamento" onClick={() => onDelete(t)}>
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow screens: cards */}
      <div className="txn-cards">
        {rows.length === 0 && <div className="hint">Nenhum lançamento encontrado.</div>}
        {rows.map((t) => (
          <div className="txn-card" key={t.id}>
            <button className="remove-row txn-card-remove" title="Excluir lançamento" onClick={() => onDelete(t)}>
              &times;
            </button>
            <div className="txn-card-top">
              <div className="txn-card-desc">
                <EditableField txn={t} field="description" display={t.description} inputClassName="staging-row-edit" onCommit={commitDescription} />
              </div>
              <div className={`txn-card-value mono ${t.value < 0 ? 'neg' : ''}`}>
                <EditableField txn={t} field="value" display={fmt(t.value)} inputClassName="staging-row-edit value" onCommit={commitValue} />
              </div>
            </div>
            <div className="txn-card-meta">
              <span className="mono">
                <EditableField txn={t} field="date" display={t.date} inputClassName="staging-row-edit date" onCommit={commitDate} />
              </span>
              <span className="tag">{t.bank || 'Não informado'}</span>
              <select
                className="cat-select"
                value={t.category}
                onChange={(e) => onCategoryChange(t, e.target.value)}
              >
                {sortedCategories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
