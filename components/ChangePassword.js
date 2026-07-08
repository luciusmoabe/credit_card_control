'use client';

import { useState } from 'react';
import { showToast } from '@/components/Toast';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('A nova senha e a confirmação não coincidem.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('A nova senha deve ser diferente da atual.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao alterar a senha.', 'error');
      } else {
        showToast('Senha alterada com sucesso!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--line)',
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontSize: '0.9rem',
  };

  return (
    <div className="panel">
      <h2>Minha Conta <span className="sub">altere sua senha de acesso</span></h2>
      
      <div style={{ maxWidth: 420, marginTop: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>
              Senha atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="Digite sua senha atual"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>
              Nova senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              placeholder="Repita a nova senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.7rem',
              borderRadius: '6px',
              background: 'var(--ink)',
              color: '#F3F1EA',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
