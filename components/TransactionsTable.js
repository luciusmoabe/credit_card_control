import { CATEGORIES, fmt } from '@/lib/finance';

export default function TransactionsTable({
  scoped,
  filterCat,
  onFilterCatChange,
  filterSearch,
  onFilterSearchChange,
  onCategoryChange,
  onFieldChange,
  onDelete,
}) {
  const search = filterSearch.trim().toUpperCase();
  let rows = [...scoped].sort((a, b) => ((a.period + a.date) < (b.period + b.date) ? 1 : -1));
  if (filterCat !== '__all__') rows = rows.filter((t) => t.category === filterCat);
  if (search) rows = rows.filter((t) => t.description.toUpperCase().includes(search));

  function commitDate(t, value) {
    if (value !== t.date) onFieldChange(t, { date: value });
  }

  function commitDescription(t, value) {
    if (value !== t.description) onFieldChange(t, { description: value });
  }

  function commitValue(t, value) {
    const v = parseFloat(String(value).replace(',', '.'));
    if (!isNaN(v) && v !== t.value) onFieldChange(t, { value: v });
  }

  return (
    <div className="panel">
      <h2>
        Lançamentos <span className="sub">({scoped.length})</span>
      </h2>
      <div className="filters">
        <select value={filterCat} onChange={(e) => onFilterCatChange(e.target.value)}>
          <option value="__all__">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar descrição..."
          value={filterSearch}
          onChange={(e) => onFilterSearchChange(e.target.value)}
        />
      </div>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Descrição</th><th>Banco</th><th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Valor</th><th></th>
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
                <td>
                  <input
                    className="staging-row-edit date"
                    defaultValue={t.date}
                    onBlur={(e) => commitDate(t, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="staging-row-edit"
                    style={{ width: '100%', minWidth: 180 }}
                    defaultValue={t.description}
                    onBlur={(e) => commitDescription(t, e.target.value)}
                  />
                </td>
                <td><span className="tag">{t.bank || 'Não informado'}</span></td>
                <td>
                  <select
                    className="cat-select"
                    value={t.category}
                    onChange={(e) => onCategoryChange(t, e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <input
                    className="staging-row-edit value"
                    defaultValue={t.value}
                    onBlur={(e) => commitValue(t, e.target.value)}
                  />
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
    </div>
  );
}
