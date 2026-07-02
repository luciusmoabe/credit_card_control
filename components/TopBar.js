import Ticket from './Ticket';

export default function TopBar({
  title,
  total,
  hasData,
  periods,
  banks,
  filterPeriod,
  onFilterPeriodChange,
  filterBank,
  onFilterBankChange,
}) {
  return (
    <div className="topbar">
      <Ticket title={title} total={total} hasData={hasData} />
      {hasData && (
        <div className="topbar-filters">
          <span className="topbar-filters-lbl">Filtrar tudo por</span>
          <select value={filterPeriod} onChange={(e) => onFilterPeriodChange(e.target.value)}>
            <option value="__all__">Todos os períodos</option>
            {periods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select value={filterBank} onChange={(e) => onFilterBankChange(e.target.value)}>
            <option value="__all__">Todos os bancos</option>
            {banks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
