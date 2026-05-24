import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideZonelessChangeDetection,
  provideAppInitializer,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideModuleTranslateLoader } from '@larscom/ngx-translate-module-loader';
import { providePrimeNG } from 'primeng/config';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { appPreset } from './primeng.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: appPreset,
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
        modules: [{ baseTranslateUrl: '/assets/i18n/home' }],
      }),
      fallbackLang: 'en',
    }),
    provideAppInitializer(() => {
      const platformId = inject(PLATFORM_ID);
      const translate = inject(TranslateService);

      translate.addLangs(['en', 'nl']);

      const savedLang = isPlatformBrowser(platformId)
        ? (localStorage.getItem('language') ?? 'en')
        : 'en';

      return firstValueFrom(translate.use(savedLang));
    }),
  ],
};
