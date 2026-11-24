import { RenderMode, ServerRoute } from '@angular/ssr';

// Every page is server-rendered, so a new public page is too. Give a route that depends on the
// device's session (an account section, a checkout) its own entry with `RenderMode.Client`
// above the catch-all.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
