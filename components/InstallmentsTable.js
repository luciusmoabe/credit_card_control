'use client';

import { useState } from 'react';
import { fmt, addMonths } from '@/lib/finance';

export default function InstallmentsTable({ parcRows, anchorPeriod }) {
  const [sortKey, setSortKey] = useState('remaining'); // 'remaining' | 'value' | 'total'
  const [sortDir, setSortDir] = useState('asc');

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return null;
    return <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  const rows = parcRows.map((r) => ({
    ...r,
    totalToPay: r.remaining * r.valuePerMonth,
    endMonth: r.remaining > 0 ? addMonths(r.anchorPeriod, r.remaining) : r.anchorPeriod,
  }));

  rows.sort((a, b) => {
    let diff = 0;
    if (sortKey === 'remaining') diff = a.remaining - b.remaining;
    else if (sortKey === 'value') diff = a.valuePerMonth - b.valuePerMonth;
    else if (sortKey === 'total') diff = a.totalToPay - b.totalToPay;
    return sortDir === 'asc' ? diff : -diff;
  });

  return (
    <div className="panel">
      <h2>
        Parcelamentos ativos{' '}
        <span className="sub">{parcRows.length ? `(${parcRows.length}) · todos os períodos, respeitando o filtro de banco` : ''}</span>
      </h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Parcela atual</th>
              <th className="sortable" onClick={() => toggleSort('remaining')}>Restam{sortIndicator('remaining')}</th>
              <th className="sortable" onClick={() => toggleSort('value')}>Valor/mês{sortIndicator('value')}</th>
              <th>Termina em</th>
              <th className="sortable" onClick={() => toggleSort('total')}>Total a pagar{sortIndicator('total')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="hint" style={{ padding: '14px 8px' }}>
                  Nenhum parcelamento ativo{anchorPeriod ? '.' : ' ainda.'}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.desc}>
                  <td>{r.desc}</td>
                  <td className="mono">{r.cur}/{r.total}</td>
                  <td className="mono">{r.remaining}</td>
                  <td className="mono">{fmt(r.valuePerMonth)}</td>
                  <td className="mono">{r.endMonth}</td>
                  <td className="mono">{fmt(r.totalToPay)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
