// Shared helpers for the translation catalog checks
// (check-error-translations.mjs, check-shared-translations.mjs,
// check-app-translations.mjs).

import fs from 'fs';
import path from 'path';

export const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

const die = (message) => {
  console.error(colors.red(message));
  process.exit(1);
};

/**
 * Remove `/* … *\/` and `// …` comments. Good enough for the TypeScript
 * sources parsed here (enum and const declarations whose string literals never
 * contain comment markers).
 * @param {string} source - TypeScript source
 * @returns {string} - The source without comments
 */
export const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/**
 * Extract the quoted entries of an `export const NAME = [...] as const` array
 * from a TypeScript source file (single- or double-quoted, so a formatter
 * flipping the quote style cannot silently empty the list).
 * @param {string} filePath - File to parse
 * @param {string} constName - Name of the exported const array
 * @returns {string[]} - The string entries
 */
export const parseConstStringArray = (filePath, constName) => {
  const source = stripComments(fs.readFileSync(filePath, 'utf8'));
  const match = source.match(new RegExp(`${constName}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!match) die(`Could not find "${constName} = [...]" in ${filePath}`);
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(([, entry]) => entry);
};

/**
 * Extract an `export const NAME = { KEY: ['a', 'b'], … }` object of string
 * arrays (libs/i18n/src/error-code-params.ts). Every entry inside the braces
 * must be `UPPER_SNAKE_KEY: [quoted, strings]` — anything else aborts, and the
 * parsed entry count is asserted against the number of `:` in the body so an
 * entry can never be skipped silently.
 * @param {string} filePath - File to parse
 * @param {string} constName - Name of the exported const object
 * @returns {Map<string, string[]>} - Key → string entries
 */
export const parseConstStringArrayMap = (filePath, constName) => {
  const source = stripComments(fs.readFileSync(filePath, 'utf8'));
  const match = source.match(new RegExp(`${constName}\\s*=\\s*\\{([^}]*)\\}`));
  if (!match) die(`Could not find "${constName} = {...}" in ${filePath}`);

  const body = match[1];
  const entries = new Map();
  for (const [, key, list] of body.matchAll(/([A-Z][A-Z0-9_]*)\s*:\s*\[([^\]]*)\]/g)) {
    if (entries.has(key)) die(`${constName} in ${filePath} lists "${key}" twice`);
    entries.set(
      key,
      [...list.matchAll(/['"]([^'"]+)['"]/g)].map(([, entry]) => entry),
    );
  }

  const colonCount = (body.match(/:/g) ?? []).length;
  if (colonCount !== entries.size) {
    die(
      `${constName} in ${filePath}: parsed ${entries.size} entr(y/ies) but the object body has ${colonCount} — every entry must be \`UPPER_SNAKE_KEY: ['param', …]\``,
    );
  }
  return entries;
};

/**
 * Extract the API `ErrorCode` enum (apps/api/src/common/errors/error-code.enum.ts).
 *
 * Comments are stripped first (JSDoc, section headers, trailing `// …`), then
 * every comma-separated segment of the enum body must be `NAME = 'NAME'`:
 * a value-less member, a value that differs from the name, or anything the
 * parser does not understand aborts instead of being skipped. The member count
 * is also asserted against the number of `=` in the comment-free body.
 *
 * The `Params:` JSDoc notes (e.g. "Params: `from`, `to`.") are collected per
 * member from the raw body so callers can cross-check catalog placeholders
 * against the documented wire params.
 * @param {string} filePath - error-code.enum.ts
 * @returns {{ codes: string[], documentedParams: Map<string, string[]> }}
 */
export const parseApiErrorCodeEnum = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rawMatch = raw.match(/enum\s+ErrorCode\s*\{([\s\S]*?)\n\}/);
  if (!rawMatch) die(`Could not find "enum ErrorCode { ... }" in ${filePath}`);

  const body = stripComments(rawMatch[1]);
  const codes = [];
  for (const segment of body.split(',').map((s) => s.trim())) {
    if (segment === '') continue; // trailing comma / blank tail
    const member = segment.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(['"])([^'"]+)\2$/);
    if (!member) {
      die(
        `Unparseable ErrorCode member in ${filePath}: "${segment}" — every member must be \`NAME = 'NAME'\` (string values are the wire contract)`,
      );
    }
    const [, name, , value] = member;
    if (name !== value) {
      die(
        `ErrorCode.${name} in ${filePath} has value '${value}' — a member's string value must equal its name (catalog keys and the generated FE const are keyed by it)`,
      );
    }
    if (codes.includes(value)) die(`ErrorCode.${value} is declared twice in ${filePath}`);
    codes.push(value);
  }

  const assignmentCount = (body.match(/=/g) ?? []).length;
  if (assignmentCount !== codes.length) {
    die(
      `ErrorCode parser in ${filePath}: parsed ${codes.length} member(s) but the enum body has ${assignmentCount} assignment(s)`,
    );
  }

  // `/** … Params: `a`, `b`. */ NAME =` → NAME → ['a', 'b'] (best effort; the
  // header convention is "Params: `x`" per param, comma-separated). The doc
  // body cannot run past its own `*/` (tempered `[\s\S]`), and `// …` lines
  // between the JSDoc and its member are skipped — so a note is never
  // attributed to the NEXT member; a JSDoc not followed by a member is dropped,
  // which surfaces as "documents no such param" rather than a false pass.
  const documentedParams = new Map();
  for (const [, doc, name] of rawMatch[1].matchAll(
    /\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*(?:\/\/[^\n]*\s*)*([A-Z][A-Z0-9_]*)\s*=/g,
  )) {
    const note = doc.match(/Params:\s*((?:`[A-Za-z0-9_]+`\s*,?\s*)+)/);
    if (note)
      documentedParams.set(
        name,
        [...note[1].matchAll(/`([A-Za-z0-9_]+)`/g)].map((m) => m[1]),
      );
  }

  return { codes, documentedParams };
};

// Each dot-separated segment of a translation key must be UPPERCASE_SNAKE_CASE
// (the convention the devkit hook enforces too).
const SEGMENT_RE = /^[A-Z0-9_]+$/;

/**
 * Collect every leaf key of a parsed catalog in dot notation. ngx-translate
 * catalogs are strings nested in objects, nothing else — any other leaf
 * (number, array, null) is reported through `onError` and skipped.
 * @param {object} node - Current object
 * @param {(key: string) => void} onError - Called with the dot path of a bad leaf
 * @param {string} prefix - Key prefix
 * @returns {string[]} - Leaf keys
 */
const collectLeafKeys = (node, onError, prefix = '') => {
  const keys = [];
  for (const [key, value] of Object.entries(node)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...collectLeafKeys(value, onError, fullKey));
    } else {
      onError(fullKey);
    }
  }
  return keys;
};

/**
 * Verify a folder of translation catalogs laid out as `<dir>/<catalog>/<lang>.json`
 * (libs/i18n/src, or an app's own assets/i18n). Every subfolder holding JSON is a
 * catalog and must carry:
 *   1. a file per language, and no JSON file for a language outside the list;
 *   2. valid JSON objects whose leaves are all strings;
 *   3. an identical nested key set across the languages;
 *   4. UPPERCASE_SNAKE_CASE key segments.
 * Prints one ✅ line per complete catalog or the ❌ list of its problems and
 * returns the verdict; callers print their own summary and exit code. A catalog
 * whose files are all `{}` passes the rules above but is reported with a ⚠️
 * line: it is dead weight in an app's translate loader (a request per language
 * switch for nothing) and usually a leftover of a feature that never landed.
 * @param {string} dir - Folder holding the catalog subfolders (absolute)
 * @param {string[]} languages - Expected language codes (SUPPORTED_LANGUAGES)
 * @param {{ skip?: Set<string>, displayRoot: string }} options - Catalog folders owned
 *   by another check, and the root that paths in messages are shown relative to
 * @returns {{ catalogs: string[], failed: boolean, keysByCatalog: Map<string, Set<string>> }} -
 *   `keysByCatalog` holds the union of leaf keys per catalog (feeds the
 *   unused-key report of check-app-translations.mjs)
 */
export const checkCatalogFolders = (dir, languages, { skip = new Set(), displayRoot }) => {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    die(`Translation directory not found: ${dir}`);
  }
  const catalogs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !skip.has(dirent.name))
    .map((dirent) => dirent.name)
    .filter((name) => fs.readdirSync(path.join(dir, name)).some((f) => f.endsWith('.json')))
    .sort();
  if (catalogs.length === 0) {
    die(`No translation catalogs (<catalog>/<lang>.json) found under ${dir}`);
  }

  const languageSet = new Set(languages);
  const keysByCatalog = new Map();
  let failed = false;

  for (const catalog of catalogs) {
    const errors = [];
    const catalogDir = path.join(dir, catalog);
    const keysByLanguage = new Map();

    const jsonFiles = fs
      .readdirSync(catalogDir)
      .filter((file) => file.endsWith('.json'))
      .sort();
    for (const file of jsonFiles) {
      if (!languageSet.has(path.basename(file, '.json'))) {
        errors.push(
          `${catalog}/${file} is not a supported language file (expected one of ${languages.join(', ')})`,
        );
      }
    }

    for (const lang of languages) {
      const filePath = path.join(catalogDir, `${lang}.json`);
      const label = `${catalog}/${lang}.json`;
      if (!fs.existsSync(filePath)) {
        errors.push(
          `${catalog}: missing file for "${lang}": ${path.relative(displayRoot, filePath)}`,
        );
        continue;
      }
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        errors.push(`${label} is not valid JSON: ${error.message}`);
        continue;
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        errors.push(`${label} must be a JSON object`);
        continue;
      }
      const leafKeys = collectLeafKeys(parsed, (key) =>
        errors.push(`${label}: ${key} must be a string or a nested object`),
      );
      keysByLanguage.set(lang, new Set(leafKeys));
    }

    const allKeys = new Set([...keysByLanguage.values()].flatMap((keys) => [...keys]));
    for (const [lang, keys] of keysByLanguage) {
      const missing = [...allKeys].filter((key) => !keys.has(key)).sort();
      if (missing.length > 0) {
        errors.push(
          `${catalog}/${lang}.json is missing ${missing.length} key(s): ${missing.join(', ')}`,
        );
      }
    }

    const badlyCased = [...allKeys]
      .filter((key) => !key.split('.').every((segment) => SEGMENT_RE.test(segment)))
      .sort();
    for (const key of badlyCased) {
      errors.push(`${catalog}: key "${key}" is not UPPERCASE_SNAKE_CASE`);
    }

    keysByCatalog.set(catalog, allKeys);
    if (errors.length > 0) {
      failed = true;
      for (const message of errors) console.error(colors.red(`  ❌ ${message}`));
    } else if (allKeys.size === 0) {
      console.warn(
        colors.yellow(
          `  ⚠️  ${catalog}: 0 keys — every language file is \`{}\`. Delete the folder and its translate-loader module, or fill it.`,
        ),
      );
    } else {
      console.log(
        colors.green(
          `  ✅ ${catalog}: ${allKeys.size} key(s) across ${keysByLanguage.size} language(s)`,
        ),
      );
    }
  }

  return { catalogs, failed, keysByCatalog };
};

// A translation key as source code references it: quoted (', " or `) and
// UPPERCASE_SNAKE_CASE dotted, either whole ('ADMIN.USERS.TITLE') or as a
// prefix the code completes at runtime — a literal ending in `.` or `_`
// ('SHARED.COLORS.' + slug, 'SELL_YOUR_CAR.STEPS.' + step) or a template
// literal interpolated right after it (`ADMIN.EMPLOYEES.${field}`).
const KEY_REFERENCE_RE = /(['"`])([A-Z][A-Z0-9_]*(?:\.[A-Z0-9_]+)*\.?)(?=\1|\$\{)/g;
const SOURCE_EXTENSIONS = new Set(['.ts', '.html']);
const SKIPPED_DIRS = new Set(['node_modules']);
// Legacy Jest/Karma specs are not shipped code; a key only a spec mentions is dead.
const isSpecFile = (name) => name.endsWith('.spec.ts');

const listSourceFiles = (dir, files = []) => {
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const entry = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (!SKIPPED_DIRS.has(dirent.name) && !dirent.name.startsWith('.')) {
        listSourceFiles(entry, files);
      }
    } else if (SOURCE_EXTENSIONS.has(path.extname(dirent.name)) && !isSpecFile(dirent.name)) {
      files.push(entry);
    }
  }
  return files;
};

// Comments must not keep a key alive (`// was 'ADMIN.CALENDAR.TODAY'`):
// stripComments for TypeScript, `<!-- … -->` for templates.
const withoutComments = (file, source) =>
  file.endsWith('.html') ? source.replace(/<!--[\s\S]*?-->/g, '') : stripComments(source);

/**
 * Index the translation keys the `.ts`/`.html` files under `sourceDirs`
 * reference (specs and comments excluded), for the unused-key report of
 * check-app-translations.mjs. A catalog key counts as referenced when the
 * sources contain it literally, contain one of its ancestor groups literally
 * (a group fetched as an object, `translate.get('ADMIN.EMPLOYEES.WEEKDAY')` —
 * at least `NAMESPACE.GROUP`, so a bare 'ADMIN' role string cannot vouch for a
 * whole catalog) or contain a dynamic prefix it starts with (see
 * KEY_REFERENCE_RE). Best effort by design — a key assembled from two
 * variables is invisible, and a wide prefix such as `ADMIN.` would vouch for a
 * whole namespace — which is why callers only warn on the result.
 * @param {string[]} sourceDirs - Absolute folders to scan (missing ones are skipped)
 * @returns {{ files: number, isReferenced: (key: string) => boolean }} - The
 *   number of files scanned and the lookup
 */
export const indexKeyReferences = (sourceDirs) => {
  const literals = new Set();
  const prefixes = new Set();
  let files = 0;
  for (const dir of sourceDirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const file of listSourceFiles(dir)) {
      files++;
      const source = withoutComments(file, fs.readFileSync(file, 'utf8'));
      for (const match of source.matchAll(KEY_REFERENCE_RE)) {
        const fragment = match[2];
        const interpolated = source.startsWith('${', match.index + match[0].length);
        if (interpolated || fragment.endsWith('.') || fragment.endsWith('_')) {
          prefixes.add(fragment);
        } else {
          literals.add(fragment);
        }
      }
    }
  }

  const prefixList = [...prefixes];
  const isReferenced = (key) => {
    if (literals.has(key)) return true;
    const segments = key.split('.');
    for (let depth = segments.length - 1; depth > 1; depth--) {
      if (literals.has(segments.slice(0, depth).join('.'))) return true;
    }
    return prefixList.some((prefix) => key.startsWith(prefix));
  };
  return { files, isReferenced };
};
