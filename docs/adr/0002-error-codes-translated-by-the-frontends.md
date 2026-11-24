# The API returns error codes; the frontends translate them

The API never returns user-facing text. Every client-facing failure is a `DomainException`
carrying a member of the `ErrorCode` enum plus optional interpolation `params`. A global
`AllExceptionsFilter` turns it into `ErrorResponse { statusCode, message, error, code, params? }`;
`message` is English debug detail and never reaches users. The frontends translate `code` from
the shared `ERRORS` catalog in `libs/i18n` (one file per supported language) through
`toErrorTranslation()` and the `translateError` pipe. ESLint bans constructing Nest
`HttpException`s directly. `scripts/check-error-translations.mjs` keeps the enum, the committed
OpenAPI spec, `ERROR_CODES`, `ERROR_CODE_PARAMS` and every language file in step (CI and
pre-commit).

This is the house error contract. The frontends serve more than one language, so server-written
messages would force the API to know the UI language of every request, or every client to keep
its own copy of every server message. Adding a code is one change across enum, catalogs, mirrors
and spec: the `/add-error-code` skill.
