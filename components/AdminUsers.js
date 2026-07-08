'use client';
import { useState, useEffect } from 'react';
import { showToast } from '@/components/Toast';

export default function AdminUsers({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isEditing = !!editingUserId;
      const url = isEditing ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = { name, email, role, active };
      if (password) payload.password = password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário`);
      
      showToast(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
      resetForm();
      loadUsers();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, userName) {
    if (id === currentUserId) {
      showToast('Você não pode excluir a si mesmo.', 'error');
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userName}? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir usuário');
      
      showToast('Usuário excluído com sucesso!', 'success');
      if (editingUserId === id) resetForm();
      loadUsers();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  function handleEdit(u) {
    setEditingUserId(u.id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setActive(u.active !== false); // Default to true if undefined
    setPassword(''); // don't load password
  }

  function resetForm() {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setActive(true);
  }

  return (
    <div className="panel">
      <h2>Gestão de Usuários</h2>
      <p style={{ marginBottom: '2rem' }}>Apenas administradores podem ver esta tela e cadastrar novos acessos.</p>
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3>Usuários Cadastrados</h3>
          <div className="scroll-x">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Nome</th>
                <th style={{ padding: '0.5rem' }}>E-mail</th>
                <th style={{ padding: '0.5rem' }}>Perfil</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem' }}>{u.name}</td>
                  <td style={{ padding: '0.5rem' }}>{u.email}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: u.role === 'admin' ? 'var(--ink)' : 'var(--line)', color: u.role === 'admin' ? '#F3F1EA' : 'var(--ink)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: u.active !== false ? 'var(--teal-bg)' : 'var(--rust-bg)', color: u.active !== false ? 'var(--teal)' : 'var(--rust)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {u.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    <button className="ghost" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '4px' }} onClick={() => handleEdit(u)}>Editar</button>
                    <button className="danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDelete(u.id, u.name)} disabled={u.id === currentUserId}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        <div style={{ width: '350px', background: 'var(--paper)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            {editingUserId && (
              <button className="ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={resetForm}>Cancelar</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                {editingUserId ? 'Nova Senha (deixe em branco para manter)' : 'Senha provisória'}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Perfil</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%' }}>
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {editingUserId && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Status</label>
                <select value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')} style={{ width: '100%' }}>
                  <option value="true">Ativo (Pode fazer login)</option>
                  <option value="false">Inativo (Acesso bloqueado)</option>
                </select>
              </div>
            )}
            <button disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Salvando...' : (editingUserId ? 'Salvar Alterações' : 'Cadastrar')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
