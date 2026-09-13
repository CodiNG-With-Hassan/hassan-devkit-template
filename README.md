# hassan-devkit-template

A starter for new client projects that comes with the complete way of working. Click **Use this
template** on [GitHub](https://github.com/CodiNG-With-Hassan/hassan-devkit-template) to get an Nx
package-based pnpm workspace whose developer experience — Docker dev stack, parallel worktrees
with isolated stacks, pre-commit chain, CI, Claude Code layer, acceptance test cases — is
delivered by [`@coding-with-hassan/devkit`](https://github.com/CodiNG-With-Hassan/hassan-devkit)
and updated by a version bump.

## What's in the box

- **`apps/api`** — NestJS 11 with TypeORM + Postgres, JWT/Passport auth, validation, Swagger
  (`/api/docs`), mailer, schedule, S3-compatible storage wired to MinIO, paginated repositories.
  Every route lives under the `/api` prefix.
- **`apps/web`** — Angular 21 with PrimeNG + theming, NgRx signal stores, ngx-translate (EN +
  NL), Tailwind, SSR. Its dev server proxies `/api` to the API, so the app never contains a port.
- **`libs/`** — empty; shared workspace packages go here (`libs/README.md`).
- **`docker/`** — Postgres, MinIO, Mailpit (profile `api`), the web dev server (profile `web`),
  n8n + pgAdmin (profile `extras`), with content-addressed dev images shared across worktrees.
- **Devkit-driven DX** — `hassan-devkit` CLI, ESLint/Prettier presets, derived lint-staged, the
  husky hook, the thin CI workflow, the Claude Code standards and agents, the acceptance-case
  generator. All configured in the `hassan-devkit` block of the root `package.json`.

## Getting started

1. Click **Use this template**, or `git clone` this repo.
2. `cp .env.dist .env` and fill in secrets (the managed block at the bottom is written by the
   devkit — leave it).
3. `pnpm install` — also installs the pre-commit hook and the Claude Code layer (`prepare`).
4. `pnpm docker:dev:up` — Postgres + MinIO + Mailpit + API on the `api` profile.
5. Open http://localhost:3000/api/docs (Swagger), http://localhost:9001 (MinIO),
   http://localhost:8025 (Mailpit). For the web app: `pnpm worktree:profiles add web`, then
   http://localhost:4200.

Work on tickets in worktrees: `pnpm worktree:create <TICKET>-Short-Title` (see
`docs/WORKTREES.md` in your project or the devkit README).

## Commands

| Command | What |
| --- | --- |
| `pnpm docker:dev:up` / `down` / `logs` | the dev stack of this checkout (`worktree:env` runs first) |
| `pnpm worktree:create\|env\|profiles\|remove\|prune\|list` | parallel worktrees with isolated stacks |
| `pnpm lint` / `format` / `format:check` / `build` | every project through Nx |
| `pnpm ci:check` / `pnpm affected` | exactly what CI runs |
| `pnpm test-cases:generate` | the acceptance-test workbooks from `docs/testing/tc-data-*.ts` |
| `pnpm db:psql` / `db:list-tables` | the dev database |

## Renaming for a client

The template ships neutral names. Search for `template` and `Template`: the compose project
(`name:` in `docker/docker-compose.dev.yml`) and the `template-dev-*` image names, the API title
in `apps/api/src/main.ts`, `DB_NAME` in `.env.dist`, `hassan-devkit.db.name` and
`hassan-devkit.testCases.title` in `package.json`, this README. Point `hassan-devkit.tracker` at
the client's Jira project (`{ "kind": "jira", "project": "ABC", "baseUrl": "https://…" }`) or keep
GitHub issues, then run `pnpm exec hassan-devkit init` so `docs/agents` and the CI workflow pick
the new values up. Rename `workspace.code-workspace` if you like; add a lib with its own
`package.json` under `libs/` when the first shared code appears.

## How updates flow

The shared configs, the CLI and the Claude Code standards live in
[hassan-devkit](https://github.com/CodiNG-With-Hassan/hassan-devkit). When it publishes a new
`@coding-with-hassan/*` version, [Renovate](https://docs.renovatebot.com/) opens a PR here;
merging it pulls the new rules — `.github/workflows/ci.yml` and the Claude stubs read the
installed version at runtime, so nothing else needs re-generating (`hassan-devkit ci:doctor`
tells you when the workflow template itself changed).

## License

MIT — but feel free to ignore that for client work; this template is meant to be cloned and
personalised.
