import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@Environment';

// The generated api-client services (@ApiClient) issue relative URLs like
// `/api/health`; prefix them with the environment's API origin. Absolute URLs
// and app-served files under /assets (e.g. the ngx-translate i18n loader)
// pass through untouched.
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/') && !req.url.startsWith('/assets')) {
    return next(req.clone({ url: `${environment.apiUrl}${req.url}` }));
  }
  return next(req);
};
