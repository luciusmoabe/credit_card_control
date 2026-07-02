import { fmt } from '@/lib/finance';

export default function InstallmentsTable({ parcRows }) {
  return (
    <div className="panel">
      <h2>
        Parcelamentos ativos <span className="sub">{parcRows.length ? `(${parcRows.length})` : ''}</span>
      </h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Descrição</th><th>Parcela atual</th><th>Restam</th><th>Valor/mês</th><th>Total a pagar</th>
            </tr>
          </thead>
          <tbody>
            {parcRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="hint" style={{ padding: '14px 8px' }}>
                  Nenhum parcelamento ativo neste período.
                </td>
              </tr>
            ) : (
              parcRows.map((r) => (
                <tr key={r.desc}>
                  <td>{r.desc}</td>
                  <td className="mono">{r.cur}/{r.total}</td>
                  <td className="mono">{r.remaining}</td>
                  <td className="mono">{fmt(r.valuePerMonth)}</td>
                  <td className="mono">{fmt(r.remaining * r.valuePerMonth)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
