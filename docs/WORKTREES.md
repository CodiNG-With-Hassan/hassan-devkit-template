# Parallel development with worktrees

Work on multiple tickets at the same time: one git worktree per ticket, one editor/Claude
session per worktree, and one fully isolated Docker dev stack per worktree (own compose
project name, own host ports, own database volume). Nothing is shared between worktrees
except the dev images.

Everything is driven by `@coding-with-hassan/devkit` from the `hassan-devkit.worktree` block in
the root `package.json` (base directory, base ports, default and required profiles, readiness
URL, extra managed `.env` keys). Profile → service maps are derived from
`docker/docker-compose.dev.yml`.

## Quick reference

```bash
pnpm worktree:create TPL-12-Short-Title       # prune merged + fetch + worktree off the remote main + .env + issue assigned to you + install + stack up
pnpm worktree:create TPL-12-Short-Title --profiles admin   # ...with the web-admin dev server from the start
pnpm worktree:profiles add customer           # (inside a worktree) start the web-customer dev server too
pnpm worktree:profiles remove customer        # ...and stop it again; `profiles list` shows what is on
pnpm worktree:list                            # worktrees with slot, ports, profiles, image tag
pnpm worktree:env                             # refresh this checkout's managed .env block
pnpm worktree:remove TPL-12-Short-Title       # stack down (volumes deleted) + worktree gone
pnpm worktree:prune                           # remove every worktree whose PR is merged
```

`create` prints the worktree's ports when it finishes. Open the worktree folder in its own editor
window (`template.code-workspace` inside it works as usual) and work there: every npm script reads
that worktree's `.env` and talks to its stack only. A new stack starts with the **`api` profile
only** (db, backend); add `customer` or `admin` when you need a browser.

## How it works

- **Location** — worktrees live outside the repo at `../template-worktrees/<branch>/`, so no tool
  that scans the repo ever sees a second copy of the sources.
- **Slots** — every checkout holds a slot: the main checkout is slot 0, a worktree gets the lowest
  free slot (allocated under a lock, so parallel `create`s cannot pick the same one).
- **Compose project** — the lower-cased branch name (`tpl-12-short-title`), so Docker Desktop
  groups each worktree's containers under its ticket, and containers, networks and named volumes
  (`tpl-12-short-title_pgdata`, …) never collide.
- **Managed `.env` block** — `worktree:env` (run by every `pnpm docker:dev:up`) writes
  `COMPOSE_PROJECT_NAME`, `COMPOSE_PROFILES`, `DEVKIT_IMAGE_TAG`, `DEVKIT_SLOT`, `DEVKIT_BRANCH`,
  `DEVKIT_PORT_*`, plus the project's extras `CUSTOMER_URL`, `ADMIN_URL`, `API_PROXY_TARGET` and
  `API_SPEC_URL` (declared in `worktree.env`). Never edit the block by hand. A checkout without
  a `.env` gets one from `.env.dist` on the first `pnpm docker:dev:up`.
- **Images** — every stack runs `template-dev-<service>:<DEVKIT_IMAGE_TAG>`, shared by all
  checkouts on the same dependency manifest: the tag hashes the lockfile, the workspace file,
  every `package.json` and the dev Dockerfiles. Sources are bind-mounted, so only a dependency
  bump builds a new image. `node_modules` live in named volumes keyed by project and tag
  (`<project>_{api,customer,admin}_node_modules_<tag>`), seeded from the image on first mount.

## Profiles: what runs per stack

| Profile         | Services                           | Use it for                           |
| --------------- | ---------------------------------- | ------------------------------------ |
| `api` (default) | db, backend                        | always — API work, `pnpm api:types`  |
| `customer`      | customer (web-customer dev server) | verifying web-customer in a browser  |
| `admin`         | admin (web-admin dev server)       | verifying web-admin in a browser     |
| `extras`        | pgAdmin                            | looking at the database in a GUI     |

`api` is required and cannot be removed. Docker memory is a budget shared by every session on the
machine: add a web profile right before you verify in a browser and remove it when you are done.
The `customer` dev server also renders on the server, which makes it the heaviest of the three.

Dev servers (`backend`, `customer`, `admin`) run with `restart: on-failure:3`; the database and
pgAdmin with `unless-stopped`. A dev server that crashes three times in a row stays `Exited`: read
`pnpm docker:dev:logs`, fix the cause, run `pnpm docker:dev:up` again.

## Ports

Slot N adds `10 × N` to every host port. The base ports below are the template's placeholders;
a project that shares a machine with other projects moves them clear of those projects' slot
ranges (`worktree.ports` in the root `package.json`, the fallbacks in the compose file, the
`.env.dist` block and this table).

| Service          | Variable               | Slot 0 | Slot N     |
| ---------------- | ---------------------- | ------ | ---------- |
| API              | `DEVKIT_PORT_API`      | 3000   | 3000 + 10N |
| web-customer     | `DEVKIT_PORT_CUSTOMER` | 4200   | 4200 + 10N |
| web-admin        | `DEVKIT_PORT_ADMIN`    | 4201   | 4201 + 10N |
| Postgres         | `DEVKIT_PORT_DB`       | 5432   | 5432 + 10N |
| pgAdmin (extras) | `DEVKIT_PORT_PGADMIN`  | 5050   | 5050 + 10N |

Inside the compose network every service keeps its standard port (the API `3000`, Postgres
`5432`, web-customer `4200`, web-admin `4201`); only the host side is offset.

## How the web apps find "their" API

The dev `environment.ts` has a relative `apiUrl`, and each dev server proxies `/api` to
`API_PROXY_TARGET` (`apps/<app>/proxy.conf.mjs`): the backend service inside the Docker stack,
this checkout's own API port (from the managed `.env`) when the dev server runs on the host. No
file needs a per-worktree edit, so never hardcode a port in an environment file. The
web-customer dev server also renders pages on the server; that render reaches the catalogs and
the proxy through `SSR_SELF_ORIGIN`, set for the container in the compose file.

## Regenerating the API contract

`pnpm api:types` fetches the spec from `API_SPEC_URL` — this checkout's own API. The backend
stamps the spec with its compose project and branch, and `libs/api-types/scripts/fetch-spec.mjs`
refuses a spec from another checkout, so types from the wrong branch cannot be committed by
accident. The stamps are stripped before the spec is written to disk.

## Tickets

Tickets are GitHub issues of this repository: branch `TPL-<n>-Short-Title` belongs to issue
`#<n>`, and `create` assigns that issue to you (`gh` must be signed in). It is best effort: a
missing issue prints a note and never blocks the worktree. An open pull request is the progress
signal; see `docs/agents/issue-tracker.md`.
