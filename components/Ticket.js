import { fmt } from '@/lib/finance';

export default function Ticket({ title, total, hasData }) {
  return (
    <div className="ticket">
      <p className="ticket-eyebrow">Painel de faturas de cartões de crédito</p>
      <div className="ticket-row">
        <div>
          <h1>{hasData ? title : 'Nenhuma fatura importada'}</h1>
        </div>
        <div className="ticket-total">
          <div className="lbl">Total no período selecionado</div>
          <div className="num">{hasData ? fmt(total) : '—'}</div>
        </div>
      </div>
      <div className="perf">
        {hasData && Array.from({ length: 40 }).map((_, i) => <span key={i} />)}
      </div>
    </div>
  );
}
