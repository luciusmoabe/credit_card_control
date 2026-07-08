import { fmt, fmtPct, FALLBACK_CATEGORY_COLOR, buildHealthBadge } from '@/lib/finance';

export default function ParecerDoc({ a, diagnostics, recsHtml, aiGenerated, chartImage, catColors }) {
  const now = new Date();
  const dataEmissao = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const escopo =
    (a.selPeriod === '__all__' ? 'Todos os períodos' : 'Período ' + a.selPeriod) +
    ' · ' +
    (a.selBank === '__all__' ? 'todos os bancos' : a.selBank);
  const health = buildHealthBadge(a, diagnostics);
  const maxCat = a.catEntries.length ? a.catEntries[0].val : 1;

  let running = 3;
  const subsSectionN = a.subs.length ? ++running : null;
  const parcSectionN = a.parcRows.length ? ++running : null;

  return (
    <div id="parecer-doc">
      <div className="doc-head parecer-section">
        <div>
          <p className="doc-eyebrow">Painel Financeiro Integrado · Educação Financeira</p>
          <p className="doc-title">Parecer Financeiro Educativo</p>
          <div className="doc-meta">{escopo} · Emitido em {dataEmissao}</div>
        </div>
        <div className="doc-total">
          <div className="lbl">Total no período</div>
          <div className="val">{fmt(a.totalSpend)}</div>
        </div>
      </div>

      <div className={`parecer-section health-badge ${health.level}`}>
        <div className="dot" />
        <div className="txt">
          <div className="lbl">{health.label}</div>
          <div className="desc">{health.desc}</div>
          {health.topics.length > 0 && (
            <div className="health-topics">
              {health.topics.map((t) => (
                <span className="health-chip" key={t}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="parecer-section">
        <h3><span className="n">1</span> Resumo do período</h3>
        <div className="doc-kpis">
          <div className="doc-kpi accent-ink"><div className="lbl">Total gasto</div><div className="val">{fmt(a.totalSpend)}</div></div>
          <div className="doc-kpi accent-ink"><div className="lbl">Lançamentos</div><div className="val">{a.count}</div></div>
          <div className="doc-kpi accent-mustard"><div className="lbl">Assinaturas/mês</div><div className="val">{fmt(a.subsTotal / a.nMonths)}</div></div>
          <div className="doc-kpi accent-rust"><div className="lbl">Parcelas a vencer</div><div className="val">{fmt(a.futureTotal)}</div></div>
        </div>
      </div>

      <div className="parecer-section">
        <h3><span className="n">2</span> Para onde foi o dinheiro</h3>
        {chartImage && <img className="chart-snap" src={chartImage} alt="Gastos por categoria" />}
        {chartImage && (
          <div className="chart-legend">
            {a.catEntries.map((c) => (
              <span key={c.cat}>
                <span className="sw" style={{ background: catColors[c.cat] || FALLBACK_CATEGORY_COLOR }} />
                {c.cat} {fmtPct(c.pct)}
              </span>
            ))}
          </div>
        )}
        <table>
          <thead><tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ textAlign: 'right' }}>% do total</th></tr></thead>
          <tbody>
            {a.catEntries.map((c) => {
              const color = catColors[c.cat] || FALLBACK_CATEGORY_COLOR;
              const barPct = Math.max(4, Math.round((c.val / maxCat) * 100));
              return (
                <tr key={c.cat}>
                  <td>
                    <div className="cat-name"><span className="cat-swatch" style={{ background: color }} />{c.cat}</div>
                    <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width: barPct + '%', background: color }} /></div>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(c.val)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmtPct(c.pct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="parecer-section">
        <h3><span className="n">3</span> Maiores compras do período</h3>
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
          <tbody>
            {a.topPurchases.map((t, i) => (
              <tr key={i}>
                <td className="mono">{t.date}</td>
                <td>{t.description}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{fmt(t.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {a.subs.length > 0 && (
        <div className="parecer-section">
          <h3><span className="n">{subsSectionN}</span> Assinaturas e recorrências</h3>
          <ul>
            {a.subs.map((s) => (
              <li key={s.id}>
                <span className="cat-name">
                  <span className="cat-swatch" style={{ background: catColors['Assinaturas'] || FALLBACK_CATEGORY_COLOR }} />
                  {s.description}
                </span>{' '}
                — <span className="mono">{fmt(s.value)}</span>
              </li>
            ))}
          </ul>
          <p>Total anualizado: <strong>{fmt((a.subsTotal / a.nMonths) * 12)}</strong>.</p>
        </div>
      )}

      {a.parcRows.length > 0 && (
        <div className="parecer-section">
          <h3><span className="n">{parcSectionN}</span> Parcelamentos ativos</h3>
          <table>
            <thead><tr><th>Descrição</th><th style={{ textAlign: 'right' }}>Parcela</th><th style={{ textAlign: 'right' }}>Valor/mês</th><th style={{ textAlign: 'right' }}>Falta pagar</th></tr></thead>
            <tbody>
              {a.parcRows.map((r) => (
                <tr key={r.desc}>
                  <td>{r.desc}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{r.cur}/{r.total}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(r.valuePerMonth)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(r.remaining * r.valuePerMonth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="parecer-section">
        <h3>Diagnóstico do educador financeiro</h3>
        {diagnostics.map((d, i) => (
          <div className={`insight ${d.sev}`} key={i}>
            <span className="tag">{d.tag}</span>
            <div dangerouslySetInnerHTML={{ __html: d.html }} />
          </div>
        ))}
      </div>

      <div className="parecer-section">
        <h3>Recomendações e plano de ação</h3>
        <div dangerouslySetInnerHTML={{ __html: recsHtml }} />
        {aiGenerated && <p className="ai-note">Recomendações personalizadas geradas por IA a partir dos seus dados.</p>}
      </div>

      <div className="doc-foot parecer-section">
        Este parecer tem caráter educativo e foi gerado automaticamente a partir dos lançamentos importados no
        Painel Financeiro Integrado. Ele não substitui aconselhamento financeiro profissional individualizado. Revise as
        categorias dos lançamentos para maior precisão da análise.
      </div>
    </div>
  );
}
