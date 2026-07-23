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
  const { transactions: rows, skipped } = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  }).then(handle);
  return { transactions: rows.map(normalizeTxn), skipped };
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

export function deleteAllTransactions(period, bank, category, accountType) {
  const query = new URLSearchParams();
  if (period && period !== '__all__') query.set('period', period);
  if (bank && bank !== '__all__') query.set('bank', bank);
  if (category && category !== '__all__') query.set('category', category);
  if (accountType && accountType !== '__all__') query.set('accountType', accountType);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return fetch(`/api/transactions${qStr}`, { method: 'DELETE' }).then(handle);
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

export function getCategories() {
  return fetch('/api/categories').then(handle);
}

export function createCategory(name, color) {
  return fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  }).then(handle);
}

export function updateCategory(name, fields) {
  return fetch('/api/categories', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...fields }),
  }).then(handle);
}

export function deleteCategory(name) {
  return fetch('/api/categories', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(handle);
}

export function getBudgets() {
  return fetch('/api/budgets').then(handle);
}

export function upsertBudget(category, monthlyAmount) {
  return fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, monthly_amount: monthlyAmount }),
  }).then(handle);
}

export function deleteBudget(category) {
  return fetch('/api/budgets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  }).then(handle);
}

function normalizeIncomeRow(r) {
  return {
    ...r,
    gross_income: r.gross_income === null ? null : Number(r.gross_income),
    deductions: r.deductions === null ? null : Number(r.deductions),
    net_income: Number(r.net_income),
  };
}

export async function getIncome() {
  const rows = await fetch('/api/income').then(handle);
  return rows.map(normalizeIncomeRow);
}

export async function upsertIncome({ period, gross_income, deductions, net_income }) {
  const row = await fetch('/api/income', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period, gross_income, deductions, net_income }),
  }).then(handle);
  return normalizeIncomeRow(row);
}

export function deleteIncome(period) {
  return fetch('/api/income', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period }),
  }).then(handle);
}

function normalizeActionItem(r) {
  return { ...r, target_amount: r.target_amount === null ? null : Number(r.target_amount) };
}

export async function getActionItems() {
  const rows = await fetch('/api/action-items').then(handle);
  return rows.map(normalizeActionItem);
}

export async function createActionItem({ title, description, category, target_amount, due_date }) {
  const row = await fetch('/api/action-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, category, target_amount, due_date }),
  }).then(handle);
  return normalizeActionItem(row);
}

export async function updateActionItem(id, fields) {
  const row = await fetch(`/api/action-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  }).then(handle);
  return normalizeActionItem(row);
}

export function deleteActionItem(id) {
  return fetch(`/api/action-items/${id}`, { method: 'DELETE' }).then(handle);
}
