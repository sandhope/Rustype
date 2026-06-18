import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const themesDir = 'D:\\code\\Rustype\\src\\styles\\themes';

// New UI component CSS variables to add to every theme file.
// All values reference existing theme variables so they adapt per-theme.
const newVars = `
  /* UI Component Variables */
  --tab-bar-bg: var(--app-tab-bg);
  --tab-bar-border: var(--app-header-border);
  --app-main-bg: var(--app-bg-color);
  --scrollbar-thumb: var(--editor-color-30);

  --menu-trigger-color: var(--app-text-color);
  --menu-trigger-hover-bg: var(--float-hover-color);
  --menu-trigger-active-bg: var(--float-hover-color);
  --menu-dropdown-bg: var(--float-bg-color);
  --menu-dropdown-border: var(--float-border-color);
  --menu-dropdown-shadow: var(--float-shadow);
  --menu-item-color: var(--float-font-color);
  --menu-item-hover-bg: var(--float-hover-color);
  --menu-item-shortcut-color: var(--editor-color-40);
  --menu-divider-color: var(--float-border-color);
  --menu-danger-color: var(--delete-color);
  --menu-danger-hover-bg: rgba(255, 82, 82, 0.15);

  --file-item-color: var(--app-text-color);
  --file-item-hover-bg: var(--float-hover-color);
  --file-name-color: var(--app-text-color);

  --tree-folder-color: var(--app-text-color);
  --tree-folder-hover-bg: var(--float-hover-color);
  --tree-folder-active-bg: var(--item-bg-color);
  --tree-arrow-color: var(--editor-color-40);
  --tree-file-color: var(--app-text-color);
  --tree-file-hover-bg: var(--float-hover-color);
  --tree-file-active-bg: var(--item-bg-color);
  --tree-context-bg: var(--float-bg-color);
  --tree-context-border: var(--float-border-color);
  --tree-context-color: var(--float-font-color);
  --tree-context-shadow: var(--float-shadow);
  --tree-context-hover-bg: var(--float-hover-color);
  --tree-context-danger-color: var(--delete-color);
  --tree-context-disabled-color: var(--editor-color-30);
  --tree-context-divider: var(--float-border-color);
  --tree-rename-input-bg: var(--input-bg-color);
  --tree-rename-input-border: var(--settings-input-focus, #1976d2);
  --tree-rename-input-color: var(--app-text-color);

  --editor-context-bg: var(--float-bg-color);
  --editor-context-border: var(--float-border-color);
  --editor-context-color: var(--float-font-color);
  --editor-context-shadow: var(--float-shadow);
  --editor-context-hover-bg: var(--float-hover-color);
  --editor-context-disabled-color: var(--editor-color-30);
  --editor-context-divider: var(--float-border-color);

  --modal-bg: var(--float-bg-color);
  --modal-title-color: var(--app-text-color);
  --modal-text-color: var(--editor-color-80);
  --modal-btn-secondary-bg: var(--float-hover-color);
  --modal-btn-secondary-color: var(--app-text-color);
  --modal-btn-secondary-hover-bg: var(--item-bg-color);

  --find-replace-bg: var(--float-bg-color);
  --find-replace-border: var(--float-border-color);
  --find-input-bg: var(--input-bg-color);
  --find-input-color: var(--app-text-color);
  --find-input-border: var(--float-border-color);
  --find-input-focus-border: var(--settings-input-focus, #1976d2);
  --find-btn-bg: var(--float-hover-color);
  --find-btn-color: var(--app-text-color);
  --find-btn-border: var(--float-border-color);
  --find-btn-hover-bg: var(--item-bg-color);
  --find-options-color: var(--editor-color-50);
  --find-count-color: var(--editor-color-40);

  --source-mode-bg: var(--editor-bg-color);
  --source-textarea-bg: var(--editor-bg-color);
  --source-textarea-color: var(--editor-color);
  --source-placeholder-color: var(--editor-color-30);

  --outline-bg: var(--float-bg-color);
  --outline-border: var(--float-border-color);
  --outline-title-color: var(--app-text-color);
  --outline-close-color: var(--editor-color-40);
  --outline-close-hover-bg: var(--float-hover-color);
  --outline-empty-color: var(--editor-color-40);
  --outline-item-color: var(--float-font-color);
  --outline-item-hover-bg: var(--float-hover-color);

  --welcome-bg: var(--app-bg-color);
  --welcome-action-bg: var(--float-bg-color);
  --welcome-action-border: var(--float-border-color);
  --welcome-action-color: var(--float-font-color);
  --welcome-action-hover-bg: var(--float-hover-color);
  --welcome-action-hover-border: var(--settings-input-focus, #1976d2);
  --welcome-folder-icon-color: var(--editor-color-40);
  --welcome-folder-title-color: var(--app-text-color);
  --welcome-folder-subtitle-color: var(--editor-color-40);

  --activity-bar-bg: var(--app-sidebar-bg);
  --activity-bar-border: var(--app-sidebar-border);
  --activity-bar-icon-color: var(--editor-color-40);
  --activity-bar-icon-hover-color: var(--app-text-color);
  --activity-bar-icon-active-color: var(--app-text-color);
  --activity-bar-bottom-border: var(--app-sidebar-border);

  --sidebar-section-title-color: var(--editor-color-40);
  --sidebar-empty-color: var(--editor-color-30);
`;

async function main() {
  const files = (await readdir(themesDir)).filter(f => f.endsWith('.css'));
  let count = 0;

  for (const file of files) {
    const filePath = join(themesDir, file);
    let content = await readFile(filePath, 'utf8');

    // Skip if already patched
    if (content.includes('/* UI Component Variables */')) {
      console.log(`  skip (already patched): ${file}`);
      continue;
    }

    // Find the last closing brace of .theme-{id} { ... }
    const lastBrace = content.lastIndexOf('}');
    if (lastBrace === -1) {
      console.log(`  skip (no closing brace): ${file}`);
      continue;
    }

    // Insert new variables before the closing brace
    content = content.slice(0, lastBrace) + newVars + '\n}\n';
    await writeFile(filePath, content, 'utf8');
    count++;
    console.log(`  patched: ${file}`);
  }

  console.log(`\nDone: ${count} files patched`);
}

main().catch(console.error);
