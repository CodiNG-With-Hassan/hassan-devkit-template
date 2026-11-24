// The platform's supported UI languages — mirror of the FE list in
// libs/i18n (the API package does not depend on the FE workspace libs, so
// the closed list is repeated here; extend both together —
// scripts/check-error-translations.mjs fails on drift).
export const SUPPORTED_LANGUAGES = ['en', 'nl'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
