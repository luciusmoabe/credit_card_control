'use client';

import { useState, useEffect } from 'react';

// Context-free simple Toast implementation using an event bus
const toastBus = new EventTarget();

export function showToast(message, type = 'info') {
  toastBus.dispatchEvent(new CustomEvent('show_toast', { detail: { message, type } }));
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, ...e.detail }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    toastBus.addEventListener('show_toast', handleToast);
    return () => toastBus.removeEventListener('show_toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === 'error' ? 'var(--rust)' : t.type === 'success' ? 'var(--teal)' : 'var(--ink)',
          color: '#F3F1EA',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13.5px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'toastIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          pointerEvents: 'auto'
        }}>
          {t.message}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
