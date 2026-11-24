// The `?v=` query parameter every translate loader appends to each
// /assets/i18n request. It is NOT a per-change cache buster and does not move
// when a catalog changes: production must serve /assets with
// `Cache-Control: no-cache`, so every catalog change is picked up by
// revalidation on the next load.
//
// Bump it only if a server ever serves /assets with a long max-age: browsers
// would then hold the old copies and only a new URL evicts them.
export const I18N_CATALOG_VERSION = 1;
