'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Limpa cookies corrompidos do NextAuth ao carregar a página de login
  useEffect(() => {
    document.cookie.split(';').forEach(c => {
      const name = c.trim().split('=')[0];
      if (name.startsWith('next-auth') || name.startsWith('__Secure-next-auth')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/'
      });

      console.log('signIn response:', JSON.stringify(res));

      if (res?.error) {
        setError(`Erro: ${res.error} (status: ${res.status})`);
      } else if (res?.ok) {
        window.location.href = '/';
      } else {
        setError('Resposta inesperada do servidor');
      }
    } catch (err) {
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative background shapes for an elegant look */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'var(--teal-bg)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.6, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'var(--mustard-bg)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.5, zIndex: 0 }} />

      <form onSubmit={handleSubmit} style={{ 
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '3rem 2.5rem', 
        borderRadius: '24px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)', 
        border: '1px solid rgba(255, 255, 255, 0.6)', 
        width: '100%', 
        maxWidth: '420px',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--ink)', color: '#F3F1EA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', letterSpacing: '.02em'
          }}>
            PF
          </div>
        </div>

        <h1 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Acesse sua conta</h1>
        
        {error && <div style={{ 
          color: 'var(--rust)', background: 'var(--rust-bg)', padding: '0.75rem', borderRadius: '8px', 
          marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem', wordBreak: 'break-word', border: '1px solid rgba(193, 86, 46, 0.2)' 
        }}>{error}</div>}
        
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-soft)', fontSize: '0.85rem', fontWeight: 500 }}>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} 
                 style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--paper)', color: 'var(--ink)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }} 
                 onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                 onBlur={e => e.target.style.borderColor = 'var(--line)'}
                 required />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--ink-soft)', fontSize: '0.85rem', fontWeight: 500 }}>Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} 
                 style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--paper)', color: 'var(--ink)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }} 
                 onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                 onBlur={e => e.target.style.borderColor = 'var(--line)'}
                 required />
        </div>
        
        <button type="submit" disabled={loading} style={{ 
          width: '100%', padding: '0.85rem', background: 'var(--ink)', color: '#F3F1EA', 
          border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer', fontWeight: '600', fontSize: '1rem',
          opacity: loading ? 0.7 : 1, transition: 'transform 0.1s, opacity 0.2s',
          transform: loading ? 'scale(0.98)' : 'scale(1)'
        }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
