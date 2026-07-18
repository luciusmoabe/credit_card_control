// Cria (uma vez) um papel Postgres restrito, sem BYPASSRLS, para o app usar
// em runtime -- só assim as políticas de Row-Level Security (ver
// scripts/migrate.js) realmente valem. O papel "neondb_owner" usado pela
// DATABASE_URL padrão do Neon tem BYPASSRLS por default, então RLS não
// protege nada enquanto o app se conectar com ele.
//
// Uso: node scripts/create_app_role.js
// Roda com DATABASE_URL (papel dono, com privilégio pra CREATE ROLE/GRANT).
// Não roda de novo automaticamente com migrate.js -- rodar de novo é seguro
// (os GRANTs são idempotentes), mas NÃO troca a senha se o papel já existir,
// pra não invalidar uma APP_DATABASE_URL já configurada em algum lugar.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

const TABLES = ['transactions', 'categories', 'category_budgets', 'category_overrides', 'income', 'period_meta', 'users', 'action_items'];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const [{ exists }] = await sql`SELECT EXISTS(SELECT FROM pg_roles WHERE rolname = 'app_user') AS exists`;

  let password = null;
  if (exists) {
    console.log('Papel "app_user" já existe -- senha não foi alterada (evita quebrar uma APP_DATABASE_URL já configurada).');
    console.log('Se precisar trocar a senha, rode manualmente no banco: ALTER ROLE app_user PASSWORD \'nova-senha-aqui\';');
  } else {
    password = crypto.randomBytes(24).toString('hex');
    await sql`${sql.unsafe(`CREATE ROLE app_user LOGIN PASSWORD '${password}'`)}`;
    console.log('Papel "app_user" criado.');
  }

  await sql`GRANT CONNECT ON DATABASE neondb TO app_user`;
  await sql`GRANT USAGE ON SCHEMA public TO app_user`;
  for (const t of TABLES) {
    await sql`${sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${t} TO app_user`)}`;
  }
  await sql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user`;
  console.log('Privilégios concedidos (SELECT/INSERT/UPDATE/DELETE) em: ' + TABLES.join(', '));

  const [{ rolbypassrls }] = await sql`SELECT rolbypassrls FROM pg_roles WHERE rolname = 'app_user'`;
  console.log('Confirmação: app_user tem BYPASSRLS =', rolbypassrls, '(esperado: false)');

  if (password) {
    const url = new URL(process.env.DATABASE_URL);
    url.username = 'app_user';
    url.password = password;
    console.log('\n=== COPIE ISSO AGORA (só é exibido nesta execução) ===');
    console.log('APP_DATABASE_URL=' + url.toString());
    console.log('========================================================');
    console.log('\n1. Adicione essa linha no .env.local (uso local/dev).');
    console.log('2. Crie a mesma variável "APP_DATABASE_URL" nas Environment Variables do projeto na Vercel (produção).');
    console.log('3. Depois de configurar os dois, redeploy/reinicie o app -- ele passa a usar esse papel restrito, e a RLS passa a valer de verdade.');
  }
}

main().catch((e) => {
  console.error('Falhou:', e);
  process.exit(1);
});
