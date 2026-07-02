'use client';

import 'chart.js/auto';
import { useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import ParecerDoc from './ParecerDoc';
import { buildDiagnostics, buildBudgetDiagnostics, buildFallbackRecommendations, buildRecommendationsHtml, buildAiPayload, FALLBACK_CATEGORY_COLOR } from '@/lib/finance';

// Renders its own (visually hidden) donut chart instead of reusing the one on
// the Visão Geral section — that panel may not be mounted when the parecer
// is generated, since sections unmount when you navigate away from them.
export default function ParecerPanel({ analysis, budgets, catColors }) {
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);
  const snapshotChartRef = useRef(null);

  async function handleGerar() {
    if (!analysis.count) {
      setStatus('Nenhum gasto no filtro selecionado. Ajuste o período/banco na Visão geral.');
      return;
    }

    setGenerating(true);
    const diagnostics = buildDiagnostics(analysis).concat(
      buildBudgetDiagnostics(analysis.catEntries, budgets, analysis.nMonths),
    );
    const fallbackHtml = buildRecommendationsHtml(buildFallbackRecommendations(analysis));
    let chartImage = null;
    try {
      chartImage = snapshotChartRef.current?.toBase64Image() || null;
    } catch (e) {
      chartImage = null;
    }
    setStatus('Analisando seus dados e gerando recomendações personalizadas...');
    setDoc({ a: analysis, diagnostics, recsHtml: fallbackHtml, aiGenerated: false, chartImage });

    try {
      const res = await fetch('/api/parecer/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiPayload(analysis)),
      });
      if (!res.ok) throw new Error('IA indisponível');
      const { html } = await res.json();
      setDoc({ a: analysis, diagnostics, recsHtml: `<div class="ai-rec">${html}</div>`, aiGenerated: true, chartImage });
      setStatus('Parecer gerado. Revise abaixo e exporte em PDF quando quiser.');
    } catch (e) {
      setStatus('Parecer gerado com recomendações padrão (análise personalizada por IA indisponível no momento).');
    } finally {
      setGenerating(false);
    }
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
      {analysis.catEntries.length > 0 && (
        <div className="chart-snapshot-source" style={{ position: 'absolute', left: -9999, top: 0, width: 300, height: 300 }} aria-hidden="true">
          <Doughnut
            ref={snapshotChartRef}
            data={{
              labels: analysis.catEntries.map((c) => c.cat),
              datasets: [{
                data: analysis.catEntries.map((c) => c.val),
                backgroundColor: analysis.catEntries.map((c) => catColors[c.cat] || FALLBACK_CATEGORY_COLOR),
                borderColor: '#FFFFFF',
                borderWidth: 2,
              }],
            }}
            options={{ responsive: false, animation: false }}
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
        />
      )}
    </div>
  );
}
