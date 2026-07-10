'use client';

import { useEffect, useState } from 'react';

// Acompanha o atributo data-theme em <html> (alternado por TopBar.js via
// localStorage, sem Context) para que os gráficos Chart.js — que exigem
// cores literais em JS, não CSS vars — se recolorem junto com o toggle.
export function useChartTheme() {
  const [theme, setTheme] = useState(() =>
    typeof document === 'undefined' ? 'light' : document.documentElement.getAttribute('data-theme') || 'light',
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(root.getAttribute('data-theme') || 'light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

// Espelha os valores de --teal/--mustard/--ink-soft de app/globals.css para
// cada tema, já que Chart.js não lê CSS custom properties.
export function getChartPalette(theme) {
  return theme === 'dark'
    ? { creditCard: '#4EA38C', checking: '#E2B150', trendBar: '#4EA38C', gridLine: 'rgba(163, 177, 170, 0.25)' }
    : { creditCard: '#2F6F5E', checking: '#B98A2E', trendBar: '#2F6F5E', gridLine: 'rgba(91, 107, 98, 0.18)' };
}
