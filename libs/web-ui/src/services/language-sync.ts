import { InjectionToken } from '@angular/core';
import type { SupportedLanguage } from 'tpl-i18n';

/**
 * Optional seam for reacting to a user-initiated language change.
 *
 * web-ui is app-agnostic and must not know about auth stores or API wiring,
 * so the language switcher only calls this handler when an app provides it.
 * An app with signed-in users provides an implementation from its `core/`
 * that persists the language on the user's profile; without one the choice
 * stays on the device.
 */
export interface LanguageSyncHandler {
  syncLanguage(language: SupportedLanguage): void;
}

export const LANGUAGE_SYNC_HANDLER = new InjectionToken<LanguageSyncHandler>(
  'LANGUAGE_SYNC_HANDLER',
);
