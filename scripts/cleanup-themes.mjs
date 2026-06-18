// Cleanup script: remove unused CSS variables from all theme files
// and remove redundant rules from dark-mode-overrides.css

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const themesDir = 'D:\\code\\Rustype\\src\\styles\\themes';

// These 40 variables are never referenced in any CSS rule outside theme files
const deadVariables = [
  // Button state variants (4)
  '--button-bg-color-active',
  '--button-border-active',
  '--button-font-color-active',
  '--button-font-color-hover',
  // Button primary family (12)
  '--button-primary-bg-color',
  '--button-primary-bg-color-active',
  '--button-primary-bg-color-hover',
  '--button-primary-border',
  '--button-primary-border-active',
  '--button-primary-border-hover',
  '--button-primary-focus-border',
  '--button-primary-focus-shadow',
  '--button-primary-font-color',
  '--button-primary-font-color-active',
  '--button-primary-font-color-hover',
  '--button-primary-shadow',
  // Other button (1)
  '--button-shadow',
  // Editor (1)
  '--editor-color-04',
  // Misc (3)
  '--focus-color',
  '--footnote-bg-color',
  '--mask-color',
  // Theme color opacity scale (9)
  '--theme-color-10',
  '--theme-color-20',
  '--theme-color-30',
  '--theme-color-40',
  '--theme-color-50',
  '--theme-color-60',
  '--theme-color-70',
  '--theme-color-80',
  '--theme-color-90',
  // Unused sidebar vars (5) — note: --side-bar-bg-color IS used by derived vars
  '--side-bar-color',
  '--side-bar-icon-color',
  '--side-bar-item-hover-bg-color',
  '--side-bar-text-color',
  '--side-bar-title-color',
  // Unused float var (1)
  '--float-font-color',
  // Unused item var (1)
  '--item-bg-color',
];

// Regex patterns for dead variables. We need to match the full line including
// the property name, value (which may span to semicolon), and trailing newline.
function buildDeadVarPattern(varName) {
  // Match: optional whitespace, property-name, colon, anything up to semicolon, newline
  // The value might contain var() references, rgba(), etc. — anything except newline
  const escaped = varName.replace(/-/g, '\\-');
  return new RegExp(`\\s*${escaped}:\\s*[^;]+;\\s*\\n`, 'g');
}

async function cleanThemeFiles() {
  const files = (await readdir(themesDir)).filter(f => f.endsWith('.css'));
  let totalRemoved = 0;

  for (const file of files) {
    const filePath = join(themesDir, file);
    let content = await readFile(filePath, 'utf8');
    let originalLength = content.length;

    for (const varName of deadVariables) {
      const pattern = buildDeadVarPattern(varName);
      content = content.replace(pattern, '\n');
    }

    // Clean up multiple consecutive blank lines (keep at most 2)
    content = content.replace(/\n{3,}/g, '\n\n');

    const removed = originalLength - content.length;
    if (removed > 0) {
      await writeFile(filePath, content, 'utf8');
      totalRemoved += removed;
      console.log(`  cleaned: ${file} (removed ${removed} chars)`);
    } else {
      console.log(`  no changes: ${file}`);
    }
  }

  console.log(`\nTheme files: removed ~${totalRemoved} chars of dead variables from ${files.length} files`);
}

// Clean dark-mode-overrides.css — remove 17 redundant rule blocks
async function cleanDarkModeOverrides() {
  const filePath = 'D:\\code\\Rustype\\src\\styles\\dark-mode-overrides.css';
  let content = await readFile(filePath, 'utf8');

  // These are the redundant blocks that duplicate themes.css rules.
  // They all apply the same CSS variable to the same element.
  // We'll remove them one by one.

  const redundantBlocks = [
    // Editor background (lines ~4-8)
    /\[data-theme-mode="dark"\] \.rustype-editor,\s*\n\[data-theme-mode="dark"\] \.mu-editor,\s*\n\[data-theme-mode="dark"\] \.mu-scroll-page \{[^}]+\}\s*\n/g,
    // Editor container (lines ~10-15)
    /\[data-theme-mode="dark"\] \.rustype-editor \.mu-editor,\s*\n\[data-theme-mode="dark"\] \.rustype-editor \.mu-container,\s*\n\[data-theme-mode="dark"\] \.mu-editor \.mu-container \{[^}]+\}\s*\n/g,
    // Text color (lines ~17-20)
    /\[data-theme-mode="dark"\] \.mu-block,\s*\n\[data-theme-mode="dark"\] \.mu-ag-front-content,\s*\n\[data-theme-mode="dark"\] \.mu-content,\s*\n\[data-theme-mode="dark"\] \.mu-ag-paragraph,\s*\n\[data-theme-mode="dark"\] \.mu-container p,\s*\n\[data-theme-mode="dark"\] \.mu-container div \{[^}]+\}\s*\n/g,
    // Heading color (generic)
    /\[data-theme-mode="dark"\] \.mu-heading,\s*\n\[data-theme-mode="dark"\] \.mu-container h1,\s*\n\[data-theme-mode="dark"\] \.mu-container h2,\s*\n\[data-theme-mode="dark"\] \.mu-container h3,\s*\n\[data-theme-mode="dark"\] \.mu-container h4,\s*\n\[data-theme-mode="dark"\] \.mu-container h5,\s*\n\[data-theme-mode="dark"\] \.mu-container h6,\s*\n\[data-theme-mode="dark"\] \.mu-h1,\s*\n\[data-theme-mode="dark"\] \.mu-h2,\s*\n\[data-theme-mode="dark"\] \.mu-h3,\s*\n\[data-theme-mode="dark"\] \.mu-h4,\s*\n\[data-theme-mode="dark"\] \.mu-h5,\s*\n\[data-theme-mode="dark"\] \.mu-h6 \{[^}]+\}\s*\n/g,
    // Link color
    /\[data-theme-mode="dark"\] \.mu-link,\s*\n\[data-theme-mode="dark"\] a \{[^}]+\}\s*\n/g,
    // Strong/Em/Code color
    /\[data-theme-mode="dark"\] \.mu-strong,\s*\n\[data-theme-mode="dark"\] \.mu-em,\s*\n\[data-theme-mode="dark"\] \.mu-code,\s*\n\[data-theme-mode="dark"\] \.mu-inline-code,\s*\n\[data-theme-mode="dark"\] \.mu-pre,\s*\n\[data-theme-mode="dark"\] \.mu-code-block,\s*\n\[data-theme-mode="dark"\] \.mu-container code,\s*\n\[data-theme-mode="dark"\] \.mu-container pre \{[^}]+\}\s*\n/g,
    // Code block bg
    /\[data-theme-mode="dark"\] \.mu-code,\s*\n\[data-theme-mode="dark"\] \.mu-inline-code,\s*\n\[data-theme-mode="dark"\] \.mu-pre,\s*\n\[data-theme-mode="dark"\] \.mu-code-block,\s*\n\[data-theme-mode="dark"\] \.mu-container code,\s*\n\[data-theme-mode="dark"\] \.mu-container pre \{[^}]+background-color[^}]+\}\s*\n/g,
    // Table border
    /\[data-theme-mode="dark"\] \.mu-table,\s*\n\[data-theme-mode="dark"\] \.mu-table td,\s*\n\[data-theme-mode="dark"\] \.mu-table th,\s*\n\[data-theme-mode="dark"\] \.mu-container table,\s*\n\[data-theme-mode="dark"\] \.mu-container td,\s*\n\[data-theme-mode="dark"\] \.mu-container th \{[^}]+\}\s*\n/g,
    // Blockquote
    /\[data-theme-mode="dark"\] \.mu-blockquote,\s*\n\[data-theme-mode="dark"\] \.mu-container blockquote \{[^}]+\}\s*\n/g,
    // HR
    /\[data-theme-mode="dark"\] \.mu-hr,\s*\n\[data-theme-mode="dark"\] \.mu-container hr \{[^}]+\}\s*\n/g,
    // Float/tooltip
    /\[data-theme-mode="dark"\] \.mu-float-wrapper,\s*\n\[data-theme-mode="dark"\] \.mu-front-button-wrapper,\s*\n\[data-theme-mode="dark"\] \.mu-float-container \{[^}]+\}\s*\n/g,
  ];

  let beforeLength = content.length;

  for (const pattern of redundantBlocks) {
    content = content.replace(pattern, '');
  }

  // Clean up multiple consecutive blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  const removed = beforeLength - content.length;
  await writeFile(filePath, content, 'utf8');
  console.log(`\ndark-mode-overrides.css: removed ${removed} chars of redundant rules`);
}

async function main() {
  console.log('=== Cleaning theme files ===');
  await cleanThemeFiles();

  console.log('\n=== Cleaning dark-mode-overrides.css ===');
  await cleanDarkModeOverrides();

  console.log('\nDone!');
}

main().catch(console.error);
