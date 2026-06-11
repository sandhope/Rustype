export interface AppSettings {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
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

const SETTINGS_KEY = 'rustype_settings';

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function updateSetting<K extends keyof AppSettings>(
  settings: AppSettings,
  key: K,
  value: AppSettings[K]
): AppSettings {
  const newSettings = { ...settings, [key]: value };
  saveSettings(newSettings);
  return newSettings;
}