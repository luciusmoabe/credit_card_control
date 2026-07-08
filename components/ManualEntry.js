'use client';

import { useState } from 'react';
import { categorize } from '@/lib/finance';
import { showToast } from '@/components/Toast';

export default function ManualEntry({ onSave, banks, categories, overrides }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [date, setDate] = useState(today);
  const [period, setPeriod] = useState(currentMonth);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [bank, setBank] = useState(banks[0] || '');
  const [accountType, setAccountType] = useState('credit_card');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-categorize when description changes
  const handleDescriptionChange = (e) => {
    const desc = e.target.value;
    setDescription(desc);
    const cat = categorize(desc, overrides, categories.map(c => c.name));
    if (cat && !category) {
      setCategory(cat);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const parsedValue = parseFloat(value.replace(',', '.'));
    if (isNaN(parsedValue)) {
      showToast('Valor inválido', 'error');
      return;
    }

    setIsSaving(true);
    
    const transaction = {
      period,
      bank,
      date,
      description,
      value: parsedValue,
      category: category || categorize(description, overrides, categories.map(c => c.name)) || 'Outros',
      account_type: accountType
    };

    try {
      await onSave([transaction]);
      showToast('Lançamento adicionado com sucesso', 'success');
      
      // Reset only description and value to allow quick multiple entries
      setDescription('');
      setValue('');
      setCategory('');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar lançamento', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      <h2>Lançamento Manual <span className="sub">adicione um gasto avulso</span></h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Competência (Mês/Ano)</label>
          <input 
            type="text" 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            placeholder="AAAA-MM" 
            required 
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Data (Dia/Mês)</label>
          <input 
            type="text" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            placeholder="DD/MM" 
            required 
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Descrição</label>
          <input 
            type="text" 
            value={description} 
            onChange={handleDescriptionChange} 
            placeholder="Ex: Almoço Restaurante X" 
            required 
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Valor (R$)</label>
          <input 
            type="text" 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            placeholder="Ex: 45,90" 
            required 
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Tipo de Conta</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value)} style={{ width: '100%' }}>
            <option value="credit_card">💳 Cartão de Crédito</option>
            <option value="checking_account">🏦 Conta-Corrente</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Banco</label>
          <input 
            type="text" 
            value={bank} 
            onChange={e => setBank(e.target.value)} 
            placeholder="Ex: Nubank" 
            required 
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }}>
            <option value="">(Automática)</option>
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="submit" disabled={isSaving} style={{ width: 'auto', minWidth: '150px' }}>
            {isSaving ? 'Salvando...' : 'Adicionar Lançamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
