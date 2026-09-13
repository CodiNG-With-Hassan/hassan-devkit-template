# Template workspace

<!-- devkit standards: house rules shipped by @coding-with-hassan/devkit; project rules follow -->
@../node_modules/@coding-with-hassan/devkit/claude/standards.md

Nx package-based pnpm workspace scaffolded from
[hassan-devkit-template](https://github.com/CodiNG-With-Hassan/hassan-devkit-template): apps in
`apps/` (`api` — NestJS 11 + TypeORM/Postgres, JWT auth, Swagger, mailer, S3-compatible storage;
`web` — Angular 21 with PrimeNG, NgRx signal stores, ngx-translate EN/NL, Tailwind, SSR), shared
libraries in `libs/` (empty until you add one — see `libs/README.md`). One `pnpm install` at the
root covers everything.

The way of working (Docker via the npm scripts, one worktree per ticket with its own stack,
commit/push consent, acceptance cases as the quality gate, CI parity) comes from
`@coding-with-hassan/devkit` through the import above; everything the devkit reads is the
`hassan-devkit` block in the root `package.json`. Project notes on top of it:

## Docker

- The dev stack runs on compose profiles: `api` (db, init, api, MinIO, Mailpit) is the mandatory
  default, `web` adds the Angular dev server (≈2 GiB), `extras` adds n8n + pgAdmin. Add a profile
  only while you need it: `pnpm worktree:profiles add web`.
- Crashed dev server: `api`/`web` restart at most 3 times, then stay `Exited` — read
  `pnpm docker:dev:logs`, fix the cause, `pnpm docker:dev:up`. Infra restarts on its own.
- URLs on slot 0: API `http://localhost:3000/api` (Swagger at `/api/docs`), web
  `http://localhost:4200`, MinIO console `:9001`, Mailpit `:8025`, pgAdmin `:5050`, n8n `:5678`.
  A worktree on slot N adds 10 × N to every port (`pnpm worktree:list`).

## How the web app reaches the API

Every API route lives under the `/api` global prefix. The web dev server proxies `/api/*`
(`apps/web/proxy.conf.mjs`) to `API_PROXY_TARGET` — the `api` container inside Docker, the
worktree's own API port on the host — and `environment.ts` uses the relative `apiUrl: '/api'`.
Never hardcode a port in the app.

## Linting & formatting

Each app owns its config through the shared presets (`@coding-with-hassan/eslint-config-*`,
`@coding-with-hassan/prettier-config-*`): API = `singleQuote`, `trailingComma: "all"`; web =
`printWidth: 100`, `singleQuote`, no trailing comma, angular-eslint with the `app` selector
prefix. Root: `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm build` (all through Nx),
`pnpm ci:check` + `pnpm affected` for CI parity.

## Translations

App copy lives in `apps/web/public/assets/i18n/<module>/{en,nl}.json`, loaded per module by
`@larscom/ngx-translate-module-loader`. Keys are `UPPERCASE_SNAKE_CASE` and every module has
every language: `hassan-devkit i18n:check` (configured by `hassan-devkit.i18n`) runs in the
pre-commit hook.

## Renaming for a client

Search for `template` (compose project name, `template-dev-*` image names, the API title in
`apps/api/src/main.ts`, `DB_NAME` in `.env.dist`, `hassan-devkit.db.name`, `testCases.title`)
and `Template` in `README.md`; set `hassan-devkit.tracker` to the client's Jira project or keep
GitHub issues; then run `hassan-devkit init` once more so the generated files pick the new
values up.
