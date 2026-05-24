# Project-specific pre-commit additions for this client.
# Invoked by @coding-with-hassan/devkit's shared pre-commit hook before lint-staged.
# Remove this file if you don't need any extras.

# Example: run the i18n consistency check if translation files changed.
if git diff --cached --name-only | grep -q '^spa/public/assets/i18n/'; then
  echo "🌐 i18n changes detected — running translation check..."
  cd spa && node scripts/check-translations.mjs || exit 1
  cd ..
fi
