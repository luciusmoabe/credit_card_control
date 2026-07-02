# Painel de Faturas — Handoff para Claude Code

## Objetivo desta sessão
Migrar o "Painel de Faturas" (hoje um artifact HTML autocontido, rodando 100% no
navegador com `window.storage` como persistência) para uma aplicação hospedada de
verdade, com banco Postgres no **Neon**.

Arquitetura alvo:

```
Frontend (Next.js, reaproveitando UI/lógica de painel_faturas.html)
        │  fetch
        ▼
API routes (Next.js) ──► Neon (Postgres, via @neondatabase/serverless)
```

O frontend **não deve** falar com o Neon diretamente — sempre via API routes do
próprio Next.js, para não expor a connection string no navegador.

## Arquivo de referência
`painel_faturas.html` (neste mesmo pacote) é a versão atual e funcional do app.
Ele contém toda a lógica de negócio já validada — a ideia é portar essa lógica,
não reescrevê-la do zero. Principais blocos de JS a extrair para o backend/lib:

- `categorize(desc)` — regras de categorização automática por palavra-chave
- `isInstallment(desc)` — detecção de compra parcelada via regex `PARC\s*\d+\/\d+`
- `buildParcelamentos(scoped)` — agrupa parcelas ativas por descrição
- `buildProjection(parcRows, anchorPeriod)` — projeção de comprometimento futuro
- `computeAnalysis()`, `buildDiagnostics()`, `buildHealthBadge()`,
  `buildFallbackRecommendations()` — motor do "Parecer do Educador Financeiro"
- `fetchAiRecommendations()` — hoje chama a Anthropic API direto do navegador
  (padrão de artifact); no Next.js isso deve virar uma API route server-side
  (nunca expor a API key no cliente)

## Modelo de dados atual (window.storage) → schema Postgres alvo

Hoje existem 3 chaves no `window.storage`:
- `transactions` → array de lançamentos
- `category_overrides` → dicionário palavra-chave → categoria (edição manual do usuário)
- `period_meta` → dicionário período → banco (usado como fallback de banco)

Schema Postgres proposto:

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  date TEXT,
  description TEXT NOT NULL,
  bank TEXT,
  period TEXT,                    -- formato 'YYYY-MM'
  value NUMERIC(12,2) NOT NULL,   -- valores negativos = estorno/pagamento
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE category_overrides (
  user_id TEXT NOT NULL DEFAULT 'default',
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (user_id, keyword)
);

CREATE TABLE period_meta (
  user_id TEXT NOT NULL DEFAULT 'default',
  period TEXT NOT NULL,
  bank TEXT,
  PRIMARY KEY (user_id, period)
);

CREATE INDEX idx_transactions_user_period ON transactions(user_id, period);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);
```

`user_id` já vem desenhado desde o início (mesmo que hoje só exista `'default'`),
para não ter que migrar schema depois se o app ganhar login.

## Categorias válidas (CATEGORIES) e cores (CAT_COLORS)

**Importante:** "Parcelamentos" NÃO é categoria — é condição de pagamento,
detectada separadamente via `isInstallment()`. Isso foi uma correção recente
feita a pedido do usuário; não reintroduzir.

```js
const CATEGORIES = ['Alimentação','Assinaturas','Saúde & Cuidado Pessoal',
  'Transporte','Compras & Mercado','Anuidade','IOF/Tarifas','Pagamento Fatura','Outros'];

const CAT_COLORS = {
  'Alimentação':'#C1562E','Assinaturas':'#B98A2E','Saúde & Cuidado Pessoal':'#2F6F5E',
  'Transporte':'#5B6B62','Compras & Mercado':'#7F77DD',
  'Anuidade':'#993C1D','IOF/Tarifas':'#888780','Pagamento Fatura':'#639922','Outros':'#B4B2A9'
};
```

## Funcionalidades a preservar (feature list)

1. Importação de lançamentos: texto colado, CSV, ou PDF de fatura (via pdf.js)
2. Prévia editável antes de confirmar import (staging area)
3. Categorização automática + override manual persistente por palavra-chave
4. Filtros: período, banco, categoria, busca livre
5. Gráficos: gastos por categoria (donut), evolução mensal (linha)
6. Detecção de assinaturas/recorrências
7. Detecção de parcelamentos ativos + projeção de comprometimento futuro (12 meses)
8. **Parecer do Educador Financeiro**: selo de saúde financeira (verde/amarelo/
   vermelho, derivado dos diagnósticos — não pode contradizer o corpo do texto),
   diagnósticos com severidade (`warn`/`ok`/`info`), recomendações com IA
   (fallback local se a IA falhar), exportável em PDF via impressão nativa do
   navegador (`window.print()` + CSS `@media print` dedicado — NÃO usar
   html2canvas/html2pdf, que se mostrou pouco confiável em ambiente sandboxed)

## Coisas que já quebraram antes (não repetir)

- **Exportação de PDF via html2canvas/html2pdf**: gerava páginas em branco de
  forma consistente em ambiente sandboxed. Solução adotada: impressão nativa
  do navegador com CSS `@media print` escondendo tudo exceto o parecer via
  `display:none` (nunca `visibility:hidden`, que mantém o espaço no layout e
  gera páginas extras em branco).
- **Selo de saúde financeira desalinhado com o diagnóstico**: o selo deve ser
  *derivado* da lista de diagnósticos (contagem de itens `warn`), nunca
  calculado por um critério independente — senão o resumo pode contradizer o
  corpo do texto.
- **"Parcelamentos" como categoria**: já foi removido; parcelamento é atributo
  da transação (`isInstallment`), não categoria de gasto.

## Próximos passos sugeridos para o Claude Code

1. Confirmar se já existe um projeto Neon criado (senão, criar em neon.tech ou
   via CLI/MCP do Neon, se disponível) e obter a `DATABASE_URL`
2. Rodar as migrations do schema acima
3. Scaffold do Next.js (`npx create-next-app`) com API routes:
   - `GET/POST /api/transactions`
   - `GET/POST /api/overrides`
   - `POST /api/parecer/ai-recommendations` (proxy server-side para a Anthropic API)
4. Portar a lógica de `categorize`, `buildParcelamentos`, `buildProjection`,
   `computeAnalysis`, `buildDiagnostics`, `buildHealthBadge` para
   `lib/finance.js` (funções puras, testáveis, reaproveitadas por frontend e
   API routes onde fizer sentido)
5. Portar a UI (HTML/CSS de `painel_faturas.html`) para componentes React
6. Script de migração: ler os dados atuais (usuário pode exportar o
   `window.storage` do artifact) e popular as tabelas do Neon
7. Deploy (Vercel é o caminho mais direto para Next.js + Neon)
