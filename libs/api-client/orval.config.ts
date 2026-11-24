import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    // The committed spec is the single source of truth, owned by libs/api-types
    // (refreshed from the running dev API via `pnpm api:types`).
    input: '../api-types/spec/openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/generated/api.ts',
      schemas: 'src/generated/models',
      client: 'angular',
      clean: true,
      prettier: true,
    },
  },
});
