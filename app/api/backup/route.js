import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { buildZip } from '@/lib/zip';
import { rowsToCsv } from '@/lib/csv';

// Tabelas de dados do usuário (RLS-scoped). "users" fica de fora por conter
// password_hash e não ser "dado financeiro" do backup.
const BACKUP_TABLES = [
  'transactions',
  'categories',
  'category_budgets',
  'category_overrides',
  'income',
  'action_items',
  'period_meta',
];

function pgType(col) {
  if (col.data_type === 'numeric' && col.numeric_precision) {
    return `numeric(${col.numeric_precision},${col.numeric_scale ?? 0})`;
  }
  if (col.data_type === 'character varying' && col.character_maximum_length) {
    return `varchar(${col.character_maximum_length})`;
  }
  return col.data_type;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  // Esquema real das tabelas, direto do catálogo do Postgres (não depende
  // de scripts de migração estarem atualizados).
  const schemaRows = await sql`
    SELECT table_name, column_name, data_type, is_nullable, column_default,
           numeric_precision, numeric_scale, character_maximum_length, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ANY(${BACKUP_TABLES})
    ORDER BY table_name, ordinal_position
  `;

  const columnsByTable = {};
  for (const row of schemaRows) {
    (columnsByTable[row.table_name] ||= []).push(row);
  }

  const tablesWithSchema = BACKUP_TABLES.filter((t) => columnsByTable[t]?.length);

  const dataResults = await sql.transaction((txn) => [
    txn`SELECT set_config('app.current_user_id', ${userId}, true)`,
    ...tablesWithSchema.map(
      (table) => txn`SELECT * FROM ${txn.unsafe(table)} WHERE user_id = ${userId}`
    ),
  ]);
  const rowsByTable = tablesWithSchema.reduce((acc, table, i) => {
    acc[table] = dataResults[i + 1];
    return acc;
  }, {});

  const schemaLines = [
    '-- Esquema das tabelas incluídas neste backup',
    `-- Gerado em ${new Date().toISOString()}`,
    '',
  ];
  const files = [];

  for (const table of tablesWithSchema) {
    const columns = columnsByTable[table];
    schemaLines.push(`CREATE TABLE ${table} (`);
    schemaLines.push(
      columns
        .map((c) => `  ${c.column_name} ${pgType(c)}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
        .join(',\n')
    );
    schemaLines.push(');', '');

    const csv = rowsToCsv(rowsByTable[table], columns.map((c) => c.column_name));
    files.push({ name: `${table}.csv`, data: Buffer.from(csv, 'utf8') });
  }

  files.unshift({ name: 'schema.sql', data: Buffer.from(schemaLines.join('\n'), 'utf8') });

  const zip = buildZip(files);
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(zip, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="backup_${dateStr}.zip"`,
    },
  });
}
