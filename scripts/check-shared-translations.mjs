#!/usr/bin/env node

// Completeness check for the shared (non-error) catalogs in libs/i18n.
//
// Every folder under libs/i18n/src that holds translation JSON — except
// `errors`, which check-error-translations.mjs owns because of its flat
// shape and ErrorCode cross-checks — is verified by checkCatalogFolders
// (scripts/lib/i18n-check-utils.mjs) for:
//   1. a file per supported language (libs/i18n/src/index.ts SUPPORTED_LANGUAGES);
//   2. valid JSON whose leaves are all strings;
//   3. an identical nested key set across all languages;
//   4. UPPERCASE_SNAKE_CASE key segments (the repo-wide key convention).
//
// The per-app check (scripts/check-app-translations.mjs) only scans each app's
// own assets/i18n folder and never sees the node_modules-globbed shared
// catalogs, so this script owns their parity.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkCatalogFolders, colors, parseConstStringArray } from './lib/i18n-check-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const I18N_INDEX = path.join(ROOT, 'libs/i18n/src/index.ts');
const I18N_SRC = path.join(ROOT, 'libs/i18n/src');
const OWNED_ELSEWHERE = new Set(['errors']);

console.log(colors.cyan('🌐 Checking shared catalogs in libs/i18n...\n'));

// A workspace whose only shared catalog is `errors` has nothing to check here
// yet; the first enum-label catalog folder makes the rules below apply.
const hasSharedCatalog = fs
  .readdirSync(I18N_SRC, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory() && !OWNED_ELSEWHERE.has(dirent.name))
  .some((dirent) =>
    fs.readdirSync(path.join(I18N_SRC, dirent.name)).some((file) => file.endsWith('.json')),
  );
if (!hasSharedCatalog) {
  console.log(colors.green('✅ No shared catalogs besides errors yet — nothing to check.'));
  process.exit(0);
}

const languages = parseConstStringArray(I18N_INDEX, 'SUPPORTED_LANGUAGES');
const { catalogs, failed } = checkCatalogFolders(I18N_SRC, languages, {
  skip: OWNED_ELSEWHERE,
  displayRoot: ROOT,
});

if (failed) {
  console.error(
    colors.red('\n❌ Shared catalog check failed. Every key needs an entry in every language file'),
  );
  console.error(colors.red('   under libs/i18n/src/<catalog>/, in UPPERCASE_SNAKE_CASE.'));
  process.exit(1);
}

console.log(colors.green(`\n✅ ${catalogs.length} shared catalog(s) complete.`));
