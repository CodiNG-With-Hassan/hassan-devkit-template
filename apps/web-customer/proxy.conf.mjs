// Every backend route lives under /api (the Swagger spec sits at /api-json), so one prefix
// rule covers all API calls. Inside the Docker dev stack API_PROXY_TARGET points at the
// backend service; on the host it comes from .env (per-worktree port) or defaults to 3000.
export default {
  '/api': {
    target: process.env['API_PROXY_TARGET'] ?? 'http://localhost:3000',
    changeOrigin: true,
  },
};
