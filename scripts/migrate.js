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

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
