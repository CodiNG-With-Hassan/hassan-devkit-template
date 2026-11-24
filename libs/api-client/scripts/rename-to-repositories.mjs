/**
 * Post-processes orval's output to match the workspace's repository naming
 * convention: <tag>.service.ts → <tag>.repository.ts and XService →
 * XRepository. Both suffixes are hardcoded in orval's Angular client (the
 * file suffix in @orval/core's writers, the class suffix in @orval/angular's
 * title builder), and wrapping the builder to change them would bypass
 * orval's isAngularClient checks — so rename after the fact instead.
 *
 * Also shortens method names: Nest operationIds like
 * `OrdersController_findById` become the camelised method
 * `ordersControllerFindById`; the controller prefix is dropped so calls
 * read `ordersRepository.findById(...)`. Only lowercase-initial (method)
 * identifiers are rewritten — PascalCase model names such as
 * `OrdersControllerFindAllParams` keep their prefix, which is what keeps
 * them unique in the shared models folder (orval's operationName override
 * cannot do this split, and shortening it there collides model names across
 * tags). One tag maps to one controller, so method parts are unique per class.
 *
 * Runs as part of `pnpm generate`.
 */
import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const generatedDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'generated');

let renamed = 0;
for (const entry of readdirSync(generatedDir, { withFileTypes: true, recursive: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.service.ts')) continue;
  const from = join(entry.parentPath, entry.name);
  const to = join(entry.parentPath, entry.name.replace(/\.service\.ts$/, '.repository.ts'));
  const source = readFileSync(from, 'utf8');
  const processed = source
    .replace(/\b([A-Za-z0-9]+)Service\b/g, '$1Repository')
    .replace(
      /\b[a-z][A-Za-z0-9]*Controller([A-Z])([A-Za-z0-9]*)\b/g,
      (_, first, rest) => `${first.toLowerCase()}${rest}`,
    );
  writeFileSync(from, processed);
  renameSync(from, to);
  renamed++;
}
console.log(`Renamed ${renamed} generated services to repositories`);
