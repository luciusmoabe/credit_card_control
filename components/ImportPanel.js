'use client';

import { useRef, useState } from 'react';
import { categorize } from '@/lib/finance';

const BANK_PRESETS = ['Banco do Brasil', 'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Inter', 'C6 Bank'];

export default function ImportPanel({
  periodLabel,
  onPeriodLabelChange,
  bankLabel,
  onBankLabelChange,
  importText,
  onImportTextChange,
  staging,
  onStagingChange,
  overrides,
  parseFeedback,
  onParseFeedbackChange,
  onParse,
  onConfirm,
  onCancel,
  onClearAll,
}) {
  const [bankPreset, setBankPreset] = useState('');
  const [readingPdf, setReadingPdf] = useState(false);
  const fileInputRef = useRef(null);

  function handleBankPreset(e) {
    const value = e.target.value;
    setBankPreset(value);
    if (value && value !== '__outro__') {
      onBankLabelChange(value);
    } else if (value === '__outro__') {
      onBankLabelChange('');
    }
  }

  async function handlePdfFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setReadingPdf(true);
    onParseFeedbackChange('Lendo PDF...');
    try {
      const { extractTextFromPdf } = await import('@/lib/pdf');
      const fullText = await extractTextFromPdf(file);
      const meaningfulLength = fullText.replace(/\s/g, '').length;
      if (meaningfulLength < 30) {
        onParseFeedbackChange(
          'Este PDF não tem texto selecionável (pode ser uma imagem/scan, ou usar uma fonte incorporada que o navegador não consegue decodificar). Cole os lançamentos manualmente no campo acima.',
        );
      } else {
        onImportTextChange(fullText);
        onParseFeedbackChange('Texto extraído do PDF. Revise abaixo e clique em "Analisar lançamentos". Faturas com colunas incomuns podem precisar de ajuste manual.');
      }
    } catch (err) {
      onParseFeedbackChange('Não foi possível ler este PDF automaticamente. Cole os lançamentos manualmente no campo acima.');
    } finally {
      setReadingPdf(false);
    }
  }

  function updateRow(i, field, value) {
    const next = staging.map((row, idx) => {
      if (idx !== i) return row;
      if (field === 'value') {
        const v = parseFloat(String(value).replace(',', '.'));
        return { ...row, value: isNaN(v) ? row.value : v };
      }
      if (field === 'description') {
        return { ...row, description: value, category: categorize(value, overrides) };
      }
      return { ...row, [field]: value };
    });
    onStagingChange(next);
  }

  function removeRow(i) {
    onStagingChange(staging.filter((_, idx) => idx !== i));
  }

  return (
    <div className="panel">
      <h2>
        Importar fatura <span className="sub">de qualquer banco — cole o texto, um CSV ou faça upload do PDF</span>
      </h2>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Período (ex: 2026-07)"
          style={{ width: 150 }}
          value={periodLabel}
          onChange={(e) => onPeriodLabelChange(e.target.value)}
        />
        <input
          type="text"
          placeholder="Banco (ex: Nubank)"
          style={{ width: 160 }}
          value={bankLabel}
          onChange={(e) => onBankLabelChange(e.target.value)}
        />
        <select value={bankPreset} onChange={handleBankPreset} style={{ width: 170 }}>
          <option value="">Banco (opcional)</option>
          {BANK_PRESETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
          <option value="__outro__">Outro (digitar ao lado)</option>
        </select>
        <button className="ghost" onClick={() => fileInputRef.current?.click()} disabled={readingPdf}>
          {readingPdf ? 'Lendo PDF...' : 'Carregar PDF'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handlePdfFile}
        />
        <button onClick={onParse}>Analisar lançamentos</button>
        <button className="ghost" onClick={onClearAll}>Limpar tudo</button>
      </div>
      <textarea
        placeholder="Cole aqui os lançamentos da fatura..."
        value={importText}
        onChange={(e) => onImportTextChange(e.target.value)}
      />
      <p className="hint">
        Aceita quase qualquer formato de fatura ou extrato: linhas com data + descrição + valor
        (<code>DD/MM</code>, <code>DD/MM/AAAA</code> ou <code>AAAA-MM-DD</code>), CSV exportado do
        app do banco (<code>data,descrição,valor</code>) e valores com <code>R$</code>,{' '}
        <code>US$</code>, ponto ou vírgula decimal. Pagamentos/estornos podem vir com{' '}
        <code>-</code> na frente, atrás, ou entre parênteses. Se o PDF for uma imagem/scan sem
        texto selecionável, cole os lançamentos manualmente. Depois de analisar, você confere e
        ajusta cada linha antes de confirmar a importação.
      </p>
      {parseFeedback && <div className="hint">{parseFeedback}</div>}

      {staging.length > 0 && (
        <div className="staging">
          <div className="staging-head">
            <div className="title">
              Prévia da importação{bankLabel ? ' · ' + bankLabel : ''}
            </div>
            <div className="row">
              <button className="ghost" onClick={onCancel}>Cancelar</button>
              <button onClick={onConfirm}>Confirmar {staging.length} lançamento(s)</button>
            </div>
          </div>
          <div className="scroll-x">
            <table>
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Valor</th><th></th></tr>
              </thead>
              <tbody>
                {staging.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className="staging-row-edit date"
                        value={t.date}
                        onChange={(e) => updateRow(i, 'date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="staging-row-edit"
                        style={{ width: '100%' }}
                        value={t.description}
                        onChange={(e) => updateRow(i, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="staging-row-edit value"
                        value={t.value}
                        onChange={(e) => updateRow(i, 'value', e.target.value)}
                      />
                    </td>
                    <td>
                      <button className="remove-row" title="Remover linha" onClick={() => removeRow(i)}>
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
