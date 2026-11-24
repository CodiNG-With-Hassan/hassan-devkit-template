import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SSR_SELF_ORIGIN } from './core/interceptors/server-absolute-url-interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // The production SSR server (server.ts) listens on PORT (default 4000);
    // the dev server sets SSR_SELF_ORIGIN (docker-compose.dev.yml).
    {
      provide: SSR_SELF_ORIGIN,
      useValue: process.env['SSR_SELF_ORIGIN'] ?? `http://localhost:${process.env['PORT'] ?? 4000}`,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
