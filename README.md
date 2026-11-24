# Template

The starting point of a new client web project: a NestJS API, an Angular staff app and a
server-rendered Angular customer site in one Nx pnpm-workspace monorepo, wired to
[`@coding-with-hassan/devkit`](https://github.com/CodiNG-With-Hassan/hassan-devkit). Click **Use
this template**, clone the new repository, and it runs:

```bash
pnpm install
pnpm docker:dev:up
```

Every name in it is a placeholder: the project name `template`, the ticket key `TPL`, the
`tpl-i18n` package, the host ports and the brand theme. Rename them for the real project before
the first feature.

## Repository Structure

```
template/
├── apps/
│   ├── api/                      # Backend  (NestJS 11, error-code contract)
│   ├── web-admin/                # Staff web app (Angular 22, PrimeNG, Tailwind)
│   └── web-customer/             # Customer site (Angular 22, server-side rendered)
├── libs/                         # Shared libraries (workspace:* packages, consumed as source)
│   ├── api-types/                # Types generated from the API's OpenAPI spec
│   ├── api-client/               # Angular repositories generated from the same spec
│   ├── i18n/                     # Language list (en, nl) and the shared ERRORS catalog
│   ├── theme/                    # Brand tokens (PrimeNG preset, neutral placeholder)
│   ├── web-ui/                   # Shared Angular UI (logo, theme and language switches, field errors)
│   ├── shared-utils/             # Framework-agnostic helpers
│   └── assets/                   # Shared static assets
├── docker/                       # Docker Compose & dev Dockerfiles
├── docs/                         # ADRs, worktree guide, acceptance test cases
├── scripts/                      # Translation checks, pre-commit guards
├── nx.json                       # Nx task caching / affected config
├── pnpm-workspace.yaml           # Workspace packages + build allowlist
├── .env.dist                     # Environment template
└── package.json                  # Root scripts + the hassan-devkit config block
```

The way of working — worktrees, the pre-commit chain, CI, commit standards, the Claude Code
layer — comes from the devkit, configured in the `hassan-devkit` block of the root
`package.json`.

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | Angular 22 (SSR for the customer site), PrimeNG, Tailwind CSS, ngx-translate |
| Backend  | NestJS 11, TypeORM, Swagger, TypeScript                |
| Database | PostgreSQL 17                                          |
| Tooling  | pnpm workspace + Nx (task caching, affected)           |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 26+
- [pnpm](https://pnpm.io/) 11

## Getting Started

From the monorepo root:

```bash
pnpm install            # one install at the repo root covers all apps
pnpm docker:dev:up      # Create .env from .env.dist, build (if needed) and start the enabled profiles
pnpm docker:dev:logs    # Follow logs
pnpm docker:dev:down    # Stop the stack
```

The stack starts with the `api` profile only (db, backend). Add a web dev server or pgAdmin when
you need them — `pnpm worktree:profiles add customer admin extras` — see
[docs/WORKTREES.md](docs/WORKTREES.md#profiles-what-runs-per-stack).

| Service      | Profile    | URL                       |
| ------------ | ---------- | ------------------------- |
| API          | `api`      | http://localhost:3000/api |
| Swagger      | `api`      | http://localhost:3000/api |
| Postgres     | `api`      | localhost:5432            |
| web-customer | `customer` | http://localhost:4200     |
| web-admin    | `admin`    | http://localhost:4201     |
| pgAdmin      | `extras`   | http://localhost:5050     |

pgAdmin default login: `admin@admin.com` / `postgres`

Dependency bumps need no extra step: `pnpm docker:dev:up` re-hashes the lockfile into the dev
image tag and mounts fresh `node_modules` volumes automatically.

Working on several tickets in parallel? Each one gets its own worktree and its own isolated dev
stack — see [docs/WORKTREES.md](docs/WORKTREES.md).

### Task running (Nx)

Root scripts fan out through Nx with caching:

```bash
pnpm build                 # nx run-many -t build (api + both web apps, production builds)
pnpm lint                  # nx run-many -t lint
pnpm format:check          # nx run-many -t format:check
pnpm affected              # lint + build only what changed vs main (hassan-devkit ci:affected)
pnpm ci:check              # what CI runs before lint+build: doctor, formatting, path-triggered checks
pnpm api:types             # regenerate the OpenAPI spec, api-types and api-client from the running API
pnpm exec nx run api:lint  # single project target
```

> **Testing policy** — there is no unit-test gate: CI runs format, lint and production builds.
> Correctness is asserted by the acceptance test cases in `docs/testing/` (English and Dutch, one
> file per frontend). Every change to user-facing behaviour ships with its cases; regenerate the
> workbooks with `pnpm test-cases:generate`. The `.xlsx` outputs are gitignored build artifacts —
> commit only the data files together with the feature.

## Starting a project from the template

1. **Use this template** on GitHub, then clone the new repository.
2. `pnpm install && pnpm docker:dev:up` — the stack must come up before anything is renamed.
3. Rename the placeholders: the project name (`template`, `Template`: package names, compose
   project, database, image names, titles), the ticket key (`TPL`, and with it the `tpl-i18n`
   package), the tracker in the `hassan-devkit` block (GitHub issues, or a Jira project) and the
   host ports (`worktree.ports`, the compose fallbacks, `.env.dist`, the tables in this file and
   in `docs/WORKTREES.md`).
4. Write the domain glossary (`CONTEXT.md`) and the project's first decisions (`docs/adr/`,
   continuing after the two house ADRs).
5. Replace the placeholder brand: the preset in `libs/theme`, the logo in `libs/web-ui`, the
   typeface in each app's `src/styles.css`.
6. Delete `packageRules` from `renovate.json` unless the project also wants devkit bumps merged
   unattended (see below), and enable Renovate on the repository.

## Maintaining the template

This repository is maintained like a project: its own CI (`.github/workflows/ci.yml`, scaffolded
by the devkit) runs the commit standard, format, lint and production builds on every pull
request, and Renovate (`renovate.json`) bumps `@coding-with-hassan/*` and merges the bump by
itself when that CI is green. A devkit release that breaks the template therefore shows up as a
red Renovate pull request here. Tickets are this repository's GitHub issues, as `TPL-<n>`.

## Backend Conventions

- **Feature modules** live under `apps/api/src/<feature>/`; **entities** live in the top-level
  `apps/api/entities/` directory (created with the first entity), not inside feature modules.
- **TypeORM** runs with `synchronize: true` and no migration runner
  ([ADR 0001](docs/adr/0001-typeorm-synchronize-in-production.md)); the few steps synchronize
  cannot do are idempotent SQL in `apps/api/src/migrations/`, run from `main.ts`.
- **Errors** are codes, never text: throw `DomainException` with an `ErrorCode`; the frontends
  translate it ([ADR 0002](docs/adr/0002-error-codes-translated-by-the-frontends.md)).
- **Validation** is global (`AppValidationPipe`: `whitelist`, `forbidNonWhitelisted`,
  `transform`); DTOs use `class-validator` decorators.
- **Swagger** UI is at `/api`, the spec at `/api-json`; every route is served under the `/api`
  global prefix. Endpoints declare a response `type` so the generated client is typed.

## Languages

Both web apps ship in English and Dutch. See `.claude/rules/i18n.md` for how a language is added
and `libs/i18n/README.md` for how catalogs are shared and checked.
