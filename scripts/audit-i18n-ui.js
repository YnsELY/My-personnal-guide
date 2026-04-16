const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components'];
const VALID_EXTENSIONS = new Set(['.ts', '.tsx']);
const I18N_PATTERNS = ['useTranslation(', 'i18n.t(', '<Trans', 'useLanguage('];

function collectFiles(dir) {
  const absoluteDir = path.join(ROOT, dir);
  if (!fs.existsSync(absoluteDir)) return [];

  const results = [];

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = path.relative(ROOT, absolutePath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results.push(...collectFiles(relativePath));
      continue;
    }

    if (VALID_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(relativePath);
    }
  }

  return results;
}

const allFiles = TARGET_DIRS.flatMap(collectFiles).sort();
const translatedFiles = allFiles.filter((file) => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return I18N_PATTERNS.some((pattern) => source.includes(pattern));
});
const untranslatedFiles = allFiles.filter((file) => !translatedFiles.includes(file));

console.log(`UI files: ${allFiles.length}`);
console.log(`i18n-aware files: ${translatedFiles.length}`);
console.log(`Files still missing i18n hooks: ${untranslatedFiles.length}`);

if (untranslatedFiles.length > 0) {
  console.log('\nRemaining files:');
  untranslatedFiles.forEach((file) => console.log(file));
}
