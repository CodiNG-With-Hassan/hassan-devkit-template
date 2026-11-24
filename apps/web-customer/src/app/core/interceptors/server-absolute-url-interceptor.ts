import { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';

/**
 * Origin the SSR process reaches itself on (provided by app.config.server.ts
 * only, so it is `null` in the browser). Not the incoming request's origin:
 * behind Docker or a hosting proxy that is a public host/port the process
 * cannot necessarily reach.
 */
export const SSR_SELF_ORIGIN = new InjectionToken<string>('SSR_SELF_ORIGIN');

// During server-side rendering there is no document origin, so relative
// requests (the translate loader's /assets/i18n/*, and /api/* in dev where
// environment.apiUrl is '') cannot resolve and the page renders raw keys.
// Prefix them with the SSR process's own origin. A no-op in the browser.
// Registered last, after apiBaseUrlInterceptor.
export const serverAbsoluteUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const origin = inject(SSR_SELF_ORIGIN, { optional: true });
  if (!origin || !req.url.startsWith('/')) {
    return next(req);
  }
  return next(req.clone({ url: `${origin}${req.url}` }));
};
