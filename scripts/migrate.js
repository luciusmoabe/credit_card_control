const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Running migrations...');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      );
    `;
    console.log('Table users created or already exists.');

    await sql`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'credit_card';
    `;
    console.log('Column account_type added to transactions.');

    await sql`
      CREATE TABLE IF NOT EXISTS income (
        user_id TEXT NOT NULL DEFAULT 'default',
        period TEXT NOT NULL,
        gross_income NUMERIC(12,2),
        deductions NUMERIC(12,2),
        net_income NUMERIC(12,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (user_id, period)
      );
    `;
    console.log('Table income created or already exists.');

    await sql`
      CREATE TABLE IF NOT EXISTS action_items (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT,
        target_amount NUMERIC(12,2),
        due_date DATE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        completed_at TIMESTAMPTZ
      );
    `;
    console.log('Table action_items created or already exists.');

    // Row-Level Security como camada extra de defesa: mesmo que uma rota
    // futura esqueça o WHERE user_id = ..., a política do banco barra o
    // vazamento (consulta sem set_config('app.current_user_id', ...) na
    // mesma transação retorna vazio, nunca dado de outro usuário). FORCE é
    // o que faz a política valer mesmo para o dono da tabela (o papel usado
    // pela própria DATABASE_URL do app) -- sem isso, RLS não protegeria nada.
    await sql`
      DO $$
      DECLARE
        tbl TEXT;
      BEGIN
        FOREACH tbl IN ARRAY ARRAY['transactions','categories','category_budgets','category_overrides','income','period_meta','action_items']
        LOOP
          EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
          EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
          EXECUTE format('DROP POLICY IF EXISTS user_isolation ON %I', tbl);
          EXECUTE format(
            'CREATE POLICY user_isolation ON %I USING (user_id = current_setting(''app.current_user_id'', true))',
            tbl
          );
        END LOOP;
      END $$;
    `;
    console.log('Row-Level Security habilitada em transactions/categories/category_budgets/category_overrides/income/period_meta/action_items.');

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
