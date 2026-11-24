# api-types

TypeScript types for the API's request/response contract, generated from the NestJS OpenAPI
spec. Types only — the package ships no runtime code, so any consumer (Angular, Node, future apps) can depend on it without pulling in backend dependencies.

## Usage

Add to a consumer's `devDependencies`:

```json
"api-types": "workspace:*"
```

```ts
import type { Schema, paths, operations } from 'api-types';

type ErrorBody = Schema<'ErrorResponse'>;
type Health = paths['/api/health']['get']['responses']['200']['content']['application/json'];
```

Hand-written app models can re-export while migrating incrementally:

```ts
export type ErrorBody = Schema<'ErrorResponse'>;
```

## Regenerating

The pipeline is: NestJS DTOs → OpenAPI spec (`spec/openapi.json`, committed) → generated types
(`src/generated/api.d.ts`, committed).

1. Start the dev stack: `pnpm docker:dev:up` (the spec is fetched from the running API at
   `http://localhost:3000/api-json`, because the `@nestjs/swagger` CLI plugin that infers DTO
   metadata only runs inside `nest start`/`nest build`).
2. From the repo root: `pnpm api:types` — fetches the spec and regenerates the types.
3. Commit `spec/openapi.json` and `src/generated/api.d.ts` together with the API change.

`pnpm api:types:check` regenerates from the committed spec and fails if `src/generated` is
stale (usable in CI without a running API).

Never edit `src/generated/` by hand.
