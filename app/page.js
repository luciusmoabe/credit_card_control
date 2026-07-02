'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import KpiGrid from '@/components/KpiGrid';
import ImportPanel from '@/components/ImportPanel';
import TransactionsTable from '@/components/TransactionsTable';
import CategoryChart from '@/components/CategoryChart';
import TrendChart from '@/components/TrendChart';
import SubscriptionsList from '@/components/SubscriptionsList';
import InstallmentsTable from '@/components/InstallmentsTable';
import ProjectionPanel from '@/components/ProjectionPanel';
import ParecerPanel from '@/components/ParecerPanel';
import CategoryManager from '@/components/CategoryManager';
import BudgetProgress from '@/components/BudgetProgress';
import {
  getTransactions,
  getOverrides,
  createTransactions,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
  upsertOverride,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBudgets,
  upsertBudget,
  deleteBudget,
} from '@/lib/api';
import {
  parseLines,
  periodsSorted,
  banksSorted,
  computeAnalysis,
  buildTicketTitle,
  buildParcelamentos,
  dedupeTransactions,
  normDesc,
  catColorMap,
  DEFAULT_CATEGORIES,
} from '@/lib/finance';

function defaultPeriod() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('overview');

  const [txns, setTxns] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [periodLabel, setPeriodLabel] = useState(defaultPeriod());
  const [bankLabel, setBankLabel] = useState('');
  const [importText, setImportText] = useState('');
  const [staging, setStaging] = useState([]);
  const [parseFeedback, setParseFeedback] = useState('');

  // null = user hasn't picked one yet; falls back to the most recent period once data loads
  const [filterPeriod, setFilterPeriod] = useState(null);
  const [filterBank, setFilterBank] = useState('__all__');
  const [filterCat, setFilterCat] = useState('__all__');
  const [filterSearch, setFilterSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [txRes, ovRes, catRes, budgetRes] = await Promise.all([
        getTransactions(),
        getOverrides(),
        getCategories(),
        getBudgets(),
      ]);
      setTxns(txRes);
      const map = {};
      ovRes.forEach((o) => {
        map[o.keyword] = o.category;
      });
      setOverrides(map);
      setCategories(catRes);
      setBudgets(budgetRes);
    } catch (e) {
      setError('Não foi possível carregar os dados: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const periods = useMemo(() => periodsSorted(txns), [txns]);
  const banks = useMemo(() => banksSorted(txns), [txns]);

  // Derived (not synced-via-effect) so a real user pick of "__all__" sticks,
  // while an unset/now-invalid selection falls back to the latest period.
  const effectiveFilterPeriod = useMemo(() => {
    if (filterPeriod === '__all__' || (filterPeriod && periods.includes(filterPeriod))) return filterPeriod;
    return periods.length ? periods[periods.length - 1] : '__all__';
  }, [filterPeriod, periods]);

  const effectiveFilterBank = filterBank === '__all__' || banks.includes(filterBank) ? filterBank : '__all__';

  const analysis = useMemo(
    () => computeAnalysis({ txns, selPeriod: effectiveFilterPeriod, selBank: effectiveFilterBank }),
    [txns, effectiveFilterPeriod, effectiveFilterBank],
  );

  const ticketTitle = useMemo(
    () => buildTicketTitle(analysis.scoped, effectiveFilterPeriod, effectiveFilterBank),
    [analysis.scoped, effectiveFilterPeriod, effectiveFilterBank],
  );

  // Comprometimento futuro ignora o filtro de período (mostra a projeção
  // completa a partir do período mais recente), só respeita o filtro de banco.
  const projection = useMemo(() => {
    const bankFiltered = effectiveFilterBank === '__all__' ? txns : txns.filter((t) => (t.bank || 'Não informado') === effectiveFilterBank);
    return { parcRows: buildParcelamentos(bankFiltered), anchorPeriod: periods[periods.length - 1] || '' };
  }, [txns, effectiveFilterBank, periods]);

  function handleParse() {
    const period = periodLabel.trim() || 'sem-período';
    if (!importText.trim()) {
      setParseFeedback('Cole os lançamentos antes de analisar.');
      return;
    }
    const { out, skipped, stoppedAt } = parseLines(importText, period, overrides, categories);
    if (out.length === 0) {
      setParseFeedback('Nenhum lançamento reconhecido. Confira o formato das linhas ou ajuste manualmente.');
      return;
    }
    setStaging(out);
    let msg = `${out.length} lançamento(s) reconhecido(s)` + (skipped ? `, ${skipped} linha(s) ignorada(s)` : '');
    if (stoppedAt) {
      msg += `. Parei de ler ao encontrar "${stoppedAt}" — essa seção costuma ser uma prévia da próxima fatura, não desta.`;
    }
    setParseFeedback(msg + '. Confira abaixo antes de confirmar.');
  }

  function handleCancelStaging() {
    setStaging([]);
    setParseFeedback('');
  }

  async function handleConfirmStaging() {
    if (!staging.length) return;
    const period = periodLabel.trim() || 'sem-período';
    const bank = bankLabel.trim() || 'Não informado';
    const finalized = staging.map((t) => ({
      period: t.period,
      bank,
      date: t.date,
      description: t.description,
      value: t.value,
      category: t.category,
    }));
    const { newOnes, duplicateCount } = dedupeTransactions(finalized, txns);

    if (!newOnes.length) {
      setParseFeedback(`Todos os ${finalized.length} lançamento(s) já existiam e foram ignorados (para não duplicar).`);
      setStaging([]);
      return;
    }

    try {
      await createTransactions(newOnes);
      setParseFeedback(
        `Importado: ${newOnes.length} lançamento(s) novo(s) no período ${period} (${bank}).` +
          (duplicateCount ? ` ${duplicateCount} já existiam e foram ignorados (para não duplicar).` : ''),
      );
      setImportText('');
      setStaging([]);
      await loadData();
    } catch (e) {
      setParseFeedback('Erro ao salvar os lançamentos: ' + e.message);
    }
  }

  async function handleCategoryChange(txn, category) {
    const prevTxns = txns;
    setTxns((cur) => cur.map((t) => (t.id === txn.id ? { ...t, category } : t)));
    try {
      await updateTransaction(txn.id, { category });
      await upsertOverride(normDesc(txn.description), category);
      setOverrides((cur) => ({ ...cur, [normDesc(txn.description)]: category }));
    } catch (e) {
      setTxns(prevTxns);
      setError('Não foi possível salvar a categoria: ' + e.message);
    }
  }

  async function handleTransactionFieldChange(txn, fields) {
    const prevTxns = txns;
    setTxns((cur) => cur.map((t) => (t.id === txn.id ? { ...t, ...fields } : t)));
    try {
      await updateTransaction(txn.id, fields);
    } catch (e) {
      setTxns(prevTxns);
      setError('Não foi possível salvar o lançamento: ' + e.message);
    }
  }

  async function handleDeleteTransaction(txn) {
    const prevTxns = txns;
    setTxns((cur) => cur.filter((t) => t.id !== txn.id));
    try {
      await deleteTransaction(txn.id);
    } catch (e) {
      setTxns(prevTxns);
      setError('Não foi possível excluir o lançamento: ' + e.message);
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Isso vai apagar todos os lançamentos salvos. Continuar?')) return;
    const prevTxns = txns;
    setTxns([]);
    try {
      await deleteAllTransactions();
    } catch (e) {
      setTxns(prevTxns);
      setError('Não foi possível apagar os lançamentos: ' + e.message);
    }
  }

  async function handleCreateCategory(name, color) {
    try {
      await createCategory(name, color);
      await loadData();
    } catch (e) {
      setError('Não foi possível criar a categoria: ' + e.message);
    }
  }

  async function handleRenameCategory(oldName, newName) {
    try {
      await updateCategory(oldName, { newName });
      await loadData();
    } catch (e) {
      setError('Não foi possível renomear a categoria: ' + e.message);
    }
  }

  async function handleRecolorCategory(name, color) {
    try {
      await updateCategory(name, { color });
      await loadData();
    } catch (e) {
      setError('Não foi possível trocar a cor da categoria: ' + e.message);
    }
  }

  async function handleDeleteCategory(name) {
    if (!window.confirm(`Excluir a categoria "${name}"? Os lançamentos dela serão movidos para "Outros".`)) return;
    try {
      await deleteCategory(name);
      await loadData();
    } catch (e) {
      setError('Não foi possível excluir a categoria: ' + e.message);
    }
  }

  async function handleSetBudget(category, amount) {
    try {
      await upsertBudget(category, amount);
      await loadData();
    } catch (e) {
      setError('Não foi possível salvar a meta: ' + e.message);
    }
  }

  async function handleClearBudget(category) {
    try {
      await deleteBudget(category);
      await loadData();
    } catch (e) {
      setError('Não foi possível remover a meta: ' + e.message);
    }
  }

  const hasData = txns.length > 0;
  const catColors = useMemo(() => catColorMap(categories), [categories]);

  function renderSection() {
    if (loading) return <div className="panel hint">Carregando...</div>;

    if (activeSection === 'import') {
      return (
        <ImportPanel
          periodLabel={periodLabel}
          onPeriodLabelChange={setPeriodLabel}
          bankLabel={bankLabel}
          onBankLabelChange={setBankLabel}
          importText={importText}
          onImportTextChange={setImportText}
          staging={staging}
          onStagingChange={setStaging}
          overrides={overrides}
          categories={categories}
          parseFeedback={parseFeedback}
          onParseFeedbackChange={setParseFeedback}
          onParse={handleParse}
          onConfirm={handleConfirmStaging}
          onCancel={handleCancelStaging}
          onClearAll={handleClearAll}
        />
      );
    }

    if (activeSection === 'categories') {
      return (
        <CategoryManager
          categories={categories}
          budgets={budgets}
          onCreate={handleCreateCategory}
          onRename={handleRenameCategory}
          onRecolor={handleRecolorCategory}
          onDelete={handleDeleteCategory}
          onSetBudget={handleSetBudget}
          onClearBudget={handleClearBudget}
        />
      );
    }

    if (!hasData) {
      return (
        <div className="panel empty">
          <div className="big">Nenhum lançamento ainda</div>
          <div>
            Vá em <strong>&quot;Importar&quot;</strong> no menu ao lado para trazer sua primeira fatura.
          </div>
        </div>
      );
    }

    if (activeSection === 'transactions') {
      return (
        <TransactionsTable
          scoped={analysis.scoped}
          categories={categories}
          banks={banks}
          filterCat={filterCat}
          onFilterCatChange={setFilterCat}
          filterBank={effectiveFilterBank}
          onFilterBankChange={setFilterBank}
          filterSearch={filterSearch}
          onFilterSearchChange={setFilterSearch}
          onCategoryChange={handleCategoryChange}
          onFieldChange={handleTransactionFieldChange}
          onDelete={handleDeleteTransaction}
        />
      );
    }

    if (activeSection === 'commitments') {
      return (
        <>
          <SubscriptionsList subs={analysis.subs} />
          <InstallmentsTable parcRows={analysis.parcRows} />
          <ProjectionPanel parcRows={projection.parcRows} anchorPeriod={projection.anchorPeriod} />
        </>
      );
    }

    if (activeSection === 'parecer') {
      return <ParecerPanel analysis={analysis} budgets={budgets} catColors={catColors} />;
    }

    // overview
    return (
      <>
        <KpiGrid analysis={analysis} />
        <BudgetProgress catEntries={analysis.catEntries} budgets={budgets} nMonths={analysis.nMonths} catColors={catColors} />
        <div className="charts">
          <CategoryChart catEntries={analysis.catEntries} catColors={catColors} />
          <TrendChart perPeriod={analysis.perPeriod} />
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active={activeSection} onSelect={setActiveSection} />
      <div className="app-content">
        <TopBar
          title={ticketTitle}
          total={analysis.totalSpend}
          hasData={hasData}
          periods={periods}
          banks={banks}
          filterPeriod={effectiveFilterPeriod}
          onFilterPeriodChange={setFilterPeriod}
          filterBank={effectiveFilterBank}
          onFilterBankChange={setFilterBank}
        />
        <main id="section-content">
          {error && <div className="panel hint">{error}</div>}
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
