import { neon } from '@neondatabase/serverless';

// APP_DATABASE_URL aponta para o papel "app_user" (sem BYPASSRLS, ver
// scripts/create_app_role.js) — é o que faz as políticas de Row-Level
// Security abaixo realmente valerem; DATABASE_URL (papel dono, com
// BYPASSRLS) continua existindo só para os scripts de migração/admin.
// Cai para DATABASE_URL se APP_DATABASE_URL ainda não estiver configurada,
// pra não quebrar o app antes da variável ser criada no ambiente.
export const sql = neon(process.env.APP_DATABASE_URL || process.env.DATABASE_URL);

// Camada extra de defesa (Row-Level Security no Postgres): roda a consulta
// na mesma transação de set_config('app.current_user_id', ...), que é o que
// as políticas das tabelas protegidas (transactions/categories/
// category_budgets/category_overrides/income/period_meta) exigem para
// liberar as linhas desse usuário. Não substitui o WHERE user_id = ...
// explícito em cada rota — é redundância proposital: se uma rota futura
// esquecer o filtro, a política do banco ainda barra o vazamento (a
// consulta retorna vazio, nunca dados de outro usuário).
export function sqlAsUser(userId) {
  return async (strings, ...values) => {
    const results = await sql.transaction((txn) => [
      txn`SELECT set_config('app.current_user_id', ${userId}, true)`,
      txn(strings, ...values),
    ]);
    return results[1];
  };
}
