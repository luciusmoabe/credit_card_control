'use client';

import { useRef, useState } from 'react';
import { showToast } from '@/components/Toast';

function fmt(n) {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PayslipImportPanel({ income, onSave, onDelete }) {
  const [reading, setReading] = useState(false);
  const [period, setPeriod] = useState('');
  const [grossStr, setGrossStr] = useState('');
  const [deductionsStr, setDeductionsStr] = useState('');
  const [netStr, setNetStr] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setReading(true);
    try {
      const { extractTextFromPdf } = await import('@/lib/pdf');
      const { parsePayslipText } = await import('@/lib/payslip');
      // O texto bruto extraído (fullText) fica só nesta variável local — é
      // consumido uma única vez por parsePayslipText e descartado; nunca vai
      // para o estado do componente, nunca é logado, nunca é enviado a
      // lugar nenhum. Só os 4 campos nomeados abaixo chegam ao formulário.
      const fullText = await extractTextFromPdf(file);
      const meaningfulLength = fullText.replace(/\s/g, '').length;
      if (meaningfulLength < 30) {
        showToast('Este PDF não tem texto selecionável (pode ser um scan). Preencha os campos manualmente.', 'error');
        setReading(false);
        return;
      }

      const parsed = parsePayslipText(fullText);
      setPeriod(parsed.period || '');
      setGrossStr(parsed.gross_income !== null ? String(parsed.gross_income).replace('.', ',') : '');
      setDeductionsStr(parsed.deductions !== null ? String(parsed.deductions).replace('.', ',') : '');
      setNetStr(parsed.net_income !== null ? String(parsed.net_income).replace('.', ',') : '');
      setWarnings(parsed.warnings);
      if (parsed.warnings.length === 0) {
        showToast('Contracheque lido com sucesso. Confira os valores antes de confirmar.', 'success');
      }
    } catch (err) {
      showToast('Não foi possível ler este PDF automaticamente. Preencha os campos manualmente.', 'error');
    } finally {
      setReading(false);
    }
  }

  function parseMoneyStr(s) {
    if (!s || !s.trim()) return null;
    const n = parseFloat(s.trim().replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      showToast('Informe o período no formato AAAA-MM.', 'error');
      return;
    }
    const net_income = parseMoneyStr(netStr);
    if (net_income === null || net_income <= 0) {
      showToast('Informe um valor de líquido válido.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        period,
        gross_income: parseMoneyStr(grossStr),
        deductions: parseMoneyStr(deductionsStr),
        net_income,
      });
      showToast('Renda registrada com sucesso', 'success');
      setPeriod('');
      setGrossStr('');
      setDeductionsStr('');
      setNetStr('');
      setWarnings([]);
    } catch (err) {
      showToast(err.message || 'Erro ao salvar renda', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Excluir o registro de renda de ${p}?`)) return;
    try {
      await onDelete(p);
      showToast('Registro excluído', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao excluir', 'error');
    }
  }

  return (
    <div className="panel">
      <h2>Renda (contracheque) <span className="sub">importe o líquido do mês para acompanhar o quanto já está comprometido</span></h2>

      <p className="hint" style={{ marginTop: 0 }}>
        Extraímos só o período, o total de vantagens, o total de descontos e o líquido do PDF — nenhum outro dado
        (nome, CPF, matrícula, endereço) é lido ou guardado.
      </p>

      <div className="row" style={{ marginBottom: 16 }}>
        <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={reading}>
          {reading ? 'Lendo PDF...' : 'Carregar PDF do contracheque'}
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="alert" style={{ marginBottom: 16 }}>
          <div>
            {warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Período (Ano-Mês)</label>
          <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="AAAA-MM" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Total de Vantagens (R$)</label>
          <input type="text" value={grossStr} onChange={(e) => setGrossStr(e.target.value)} placeholder="Ex: 45.442,46" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Total de Descontos (R$)</label>
          <input type="text" value={deductionsStr} onChange={(e) => setDeductionsStr(e.target.value)} placeholder="Ex: 18.087,75" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--ink-soft)' }}>Líquido (R$)</label>
          <input type="text" value={netStr} onChange={(e) => setNetStr(e.target.value)} placeholder="Ex: 27.354,71" style={{ width: '100%' }} required />
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="submit" disabled={isSaving} style={{ width: 'auto', minWidth: '150px' }}>
            {isSaving ? 'Salvando...' : 'Confirmar importação'}
          </button>
        </div>
      </form>

      {income.length > 0 && (
        <div className="scroll-x" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th style={{ textAlign: 'right' }}>Vantagens</th>
                <th style={{ textAlign: 'right' }}>Descontos</th>
                <th style={{ textAlign: 'right' }}>Líquido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {income.map((i) => (
                <tr key={i.period}>
                  <td className="mono">{i.period}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(i.gross_income)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(i.deductions)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(i.net_income)}</td>
                  <td>
                    <button className="remove-row" title="Excluir" onClick={() => handleDelete(i.period)}>
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
