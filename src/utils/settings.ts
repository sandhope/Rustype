import { LazyStore } from '@tauri-apps/plugin-store';

export interface AppSettings {
  // Theme (theme id like 'cadmium-light', 'dracula', or 'system')
  theme: string;

  // Editor
  fontSize: number;
  lineHeight: number;
  editorFontFamily: string;
  codeFontSize: number;
  codeFontFamily: string;
  editorLineWidth: string;

  // Auto save
  autoSave: boolean;
  autoSaveDelay: number;

  // Markdown
  tabSize: number;
  bulletListMarker: '-' | '*' | '+';
  orderListDelimiter: '.' | ')';
  preferLooseListItem: boolean;

  // Editor behavior
  autoPairBracket: boolean;
  autoPairMarkdownSyntax: boolean;
  autoPairQuote: boolean;
  hideQuickInsertHint: boolean;
  hideLinkPopup: boolean;

  // View
  sideBarVisibility: boolean;
  tabBarVisibility: boolean;
  sourceCodeModeEnabled: boolean;
  typewriterMode: boolean;
  focusMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  // Theme
  theme: 'system',

  // Editor
  fontSize: 16,
  lineHeight: 1.6,
  editorFontFamily: 'Open Sans, -apple-system, BlinkMacSystemFont, sans-serif',
  codeFontSize: 14,
  codeFontFamily: "'SF Mono', 'Consolas', 'Monaco', 'Menlo', monospace",
  editorLineWidth: '800px',

  // Auto save
  autoSave: false,
  autoSaveDelay: 5000,

  // Markdown
  tabSize: 4,
  bulletListMarker: '-',
  orderListDelimiter: '.',
  preferLooseListItem: true,

  // Editor behavior
  autoPairBracket: true,
  autoPairMarkdownSyntax: true,
  autoPairQuote: true,
  hideQuickInsertHint: false,
  hideLinkPopup: false,

  // View
  sideBarVisibility: false,
  tabBarVisibility: true,
  sourceCodeModeEnabled: false,
  typewriterMode: false,
  focusMode: false,
};

const SETTINGS_STORE_KEY = 'settings';

const settingsStore = new LazyStore('settings.bin');

export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await settingsStore.get<AppSettings>(SETTINGS_STORE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...stored };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await settingsStore.set(SETTINGS_STORE_KEY, settings);
    await settingsStore.save();
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export async function updateSetting<K extends keyof AppSettings>(
  settings: AppSettings,
  key: K,
  value: AppSettings[K],
): Promise<AppSettings> {
  const newSettings = { ...settings, [key]: value };
  await saveSettings(newSettings);
  return newSettings;
}
