# tpl-i18n (`libs/i18n`)

Framework-agnostic language definitions shared by every frontend. Consumed as source
(`"tpl-i18n": "workspace:*"`, never built): TypeScript exports come from `src/index.ts`,
translation JSON is copied into each app's bundle by an `angular.json` assets glob.

## What lives here

| Export / folder                                                  | Purpose                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPPORTED_LANGUAGES`, `LANGUAGE_OPTIONS`                        | The platform languages (`en`, `nl`; `en` is the fallback) and what the language switcher lists for each.                                                                                          |
| `src/errors/<lang>.json` + `ERROR_CODES`, `toErrorTranslation()` | The `ERRORS` catalog: one flat entry per API error code (ADR 0002).                                                                                                                               |
| `ERROR_CODE_PARAMS` (`src/error-code-params.ts`)                 | Which `{{placeholders}}` each `ERRORS` text interpolates — the machine-readable twin of the API enum's `Params:` notes; the completeness check keeps the catalogs, this map and the enum in step. |

## The rule

**Labels of API enum values are translated once, here. Feature UI copy stays in the app.**
If a string is the human name of a value the API returns (a status, an error code), it belongs in
a shared catalog — one folder per enum under `src/`, with a `*Key()` helper that builds its key —
and apps build the key with that helper. Headings, buttons, hints and empty states belong to the
app's own `public/assets/i18n`. An enum label that only one app shows may stay in that app's
catalog — but never behind a key concatenated from the wire value: keep such labels in a
`Record<union, string>` map exhaustive over the generated union, and move them here the day a
second app shows them.

## Consuming a catalog in an app

1. `angular.json` — add the glob to the build `assets` array:
   `{ "glob": "**/*", "input": "node_modules/tpl-i18n/src/<catalog>", "output": "assets/i18n/<catalog>" }`
2. Translate loader — add `{ baseTranslateUrl: '/assets/i18n/<catalog>' }` to the module list.
   The loader's `version` is the shared `I18N_CATALOG_VERSION` — nothing to bump.
3. Build keys with the exported helpers and render them through the `translate` pipe, never
   `instant()`, so language switches re-render.

## Adding or changing keys

Edit every language file together. CI runs the lib's `check-translations` target and the
pre-commit hook (`scripts/pre-commit-extra.sh`) runs the same scripts whenever any of their inputs
is staged — everything offline, no running API:

- `scripts/check-error-translations.mjs` — the `ERRORS` catalog and the error-contract mirrors:
  identical key set across the languages; `ERROR_CODES` equals that set; every API `ErrorCode`
  member is translated and every catalog key is an enum member (except `UNKNOWN`, the only
  catalog-only key); `{{placeholder}}` tokens identical across the languages, equal to
  `ERROR_CODE_PARAMS` and documented in the enum member's `Params:` note; the API's
  `SUPPORTED_LANGUAGES` mirror (`apps/api/src/common/supported-languages.ts`) equals the shared
  list in the same order; the committed OpenAPI spec's `ErrorCode` enum equals the API enum in the
  same order.
- `scripts/check-shared-translations.mjs` — every other catalog folder: file per language,
  identical nested key set, string leaves, UPPERCASE_SNAKE_CASE keys.

The apps' own catalogs (`apps/<app>/public/assets/i18n`) are held to the same rules by
`scripts/check-app-translations.mjs <i18n-dir>`, which reads `SUPPORTED_LANGUAGES` from this lib
and runs as each app's `check-translations` script. A new `SUPPORTED_LANGUAGES` entry therefore
fails every app that lacks its file.

## Register per language

Every catalog addresses the user in one register per language. New entries (also
machine-translated drafts) must match it:

| Language | Register                                                              | Example                         |
| -------- | --------------------------------------------------------------------- | ------------------------------- |
| `en`     | neutral "you", short imperatives                                      | Sign in again. Try again later. |
| `nl`     | informal "je", short imperatives                                      | Log opnieuw in. Probeer het later opnieuw. |

Prefer pronoun-free phrasing when it reads naturally. Counts are phrased so the sentence is right
for 1 and for many — ngx-translate has no ICU plural here — so never `file(s)`; write the count after a label instead: "Files selected: {{count}}."

## Adding an error code

The contract is `.claude/rules/api-errors.md`; the full procedure is the `/add-error-code` skill
(shipped by the devkit). In short, one change: the `ErrorCode` enum member
(`NAME = 'NAME'`, JSDoc with status and `Params:` note) thrown through `DomainException` → the
text in every `src/errors/*.json` + `ERROR_CODES` (+ `ERROR_CODE_PARAMS` when it interpolates) →
`pnpm api:types` against your own worktree's stack → reachable from some UI or documented
server-side-only → acceptance cases. Frontends compare codes via the generated `ErrorCode` const
from `@ApiClient` and render `toErrorTranslation(err)` through the `translateError` pipe from
`@WebUi` — never `instant()`. A rule the client enforces ahead of the server gets its translation from
`errorTranslationFor(ErrorCode.X, params?)` — never a hand-built `` `ERRORS.${code}` `` key.

## Dev-server prebundling (why `prebundle.exclude` exists)

`tpl-i18n` is a bare package import that resolves to TypeScript **source**. Angular's dev server
hands every bare import to Vite's dependency optimizer, which resolves `.mjs`/`.js`/`.cjs` only —
so a multi-file TS package like this one fails with `Could not resolve './error-codes'` and the
dev server exits (in Docker: a restart loop). Every app's `serve` target therefore lists the
package in `prebundle.exclude` (`angular.json`), which makes esbuild bundle it with the app code
instead. Add any new source-shared package consumed by its package name to that list
(`shared-utils` is on it for the same reason). Libs consumed through a tsconfig path alias
(`@ApiClient`, `@Theme`, `@WebUi`) are unaffected.

## Formatting

The package has `format` / `format:check` targets covering `src/**/*.{ts,json}`, the check
scripts under `scripts/` and the acceptance-case data files `docs/testing/*.ts` — the files
outside every project root that no other target reads. They use the root `.prettierrc`. The
out-of-root globs are declared as Nx `inputs` of `format:check` in this `package.json`, and
`ci.affected.adopted` in the root `package.json` maps them to this package, so `ci:check` runs the
target for any PR that touches them.
