# TypeORM `synchronize` in production, no migrations

The API runs TypeORM with `synchronize: true` in every environment, production included, and has
no migrations folder. This is the house workflow: the schema always follows the entities and a
change needs no extra step. We accepted that synchronize can drop or alter columns on live data.
Anything synchronize cannot do safely is done first, through `runSqlBeforeSynchronize`
(`apps/api/src/migrations/`), which `main.ts` awaits before the app starts. Examples: renaming a
table or column instead of dropping and re-creating it, or backfilling a new NOT NULL column on
existing rows.

## Considered Options

- **Real TypeORM migrations, synchronize off.** Safer on production data and easiest to adopt
  while the database is empty. Rejected as the default so every project works the same way.
  Switching later means generating a baseline migration from the then-current schema.
- **Synchronize in dev, migrations in production.** Rejected for the same reason: two schema
  workflows to keep in step.

## Consequences

- Every entity change is a production schema change on the next deploy. Review entity diffs as
  schema diffs: a renamed property is a dropped column plus a new empty one unless a
  pre-synchronize step renames it first.
- Nothing stops a destructive entity change, so a database backup before every risky deploy is
  the safety net. A project whose records are hard to restore (financial history, legal
  documents) revisits this decision before real data accumulates.
