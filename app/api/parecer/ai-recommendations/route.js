import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

function sanitizeAiHtml(html) {
  return html
    .replace(/```html|```/g, '')
    .replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export async function POST(request) {
  const payload = await request.json();

  const prompt = `Você é um educador financeiro brasileiro experiente, com tom acolhedor, direto e prático (sem julgamentos). Analise os dados agregados de faturas de cartão de crédito abaixo e escreva APENAS a seção de recomendações de um parecer financeiro, em português do Brasil.

Requisitos:
- De 4 a 6 recomendações concretas e personalizadas, citando descrições e valores reais dos dados (estime a economia mensal e anual de cada ação).
- Termine com um parágrafo curto "Próximo passo desta semana" com UMA ação simples e imediata.
- Responda SOMENTE com HTML simples usando as tags <p>, <ul>, <li>, <strong>. Sem markdown, sem <h1>-<h6>, sem comentários, sem texto fora do HTML.

Dados (JSON):
${JSON.stringify(payload)}`;

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  if (response.stop_reason === 'refusal') {
    return NextResponse.json({ error: 'Solicitação recusada pelo modelo.' }, { status: 502 });
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    return NextResponse.json({ error: 'Resposta vazia da IA.' }, { status: 502 });
  }

  return NextResponse.json({ html: sanitizeAiHtml(text) });
}
