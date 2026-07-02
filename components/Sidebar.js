const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  ),
  commitments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="1.5" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  parecer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5h9l4 4v15H6z" />
      <path d="M15 2.5v4h4" />
      <line x1="8.5" y1="12" x2="16" y2="12" />
      <line x1="8.5" y1="15.5" x2="16" y2="15.5" />
    </svg>
  ),
};

export const SECTIONS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'transactions', label: 'Lançamentos' },
  { id: 'import', label: 'Importar' },
  { id: 'commitments', label: 'Parcelamentos' },
  { id: 'categories', label: 'Categorias & Metas' },
  { id: 'parecer', label: 'Parecer' },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">PF</span>
        <span className="sidebar-brand-name">Painel de Faturas</span>
      </div>
      <ul className="sidebar-nav">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <button
              className={`sidebar-link ${active === s.id ? 'active' : ''}`}
              onClick={() => onSelect(s.id)}
            >
              <span className="sidebar-icon">{ICONS[s.id]}</span>
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
