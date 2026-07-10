'use client';

import { useState } from 'react';
import { categorize } from '@/lib/finance';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function ManualEntry({ onSave, banks, categories, overrides }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch (err) {
      showToast(err.message || 'Erro ao salvar lançamento', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      <h2>
        <span>Lançamento Manual <span className="sub">adicione um gasto avulso</span></span>
        <button type="button" className="btn-accent" onClick={() => setOpen(true)}>+ Novo lançamento</button>
      </h2>
      <p className="hint" style={{ marginTop: 0 }}>Registre uma compra ou pagamento avulso que não veio de uma importação de PDF/CSV.</p>

      <Modal open={open} onClose={() => setOpen(false)} eyebrow="Lançamento manual" title="Novo lançamento">
      <form onSubmit={handleSubmit} className="form-grid">

        <div className="field">
          <label>Competência (Mês/Ano)</label>
          <input
            type="text"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            placeholder="AAAA-MM"
            required
          />
        </div>

        <div className="field">
          <label>Data (Dia/Mês)</label>
          <input
            type="text"
            value={date}
            onChange={e => setDate(e.target.value)}
            placeholder="DD/MM"
            required
          />
        </div>

        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Descrição</label>
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Ex: Almoço Restaurante X"
            required
          />
        </div>

        <div className="field">
          <label>Valor (R$)</label>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ex: 45,90"
            required
          />
        </div>

        <div className="field">
          <label>Tipo de Conta</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value)}>
            <option value="credit_card">💳 Cartão de Crédito</option>
            <option value="checking_account">🏦 Conta-Corrente</option>
          </select>
        </div>

        <div className="field">
          <label>Banco</label>
          <input
            type="text"
            value={bank}
            onChange={e => setBank(e.target.value)}
            placeholder="Ex: Nubank"
            required
          />
        </div>

        <div className="field">
          <label>Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">(Automática)</option>
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '0.5rem' }}>
          <button type="button" className="btn-text" onClick={() => setOpen(false)}>Cancelar</button>
          <button type="submit" disabled={isSaving} style={{ width: 'auto', minWidth: '150px' }}>
            {isSaving ? 'Salvando...' : 'Adicionar Lançamento'}
          </button>
        </div>
      </form>
      </Modal>
    </div>
  );
}
