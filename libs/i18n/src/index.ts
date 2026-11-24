export { ERROR_CODES, type KnownErrorCode } from './error-codes';
export { ERROR_CODE_PARAMS, type InterpolatedErrorCode } from './error-code-params';
export { errorCodeOf } from './error-code';
export {
  errorTranslationFor,
  toErrorTranslation,
  UNKNOWN_ERROR_KEY,
  type ErrorParamKeysFor,
  type ErrorParamsFor,
  type ErrorTranslation,
} from './error-translation';

// The one language list: the catalog checks and the API mirror
// (apps/api/src/common/supported-languages.ts) read it, so a language is added
// or removed here first.
export const SUPPORTED_LANGUAGES = ['en', 'nl'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** The language a missing or unsupported one falls back to. */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly unknown[]).includes(value);
}

export interface LanguageOption {
  code: SupportedLanguage;
  /** The language's own name: never translated, so users find theirs in any UI language. */
  label: string;
  flag: string;
}

/** What the shared language switcher (`libs/web-ui`) lists, in this order. */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export { I18N_CATALOG_VERSION } from './catalog-version';
