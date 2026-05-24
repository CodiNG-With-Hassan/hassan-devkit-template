#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color functions for terminal output
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
};

// Configuration
const I18N_DIR = path.resolve(__dirname, '..', 'public/assets/i18n');
const SUPPORTED_LANGUAGES = ['en', 'nl'];

/**
 * Recursively extract all keys from a nested object
 * @param {Object} obj - The object to extract keys from
 * @param {string} prefix - Current key prefix for nested objects
 * @returns {Set<string>} - Set of all nested keys
 */
const extractKeys = (obj, prefix = '') => {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = extractKeys(value, fullKey);
      nestedKeys.forEach((nestedKey) => keys.add(nestedKey));
    }
  }

  return keys;
}

/**
 * Read and parse JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Object|null} - Parsed JSON or null if error
 */
const readJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(colors.red(`Error reading ${filePath}: ${error.message}`));
    return null;
  }
}

/**
 * Get all translation modules (subdirectories in i18n folder)
 * @returns {string[]} - Array of module names
 */
const getTranslationModules = () => {
  if (!fs.existsSync(I18N_DIR)) {
    console.error(colors.red(`Translation directory not found: ${I18N_DIR}`));
    process.exit(1);
  }

  return fs
    .readdirSync(I18N_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort();
}

/**
 * Check translations for a specific module
 * @param {string} module - Module name (e.g., 'auth', 'home', etc.)
 * @returns {Object} - Results object with errors and warnings
 */
const checkModuleTranslations = (module) => {
  const modulePath = path.join(I18N_DIR, module);
  const results = {
    module,
    errors: [],
    warnings: [],
    languageKeys: new Map(),
    allKeys: new Set(),
    missingFiles: [],
    validLanguages: [],
  };

  // Check which language files exist
  const existingFiles = new Map();
  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(modulePath, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      existingFiles.set(lang, filePath);
      results.validLanguages.push(lang);
    } else {
      results.missingFiles.push(lang);
    }
  }

  if (existingFiles.size === 0) {
    results.errors.push(`No translation files found in ${module}`);
    return results;
  }

  // Extract keys from each language file
  for (const [lang, filePath] of existingFiles) {
    const jsonData = readJsonFile(filePath);
    if (jsonData) {
      const keys = extractKeys(jsonData);
      results.languageKeys.set(lang, keys);
      keys.forEach((key) => results.allKeys.add(key));
    } else {
      results.errors.push(`Failed to parse ${lang}.json in ${module}`);
    }
  }

  // Find missing keys in each language
  for (const [lang, langKeys] of results.languageKeys) {
    const missingKeys = [];

    for (const key of results.allKeys) {
      if (!langKeys.has(key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      results.errors.push({
        language: lang,
        missingKeys: missingKeys.sort(),
        count: missingKeys.length,
      });
    }
  }

  // Report missing language files
  if (results.missingFiles.length > 0) {
    results.warnings.push({
      type: 'missing_files',
      languages: results.missingFiles,
      message: `Missing language files: ${results.missingFiles.join(', ')}`,
    });
  }

  return results;
}

/**
 * Format and display results
 * @param {Object[]} allResults - Array of results from all modules
 */
const displayResults = (allResults) => {
  let hasErrors = false;
  let totalErrors = 0;
  let totalWarnings = 0;

  console.log(colors.cyan('\n🔍 Translation Consistency Check Results\n'));

  for (const result of allResults) {
    const moduleErrors = result.errors.filter((error) => typeof error === 'object' && error.missingKeys);
    const otherErrors = result.errors.filter((error) => typeof error === 'string');

    if (moduleErrors.length > 0 || otherErrors.length > 0 || result.warnings.length > 0) {
      console.log(colors.yellow(`📁 Module: ${result.module}`));

      // Display general errors
      for (const error of otherErrors) {
        console.log(colors.red(`  ❌ ${error}`));
        totalErrors++;
        hasErrors = true;
      }

      // Display missing keys errors
      for (const error of moduleErrors) {
        console.log(colors.red(`  ❌ ${error.language}.json missing ${error.count} key(s):`));
        for (const key of error.missingKeys) {
          console.log(colors.red(`    - ${key}`));
        }
        totalErrors++;
        hasErrors = true;
      }

      // Display warnings
      for (const warning of result.warnings) {
        console.log(colors.yellow(`  ⚠️  ${warning.message}`));
        totalWarnings++;
      }

      console.log('');
    } else {
      console.log(colors.green(`✅ Module: ${result.module} - All translations consistent`));
    }
  }

  // Summary
  console.log(colors.cyan('📊 Summary:'));
  console.log(`  Modules checked: ${allResults.length}`);
  console.log(`  Total errors: ${colors.red(totalErrors)}`);
  console.log(`  Total warnings: ${colors.yellow(totalWarnings)}`);

  if (hasErrors) {
    console.log(colors.red('\n❌ Translation check failed! Please fix the missing translations above.'));
    process.exit(1);
  } else {
    console.log(colors.green('\n✅ All translations are consistent!'));
  }
}

/**
 * Generate a detailed report of all keys across all modules
 * @param {Object[]} allResults - Array of results from all modules
 */
const generateDetailedReport = (allResults) => {
  if (process.argv.includes('--detailed')) {
    console.log(colors.cyan('\n📋 Detailed Translation Report\n'));

    for (const result of allResults) {
      if (result.allKeys.size > 0) {
        console.log(colors.yellow(`Module: ${result.module}`));
        console.log(`  Languages: ${result.validLanguages.join(', ')}`);
        console.log(`  Total keys: ${result.allKeys.size}`);

        if (process.argv.includes('--show-keys')) {
          console.log('  Keys:');
          const sortedKeys = Array.from(result.allKeys).sort();
          for (const key of sortedKeys) {
            console.log(`    - ${key}`);
          }
        }
        console.log('');
      }
    }
  }
}

/**
 * Main execution function
 */
const main = () => {
  console.log(colors.cyan('🌐 Starting translation consistency check...\n'));

  const modules = getTranslationModules();
  console.log(`Found ${modules.length} translation modules: ${modules.join(', ')}\n`);

  const allResults = [];

  for (const module of modules) {
    console.log(colors.gray(`Checking module: ${module}...`));
    const result = checkModuleTranslations(module);
    allResults.push(result);
  }

  console.log(colors.gray('\nAnalysis complete.\n'));

  displayResults(allResults);
  generateDetailedReport(allResults);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Translation Consistency Checker

Usage: node check-translations.js [options]

Options:
  --help, -h      Show this help message
  --detailed      Show detailed report with module statistics
  --show-keys     Show all keys for each module (use with --detailed)

Examples:
  node check-translations.js                    # Basic check
  node check-translations.js --detailed         # Detailed report
  node check-translations.js --detailed --show-keys  # Show all keys
`);
  process.exit(0);
}

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkModuleTranslations, extractKeys, getTranslationModules };
