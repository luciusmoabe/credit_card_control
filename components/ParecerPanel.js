'use client';

import 'chart.js/auto';
import { useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import ParecerDoc from './ParecerDoc';
import { showToast } from '@/components/Toast';
import {
  buildDiagnostics,
  buildBudgetDiagnostics,
  buildIncomeDiagnostics,
  buildInvestmentPlan,
  buildFallbackRecommendations,
  buildRecommendationsHtml,
  buildAiPayload,
  FALLBACK_CATEGORY_COLOR,
  fmt,
} from '@/lib/finance';

// Renders its own (visually hidden) donut chart instead of reusing the one on
// the Visão Geral section — that panel may not be mounted when the parecer
// is generated, since sections unmount when you navigate away from them.
export default function ParecerPanel({ analysis, budgets, catColors, categories, expenseVsIncome, incomeCommitment, onAddToPlan }) {
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);
  const [addedKeys, setAddedKeys] = useState(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const snapshotChartRef = useRef(null);

  async function handleGerar() {
    if (!analysis.count) {
      setStatus('Nenhum gasto no filtro selecionado. Ajuste o período/banco na Visão geral.');
      return;
    }

    setGenerating(true);
    setAddedKeys(new Set());
    const diagnostics = buildDiagnostics(analysis)
      .concat(buildBudgetDiagnostics(analysis.catEntries, budgets, analysis.nMonths))
      .concat(buildIncomeDiagnostics(expenseVsIncome, incomeCommitment));
    const investmentPlan = buildInvestmentPlan(
      analysis,
      expenseVsIncome?.netIncome ?? null,
      expenseVsIncome?.source ?? null,
      categories,
    );
    const fallbackHtml = buildRecommendationsHtml(buildFallbackRecommendations(analysis, categories));
    let chartImage = null;
    try {
      chartImage = snapshotChartRef.current?.toBase64Image() || null;
    } catch (e) {
      chartImage = null;
    }
    setStatus('Analisando seus dados e gerando recomendações personalizadas...');
    setDoc({ a: analysis, diagnostics, recsHtml: fallbackHtml, aiGenerated: false, chartImage, expenseVsIncome, incomeCommitment, investmentPlan });

    try {
      const res = await fetch('/api/parecer/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiPayload(analysis, expenseVsIncome, incomeCommitment)),
      });
      if (!res.ok) throw new Error('IA indisponível');
      const { html } = await res.json();
      setDoc({ a: analysis, diagnostics, recsHtml: `<div class="ai-rec">${html}</div>`, aiGenerated: true, chartImage, expenseVsIncome, incomeCommitment, investmentPlan });
      setStatus('Parecer gerado. Revise abaixo e exporte em PDF quando quiser.');
    } catch (e) {
      setStatus('Parecer gerado com recomendações padrão (análise personalizada por IA indisponível no momento).');
    } finally {
      setGenerating(false);
    }
  }

  function cutItem(c) {
    return {
      title: `Reduzir gasto em ${c.cat}`,
      description: `Reduza o gasto mensal com "${c.cat}" de ${fmt(c.monthly)} para até ${fmt(c.newMonthly)} — um corte de ${fmt(c.cut)}/mês. Direcione a diferença economizada para investimentos ou para a reserva de emergência.`,
      category: c.cat,
      target_amount: c.cut,
    };
  }

  function diagItem(d) {
    return {
      title: d.topic || d.tag,
      description: d.html ? d.html.replace(/<[^>]+>/g, '') : null,
      category: null,
      target_amount: null,
    };
  }

  async function handleAddToPlan(item, key, silent) {
    try {
      await onAddToPlan(item);
      setAddedKeys((prev) => new Set(prev).add(key));
      if (!silent) showToast('Adicionado ao plano de ação', 'success');
      return true;
    } catch (e) {
      showToast(e.message || 'Erro ao adicionar ao plano de ação', 'error');
      return false;
    }
  }

  function pendingSuggestions() {
    const cuts = (doc?.investmentPlan?.cuts || [])
      .filter((c) => !addedKeys.has(`cut:${c.cat}`))
      .map((c) => ({ item: cutItem(c), key: `cut:${c.cat}` }));
    const diags = (doc?.diagnostics || [])
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => d.sev === 'warn' && !addedKeys.has(`diag:${i}`))
      .map(({ d, i }) => ({ item: diagItem(d), key: `diag:${i}` }));
    return [...cuts, ...diags];
  }

  async function handleAddAllToPlan() {
    const pending = pendingSuggestions();
    if (!pending.length) return;
    setAddingAll(true);
    let added = 0;
    for (const { item, key } of pending) {
      if (await handleAddToPlan(item, key, true)) added++;
    }
    setAddingAll(false);
    if (added) showToast(`${added} sugestão(ões) adicionada(s) ao plano de ação`, 'success');
  }

  function handleExport() {
    const nome = 'parecer_financeiro_' + (analysis.selPeriod === '__all__' ? 'geral' : analysis.selPeriod);
    const oldTitle = document.title;
    document.title = nome;
    setStatus('Abrindo a janela de impressão... escolha "Salvar como PDF" como destino.');

    const afterPrint = () => {
      document.title = oldTitle;
      window.removeEventListener('afterprint', afterPrint);
      setStatus('Se você escolheu "Salvar como PDF" na janela de impressão, o arquivo já foi baixado.');
    };
    window.addEventListener('afterprint', afterPrint);

    setTimeout(() => window.print(), 60);
  }

  return (
    <div className="panel" id="parecer-panel">
      <h2>
        Parecer do Educador Financeiro{' '}
        <span className="sub">análise dos seus gastos com orientações práticas de economia</span>
      </h2>
      <div className="row">
        <button onClick={handleGerar} disabled={generating}>Gerar parecer</button>
        {doc && (
          <button className="ghost" onClick={handleExport}>Exportar em PDF (imprimir)</button>
        )}
      </div>
      {status && <div className="hint">{status}</div>}
      {doc && onAddToPlan && pendingSuggestions().length > 0 && (
        <div style={{ borderLeft: '3px solid var(--teal)', background: 'var(--teal-bg)', borderRadius: 8, padding: '12px 14px', marginTop: 10 }}>
          <span className="tag">Plano de ação</span>
          <div style={{ marginTop: 6 }}>
            O parecer encontrou {pendingSuggestions().length} sugestão(ões) de ação
            {doc.investmentPlan?.cuts?.length > 0 && (
              <> — cortes de categoria que juntos liberam <strong>{fmt(doc.investmentPlan.cuts.reduce((s, c) => s + c.cut, 0))}/mês</strong> para investir</>
            )}
            .
            <div className="row" style={{ marginTop: 8 }}>
              <button type="button" className="ghost" onClick={handleAddAllToPlan} disabled={addingAll}>
                {addingAll ? 'Adicionando...' : 'Adicionar todas as sugestões ao plano de ação'}
              </button>
            </div>
          </div>
        </div>
      )}
      {analysis.catEntries.length > 0 && (
        <div className="chart-snapshot-source" style={{ position: 'absolute', left: -9999, top: 0, width: 500, height: 500 }} aria-hidden="true">
          <Doughnut
            ref={snapshotChartRef}
            width={500}
            height={500}
            data={{
              labels: analysis.catEntries.map((c) => c.cat),
              datasets: [{
                data: analysis.catEntries.map((c) => c.val),
                backgroundColor: analysis.catEntries.map((c) => catColors[c.cat] || FALLBACK_CATEGORY_COLOR),
                borderColor: '#FFFFFF',
                borderWidth: 2,
              }],
            }}
            options={{ 
              responsive: false, 
              animation: false,
              plugins: { legend: { display: false } }
            }}
          />
        </div>
      )}
      {doc && (
        <ParecerDoc
          a={doc.a}
          diagnostics={doc.diagnostics}
          recsHtml={doc.recsHtml}
          aiGenerated={doc.aiGenerated}
          chartImage={doc.chartImage}
          catColors={catColors}
          expenseVsIncome={doc.expenseVsIncome}
          incomeCommitment={doc.incomeCommitment}
          investmentPlan={doc.investmentPlan}
          onAddCutToPlan={onAddToPlan ? (c) => handleAddToPlan(cutItem(c), `cut:${c.cat}`, false) : undefined}
          onAddDiagnosticToPlan={onAddToPlan ? (d, i) => handleAddToPlan(diagItem(d), `diag:${i}`, false) : undefined}
          addedKeys={addedKeys}
        />
      )}
    </div>
  );
}
