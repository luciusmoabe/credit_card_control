// Seed list only — the source of truth at runtime is the `categories` table
// (fetched via /api/categories), since users can rename/recolor/add/remove
// categories. 'Pagamento Fatura' and 'Outros' are seeded as system rows
// (is_system) and can't be renamed or deleted, because isSpend() and the
// auto-categorization fallback below depend on those exact names.
export const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', color: '#C1562E', default_key: 'alimentacao' },
  { name: 'Assinaturas', color: '#B98A2E', default_key: 'assinaturas' },
  { name: 'Saúde & Cuidado Pessoal', color: '#2F6F5E', default_key: 'saude' },
  { name: 'Transporte', color: '#5B6B62', default_key: 'transporte' },
  { name: 'Compras & Mercado', color: '#7F77DD', default_key: 'compras' },
  { name: 'Anuidade', color: '#993C1D', default_key: 'anuidade' },
  { name: 'IOF/Tarifas', color: '#888780', default_key: 'iof' },
  { name: 'Pagamento Fatura', color: '#639922', default_key: null },
  { name: 'Outros', color: '#B4B2A9', default_key: null },
];

export const FALLBACK_CATEGORY_COLOR = '#B4B2A9';

// Curated swatches offered when creating/recoloring a category — spread
// across distinct hues so two categories never end up visually identical in
// the chart/legend by chance the way a raw <input type="color"> allows.
export const CATEGORY_PALETTE = [
  '#C1562E', '#993C1D', '#D97B4F', '#B98A2E', '#639922',
  '#2F6F5E', '#3E7C99', '#5C6BC0', '#7F77DD', '#A5589C',
  '#C24B7C', '#5B6B62', '#4D5B3A', '#8A6D3B', '#888780', '#B4B2A9',
];

export function catColorMap(categories) {
  return Object.fromEntries(categories.map((c) => [c.name, c.color]));
}

export function sortCategoriesAlpha(categories) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
}

// Auto-categorization keyword rules, keyed by a stable `default_key` instead
// of a display name — a category row can be renamed without breaking the
// association (the category holding that default_key is looked up by the
// caller). Returns null when nothing matches ('Outros'), or the literal
// 'Pagamento Fatura' name directly since that category is unrenamable.
function classifyByRules(normalizedDesc) {
  const d = normalizedDesc;
  if (/ANUIDADE/.test(d)) return { key: 'anuidade' };
  if (/^IOF\b/.test(d)) return { key: 'iof' };
  if (/PGTO|PAGAMENTO|PAGTO/.test(d)) return { name: 'Pagamento Fatura' };
  if (/IFD|IFOOD|BAMBU|TORTARELLI|DEGUSTAR|FORMAGGIO|LANCHONETE|RESTAURANTE|PASTA|ARMAZEM|CAFE|DELICATESSEN|CHURRASC|PIZZA|BURGER|BURGO/.test(d)) return { key: 'alimentacao' };
  if (/CHATGPT|OPENAI|SPOTIFY|NETFLIX|APPLE COM|GOOGLE|SUNO|SCRIBD|KIWIFY|TOTALPASS|UBER ONE|PRIME VIDEO|DISNEY|HBO|AMAZON PRIME|CASADOCODIGO|GAZETA|SUPABASE|GITHUB|VERCEL|NOTION|ADOBE|MIDJOURNEY|ANTHROPIC|CLAUDE\.AI/.test(d)) return { key: 'assinaturas' };
  if (/DROGARIA|FARMA|BARBEARIA|ACADEMIA|GYM|CLEAN\s?JET|SALAO/.test(d)) return { key: 'saude' };
  if (/UBER(?!\s*ONE)|COMBUST|POSTO|99APP|TAXI|BESTPASS|RENTCAR|LOCACAO|URENTCAR/.test(d)) return { key: 'transporte' };
  if (/SHOPEE|MERCADOLIVRE|MERCADO LIVRE|MAGAZINE|LOJA|ATACADAO|SUPERPAO|HORTI|HIPERIDEAL|MERCA(?!DO)|GIFU|TRACK FIELD|CLARO|EDZGUTO|FERREIRA COST|EUROCAPA|GPSHOP|PAGUE MENOS|HTM PACKG|DESCOMPLICA|RP COMERCIO|ADAPTAORG|MP BARBEARIA|MELIMAIS|MCAS|CODA TEAM|PAYPAL/.test(d)) return { key: 'compras' };
  return null;
}

export function fmt(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtPct(p) {
  return p.toFixed(1).replace('.', ',') + '%';
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function normDesc(d) {
  return d.trim().toUpperCase().replace(/\s+/g, ' ');
}

// `categories` is the live list from /api/categories (array of {name, default_key, ...}).
// Falls back to 'Outros' if a rule matches a default_key whose category was
// since deleted, or to DEFAULT_CATEGORIES' name when `categories` isn't loaded yet.
export function categorize(desc, overrides = {}, categories = DEFAULT_CATEGORIES) {
  const key = normDesc(desc);
  for (const k in overrides) {
    if (key.includes(k)) return overrides[k];
  }
  const rule = classifyByRules(key);
  if (!rule) return 'Outros';
  if (rule.name) return rule.name;
  const match = categories.find((c) => c.default_key === rule.key);
  return match ? match.name : 'Outros';
}

// Installment markers vary by issuer: "PARC 01/03" (slash) vs. Mercado Pago's
// "Parcela 16 de 24" (the word "de" instead of a slash) — accept both.
const INSTALLMENT_RE = /PARC(?:ELA)?\s*(\d+)\s*(?:\/|DE)\s*(\d+)/i;
const INSTALLMENT_STRIP_RE = /[-–]?\s*PARC(?:ELA)?\s*\d+\s*(?:\/|DE)\s*\d+/i;

export function isInstallment(desc) {
  return INSTALLMENT_RE.test(desc || '');
}

export function isSpend(t) {
  return t.category !== 'Pagamento Fatura' && t.value > 0;
}

export function periodsSorted(txns) {
  return [...new Set(txns.map((t) => t.period))].sort();
}

export function banksSorted(txns) {
  return [...new Set(txns.map((t) => t.bank || 'Não informado'))].sort();
}

export function buildParcelamentos(scoped) {
  const map = {};
  scoped.forEach((t) => {
    const m = t.description.match(INSTALLMENT_RE);
    if (!m) return;
    const cur = parseInt(m[1], 10);
    const total = parseInt(m[2], 10);
    const key = t.description.replace(INSTALLMENT_STRIP_RE, '').trim();
    if (!map[key] || cur > map[key].cur) {
      map[key] = { desc: key, cur, total, remaining: Math.max(total - cur, 0), valuePerMonth: t.value, anchorPeriod: t.period };
    }
  });
  return Object.values(map).sort((a, b) => b.remaining * b.valuePerMonth - a.remaining * a.valuePerMonth);
}

export function addMonths(periodStr, n) {
  const parts = periodStr.split('-');
  if (parts.length < 2 || isNaN(parseInt(parts[0], 10)) || isNaN(parseInt(parts[1], 10))) return periodStr + '+' + n;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const total = month - 1 + n;
  const newYear = year + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12 + 1;
  return newYear + '-' + String(newMonth).padStart(2, '0');
}

export function buildProjection(parcRows, anchorPeriod) {
  const committed = {};
  parcRows.forEach((r) => {
    for (let i = 1; i <= r.remaining; i++) {
      const p = addMonths(r.anchorPeriod, i);
      committed[p] = (committed[p] || 0) + r.valuePerMonth;
    }
  });
  const months = [];
  for (let i = 1; i <= 12; i++) months.push(addMonths(anchorPeriod, i));
  return { months, committed };
}

export function computeAnalysis({ txns, selPeriod = '__all__', selBank = '__all__', selAccountType = '__all__' }) {
  const byPeriod = selPeriod === '__all__' ? txns : txns.filter((t) => t.period === selPeriod);
  const byBank = selBank === '__all__' ? byPeriod : byPeriod.filter((t) => (t.bank || 'Não informado') === selBank);
  const scoped = selAccountType === '__all__' ? byBank : byBank.filter((t) => t.account_type === selAccountType);

  const spend = scoped.filter(isSpend);
  const totalSpend = spend.reduce((s, t) => s + t.value, 0);
  const byCat = {};
  spend.forEach((t) => {
    byCat[t.category] = (byCat[t.category] || 0) + t.value;
  });
  const catEntries = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ cat, val, pct: totalSpend ? (val / totalSpend) * 100 : 0 }));

  const subs = scoped.filter((t) => t.category === 'Assinaturas' && t.value > 0).sort((a, b) => b.value - a.value);
  const subsTotal = subs.reduce((s, t) => s + t.value, 0);

  const parcRows = buildParcelamentos(scoped);
  const futureTotal = parcRows.reduce((s, r) => s + r.remaining * r.valuePerMonth, 0);
  const periods = periodsSorted(txns);
  const anchorPeriod = periods[periods.length - 1] || (selPeriod !== '__all__' ? selPeriod : '');
  let nextCommitted = 0;
  let freeMonth = null;
  if (anchorPeriod) {
    const { months, committed } = buildProjection(parcRows, anchorPeriod);
    nextCommitted = months.length ? committed[months[0]] || 0 : 0;
    freeMonth = months.find((m) => !(committed[m] > 0)) || null;
  }

  const bankFiltered = selBank === '__all__' ? txns : txns.filter((t) => (t.bank || 'Não informado') === selBank);
  const perPeriod = periods.map((p) => ({
    period: p,
    total: bankFiltered.filter((t) => t.period === p && isSpend(t)).reduce((s, t) => s + t.value, 0),
  }));
  const avgMonthly = perPeriod.length ? perPeriod.reduce((a, b) => a + b.total, 0) / perPeriod.length : totalSpend;

  const totalCreditCard = spend.filter(t => t.account_type === 'credit_card').reduce((s, t) => s + t.value, 0);
  const totalChecking = spend.filter(t => t.account_type === 'checking_account').reduce((s, t) => s + t.value, 0);

  let previousMonthTotal = 0;
  let spendDiffPct = 0;
  if (selPeriod !== '__all__' && periods.length > 0) {
    const curIdx = periods.indexOf(selPeriod);
    if (curIdx > 0) {
      const prevPeriod = periods[curIdx - 1];
      const prevSpend = txns.filter(t => t.period === prevPeriod && isSpend(t));
      const scopedPrevSpend = selBank === '__all__' ? prevSpend : prevSpend.filter(t => (t.bank || 'Não informado') === selBank);
      previousMonthTotal = scopedPrevSpend.reduce((s, t) => s + t.value, 0);
      if (previousMonthTotal > 0) {
        spendDiffPct = ((totalSpend - previousMonthTotal) / previousMonthTotal) * 100;
      }
    }
  }

  const refunds = scoped.filter((t) => t.value < 0 && t.category !== 'Pagamento Fatura').reduce((s, t) => s + t.value, 0);
  const totalIncome = Math.abs(refunds);
  const topPurchases = [...spend].sort((a, b) => b.value - a.value).slice(0, 5);
  const nMonths = selPeriod === '__all__' ? Math.max(periods.length, 1) : 1;

  return {
    scoped,
    selPeriod,
    selBank,
    totalSpend,
    count: spend.length,
    catEntries,
    subs,
    subsTotal,
    parcRows,
    futureTotal,
    nextCommitted,
    freeMonth,
    avgMonthly,
    refunds,
    topPurchases,
    perPeriod,
    nMonths,
    anchorPeriod,
    totalCreditCard,
    totalChecking,
    previousMonthTotal,
    spendDiffPct,
    totalIncome,
  };
}

// Combina o lado de gasto (analysis, já calculado por computeAnalysis, que
// não sabe nada de renda) com o líquido de um contracheque — mantido fora de
// computeAnalysis de propósito, pra não acoplar os dois domínios (gasto vem
// de `transactions`, renda vem de `income`, tabelas separadas). netIncome
// deve ser o líquido do contracheque do mês ANTERIOR ao anchorPeriod de
// `analysis` (anchorPeriod - 1), já que o salário de um mês M paga as
// despesas de M+1: se o período mais recente com lançamentos é julho, é o
// contracheque de junho (já recebido) que pagou julho, e é ele que deve ser
// usado aqui — a responsabilidade de achar esse contracheque certo (por
// período == anchorPeriod - 1) é de quem chama esta função.
export function computeIncomeCommitment(analysis, netIncome) {
  if (!netIncome || netIncome <= 0) return null;
  const pctNextCommitted = (analysis.nextCommitted / netIncome) * 100;
  return {
    netIncome,
    nextCommitted: analysis.nextCommitted,
    futureTotal: analysis.futureTotal,
    pctNextCommitted,
    // mesmo limiar de 30% que buildDiagnostics já usa pra nextCommitted/monthlySpend
    overCommitted: pctNextCommitted >= 30,
  };
}

// % do gasto TOTAL do período mais recente (analysis.totalSpend — todas as
// compras, não só as parcelas do mês seguinte, ao contrário de
// computeIncomeCommitment) em relação à renda que efetivamente pagou essas
// contas: o mesmo contracheque do mês anterior usado em
// computeIncomeCommitment (quem chama já resolveu esse período certo).
export function computeExpenseVsIncome(analysis, netIncome) {
  if (!netIncome || netIncome <= 0) return null;
  const pctOfIncome = (analysis.totalSpend / netIncome) * 100;
  // mesmos limiares de 80%/100% que buildBudgetProgress usa pras barras de meta
  const tier = pctOfIncome > 100 ? 'over' : pctOfIncome >= 80 ? 'near' : 'ok';
  return {
    netIncome,
    totalSpend: analysis.totalSpend,
    pctOfIncome,
    tier,
  };
}

function dedupKey(t) {
  return [t.account_type || 'credit_card', t.period, t.bank, t.date, t.description, Number(t.value)].join('|');
}

// Avoids re-importing the same statement twice while still allowing genuinely
// repeated identical charges (e.g. two coffees on the same day/value) — an
// occurrence is only treated as a duplicate if enough identical entries
// already exist among `existingTxns`.
export function dedupeTransactions(staged, existingTxns) {
  const existingCounts = {};
  existingTxns.forEach((t) => {
    const k = dedupKey(t);
    existingCounts[k] = (existingCounts[k] || 0) + 1;
  });
  const seenInBatch = {};
  const newOnes = [];
  let duplicateCount = 0;
  staged.forEach((t) => {
    const k = dedupKey(t);
    const occurrence = seenInBatch[k] || 0;
    seenInBatch[k] = occurrence + 1;
    if (occurrence < (existingCounts[k] || 0)) {
      duplicateCount++;
    } else {
      newOnes.push(t);
    }
  });
  return { newOnes, duplicateCount };
}

export function buildTicketTitle(scoped, selPeriod, selBank) {
  const banksInScope = [...new Set(scoped.map((t) => t.bank || 'Não informado'))];
  if (selPeriod === '__all__' && selBank === '__all__') {
    return 'Todos os períodos e bancos';
  }
  if (selBank !== '__all__') {
    const bankSuffix = selBank === 'Não informado' ? '' : ' · ' + selBank;
    return 'Período ' + (selPeriod === '__all__' ? '(todos os períodos)' : selPeriod) + bankSuffix;
  }
  if (banksInScope.length <= 1) {
    const b = banksInScope[0];
    const bankSuffix = b && b !== 'Não informado' ? ' · ' + b : '';
    return 'Período ' + selPeriod + bankSuffix;
  }
  if (banksInScope.length > 3) {
    return 'Período ' + selPeriod + ' · ' + banksInScope.length + ' bancos';
  }
  return 'Período ' + selPeriod + ' · ' + banksInScope.length + ' bancos (' + banksInScope.join(', ') + ')';
}

export function buildHealthBadge(a, diagnostics) {
  const warns = diagnostics.filter((d) => d.sev === 'warn');
  if (warns.length >= 2) {
    return {
      level: 'risk',
      label: 'Atenção',
      desc: 'Mais de uma frente está pesando na sua fatura este mês. As recomendações abaixo priorizam essas frentes primeiro.',
      topics: warns.map((w) => w.topic),
    };
  }
  if (warns.length === 1) {
    return {
      level: 'warn',
      label: 'Equilibrada, com um ponto de atenção',
      desc: 'No geral sua fatura está sob controle, mas um ponto merece ajuste este mês — veja o diagnóstico abaixo.',
      topics: warns.map((w) => w.topic),
    };
  }
  return {
    level: 'ok',
    label: 'Saudável',
    desc: 'Nenhuma categoria, parcelamento ou assinatura está pesando de forma desproporcional este mês. Foco agora é manter o ritmo e fortalecer a reserva de emergência.',
    topics: [],
  };
}

export function buildDiagnostics(a) {
  const diags = [];
  const monthlySpend = a.totalSpend / a.nMonths;

  if (a.catEntries.length && a.catEntries[0].pct >= 35) {
    diags.push({
      sev: 'warn',
      tag: 'Atenção',
      topic: 'Concentração de gastos',
      html: `<strong>Concentração de gastos:</strong> a categoria <strong>${esc(a.catEntries[0].cat)}</strong> responde sozinha por ${fmtPct(a.catEntries[0].pct)} do total — é o primeiro lugar para buscar economia, porque pequenos cortes percentuais aqui geram o maior efeito em reais.`,
    });
  }

  if (a.spendDiffPct !== undefined && a.spendDiffPct > 15) {
    diags.push({
      sev: 'warn',
      tag: 'Crescimento de Gastos',
      html: `Seu gasto aumentou <strong>${a.spendDiffPct.toFixed(1)}%</strong> em relação ao mês anterior. Fique atento para garantir que este salto esteja acompanhado de um aumento na sua receita ou de uso planejado de reservas.`,
    });
  } else if (a.spendDiffPct !== undefined && a.spendDiffPct < -10) {
    diags.push({
      sev: 'good',
      tag: 'Redução de Gastos',
      html: `Ótima notícia: seu gasto diminuiu <strong>${Math.abs(a.spendDiffPct).toFixed(1)}%</strong> comparado ao mês anterior. Tente destinar a diferença economizada para sua reserva de emergência ou investimentos.`,
    });
  }

  const subsMonthly = a.subsTotal / a.nMonths;
  if (subsMonthly > 0) {
    const subsPct = a.totalSpend ? (a.subsTotal / a.totalSpend) * 100 : 0;
    diags.push({
      sev: subsPct >= 8 ? 'warn' : 'info',
      tag: subsPct >= 8 ? 'Atenção' : 'Informativo',
      topic: 'Assinaturas',
      html: `<strong>Assinaturas:</strong> ${a.subs.length} cobrança(s) recorrente(s) somando ${fmt(subsMonthly)}/mês — isso equivale a <strong>${fmt(subsMonthly * 12)} por ano</strong>${subsPct >= 8 ? ', um peso relevante (' + fmtPct(subsPct) + ' da fatura). Vale uma auditoria: cancele o que você não usou no último mês' : ''}.`,
    });
  }

  if (a.nextCommitted > 0 && monthlySpend > 0) {
    const commitPct = (a.nextCommitted / monthlySpend) * 100;
    if (commitPct >= 30) {
      diags.push({
        sev: 'warn',
        tag: 'Atenção',
        topic: 'Comprometimento futuro',
        html: `<strong>Comprometimento futuro elevado:</strong> só de parcelas já contratadas, ${fmt(a.nextCommitted)} vão cair na próxima fatura (~${fmtPct(commitPct)} do seu gasto mensal). Enquanto esse índice estiver acima de 30%, evite assumir novos parcelamentos.`,
      });
    } else {
      diags.push({
        sev: 'ok',
        tag: 'Sob controle',
        topic: 'Comprometimento futuro',
        html: `<strong>Parcelamentos sob controle:</strong> as parcelas já contratadas comprometem ${fmt(a.nextCommitted)} da próxima fatura (~${fmtPct(commitPct)} do gasto mensal), um nível administrável.`,
      });
    }
  }

  if (a.futureTotal > 0 && monthlySpend > 0) {
    const debtRatio = a.futureTotal / monthlySpend;
    if (debtRatio >= 0.7) {
      diags.push({
        sev: 'warn',
        tag: 'Atenção',
        topic: 'Passivo de parcelamentos',
        html: `<strong>Passivo total de parcelamentos:</strong> somando todas as parcelas futuras ainda em aberto, faltam <strong>${fmt(a.futureTotal)}</strong> a pagar — o equivalente a ${debtRatio.toFixed(1).replace('.', ',')}x o seu gasto mensal médio. É um passivo relevante mesmo que o comprometimento mês a mês pareça leve; ele reduz sua margem para imprevistos até ser quitado.`,
      });
    } else {
      diags.push({
        sev: 'info',
        tag: 'Informativo',
        topic: 'Passivo de parcelamentos',
        html: `<strong>Passivo total de parcelamentos:</strong> ${fmt(a.futureTotal)} ainda em aberto em parcelas futuras — abaixo de um mês de gasto médio, um nível confortável.`,
      });
    }
  }

  const endingSoon = a.parcRows.filter((r) => r.remaining > 0 && r.remaining <= 2);
  if (endingSoon.length) {
    const freed = endingSoon.reduce((s, r) => s + r.valuePerMonth, 0);
    diags.push({
      sev: 'ok',
      tag: 'Boa notícia',
      topic: 'Parcelas terminando',
      html: `<strong>Dinheiro prestes a ser liberado:</strong> ${endingSoon.length} parcelamento(s) terminam nos próximos 2 meses, liberando ${fmt(freed)}/mês. A armadilha clássica é esse valor "sumir" no consumo — direcione-o para reserva de emergência ou quitação antecipada de outras parcelas.`,
    });
  }

  if (a.freeMonth) {
    diags.push({
      sev: 'info',
      tag: 'Horizonte',
      topic: 'Horizonte de liberdade',
      html: `<strong>Horizonte de liberdade:</strong> mantendo o ritmo atual e sem novas compras parceladas, sua fatura fica livre de parcelas em <strong>${esc(a.freeMonth)}</strong>.`,
    });
  }

  if (a.refunds < 0) {
    diags.push({
      sev: 'good',
      tag: 'Estornos',
      html: `Houve ${fmt(Math.abs(a.refunds))} em estornos identificados. Lembre-se que estornos devolvem o saldo, mas você ainda precisará ter caixa para pagar a fatura original no fechamento.`,
    });
  }

  if (a.totalCreditCard > 0 && a.totalChecking > 0) {
    const ccPct = Math.round((a.totalCreditCard / a.totalSpend) * 100);
    const ckPct = Math.round((a.totalChecking / a.totalSpend) * 100);
    diags.push({
      sev: 'info',
      tag: 'Perfil de Pagamento',
      html: `Seus gastos dividem-se em <strong>${ccPct}% no cartão de crédito</strong> e <strong>${ckPct}% à vista (conta-corrente)</strong>. Concentrar no crédito pode gerar milhas/cashback, mas exige controle rigoroso da fatura mensal. Pagamentos à vista facilitam o controle imediato do saldo.`,
    });
  }

  return diags;
}

// Diagnósticos ligados à renda do contracheque — função separada de
// buildDiagnostics (não recebe `a`, recebe os objetos já calculados em
// app/page.js: expenseVsIncome e incomeCommitment), seguindo o mesmo padrão
// de buildBudgetDiagnostics: o chamador concatena as listas. Shaped como o
// resto (sev/tag/topic/html) pra entrar direto em buildHealthBadge também.
export function buildIncomeDiagnostics(expenseVsIncome, incomeCommitment) {
  const diags = [];

  if (!expenseVsIncome && !incomeCommitment) {
    diags.push({
      sev: 'info',
      tag: 'Informativo',
      topic: 'Renda',
      html: 'Nenhum contracheque importado ainda — importe o do mês anterior na seção "Renda" pra acompanhar quanto da sua renda já está comprometido com a fatura.',
    });
    return diags;
  }

  if (expenseVsIncome) {
    const sourceNote = expenseVsIncome.source === 'estimate' ? ' (estimativa a partir do extrato, não do contracheque)' : '';
    if (expenseVsIncome.pctOfIncome >= 100) {
      diags.push({
        sev: 'warn',
        tag: 'Atenção',
        topic: 'Renda',
        html: `<strong>Gasto acima da renda:</strong> você gastou ${fmt(expenseVsIncome.totalSpend)} este mês — ${fmtPct(expenseVsIncome.pctOfIncome)} da renda líquida de ${fmt(expenseVsIncome.netIncome)} do mês anterior${sourceNote} — ou seja, mais do que ganhou. Só é sustentável se veio de reserva; se foi rotativo ou parcelamento, é sinal de alerta.`,
      });
    } else if (expenseVsIncome.pctOfIncome >= 80) {
      diags.push({
        sev: 'warn',
        tag: 'Atenção',
        topic: 'Renda',
        html: `<strong>Gasto próximo do limite da renda:</strong> ${fmtPct(expenseVsIncome.pctOfIncome)} da renda líquida de ${fmt(expenseVsIncome.netIncome)}${sourceNote} já foi consumida em gastos este mês (${fmt(expenseVsIncome.totalSpend)}) — pouca margem para imprevistos ou poupança.`,
      });
    } else {
      diags.push({
        sev: 'ok',
        tag: 'Sob controle',
        topic: 'Renda',
        html: `<strong>Gasto dentro da renda:</strong> você usou ${fmtPct(expenseVsIncome.pctOfIncome)} da renda líquida de ${fmt(expenseVsIncome.netIncome)}${sourceNote} em gastos este mês (${fmt(expenseVsIncome.totalSpend)}), sobrando espaço para poupança.`,
      });
    }
  }

  if (incomeCommitment && incomeCommitment.pctNextCommitted >= 30) {
    const sourceNote = incomeCommitment.source === 'estimate' ? ' (estimativa a partir do extrato)' : '';
    diags.push({
      sev: 'warn',
      tag: 'Atenção',
      topic: 'Renda comprometida',
      html: `<strong>Renda já comprometida:</strong> ${fmtPct(incomeCommitment.pctNextCommitted)} da sua renda líquida (${fmt(incomeCommitment.netIncome)})${sourceNote} já está reservada só para as parcelas do próximo mês (${fmt(incomeCommitment.nextCommitted)}) — evite novos parcelamentos enquanto esse número estiver alto.`,
    });
  }

  return diags;
}

// Categorias cujo gasto é essencialmente uma taxa/tarifa contratual — não
// tem sentido sugerir "cortar" IOF ou anuidade como se fosse uma escolha de
// consumo. Identificadas por default_key (não por nome, que o usuário pode
// renomear) — mesmo padrão de DISCRETIONARY_KEYS.
const NON_CUTTABLE_KEYS = ['iof', 'anuidade'];

// Meta de 20% da renda pra investimento, no espírito da mesma regra 50-30-20
// já sugerida em buildFallbackRecommendations. Sugere cortes de até 15% por
// categoria (mesmo teto que a recomendação de redução de categoria já usa),
// começando pelas maiores (catEntries já vem ordenado por valor desc), até
// fechar a diferença entre a sobra atual (renda - gasto) e a meta.
const INVEST_TARGET_RATE = 0.20;
const MAX_CATEGORY_CUT_PCT = 0.15;

export function buildInvestmentPlan(a, netIncome, source, categories = DEFAULT_CATEGORIES) {
  if (!netIncome || netIncome <= 0 || !a.catEntries.length) return null;

  const keyByName = Object.fromEntries(categories.map((c) => [c.name, c.default_key]));
  const currentSurplus = netIncome - a.totalSpend;
  const targetInvestAmount = netIncome * INVEST_TARGET_RATE;
  let remainingGap = Math.max(targetInvestAmount - currentSurplus, 0);

  const cuts = [];
  for (const c of a.catEntries) {
    if (remainingGap <= 0) break;
    if (NON_CUTTABLE_KEYS.includes(keyByName[c.cat])) continue;
    const monthly = c.val / a.nMonths;
    const cut = Math.min(monthly * MAX_CATEGORY_CUT_PCT, remainingGap);
    if (cut < 5) continue; // ignora cortes irrisórios
    cuts.push({ cat: c.cat, monthly, cut, newMonthly: monthly - cut });
    remainingGap -= cut;
  }

  const achievedInvestAmount = currentSurplus + cuts.reduce((s, c) => s + c.cut, 0);

  return {
    netIncome,
    source,
    totalSpend: a.totalSpend,
    currentSurplus,
    targetInvestRate: INVEST_TARGET_RATE,
    targetInvestAmount,
    cuts,
    achievedInvestAmount,
    achievesTarget: remainingGap <= 0,
  };
}

// Compares each category's monthly-average spend (val/nMonths, consistent
// with how the rest of the analysis normalizes multi-period scopes) against
// its recurring monthly goal, if one is set. Shaped like buildDiagnostics'
// output so callers can concatenate the two lists directly.
export function buildBudgetDiagnostics(catEntries, budgets, nMonths) {
  const budgetMap = {};
  budgets.forEach((b) => {
    budgetMap[b.category] = Number(b.monthly_amount);
  });
  const d = [];
  catEntries.forEach((c) => {
    const goal = budgetMap[c.cat];
    if (!goal) return;
    const monthly = c.val / nMonths;
    if (monthly > goal) {
      const over = monthly - goal;
      d.push({
        sev: 'warn',
        tag: 'Meta estourada',
        topic: 'Meta de ' + c.cat,
        html: `<strong>Meta de ${esc(c.cat)} estourada:</strong> você gastou ${fmt(monthly)}/mês nessa categoria — ${fmt(over)} acima da meta de ${fmt(goal)}/mês definida.`,
      });
    }
  });
  return d;
}

// Per-category monthly spend vs. goal, for the dashboard progress bars.
// Only includes categories that actually have a goal set.
export function buildBudgetProgress(catEntries, budgets, nMonths) {
  const budgetMap = {};
  budgets.forEach((b) => {
    budgetMap[b.category] = Number(b.monthly_amount);
  });
  return catEntries
    .filter((c) => budgetMap[c.cat])
    .map((c) => {
      const goal = budgetMap[c.cat];
      const monthly = c.val / nMonths;
      const rawPct = goal ? (monthly / goal) * 100 : 0;
      // 'near' gives an early warning before the goal is actually blown —
      // without it, every bar is either "fine" or "red", and red stops
      // meaning anything once most categories sit above their goal.
      const tier = rawPct > 100 ? 'over' : rawPct >= 80 ? 'near' : 'ok';
      return { cat: c.cat, monthly, goal, pct: Math.min(100, Math.round(rawPct)), tier, exceeded: rawPct > 100 };
    });
}

// Categories whose default_key marks them as "everyday discretionary" spend —
// the kind a 15%-cut tip applies to. Looked up by key (not display name) so a
// rename (e.g. 'Alimentação' -> 'Restaurantes e Afins') doesn't silently drop
// the recommendation. 'Outros' is matched by name since it's a fixed system
// category with no default_key. Categories with their own dedicated tips
// elsewhere (Assinaturas, parcelamentos) are intentionally excluded.
const DISCRETIONARY_KEYS = ['alimentacao', 'compras'];

export function buildFallbackRecommendations(a, categories = DEFAULT_CATEGORIES) {
  const recs = [];
  const monthlySpend = a.totalSpend / a.nMonths;

  const keyByName = Object.fromEntries(categories.map((c) => [c.name, c.default_key]));
  const topDiscretionary = a.catEntries.find(
    (c) => c.cat === 'Outros' || DISCRETIONARY_KEYS.includes(keyByName[c.cat]),
  );
  if (topDiscretionary) {
    const cut = (topDiscretionary.val / a.nMonths) * 0.15;
    recs.push({
      html: `<strong>Meta de redução de 15% em ${esc(topDiscretionary.cat)}:</strong> hoje são ${fmt(topDiscretionary.val / a.nMonths)}/mês. Defina um teto mensal para a categoria e acompanhe aqui no painel.`,
      saving: `Libera ~${fmt(cut)}/mês (${fmt(cut * 12)}/ano)`,
    });
  }

  if (a.subs.length) {
    const cheapest = a.subs.slice(Math.ceil(a.subs.length / 2));
    const cutSubs = cheapest.reduce((s, t) => s + t.value, 0) / a.nMonths;
    recs.push({
      html: `<strong>Auditoria de assinaturas:</strong> liste as ${a.subs.length} assinaturas e pergunte para cada uma: "usei nos últimos 30 dias?". Recontrate depois se sentir falta — quase nunca acontece.`,
      saving: `Até ${fmt(cutSubs)}/mês`,
    });
  }

  if (a.parcRows.length) {
    recs.push({
      html: `<strong>Moratória de parcelamentos:</strong> não assuma nenhuma compra parcelada nova até ${a.freeMonth ? esc(a.freeMonth) : 'zerar as atuais'}. Parcela pequena parece inofensiva, mas a soma delas é o que engessa o orçamento.`,
      saving: null,
    });
  }

  recs.push({
    html: `<strong>Pague sempre o valor total da fatura:</strong> o crédito rotativo brasileiro tem custo efetivo que costuma superar 300% ao ano — é a dívida mais cara do mercado. Se não conseguir pagar o total, negocie o parcelamento da fatura com o banco (juros bem menores) em vez de cair no rotativo.`,
    saving: null,
  });
  recs.push({
    html: `<strong>Construa a reserva de emergência:</strong> direcione o valor economizado com as ações acima para uma reserva de liquidez diária (Tesouro Selic ou CDB 100%+ do CDI).`,
    saving: `Meta: ${fmt(monthlySpend * 3)} a ${fmt(monthlySpend * 6)}`,
  });
  recs.push({
    html: `<strong>Regra 50-30-20 como bússola:</strong> destine até 50% da renda a necessidades, 30% a desejos e 20% a poupança/quitação de dívidas. Use as categorias deste painel para verificar mensalmente de que lado da linha cada gasto está.`,
    saving: null,
  });

  return recs;
}

export function buildRecommendationsHtml(recs) {
  return (
    '<ol class="rec-list">' +
    recs.map((r) => `<li>${r.html}${r.saving ? `<br><span class="rec-saving">${esc(r.saving)}</span>` : ''}</li>`).join('') +
    '</ol>'
  );
}

// Shape expected by POST /api/parecer/ai-recommendations (see app/api/parecer/ai-recommendations/route.js)
export function buildAiPayload(a, expenseVsIncome = null, incomeCommitment = null) {
  return {
    escopo: { periodo: a.selPeriod, banco: a.selBank, meses_analisados: a.nMonths },
    total_gasto: Math.round(a.totalSpend * 100) / 100,
    media_mensal: Math.round((a.totalSpend / a.nMonths) * 100) / 100,
    gastos_por_categoria: a.catEntries.map((c) => ({ categoria: c.cat, valor: Math.round(c.val * 100) / 100, pct: Math.round(c.pct * 10) / 10 })),
    assinaturas: a.subs.map((s) => ({ descricao: s.description, valor: s.value })),
    parcelamentos: a.parcRows.map((r) => ({
      descricao: r.desc,
      parcela: r.cur + '/' + r.total,
      valor_mes: r.valuePerMonth,
      falta_pagar: Math.round(r.remaining * r.valuePerMonth * 100) / 100,
    })),
    comprometido_proximo_mes: Math.round(a.nextCommitted * 100) / 100,
    fatura_livre_de_parcelas_em: a.freeMonth,
    maiores_compras: a.topPurchases.map((t) => ({ data: t.date, descricao: t.description, valor: t.value })),
    evolucao_mensal: a.perPeriod,
    renda: expenseVsIncome || incomeCommitment ? {
      renda_liquida_mes_anterior: Math.round(((expenseVsIncome || incomeCommitment).netIncome) * 100) / 100,
      fonte: (expenseVsIncome || incomeCommitment).source === 'estimate' ? 'estimativa_extrato' : 'contracheque',
      pct_gasto_sobre_renda: expenseVsIncome ? Math.round(expenseVsIncome.pctOfIncome * 10) / 10 : null,
      pct_renda_comprometida_proximo_mes: incomeCommitment ? Math.round(incomeCommitment.pctNextCommitted * 10) / 10 : null,
    } : null,
  };
}

// ---------------------------------------------------------------------------
// Importação de lançamentos (texto colado / CSV)
// ---------------------------------------------------------------------------

const MONTHS_PT = { JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06', JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12' };
const MONTH_RE = 'JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ';
const DASH = '[-\\u2212\\u2013]';
const FUTURE_SECTION_RE = /^PARCELAMENTOS?\s+(DA\s+)?PR[OÓ]XIMA\s+FATURA\s*:?\s*$/i;

export function isDateLike(str) {
  if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(str)) return true;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) return true;
  if (new RegExp('^\\d{1,2}\\s+(?:' + MONTH_RE + ')\\.?$', 'i').test(str)) return true;
  return false;
}

export function normalizeDate(str) {
  let m = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?$/);
  if (m) return m[1].padStart(2, '0') + '/' + m[2].padStart(2, '0');
  m = str.match(/^\d{4}-(\d{1,2})-(\d{1,2})$/);
  if (m) return m[2].padStart(2, '0') + '/' + m[1].padStart(2, '0');
  m = str.match(new RegExp('^(\\d{1,2})\\s+(' + MONTH_RE + ')\\.?$', 'i'));
  if (m) return m[1].padStart(2, '0') + '/' + MONTHS_PT[m[2].toUpperCase()];
  return str;
}

export function matchDateStart(line) {
  const re = new RegExp('^(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}\\s+(?:' + MONTH_RE + ')\\.?)\\s+(.*)$', 'i');
  const m = line.match(re);
  if (!m) return null;
  return { date: normalizeDate(m[1]), rest: m[2].trim() };
}

export function isValueLike(str) {
  return new RegExp('^\\(?' + DASH + '?\\s*(?:R\\$|US\\$|\\$)?\\s*\\d+(?:[.,]\\d{3})*(?:[.,]\\d{2})?\\s*' + DASH + '?\\)?$').test(str.trim());
}

export function normalizeValue(raw) {
  let s = raw.trim();
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (new RegExp('^' + DASH).test(s)) {
    negative = true;
    s = s.replace(new RegExp('^' + DASH + '\\s*'), '');
  }
  if (new RegExp(DASH + '$').test(s)) {
    negative = true;
    s = s.replace(new RegExp('\\s*' + DASH + '$'), '');
  }
  s = s.replace(/R\$|US\$|\$/g, '').trim();
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(',', '.');
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      s = s.replace(/\./g, '');
    }
  }
  const val = parseFloat(s);
  if (isNaN(val)) return null;
  return negative ? -val : val;
}

export function cleanDescription(desc) {
  return desc
    .replace(/[•·]{1,4}\s*\d{4}/g, '')
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseLine(line) {
  line = line.replace(/"/g, '');
  if (line.includes(';') || (line.split(',').length >= 3 && !/R\$|US\$/.test(line))) {
    const sep = line.includes(';') ? ';' : ',';
    const parts = line.split(sep).map((p) => p.trim()).filter((p) => p.length);
    if (parts.length >= 3) {
      const dateC = parts[0];
      const valueC = parts[parts.length - 1];
      if (isDateLike(dateC) && isValueLike(valueC)) {
        const val = normalizeValue(valueC);
        if (val !== null) {
          return { date: normalizeDate(dateC), description: cleanDescription(parts.slice(1, -1).join(' ')), value: val };
        }
      }
    }
  }
  const ds = matchDateStart(line);
  if (!ds) return null;
  const rest = ds.rest;

  const twoVal = rest.match(/(?:R\$\s*)?(\d+(?:[.,]\d{3})*[.,]\d{2})\s+(?:US\$\s*)?(\d+(?:[.,]\d{3})*[.,]\d{2})\s*$/);
  if (twoVal) {
    const val = normalizeValue(twoVal[1]);
    if (val !== null) {
      let desc = rest.slice(0, twoVal.index).trim();
      desc = desc.replace(/\b(BR|US|CA|MA)\b\s*$/, '').trim();
      desc = cleanDescription(desc);
      if (desc) return { date: ds.date, description: desc, value: val };
    }
  }

  const vm = rest.match(new RegExp('(\\(?' + DASH + '?\\s*(?:R\\$|US\\$|\\$)?\\s*\\d+(?:[.,]\\d{3})*(?:[.,]\\d{2})?\\s*' + DASH + '?\\)?)\\s*$'));
  if (!vm) return null;
  const val = normalizeValue(vm[1]);
  if (val === null) return null;
  let desc = rest.slice(0, vm.index).trim();
  desc = desc.replace(/\b(BR|US|CA|MA)\b\s*$/, '').trim();
  desc = cleanDescription(desc);
  if (!desc) return null;
  return { date: ds.date, description: desc, value: val };
}

export function parseLines(text, period, overrides = {}, categories = DEFAULT_CATEGORIES, isCheckingAccount = false) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  let skipped = 0;
  let stoppedAt = null;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (FUTURE_SECTION_RE.test(line)) {
      stoppedAt = line;
      break;
    }
    const direct = parseLine(line);
    if (direct) {
      if (isCheckingAccount) {
        direct.value = -direct.value;
      }
      out.push({
        id: period + '|' + direct.date + '|' + direct.description + '|' + direct.value + '|' + Math.random().toString(36).slice(2, 7),
        period,
        date: direct.date,
        description: direct.description,
        value: direct.value,
        category: categorize(direct.description, overrides, categories),
      });
      i++;
      continue;
    }
    const ds = matchDateStart(line);
    if (ds && ds.rest && !isValueLike(ds.rest)) {
      let j = i + 1;
      let foundValue = null;
      while (j < lines.length && j < i + 6) {
        const candidate = lines[j].trim();
        if (isValueLike(candidate)) {
          foundValue = normalizeValue(candidate);
          j++;
          break;
        }
        if (matchDateStart(candidate)) break;
        j++;
      }
      if (foundValue !== null) {
        if (isCheckingAccount) {
          foundValue = -foundValue;
        }
        const desc = cleanDescription(ds.rest);
        out.push({
          id: period + '|' + ds.date + '|' + desc + '|' + foundValue + '|' + Math.random().toString(36).slice(2, 7),
          period,
          date: ds.date,
          description: desc,
          value: foundValue,
          category: categorize(desc, overrides, categories),
        });
        i = j;
        continue;
      }
    }
    skipped++;
    i++;
  }
  return { out, skipped, stoppedAt };
}

// Reassembles a PDF.js text-content page (an unordered bag of positioned
// glyph runs) into reading-order lines, by clustering items into rows by Y
// position and inserting a space wherever there's a horizontal gap between
// runs that don't already end/start with whitespace.
export function extractPageLines(content) {
  const items = content.items.filter((it) => it.str && it.str.length);
  items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  const rows = [];
  let current = [];
  let lastY = null;
  const tolerance = 2.5;
  items.forEach((it) => {
    const y = it.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > tolerance) {
      rows.push(current);
      current = [];
    }
    current.push(it);
    lastY = y;
  });
  if (current.length) rows.push(current);
  const GAP_THRESHOLD = 1.2;
  return rows
    .map((row) => {
      row.sort((a, b) => a.transform[4] - b.transform[4]);
      let line = '';
      let expectedX = null;
      row.forEach((it) => {
        const x = it.transform[4];
        if (expectedX !== null && x - expectedX > GAP_THRESHOLD && !line.endsWith(' ') && !it.str.startsWith(' ')) {
          line += ' ';
        }
        line += it.str;
        expectedX = x + (it.width || 0);
      });
      return line.replace(/[ \t]+/g, ' ').trim();
    })
    .filter(Boolean)
    .join('\n');
}
