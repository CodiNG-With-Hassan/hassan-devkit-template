# web-ui

Shared Angular UI for the web apps (`web-customer`, `web-admin`). Never built — consumed **as source** via the `@WebUi` tsconfig path alias, the same pattern as `@ApiClient` and `@Theme`.

## Contents

- `src/components/` — logo (placeholder wordmark), signal-field-errors, language-switcher, theme-switcher
- `src/pipes/` — `translateError` (one-shot `ErrorTranslation` rendering, ADR 0002; `paramKeys` entries are resolved at render time through nested `TranslatePipe`s so enum labels follow a language switch)
- `src/services/` — the theme-switcher service (exported from the barrel as `ThemeSwitcherService`; the component owns the plain `ThemeSwitcher` name), the `LANGUAGE_SYNC_HANDLER` seam and `LANGUAGE_STORAGE_KEY` (where the switcher saves the choice)

Everything is exported through the single barrel `src/index.ts` — import from `@WebUi`, never deep paths.

## Rules for consumers (and for adding code here)

- Add the `@WebUi` alias to the app's `tsconfig.json` and `web-ui` to its `package.json` `nx.implicitDependencies` (that keeps Nx caching/affected correct).
- The lib's `dependencies` mirror the web apps' Angular/rxjs/primeng ranges — **bump them together** (same rule as `libs/api-client`, see its README for the NG0203 failure mode).
- Lib code may import `@ApiClient` (each consumer's tsconfig resolves it) but must NOT import app aliases (`@Core/*`, `@Environment`, …) — internal imports are relative.
- Templates here may use Tailwind utilities: every consuming app's `src/styles.css` names the lib in an `@source` line, so its build scans these files. Add that line to a new app.
- The theme-switcher service's no-image fallback (`noImageUrl`) loads `/assets/images/no-image*.svg` from the shared `libs/assets` package — every consuming app must depend on `assets` (`workspace:*`) and map it in its `angular.json` assets array (see `libs/assets/README.md`).
- Only put things here that are genuinely app-agnostic; app-specific state (auth store, guards, token handling) stays in each app's `core/`.
