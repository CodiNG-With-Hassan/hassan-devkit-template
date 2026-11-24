---
paths:
  - "apps/api/src/**"
  - "libs/i18n/**"
  - "apps/web-customer/src/**"
  - "apps/web-admin/src/**"
  - "libs/web-ui/**"
  - "docs/testing/**"
---

<!-- The error-code contract (ADR 0002) and how the frontends render it. Loads only when a matching file is touched. -->

## Error codes (ADR 0002)

The API returns no user-facing text. Every client-facing failure is a `DomainException`
(`apps/api/src/common/errors/domain.exception.ts`) carrying a member of the `ErrorCode` enum
(`apps/api/src/common/errors/error-code.enum.ts`, a named enum in the OpenAPI spec) plus optional
interpolation `params`; the global filter shapes it into
`ErrorResponse { statusCode, message (English, debug-only), error, code, params? }`. Validation
errors collapse to `VALIDATION_FAILED`, unexpected 500s to `INTERNAL_ERROR`. The frontends
translate the code from the shared `ERRORS` catalog. `scripts/check-error-translations.mjs`
(the `tpl-i18n` `check-translations` target, CI + pre-commit) verifies all of the below offline:
catalog ↔ enum 1:1 (only `UNKNOWN` may be catalog-only), the `ERROR_CODES` mirror, placeholder
parity across every supported language against
`ERROR_CODE_PARAMS` and the enum's `Params:` notes, the API language mirror and the committed
spec's `ErrorCode` enum.

Adding a code is the `/add-error-code` skill (shipped by the devkit, no copy in this repo): one
change across enum, catalogs, mirrors, spec and acceptance cases — every partial state fails
`check-translations` or the pre-commit guard.

### Rendering errors in the frontends

- Compare codes only against the generated `ErrorCode` const from `@ApiClient`
  (`err.error?.code === ErrorCode.NOT_FOUND`) — never string literals.
- Map the failure with `toErrorTranslation(err)` from `tpl-i18n`, keep the `ErrorTranslation` in
  a signal, and render it in the TEMPLATE through the impure `translateError` pipe
  (`TranslateErrorPipe` from `@WebUi`, which delegates to ngx-translate's `TranslatePipe`):
  `{{ error() | translateError }}`. Never translate errors with `translateService.instant()` — it
  freezes the language and shows raw keys when the catalog loads late.
- Unknown codes and bodies without a code (proxy error pages, network failures) fall back to
  `ERRORS.UNKNOWN`; the server `message` is never shown.
- A refusal the client decides itself (a rule enforced ahead of the server, an empty lookup) is
  built with `errorTranslationFor(ErrorCode.X, params?)` from `tpl-i18n` — never a hand-written
  `` `ERRORS.${code}` `` key.
- A placeholder that must show a shared enum label (an order's status, say) goes into
  `ErrorTranslation.paramKeys` as its label KEY, typed with `ErrorParamKeysFor<code>`; the
  `translateError` pipe resolves it at render time so it follows a live language switch. Never
  resolve a label with `translate.get()` and store the text in `params` — that freezes it in one
  language.
