# hassan-devkit-template

A starter for new client web projects. Use the **Use this template** button on [GitHub](https://github.com/CodiNG-With-Hassan/hassan-devkit-template) to spin up a fresh repo with the stack pre-wired and all developer-experience configs sourced from the [`@hassan/*`](https://github.com/CodiNG-With-Hassan/hassan-devkit) packages.

## What's in the box

- **NestJS API** (`api/`) — `@nestjs/core` 11 with TypeORM + Postgres, JWT/Passport auth, validation, Swagger, mailer, schedule, S3-compatible storage wired to MinIO, paginated repositories.
- **Angular SPA** (`spa/`) — Angular 21 with PrimeNG + theming, NgRx signal stores, ngx-translate (English + Dutch out of the box), Tailwind, SSR, Vitest.
- **Docker dev stack** (`docker/`) — Postgres, pgAdmin, MinIO, Mailpit, n8n, and live-reloading containers for the API and SPA, orchestrated by `docker-compose.dev.yml`.
- **Devkit-driven DX** — ESLint/Prettier/lint-staged configs, husky pre-commit hook, and CLI come from `@hassan/*` packages, so updating a rule is a `pnpm up` away.

## Getting started

1. Click **Use this template** on GitHub, or `git clone` this repo.
2. Copy `.env.dist` to `.env` and fill in secrets.
3. `pnpm install` (this also installs the husky hook via `@hassan/devkit`).
4. `pnpm docker:dev:up` — brings up Postgres + MinIO + Mailpit + pgAdmin + n8n + API + SPA.
5. Open http://localhost:4200 (SPA), http://localhost:3000/api (Swagger), http://localhost:5050 (pgAdmin), http://localhost:9001 (MinIO), http://localhost:8025 (Mailpit).

## Renaming

The template ships with neutral folder names (`api/`, `spa/`) and the npm packages' own names. If you want client-branded names:

- Folder layout (`api/` → `<brand>-api/`): rename, then update `pnpm-workspace.yaml`, root `package.json` scripts, `lint-staged.config.js`, and `docker/docker-compose.dev.yml` build contexts.
- Container names: edit `docker/docker-compose.dev.yml`.
- Angular selector prefix: edit `spa/eslint.config.js` (`{ prefix: '<brand>' }`).
- VSCode workspace: rename `template.code-workspace` to `<brand>.code-workspace`.

## How updates flow

The shared configs and CLI live in [hassan-devkit](https://github.com/CodiNG-With-Hassan/hassan-devkit). When that repo publishes a new `@hassan/*` version, [Renovate](https://docs.renovatebot.com/) opens a PR in this repo — merging it pulls the new rules. No manual sync.

## License

MIT — but feel free to ignore that for client work; this template is meant to be cloned and personalised.
