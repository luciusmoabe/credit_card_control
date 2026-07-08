import Ticket from './Ticket';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

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
  filterAccountType,
  onFilterAccountTypeChange,
  showFilters,
  userName,
  onProfileClick,
}) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="topbar">
      {/* Esquerda: Ticket e Filtros (apenas se showFilters for true) */}
      <div className="topbar-left">
        {showFilters && <Ticket title={title} total={total} hasData={hasData} />}
        {showFilters && hasData && (
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
            <select value={filterAccountType} onChange={(e) => onFilterAccountTypeChange(e.target.value)}>
              <option value="__all__">Todas as contas</option>
              <option value="credit_card">💳 Cartão de Crédito</option>
              <option value="checking_account">🏦 Conta-Corrente</option>
            </select>
          </div>
        )}
      </div>

      {/* Direita: Controles Globais do Usuário */}
      <div className="topbar-right">
        <button onClick={toggleTheme} className="topbar-btn theme-btn" title="Alternar Modo Escuro/Claro">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="topbar-user">
          <span className="user-name">{userName}</span>
          <button className="topbar-btn profile-btn" onClick={onProfileClick} title="Minha Conta">
            👤 Editar Perfil
          </button>
        </div>
        <button className="topbar-btn logout-btn" onClick={() => signOut()}>
          Sair
        </button>
      </div>
    </div>
  );
}
