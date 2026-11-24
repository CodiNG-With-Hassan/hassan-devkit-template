---
paths:
  - "libs/assets/**"
  - "libs/theme/**"
  - "libs/web-ui/**"
  - "libs/shared-utils/**"
  - "libs/api-client/**"
  - "apps/web-customer/**"
  - "apps/web-admin/**"
---

<!-- The source-shared FE libs and how the apps consume them. Loads only when a matching file is touched. -->

## Shared assets (`libs/assets`)

Static assets used by more than one app (today the no-image placeholders) live in
`libs/assets/src` — never duplicate them into an app's `public/`. Apps consume the lib as a real
`"assets": "workspace:*"` dependency (the Nx graph edge comes from the package dep — no
`implicitDependencies` needed) plus an entry in every `angular.json` assets array:
`{ "glob": "**/*", "input": "node_modules/assets/src", "output": "assets" }`. URLs stay
`/assets/images/...`. The input goes through `node_modules` on purpose — each app's own
`angular.json` cannot reference paths outside the app root. App-specific files (favicons, the
app's own feature-copy i18n JSON) stay per app.

## Shared brand theme (`libs/theme`)

The brand tokens live in one lib, consumed by both web apps (never built): the PrimeNG preset
(`src/primeng.preset.ts`, the source of truth) via the `@Theme` tsconfig path alias. Every
consuming app lists `theme` in its `nx.implicitDependencies` so caching/affected stay correct; do
the same for any new FE app. The preset is a neutral placeholder (stock Aura with a zinc primary
ramp) until the project has a design system — change colours in the preset, never in an app. The
stock Aura surface ramp is the same in both colour schemes, so app CSS takes page tones from the
semantic tokens (`--p-content-background`, `--p-content-border-color`, `--p-text-color`,
`--p-text-muted-color`) or `light-dark()`, never from a fixed `--p-surface-<n>` step.

## Shared web UI (`libs/web-ui`)

App-agnostic Angular UI shared by `web-customer` and `web-admin` (logo, language switcher, theme
switcher + its service, `SignalFieldErrors`, the `translateError` pipe). Consumed **as source**
via the `@WebUi` alias to its single barrel (`src/index.ts`) — import from `@WebUi`, never deep
paths. Same rules as `api-client`: `dependencies` mirror the web apps' Angular ranges (bump
together), and every consumer lists `web-ui` in `nx.implicitDependencies`. Its templates may use
Tailwind utilities because each app's `src/styles.css` names the lib in an `@source` line. The
lib also runs inside the server-side render of `web-customer`: guard browser-only APIs with
`isPlatformBrowser`. App-specific state (auth store, guards, token) stays in each app's `core/`.
See `libs/web-ui/README.md`.

## Shared utilities (`libs/shared-utils`)

Framework-agnostic helpers (no Angular imports) shared by the frontends — today the mapping from
a signal-forms validation error to its message key. Consumed by package name
(`"shared-utils": "workspace:*"`), so it is on every app's `prebundle.exclude` list.

## Source-shared libs in general

`api-client`, `theme` and `web-ui` are consumed **as source** through a tsconfig path alias
(`@ApiClient`, `@Theme`, `@WebUi`); `tpl-i18n`, `shared-utils` and `assets` by package name.
None is ever built. A lib that imports a framework package declares it in its own
`dependencies`, mirroring the web apps' ranges exactly — bump them together, or pnpm installs
two framework instances and the dev server fails with NG0203. A new workspace package goes into
the `COPY` list of every dev Dockerfile, and a source-shared one into the `pnpm install --filter`
list of the images that compile it.
