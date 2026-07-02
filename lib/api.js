async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro na requisição (${res.status})`);
  }
  return res.json();
}

// Postgres NUMERIC columns come back from the driver as strings (to avoid
// float precision loss) — coerce to a real number before any arithmetic.
function normalizeTxn(t) {
  return { ...t, value: Number(t.value) };
}

export async function getTransactions() {
  const rows = await fetch('/api/transactions').then(handle);
  return rows.map(normalizeTxn);
}

export async function createTransactions(transactions) {
  const rows = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  }).then(handle);
  return rows.map(normalizeTxn);
}

export async function updateTransaction(id, fields) {
  const row = await fetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  }).then(handle);
  return normalizeTxn(row);
}

export function deleteTransaction(id) {
  return fetch(`/api/transactions/${id}`, { method: 'DELETE' }).then(handle);
}

export function deleteAllTransactions() {
  return fetch('/api/transactions', { method: 'DELETE' }).then(handle);
}

export function getOverrides() {
  return fetch('/api/overrides').then(handle);
}

export function upsertOverride(keyword, category) {
  return fetch('/api/overrides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, category }),
  }).then(handle);
}
