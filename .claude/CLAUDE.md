# Project notes

This repo was scaffolded from [hassan-devkit-template](https://github.com/CodiNG-With-Hassan/hassan-devkit-template). The developer experience (lint, format, docker scripts, husky hooks, lint-staged) lives in `@coding-with-hassan/*` packages from [hassan-devkit](https://github.com/CodiNG-With-Hassan/hassan-devkit) — those packages, not local files, define the rules.

## Docker

Always use the npm scripts from the root `package.json` for Docker operations — never run `docker compose` directly.

- **Start**: `pnpm docker:dev:up`
- **Stop**: `pnpm docker:dev:down`
- **Logs**: `pnpm docker:dev:logs`

## Linting & Formatting

The lint and format configs live in `@coding-with-hassan/eslint-config-api`, `@coding-with-hassan/eslint-config-spa`, `@coding-with-hassan/prettier-config-api`, `@coding-with-hassan/prettier-config-spa`. Local `eslint.config.*` / `.prettierrc` files are thin shims — do not inline rules here.

| Project | Path | Notable rules |
|---|---|---|
| API (NestJS) | `api/` | `singleQuote`, `trailingComma: "all"` |
| SPA (Angular) | `spa/` | `printWidth: 100`, `singleQuote` |

From the monorepo root: `pnpm lint`, `pnpm format`, `pnpm format:check`.

For day-to-day editing in VSCode, open `template.code-workspace` (or rename it).

## Database

Generic helpers via the `hassan-devkit` CLI:

- `pnpm db:list-tables`
- `pnpm db:psql` (interactive shell)
- Add client-specific scripts (e.g. `pnpm db:wipe-bookings`) directly in the root `package.json`.
