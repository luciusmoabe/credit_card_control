import { fmt } from '@/lib/finance';

export default function Ticket({ title, total, hasData }) {
  return (
    <div className="ticket">
      <p className="ticket-eyebrow">Painel Financeiro Integrado</p>
      <div className="ticket-row">
        <div>
          <h1>{hasData ? title : 'Nenhum lançamento importado'}</h1>
        </div>
        <div className="ticket-total">
          <div className="lbl">Total no período selecionado</div>
          <div className="num">{hasData ? fmt(total) : '—'}</div>
        </div>
      </div>
    </div>
  );
}
