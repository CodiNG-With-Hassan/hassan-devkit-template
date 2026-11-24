/**
 * Fetches the OpenAPI document from the running dev API and writes it to
 * spec/openapi.json (pretty-printed for reviewable diffs).
 *
 * The spec must come from a running server — not a ts-node side-build —
 * because the @nestjs/swagger CLI plugin only runs inside `nest start`/
 * `nest build`, and the plugin is what infers types and optionality
 * from the DTOs.
 */
import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const specUrl = process.env.API_SPEC_URL ?? 'http://localhost:3000/api-json';
const outFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'spec', 'openapi.json');

let response;
try {
  response = await fetch(specUrl);
} catch {
  console.error(
    `Could not reach ${specUrl}.\n` +
      'Start the dev stack first (pnpm docker:dev:up), or point API_SPEC_URL at a running API.',
  );
  process.exit(1);
}
if (!response.ok) {
  console.error(`GET ${specUrl} returned ${response.status} ${response.statusText}.`);
  process.exit(1);
}

const spec = await response.json();

// Provenance guard (see docs/WORKTREES.md): the dev backend stamps the doc
// with its compose project and git branch. Refuse a spec that comes from a
// stack other than this checkout's own — regenerating from another worktree's
// stack would silently commit types from the wrong branch.
const expectedStack = process.env.COMPOSE_PROJECT_NAME || 'template';
const specStack = spec.info?.['x-devkit-stack'];
if (specStack && specStack !== expectedStack) {
  console.error(
    `The spec at ${specUrl} comes from stack "${specStack}", but this checkout's stack is ` +
      `"${expectedStack}".\nRun pnpm api:types from the worktree that owns that stack.`,
  );
  process.exit(1);
}
const specBranch = spec.info?.['x-devkit-branch'];
if (specBranch) {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (branch && specBranch !== branch) {
    console.error(
      `The spec at ${specUrl} comes from branch "${specBranch}", but this checkout is on ` +
        `"${branch}".\nRun pnpm api:types from the worktree that owns that stack.`,
    );
    process.exit(1);
  }
}
if (spec.info) {
  // Runtime identity, not API contract — never write the stamps to disk.
  delete spec.info['x-devkit-stack'];
  delete spec.info['x-devkit-branch'];
}

// Some Nest spec plugins emit `"required": []` on a schema, which is invalid
// JSON Schema (minItems 1) and fails strict validators like orval's. An empty
// required array carries no meaning, so drop them.
function stripEmptyRequired(node) {
  if (Array.isArray(node)) {
    node.forEach(stripEmptyRequired);
  } else if (node && typeof node === 'object') {
    if (Array.isArray(node.required) && node.required.length === 0) {
      delete node.required;
    }
    Object.values(node).forEach(stripEmptyRequired);
  }
}
stripEmptyRequired(spec);

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(spec, null, 2) + '\n');
console.log(`Wrote ${outFile} (OpenAPI ${spec.openapi}, ${Object.keys(spec.paths).length} paths)`);
