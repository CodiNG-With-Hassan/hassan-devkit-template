# Template — Admin Web App (Angular + PrimeNG)

The staff (back-office) web app of the template. Angular 22, zoneless, standalone components,
PrimeNG with the shared brand preset, Tailwind, `@coding-with-hassan` ESLint/Prettier configs.
Browser-only build (no SSR): it is an authenticated back-office tool, so there is no SEO or
first-paint case for server rendering.

## Development

```bash
pnpm install
pnpm start          # dev server on http://localhost:4201
pnpm build          # outputs to dist/
pnpm lint
pnpm format
```

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
