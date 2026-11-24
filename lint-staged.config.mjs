// Targets are derived from the workspace: every project with an ESLint/Prettier config gets
// `pnpm -C <project> exec …` entries (api: **/*.ts; apps and libs: src/**/*.{ts,html} and
// src/**/*.{scss,css,json}), so a new app or lib is covered the moment it exists. api-client is
// excluded: its src/generated is written by orval (which already runs Prettier with the lib's
// config) and must stay exactly as generated for the pre-commit contract guard.
//
// `extra` covers what the derived targets miss, all formatted with the root `.prettierrc`:
// - the files outside every project root that the tpl-i18n `format:check` target gates in CI
//   (the workspace scripts and the acceptance-case data under docs/testing; the workbooks next
//   to the data files are gitignored artifacts and never staged);
// - the source-shared libs without an ESLint config of their own (i18n, web-ui, shared-utils,
//   theme), which their own `format:check` targets gate in CI.
// So a quote-style change or trailing whitespace is fixed on commit instead of failing the CI job.
import lintStaged from '@coding-with-hassan/devkit/lint-staged';

const rootPrettier = 'pnpm -C libs/i18n exec prettier --write';

export default lintStaged({
  exclude: ['api-client'],
  extra: {
    'scripts/**/*.mjs': [rootPrettier],
    'docs/testing/**/*.ts': [rootPrettier],
    'libs/i18n/src/**/*.{ts,json}': [rootPrettier],
    'libs/{web-ui,shared-utils,theme}/src/**/*.{ts,html,css}': [rootPrettier],
  },
});
