#!/usr/bin/env node

// Parity check for an app's own translation catalogs.
//
// Usage — from the app folder, as its package.json `check-translations` script:
//   node ../../scripts/check-app-translations.mjs <i18n-dir>
// where <i18n-dir> is `public/assets/i18n`, relative to the current directory
// (the app folder).
//
// Every catalog folder under <i18n-dir> (auth, profile, shared, …) must hold a
// file per language in SUPPORTED_LANGUAGES (libs/i18n/src/index.ts — the one
// language list, so a new language cannot drift per app), valid JSON with
// string leaves, an identical nested key set across the languages and
// UPPERCASE_SNAKE_CASE key segments — the same rules the shared catalogs get
// from check-shared-translations.mjs, through the same checkCatalogFolders.
//
// Two housekeeping reports follow, as warnings only (the exit code stays 0):
//   - a catalog whose files are all `{}` (checkCatalogFolders) — dead weight in
//     the translate loader; delete the folder and its loader module;
//   - the keys of each catalog that no `.ts`/`.html` file under the app's `src`
//     or under the `src` of the libs the app declares (workspace dependencies
//     and nx.implicitDependencies in its package.json — source-shared libs,
//     shared-utils, …) references, literally or through a dynamic prefix
//     (indexKeyReferences) — superseded copy, e.g. generic error texts replaced
//     by the shared ERRORS catalog (ADR 0002), must not linger silently.
//   The key scan is best effort: a key built from two variables is reported as
//   unused although it is not, so read the list before deleting.
//
// Runs under each app's `check-translations` Nx target (CI: `pnpm exec nx
// run-many -t check-translations`) and from scripts/pre-commit-extra.sh when an
// app's catalogs are staged. The shared catalogs an app serves through
// node_modules globs are not under <i18n-dir>; libs/i18n's own target owns them.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  checkCatalogFolders,
  colors,
  indexKeyReferences,
  parseConstStringArray,
} from './lib/i18n-check-utils.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const I18N_INDEX = path.join(ROOT, 'libs/i18n/src/index.ts');
const LIBS_DIR = path.join(ROOT, 'libs');

const [i18nDirArg, ...extraArgs] = process.argv.slice(2);
if (!i18nDirArg || i18nDirArg.startsWith('-') || extraArgs.length > 0) {
  console.error(colors.red('usage: node scripts/check-app-translations.mjs <i18n-dir>'));
  process.exit(2);
}
const appDir = process.cwd();
const i18nDir = path.resolve(appDir, i18nDirArg);
const shownDir = path.relative(ROOT, i18nDir);

console.log(colors.cyan(`🌐 Checking app catalogs in ${shownDir}...\n`));

const languages = parseConstStringArray(I18N_INDEX, 'SUPPORTED_LANGUAGES');
const { catalogs, failed, keysByCatalog } = checkCatalogFolders(i18nDir, languages, {
  displayRoot: ROOT,
});

if (failed) {
  console.error(
    colors.red('\n❌ Translation check failed. Every key needs an entry in every language file'),
  );
  console.error(colors.red(`   under ${shownDir}/<catalog>/, in UPPERCASE_SNAKE_CASE.`));
  process.exit(1);
}

// Unused-key report: the app's own sources plus the libs it declares, because
// shared code builds keys the app catalogs must provide (libs/shared-utils
// prefixes SHARED.COMPONENTS.FIELD_ERRORS.*, libs/web-ui renders
// SHARED.COMPONENTS.THEME.*, …). Libs the app never bundles are left out so
// they cannot vouch for a key nobody renders in this app.
const readPackage = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
const appPackage = readPackage(appDir);
const declaredLibs = new Set([
  ...Object.keys(appPackage.dependencies ?? {}),
  ...Object.keys(appPackage.devDependencies ?? {}),
  ...(appPackage.nx?.implicitDependencies ?? []),
]);
const appSrc = path.join(appDir, 'src');
const scannedLibs = fs
  .readdirSync(LIBS_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .filter(
    (lib) =>
      fs.existsSync(path.join(LIBS_DIR, lib, 'package.json')) &&
      declaredLibs.has(readPackage(path.join(LIBS_DIR, lib)).name),
  );
const { files, isReferenced } = indexKeyReferences([
  appSrc,
  ...scannedLibs.map((lib) => path.join(LIBS_DIR, lib, 'src')),
]);

console.log(
  colors.cyan(
    `\n🔎 Unused-key report (warning only) — ${files} source file(s) under ${path.relative(ROOT, appSrc)} and libs/{${scannedLibs.join(',')}}/src:`,
  ),
);
let unusedTotal = 0;
for (const catalog of catalogs) {
  const keys = keysByCatalog.get(catalog);
  if (keys.size === 0) continue; // already reported as an empty catalog above
  const unused = [...keys].filter((key) => !isReferenced(key)).sort();
  if (unused.length === 0) {
    console.log(colors.green(`  ✅ ${catalog}: every key is referenced`));
    continue;
  }
  unusedTotal += unused.length;
  console.warn(colors.yellow(`  ⚠️  ${catalog}: ${unused.length} key(s) referenced nowhere:`));
  for (const key of unused) console.warn(colors.yellow(`       ${key}`));
}
if (unusedTotal > 0) {
  console.warn(
    colors.yellow(
      `   Delete each unused key from all ${languages.length} language files of its catalog (or wire it up); keys assembled from variables are false alarms.`,
    ),
  );
}

console.log(colors.green(`\n✅ ${catalogs.length} catalog(s) complete.`));
