# Template — Customer Web App (Angular + PrimeNG, SSR)

The customer-facing site of the template. Angular 22, zoneless, standalone components,
server-side rendering with hydration, PrimeNG with the shared brand preset, Tailwind,
`@coding-with-hassan` ESLint/Prettier configs.

## Development

```bash
pnpm install
pnpm start          # dev server (with SSR) on http://localhost:4200
pnpm build          # outputs dist/web-customer/{browser,server}
pnpm lint
pnpm format
```

Run it through the Docker stack with the `customer` profile (`pnpm worktree:profiles add
customer`) — see the root `README.md`.

## Server-side rendering

- Every route is server-rendered (`src/app/app.routes.server.ts`); give a route that depends on
  the device's session its own `RenderMode.Client` entry above the catch-all.
- During SSR there is no document origin, so relative requests (the translation catalogs, and
  `/api` in development) are made absolute by
  `src/app/core/interceptors/server-absolute-url-interceptor.ts` against `SSR_SELF_ORIGIN`
  (provided in `src/app/app.config.server.ts`).
- The server has no device storage: it renders the default language and the default theme, and
  the browser applies the saved choices at hydration. Guard every `localStorage`, `window` and
  `document` access with `isPlatformBrowser`.
- `src/server.ts` is the production Express entry (`pnpm serve:ssr:web-customer` after a build).

## API access

The generated `@ApiClient` services (see `libs/api-client`) issue relative URLs;
`src/app/core/interceptors/api-base-url-interceptor.ts` prefixes `environment.apiUrl`. In
development that is empty on purpose: the dev server's `/api` proxy (`proxy.conf.mjs`) forwards
API calls to this checkout's own backend.

## i18n

`@ngx-translate` with the module loader, one folder per feature module under
`public/assets/i18n/`, one file per language of `SUPPORTED_LANGUAGES` in `libs/i18n`.
`pnpm check-translations` (`scripts/check-app-translations.mjs` at the repo root) verifies every
catalog has a file per supported language with the same keys, string leaves and
UPPERCASE_SNAKE_CASE names.

The PrimeNG brand preset is shared from `libs/theme` (`@Theme`), the logo and the theme and
language switches from `libs/web-ui` (`@WebUi`).
