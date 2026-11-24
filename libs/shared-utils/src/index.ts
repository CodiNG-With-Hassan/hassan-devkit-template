// Framework-agnostic helpers shared by the frontends. No Angular imports here:
// anything that needs the framework belongs in libs/web-ui.

export const FIELD_ERRORS_TRANSLATION_PREFIX = 'SHARED.COMPONENTS.FIELD_ERRORS.';

export interface FieldErrorEntry {
  key: string;
  params: Record<string, string | number>;
}

/**
 * Maps one signal-forms validation error to the key (relative to
 * `FIELD_ERRORS_TRANSLATION_PREFIX`) and params of its message in the app's
 * shared catalog. Unknown kinds fall back to the generic "is not valid".
 */
export function mapFieldErrorToTranslationKey(
  error: { readonly kind: string; [key: string]: unknown },
  label: string,
): FieldErrorEntry {
  const value = (error as Record<string, unknown>)[error.kind] as number;
  switch (error.kind) {
    case 'required':
      return { key: 'IS_REQUIRED', params: { label } };
    case 'email':
      return { key: 'EMAIL', params: { label } };
    case 'minLength':
      return { key: 'MIN_LENGTH', params: { label, value } };
    case 'maxLength':
      return { key: 'MAX_LENGTH', params: { label, value } };
    case 'min':
      return { key: 'MIN', params: { label, value } };
    case 'max':
      return { key: 'MAX', params: { label, value } };
    default:
      return { key: 'IS_NOT_VALID', params: { label } };
  }
}
