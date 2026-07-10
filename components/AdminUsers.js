'use client';
import { useState, useEffect } from 'react';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function AdminUsers({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
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
      setModalOpen(false);
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
    setModalOpen(true);
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
      <h2>
        <span>Gestão de Usuários</span>
        <button className="ghost" onClick={() => { resetForm(); setModalOpen(true); }}>+ Novo usuário</button>
      </h2>
      <p className="hint" style={{ marginTop: 0 }}>Apenas administradores podem ver esta tela e cadastrar novos acessos.</p>

      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{ padding: '0.2rem 0.5rem', background: u.role === 'admin' ? 'var(--ink)' : 'var(--line)', color: u.role === 'admin' ? '#F3F1EA' : 'var(--ink)', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </td>
                <td>
                  <span style={{ padding: '0.2rem 0.5rem', background: u.active !== false ? 'var(--teal-bg)' : 'var(--rust-bg)', color: u.active !== false ? 'var(--teal)' : 'var(--rust)', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {u.active !== false ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="ghost" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: '4px' }} onClick={() => handleEdit(u)}>Editar</button>
                  <button className="danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDelete(u.id, u.name)} disabled={u.id === currentUserId}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { resetForm(); setModalOpen(false); }}
        eyebrow="Administração"
        title={editingUserId ? 'Editar usuário' : 'Novo usuário'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field">
            <label>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>{editingUserId ? 'Nova Senha (deixe em branco para manter)' : 'Senha provisória'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId} />
          </div>
          <div className="field">
            <label>Perfil</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {editingUserId && (
            <div className="field">
              <label>Status</label>
              <select value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')}>
                <option value="true">Ativo (Pode fazer login)</option>
                <option value="false">Inativo (Acesso bloqueado)</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '0.5rem' }}>
            <button type="button" className="btn-text" onClick={() => { resetForm(); setModalOpen(false); }}>Cancelar</button>
            <button disabled={loading}>
              {loading ? 'Salvando...' : (editingUserId ? 'Salvar Alterações' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
