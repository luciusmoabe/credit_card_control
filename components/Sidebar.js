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
  subscriptions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11a8 8 0 0 0-14.9-4" />
      <path d="M4 3v4.5h4.5" />
      <path d="M4 13a8 8 0 0 0 14.9 4" />
      <path d="M20 21v-4.5h-4.5" />
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
  income: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  admin_users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  my_account: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

export const SECTIONS = [
  { id: 'overview', label: 'Dashboard' },
  { type: 'divider' },
  { id: 'categories', label: 'Categorias & Metas' },
  { id: 'import', label: 'Importação de Dados' },
  { id: 'income', label: 'Renda' },
  { type: 'divider' },
  { id: 'transactions', label: 'Lançamentos' },
  { id: 'commitments', label: 'Parcelamentos' },
  { id: 'subscriptions', label: 'Assinaturas' },
  { type: 'divider' },
  { id: 'parecer', label: 'Parecer do Especialista' },
];

import { useState } from 'react';

export default function Sidebar({ active, onSelect, role }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const handleSelect = (id) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Overlay for mobile drawer */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">PF</span>
        <span className="sidebar-brand-name">Painel Financeiro</span>
      </div>
      <ul className="sidebar-nav">
        {SECTIONS.map((s, idx) => {
          if (s.type === 'divider') {
            return <hr key={`div-${idx}`} className="sidebar-divider" />;
          }
          return (
            <li key={s.id}>
              <button
                className={`sidebar-link ${active === s.id ? 'active' : ''}`}
                onClick={() => handleSelect(s.id)}
              >
                <span className="sidebar-icon">{ICONS[s.id]}</span>
                {s.label}
              </button>
            </li>
          );
        })}
        {role === 'admin' && (
          <>
            <hr className="sidebar-divider" />
            <li key="admin_users">
              <button
                className={`sidebar-link ${active === 'admin_users' ? 'active' : ''}`}
                onClick={() => handleSelect('admin_users')}
              >
                <span className="sidebar-icon">{ICONS['admin_users']}</span>
                Administração de Usuários
              </button>
            </li>
          </>
        )}
      </ul>
      </nav>
    </>
  );
}
