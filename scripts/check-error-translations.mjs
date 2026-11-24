#!/usr/bin/env node

// Completeness check for the shared ERRORS catalog (libs/i18n, ADR 0002) and
// the mirrors of the API error contract it depends on. Everything is verified
// offline from the committed tree — no running API needed.
//
//   1. every supported language has an errors file with a flat top-level
//      "ERRORS" object of string values;
//   2. all language files carry the identical key set (cross-language parity);
//   3. ERROR_CODES (libs/i18n/src/error-codes.ts — what toErrorTranslation
//      treats as "known") equals that key set exactly;
//   4. every API ErrorCode enum member has a catalog entry, so renaming a
//      member without the catalog fails;
//   5. every catalog key is an API ErrorCode member, except UNKNOWN (the FE
//      fallback — the only catalog-only key);
//   6. the `{{placeholder}}` tokens of each key are identical across the
//      languages and equal ERROR_CODE_PARAMS (libs/i18n/src/error-code-params.ts);
//      codes absent from that map interpolate nothing, and every interpolated
//      param is documented in the enum member's `Params:` JSDoc note;
//   7. the API's SUPPORTED_LANGUAGES mirror (apps/api/src/common/
//      supported-languages.ts) equals the shared list — same entries, same order;
//   8. the committed OpenAPI spec's ErrorCode enum equals the API enum — same
//      entries, same order — i.e. `pnpm api:types` ran after the last enum change.
//
// The per-app check (scripts/check-app-translations.mjs) only scans each app's
// own assets/i18n and never sees the node_modules-globbed ERRORS module — this
// script owns ERRORS parity. It runs under the tpl-i18n `check-translations` Nx target (CI) and
// from scripts/pre-commit-extra.sh.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  colors,
  parseApiErrorCodeEnum,
  parseConstStringArray,
  parseConstStringArrayMap,
} from './lib/i18n-check-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const I18N_INDEX = path.join(ROOT, 'libs/i18n/src/index.ts');
const ERROR_CODES_FILE = path.join(ROOT, 'libs/i18n/src/error-codes.ts');
const ERROR_CODE_PARAMS_FILE = path.join(ROOT, 'libs/i18n/src/error-code-params.ts');
const ERRORS_DIR = path.join(ROOT, 'libs/i18n/src/errors');
const API_ENUM_FILE = path.join(ROOT, 'apps/api/src/common/errors/error-code.enum.ts');
const API_LANGUAGES_FILE = path.join(ROOT, 'apps/api/src/common/supported-languages.ts');
const SPEC_FILE = path.join(ROOT, 'libs/api-types/spec/openapi.json');

// Catalog keys that are deliberately NOT ErrorCode members: only UNKNOWN, the
// permanent FE-only fallback toErrorTranslation renders for anything without a
// known code. There is no other catalog-only key and no allowlist to extend —
// new codes start as enum members (the `/add-error-code` skill,
// .claude/skills/add-error-code/SKILL.md).
const FE_ONLY_CODES = ['UNKNOWN'];

// ngx-translate interpolation: `{{name}}`, whitespace inside the braces allowed.
const PLACEHOLDER_RE = /\{\{\s*([^{}\s]+)\s*\}\}/g;

let failed = false;
const fail = (message) => {
  console.error(colors.red(`  ❌ ${message}`));
  failed = true;
};
const ok = (message) => console.log(colors.green(`  ✅ ${message}`));
const rel = (filePath) => path.relative(ROOT, filePath);
const sameList = (a, b) => a.length === b.length && a.every((entry, i) => entry === b[i]);
const sortedTokens = (text) =>
  [...new Set([...text.matchAll(PLACEHOLDER_RE)].map((m) => m[1]))].sort();

console.log(
  colors.cyan('🌐 Checking the ERRORS catalog and error-contract mirrors (libs/i18n)...\n'),
);

for (const file of [API_ENUM_FILE, API_LANGUAGES_FILE, SPEC_FILE, ERROR_CODE_PARAMS_FILE]) {
  if (!fs.existsSync(file)) {
    console.error(colors.red(`Required file not found: ${rel(file)}`));
    process.exit(1);
  }
}

const languages = parseConstStringArray(I18N_INDEX, 'SUPPORTED_LANGUAGES');
const errorCodes = parseConstStringArray(ERROR_CODES_FILE, 'ERROR_CODES');
const errorCodeParams = parseConstStringArrayMap(ERROR_CODE_PARAMS_FILE, 'ERROR_CODE_PARAMS');
const { codes: apiCodes, documentedParams } = parseApiErrorCodeEnum(API_ENUM_FILE);
const apiCodeSet = new Set(apiCodes);

// ---------------------------------------------------------------- 1 + 2
// Every language file exists, is flat, and carries the same key set.
const catalogs = new Map(); // lang → { key → text }
for (const lang of languages) {
  const filePath = path.join(ERRORS_DIR, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    fail(`missing errors file for "${lang}": ${rel(filePath)}`);
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${lang}.json is not valid JSON: ${error.message}`);
    continue;
  }

  const catalog = parsed?.ERRORS;
  if (typeof catalog !== 'object' || catalog === null || Array.isArray(catalog)) {
    fail(`${lang}.json must have a top-level "ERRORS" object`);
    continue;
  }

  for (const [key, value] of Object.entries(catalog)) {
    if (typeof value !== 'string') {
      fail(`${lang}.json: ERRORS.${key} must be a string (the catalog is flat by design)`);
    }
  }
  catalogs.set(lang, catalog);
}

const allKeys = new Set([...catalogs.values()].flatMap((catalog) => Object.keys(catalog)));
for (const [lang, catalog] of catalogs) {
  const missing = [...allKeys].filter((key) => !(key in catalog)).sort();
  if (missing.length > 0) {
    fail(`${lang}.json is missing ${missing.length} key(s): ${missing.join(', ')}`);
  }
}

// -------------------------------------------------------------------- 3
// ERROR_CODES (the mapper's "known" set) mirrors the catalog exactly.
for (const code of errorCodes.filter((code) => !allKeys.has(code)).sort()) {
  fail(`ERROR_CODES entry "${code}" has no translation in libs/i18n/src/errors/`);
}
for (const key of [...allKeys].filter((key) => !errorCodes.includes(key)).sort()) {
  fail(`catalog key "${key}" is missing from ERROR_CODES in libs/i18n/src/error-codes.ts`);
}

// -------------------------------------------------------------------- 4
// Every API ErrorCode member is translated.
const untranslated = apiCodes.filter((code) => !allKeys.has(code)).sort();
for (const code of untranslated) {
  fail(
    `API ErrorCode "${code}" has no ERRORS catalog entry — add it to ERROR_CODES and all ${languages.length} language files`,
  );
}
if (untranslated.length === 0) ok(`all ${apiCodes.length} API ErrorCode members are translated`);

// -------------------------------------------------------------------- 5
// Every catalog key is an API ErrorCode member, except the FE-only fallback.
const orphanKeys = [...allKeys].filter(
  (key) => !apiCodeSet.has(key) && !FE_ONLY_CODES.includes(key),
);
for (const key of orphanKeys.sort()) {
  fail(
    `catalog key "${key}" is not an API ErrorCode member — codes start as enum members (apps/api/src/common/errors/error-code.enum.ts); UNKNOWN is the only catalog-only key`,
  );
}
for (const code of FE_ONLY_CODES) {
  if (!allKeys.has(code)) fail(`FE-only code "${code}" is missing from the catalog`);
  if (apiCodeSet.has(code)) {
    fail(
      `FE-only code "${code}" must not be an API ErrorCode member — it is the client fallback for anything without a known code and the server never emits it`,
    );
  }
}
if (orphanKeys.length === 0) {
  ok(
    `all ${allKeys.size} catalog keys map to ErrorCode members (FE-only: ${FE_ONLY_CODES.join(', ')})`,
  );
}

// -------------------------------------------------------------------- 6
// Placeholders: identical across languages, equal to ERROR_CODE_PARAMS, and
// documented on the enum member.
let placeholderFailures = 0;
const placeholderFail = (message) => {
  fail(message);
  placeholderFailures += 1;
};

for (const key of [...allKeys].sort()) {
  const tokensByLang = new Map(
    [...catalogs]
      .filter(([, catalog]) => typeof catalog[key] === 'string')
      .map(([lang, catalog]) => [lang, sortedTokens(catalog[key])]),
  );
  if (tokensByLang.size === 0) continue;

  const [referenceLang, referenceTokens] = [...tokensByLang][0];
  for (const [lang, tokens] of tokensByLang) {
    if (!sameList(tokens, referenceTokens)) {
      placeholderFail(
        `ERRORS.${key}: placeholders differ between languages — ${referenceLang}: {${referenceTokens.join(', ')}} vs ${lang}: {${tokens.join(', ')}}`,
      );
    }
  }

  const documented = [...(errorCodeParams.get(key) ?? [])].sort();
  if (!sameList(referenceTokens, documented)) {
    placeholderFail(
      `ERRORS.${key}: catalog placeholders {${referenceTokens.join(', ')}} do not match ERROR_CODE_PARAMS {${documented.join(', ')}} in libs/i18n/src/error-code-params.ts` +
        (documented.length === 0 ? ' (codes absent from the map must interpolate nothing)' : ''),
    );
  }
}

for (const [code, params] of errorCodeParams) {
  if (!allKeys.has(code)) {
    placeholderFail(`ERROR_CODE_PARAMS lists "${code}", which is not a catalog key`);
    continue;
  }
  if (params.length === 0) {
    placeholderFail(`ERROR_CODE_PARAMS.${code} is empty — remove the entry`);
  }
  const wireParams = documentedParams.get(code) ?? [];
  for (const param of params.filter((param) => !wireParams.includes(param))) {
    placeholderFail(
      `ERRORS.${code} interpolates {{${param}}} but the API enum member documents no such param — add it to the member's \`Params:\` JSDoc note in ${rel(API_ENUM_FILE)} (and the throw site) or fix the placeholder`,
    );
  }
}

if (placeholderFailures === 0) {
  ok(
    `placeholders of ${errorCodeParams.size} interpolated code(s) are identical across ${catalogs.size} language(s) and match ERROR_CODE_PARAMS`,
  );
}

// -------------------------------------------------------------------- 7
// The API's supported-language mirror equals the shared list (ordered).
const apiLanguages = parseConstStringArray(API_LANGUAGES_FILE, 'SUPPORTED_LANGUAGES');
if (sameList(apiLanguages, languages)) {
  ok(`API SUPPORTED_LANGUAGES mirror matches the shared list (${languages.join(', ')})`);
} else {
  const missing = languages.filter((lang) => !apiLanguages.includes(lang));
  const extra = apiLanguages.filter((lang) => !languages.includes(lang));
  fail(
    `${rel(API_LANGUAGES_FILE)} SUPPORTED_LANGUAGES [${apiLanguages.join(', ')}] must equal the shared list in ${rel(I18N_INDEX)} [${languages.join(', ')}], in the same order` +
      (missing.length > 0 ? ` — missing: ${missing.join(', ')}` : '') +
      (extra.length > 0 ? ` — extra: ${extra.join(', ')}` : ''),
  );
}

// -------------------------------------------------------------------- 8
// The committed OpenAPI spec's ErrorCode enum equals the API enum (ordered).
// A spec without the named schema is a hard failure, never a skip — the FE's
// generated ErrorCode const only exists while the swagger plugin emits it.
let spec;
try {
  spec = JSON.parse(fs.readFileSync(SPEC_FILE, 'utf8'));
} catch (error) {
  fail(`${rel(SPEC_FILE)} is not valid JSON: ${error.message}`);
}
if (spec !== undefined) {
  const specCodes = spec?.components?.schemas?.ErrorCode?.enum;
  if (!Array.isArray(specCodes)) {
    fail(
      `${rel(SPEC_FILE)} has no components.schemas.ErrorCode enum — the API must expose ErrorCode as a named spec enum (ADR 0002)`,
    );
  } else if (sameList(specCodes, apiCodes)) {
    ok(`OpenAPI spec ErrorCode enum matches the API enum (${apiCodes.length} members)`);
  } else {
    const missing = apiCodes.filter((code) => !specCodes.includes(code));
    const extra = specCodes.filter((code) => !apiCodeSet.has(code));
    fail(
      `${rel(SPEC_FILE)} ErrorCode enum differs from ${rel(API_ENUM_FILE)}` +
        (missing.length > 0 ? ` — missing from spec: ${missing.join(', ')}` : '') +
        (extra.length > 0 ? ` — only in spec: ${extra.join(', ')}` : '') +
        (missing.length === 0 && extra.length === 0 ? ' — same members, different order' : '') +
        ' → regenerate with `pnpm api:types` (dev stack running) and commit the spec + generated packages',
    );
  }
}

if (failed) {
  console.error(
    colors.red(
      '\n❌ ERRORS catalog check failed. See the add-error-code skill (.claude/skills/add-error-code/SKILL.md):',
    ),
  );
  console.error(
    colors.red(
      '   enum member (+ Params note) → ERROR_CODES + all language files (+ ERROR_CODE_PARAMS) → pnpm api:types.',
    ),
  );
  process.exit(1);
}

console.log(
  colors.green(
    `\n✅ ERRORS catalog is complete and consistent: ${allKeys.size} code(s) across ${catalogs.size} language(s).`,
  ),
);
