export const environment = {
  production: false,
  // Relative on purpose: the dev server's /api proxy (proxy.conf.mjs) forwards API calls to
  // this worktree's own backend, so no per-worktree edit of this file is ever needed.
  apiUrl: '',
};
