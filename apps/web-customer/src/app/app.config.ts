import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  DOCUMENT,
  inject,
  PLATFORM_ID,
  provideZonelessChangeDetection,
  provideAppInitializer,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideModuleTranslateLoader } from '@larscom/ngx-translate-module-loader';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import templatePreset from '@Theme';
import { LANGUAGE_STORAGE_KEY, ThemeSwitcherService } from '@WebUi';
import { apiBaseUrlInterceptor } from './core/interceptors/api-base-url-interceptor';
import { serverAbsoluteUrlInterceptor } from './core/interceptors/server-absolute-url-interceptor';
import {
  DEFAULT_LANGUAGE,
  I18N_CATALOG_VERSION,
  isSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from 'tpl-i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiBaseUrlInterceptor, serverAbsoluteUrlInterceptor]),
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      license:
        'eyJpZCI6IjdhZjY1ODgwLWRlMWQtNDdlOS05NjMwLTE2MzFlN2ZmMjg0MCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODUxNzc1MDksImV4cCI6MTgxNjcxMzUwOX0.grNfmglQeyCJz7eWM98_Oyk1KvJlJ9CXtUboQrKbwBGnNIafPJlFQex7IUT_oMKlLHi2yoNpBWikT9pXV343Ag',
      theme: {
        preset: templatePreset,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities',
          },
        },
      },
    }),
    provideTranslateService({
      loader: provideModuleTranslateLoader({
        modules: [
          { baseTranslateUrl: '/assets/i18n/shared' },
          { baseTranslateUrl: '/assets/i18n/home' },
          // Shared ERRORS catalog served from libs/i18n via the angular.json
          // assets glob through node_modules (ADR 0002).
          { baseTranslateUrl: '/assets/i18n/errors' },
        ],
        // Appends ?v=N to every translation request; frozen on purpose
        // (libs/i18n/src/catalog-version.ts).
        version: I18N_CATALOG_VERSION,
      }),
      fallbackLang: DEFAULT_LANGUAGE,
    }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      const theme = inject(ThemeSwitcherService);
      const document = inject(DOCUMENT);
      const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

      translate.addLangs([...SUPPORTED_LANGUAGES]);
      // The customer site defaults to light; the toggle remembers a dark choice. A site that
      // defaults to dark also sets `class="dark-mode"` in index.html, so the server-rendered
      // page does not flash light.
      theme.initialize({ defaultDark: false });
      // Keeps <html lang> in step with the language switcher (WCAG 3.1.1).
      translate.onLangChange.subscribe(({ lang }) => {
        document.documentElement.lang = lang;
      });

      // The language the switcher saved on this device, else the default. The server has no
      // device storage, so it always renders the default language.
      const saved = isBrowser ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
      return firstValueFrom(translate.use(isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE));
    }),
  ],
};
