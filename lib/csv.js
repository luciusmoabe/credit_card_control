function escapeCsvValue(v) {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// rows: array de objetos; columns: ordem das colunas no cabeçalho
export function rowsToCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((r) => columns.map((c) => escapeCsvValue(r[c])).join(','));
  return [header, ...lines].join('\r\n') + '\r\n';
}
