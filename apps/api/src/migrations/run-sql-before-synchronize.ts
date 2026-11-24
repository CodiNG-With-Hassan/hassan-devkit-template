import { DataSource } from 'typeorm';

// Runs one idempotent SQL script against the app database BEFORE TypeORM
// initializes — the app runs with `synchronize: true` (ADR 0001), so anything
// synchronize cannot do on its own (a table rename that must not become a
// fresh empty table, a NOT NULL column that has to be backfilled onto rows
// that already exist) is done here first, over a bare connection (no
// entities, no synchronize) with the same env vars the AppModule uses.
//
// Each step lives in its own file next to this one and exports a
// `runXMigration()` that calls this helper; main.ts awaits them in order
// before creating the app.
export async function runSqlBeforeSynchronize(sql: string): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await dataSource.initialize();
  try {
    await dataSource.query(sql);
  } finally {
    await dataSource.destroy();
  }
}
