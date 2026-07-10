import { normalizeValue } from '@/lib/finance';

// Extrai só os 4 campos com rótulo fixo e inequívoco de um contracheque
// (competência, total de vantagens, total de descontos, líquido) — nunca
// decompõe rubricas variáveis, e nunca captura nada além desses rótulos, o
// que evita por construção qualquer PII (CPF, matrícula, endereço) do
// documento chegar ao resultado.
const MONEY_RE = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';

const PERIOD_LABELED_RE = /(?:M[ÊE]S\s*\/?\s*ANO|COMPET[ÊE]NCIA|PER[ÍI]ODO)[^0-9]{0,25}(0[1-9]|1[0-2])[./](\d{4})/i;
const PERIOD_NUMERIC_RE = /\b(0[1-9]|1[0-2])[./](\d{4})\b/;
const PERIOD_MONTHNAME_RE = /\b([A-Za-zÀ-ÿ]+)\/(\d{4})\b/;

const MONTH_NAMES = {
  janeiro: '01', fevereiro: '02', marco: '03', abril: '04', maio: '05', junho: '06',
  julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
};

// O gap [^\d\-\n] exclui a quebra de linha de propósito: rótulo e valor só
// devem ser considerados "adjacentes" (tier 1) quando estão na MESMA linha —
// caso contrário (rótulo numa linha, valores tabulados na linha seguinte,
// como acontece com LÍQUIDO em contracheques reais) o casamento direto teria
// que "pular" pra frente e acabaria pegando o valor errado da coluna
// vizinha. Deixar cruzar linha aqui faria o tier 1 "acertar" por acidente
// com o número errado antes do fallback de tabela (extractLiquido) entrar.
const VANTAGENS_RE = new RegExp('TOTAL\\s+DE\\s+VANTAGENS[^\\d\\-\\n]{0,40}' + MONEY_RE, 'i');
const DESCONTOS_RE = new RegExp('TOTAL\\s+DE\\s+DESCONTOS[^\\d\\-\\n]{0,40}' + MONEY_RE, 'i');
const LIQUIDO_RE = new RegExp('(?:VALOR\\s+)?L[ÍI]QUIDO(?:\\s+A\\s+RECEBER)?[^\\d\\-\\n]{0,40}' + MONEY_RE, 'i');
const LIQUIDO_LABEL_RE = /L[ÍI]QUIDO/i;

function stripAccents(s) {
  return s.normalize('NFD').replace(new RegExp('[̀-ͯ]', 'g'), '');
}

function extractMoney(text, re) {
  const m = text.match(re);
  return m ? normalizeValue(m[1]) : null;
}

// Aceita período numérico rotulado ("PERÍODO: 06.2026"), por extenso
// ("Junho/2026", formato usado por este modelo de contracheque estadual) e,
// só como último recurso, numérico solto sem rótulo ("06.2026" em qualquer
// lugar do texto). A ordem importa: um numérico solto é arriscado, porque
// QUALQUER outra data no documento no formato DD.MM.AAAA (ex. "ADMISSÃO
// 20.04.1989") também bate com o padrão MM.AAAA (o "04.1989" dentro dela) —
// por isso ele só é tentado depois que as duas formas mais específicas
// (rotulada e por extenso, que não têm esse tipo de colisão) já falharam.
function extractPeriod(text) {
  const labeled = text.match(PERIOD_LABELED_RE);
  if (labeled) return `${labeled[2]}-${labeled[1]}`;

  const named = text.match(PERIOD_MONTHNAME_RE);
  if (named) {
    const mm = MONTH_NAMES[stripAccents(named[1].toLowerCase())];
    if (mm) return `${named[2]}-${mm}`;
  }

  const bare = text.match(PERIOD_NUMERIC_RE);
  if (bare) return `${bare[2]}-${bare[1]}`;

  return null;
}

// O líquido costuma aparecer como o último de vários rótulos numa linha de
// resumo (ex. "... BASE DE CÁLCULO IMP. RENDA LÍQUIDO"), com os valores
// correspondentes na linha SEGUINTE, na mesma ordem — rótulo e valor não
// ficam adjacentes no texto. Tenta o casamento direto primeiro (funciona
// quando rótulo e valor saem juntos) e cai para "último valor da linha
// seguinte ao rótulo" quando não.
function extractLiquido(flatText, lines) {
  const direct = extractMoney(flatText, LIQUIDO_RE);
  if (direct !== null) return direct;

  const idx = lines.findIndex((l) => LIQUIDO_LABEL_RE.test(l));
  if (idx === -1 || idx + 1 >= lines.length) return null;
  const moneyMatches = [...lines[idx + 1].matchAll(new RegExp(MONEY_RE, 'g'))];
  if (!moneyMatches.length) return null;
  return normalizeValue(moneyMatches[moneyMatches.length - 1][1]);
}

export function parsePayslipText(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const flat = lines.join('\n');

  const period = extractPeriod(flat);
  const gross_income = extractMoney(flat, VANTAGENS_RE);
  const deductions = extractMoney(flat, DESCONTOS_RE);
  const net_income = extractLiquido(flat, lines);

  const warnings = [];
  if (!period) warnings.push('Período não encontrado automaticamente — preencha manualmente.');
  if (gross_income === null) warnings.push('Total de Vantagens não encontrado — preencha manualmente.');
  if (deductions === null) warnings.push('Total de Descontos não encontrado — preencha manualmente.');
  if (net_income === null) warnings.push('Líquido não encontrado — preencha manualmente (obrigatório).');
  if (gross_income !== null && deductions !== null && net_income !== null) {
    const expected = gross_income - deductions;
    if (Math.abs(expected - net_income) > 0.02) {
      warnings.push('Vantagens − Descontos não bate com o Líquido extraído — confira os valores antes de confirmar.');
    }
  }

  return { period, gross_income, deductions, net_income, warnings };
}
