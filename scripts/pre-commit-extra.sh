# Project-specific pre-commit additions.
# Invoked by @coding-with-hassan/devkit's shared pre-commit hook before lint-staged.

# App-local catalogs (apps/<app>/{public,src}/assets/i18n) — the same
# `check-translations` target CI runs for every app that has one
# (scripts/check-app-translations.mjs): a file per SUPPORTED_LANGUAGES entry,
# identical key set, string leaves, UPPERCASE_SNAKE_CASE. Runs for each app
# whose catalogs are staged, and for every app when an input they all share
# is staged: the checker itself, or any libs/i18n/src file — the checker reads
# SUPPORTED_LANGUAGES from libs/i18n/src/index.ts, so a new language must fail
# every app that lacks its file, mirroring CI's translations filter. An app
# that ships catalogs without the target is rejected so a new app cannot slip
# past the check.
STAGED_FILES=$(git diff --cached --name-only)
if printf '%s\n' "$STAGED_FILES" | grep -qE '^(scripts/(check-app-translations\.mjs|lib/i18n-check-utils\.mjs)$|libs/i18n/src/)'; then
  I18N_APPS=$(ls apps)
else
  I18N_APPS=$(printf '%s\n' "$STAGED_FILES" | sed -nE 's#^apps/([^/]+)/(public|src)/assets/i18n/.*#\1#p' | sort -u)
fi
for app in $I18N_APPS; do
  [ -d "apps/$app/public/assets/i18n" ] || [ -d "apps/$app/src/assets/i18n" ] || continue
  if ! grep -q '"check-translations"' "apps/$app/package.json" 2>/dev/null; then
    echo "pre-commit: apps/$app has translation catalogs but no check-translations script."
    echo "Add to apps/$app/package.json scripts (path relative to the app):"
    echo '  "check-translations": "node ../../scripts/check-app-translations.mjs <public|src>/assets/i18n"'
    exit 1
  fi
  echo "🌐 $app i18n changes detected — running its translation check..."
  pnpm -C "apps/$app" run check-translations || exit 1
done

# Shared catalogs check (libs/i18n) — the same `check-translations` script CI
# runs through the tpl-i18n Nx target, so hook and CI can never disagree:
#   - scripts/check-error-translations.mjs (ADR 0002): the ERRORS files carry
#     identical key sets and placeholders, mirrored by ERROR_CODES /
#     ERROR_CODE_PARAMS, map 1:1 onto the API ErrorCode enum (except UNKNOWN,
#     the only catalog-only key), and the API's language mirror and the
#     committed spec enum equal their sources;
#   - scripts/check-shared-translations.mjs: parity of every other
#     catalog folder (enum labels).
# Triggered by any input either script reads.
if printf '%s\n' "$STAGED_FILES" | grep -qE '^(libs/i18n/src/|apps/api/src/common/errors/|apps/api/src/common/supported-languages\.ts$|libs/api-types/spec/openapi\.json$|scripts/check-error-translations\.mjs$|scripts/check-shared-translations\.mjs$|scripts/lib/i18n-check-utils\.mjs$)'; then
  echo "🌐 Shared catalog changes detected — running libs/i18n check-translations..."
  pnpm -C libs/i18n run check-translations || exit 1
fi

# ---------------------------------------------------------------------------
# Generated API contract guard. Two offline layers (no dev stack needed; the
# authoritative boot-the-API check belongs in CI once workflows exist):
#
#   Layer 2 — heuristic: contract-shaped API files (entities, DTOs,
#   controllers, nest-cli.json, the ErrorCode enum — a named spec enum,
#   ADR 0002) are staged but the spec is not — the developer probably
#   forgot `pnpm api:types`. Can false-positive on internal refactors;
#   override with SKIP_API_SPEC_CHECK=1 git commit.
#
#   Layer 1 — deterministic: the spec, the generated dirs, or the generator
#   config are staged — regenerate api-types + api-client from the staged
#   spec and reject if the staged generated code does not match.

if [ "$SKIP_API_SPEC_CHECK" != "1" ]; then
  if git rev-parse -q --verify HEAD >/dev/null 2>&1; then
    BASE=HEAD
  else
    BASE=4b825dc642cb6eb9a060e54bf8d69288fbee4904 # empty tree (initial commit)
  fi
  STAGED=$(git diff --cached --name-only "$BASE")
  SPEC=libs/api-types/spec/openapi.json

  # ------------------------------------------------------------- Layer 2
  CONTRACT=$(printf '%s\n' "$STAGED" |
    grep -E '^apps/api/(entities/|src/.*/dto/|src/.*\.dto\.ts$|src/.*\.controller\.ts$|src/common/errors/error-code\.enum\.ts$|nest-cli\.json$)')

  if [ -n "$CONTRACT" ] && ! printf '%s\n' "$STAGED" | grep -qx "$SPEC"; then
    echo ''
    echo 'pre-commit: API contract files are staged but the OpenAPI spec is not:'
    printf '%s\n' "$CONTRACT" | sed 's/^/  - /'
    echo ''
    echo 'If the API contract changed, regenerate and stage the spec and types:'
    echo '  pnpm api:types   (dev stack must be running: pnpm docker:dev:up)'
    echo ''
    echo 'If this change does not affect the contract (internal refactor only):'
    echo '  SKIP_API_SPEC_CHECK=1 git commit ...'
    exit 1
  fi

  # ------------------------------------------------------------- Layer 1
  GEN_TOUCHED=$(printf '%s\n' "$STAGED" |
    grep -E '^(libs/api-types/(spec/openapi\.json$|src/generated/)|libs/api-client/(src/generated/|orval\.config\.ts$|scripts/rename-to-repositories\.mjs$))')

  if [ -n "$GEN_TOUCHED" ]; then
    # The check regenerates in place and diffs against the index, so the
    # index and working tree must agree for these paths (generated content
    # should never be partially staged anyway).
    if ! git diff --quiet -- "$SPEC" libs/api-types/src/generated \
      libs/api-client/src/generated libs/api-client/orval.config.ts \
      libs/api-client/scripts; then
      echo ''
      echo 'pre-commit: the API spec / generated packages have unstaged changes.'
      echo 'Stage them fully (or restore them) before committing — generated'
      echo 'content cannot be verified when partially staged.'
      exit 1
    fi

    echo '⚙️  Verifying generated API packages against the staged spec...'
    if ! pnpm -C libs/api-types run generate >/dev/null 2>&1 ||
      ! pnpm -C libs/api-client run generate >/dev/null 2>&1 ||
      ! git diff --quiet -- libs/api-types/src/generated libs/api-client/src/generated; then
      echo ''
      echo 'pre-commit: the staged generated code does not match what the staged'
      echo 'spec produces. The correct output has been regenerated in your'
      echo 'working tree — review it, `git add` it, and commit again:'
      git diff --name-only -- libs/api-types/src/generated libs/api-client/src/generated | sed 's/^/  - /'
      exit 1
    fi
  fi
fi
