#!/usr/bin/env node

/**
 * i18n Parity Check Script
 * Ensures FR and AR translation files have exactly the same set of keys.
 * Run: node scripts/check-i18n-parity.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const LANGUAGES = ['fr', 'ar'];

function getKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

let hasErrors = false;

// Get all namespace files from FR (reference)
const frDir = path.join(LOCALES_DIR, 'fr');
const namespaces = fs.readdirSync(frDir)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

for (const ns of namespaces) {
  for (const lang of LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, lang, `${ns}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`MISSING: ${lang}/${ns}.json does not exist`);
      hasErrors = true;
    }
  }

  const frPath = path.join(LOCALES_DIR, 'fr', `${ns}.json`);
  const arPath = path.join(LOCALES_DIR, 'ar', `${ns}.json`);

  if (!fs.existsSync(frPath) || !fs.existsSync(arPath)) continue;

  const frData = JSON.parse(fs.readFileSync(frPath, 'utf-8'));
  const arData = JSON.parse(fs.readFileSync(arPath, 'utf-8'));

  const frKeys = getKeys(frData);
  const arKeys = getKeys(arData);

  const missingInAr = frKeys.filter(k => !arKeys.includes(k));
  const extraInAr = arKeys.filter(k => !frKeys.includes(k));

  if (missingInAr.length > 0) {
    console.error(`\n[${ns}] Keys in FR but missing in AR:`);
    missingInAr.forEach(k => console.error(`  - ${k}`));
    hasErrors = true;
  }

  if (extraInAr.length > 0) {
    console.error(`\n[${ns}] Keys in AR but missing in FR:`);
    extraInAr.forEach(k => console.error(`  - ${k}`));
    hasErrors = true;
  }

  if (missingInAr.length === 0 && extraInAr.length === 0) {
    console.log(`[${ns}] OK (${frKeys.length} keys)`);
  }
}

// Check AR directory for extra files
const arDir = path.join(LOCALES_DIR, 'ar');
const arNamespaces = fs.readdirSync(arDir)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

const extraArFiles = arNamespaces.filter(ns => !namespaces.includes(ns));
if (extraArFiles.length > 0) {
  console.error(`\nExtra AR files without FR counterpart: ${extraArFiles.join(', ')}`);
  hasErrors = true;
}

if (hasErrors) {
  console.error('\ni18n parity check FAILED');
  process.exit(1);
} else {
  console.log('\ni18n parity check PASSED');
}
