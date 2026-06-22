import { useState, useCallback, useEffect } from 'react';
import type { AppSettings } from '../utils/settings';
import { DEFAULT_SETTINGS, saveSettings } from '../utils/settings';
import { lightThemes, darkThemes } from '../utils/themes';
import * as webview from '../utils/webview';
import { useI18n } from '../utils/i18n';

interface SettingsPanelProps {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
    onClose: () => void;
}

const ENCODING_OPTIONS = [
    { value: 'utf8', label: 'UTF-8' },
    { value: 'utf16le', label: 'UTF-16 LE' },
    { value: 'utf16be', label: 'UTF-16 BE' },
    { value: 'latin1', label: 'Latin-1 (ISO 8859-1)' },
    { value: 'ascii', label: 'ASCII' },
    { value: 'gbk', label: 'GBK' },
    { value: 'gb2312', label: 'GB2312' },
    { value: 'big5', label: 'Big5' },
    { value: 'shift_jis', label: 'Shift_JIS' },
    { value: 'euc-jp', label: 'EUC-JP' },
    { value: 'euc-kr', label: 'EUC-KR' },
    { value: 'iso-8859-15', label: 'ISO-8859-15' },
    { value: 'windows-1252', label: 'Windows-1252' },
    { value: 'windows-1256', label: 'Windows-1256' },
];

const LANGUAGE_OPTIONS = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' },
];

export default function SettingsPanel({ settings, setSettings, onClose }: SettingsPanelProps) {
    const { t } = useI18n();

    // Local state for text inputs that need debounce
    const [lineWidthInput, setLineWidthInput] = useState(settings.editorLineWidth);
    const [editorFontInput, setEditorFontInput] = useState(settings.editorFontFamily);
    const [codeFontInput, setCodeFontInput] = useState(settings.codeFontFamily);
    const [newExcludedDir, setNewExcludedDir] = useState('');

    // Sync local text inputs when settings change externally (e.g. reset)
    useEffect(() => { setLineWidthInput(settings.editorLineWidth); }, [settings.editorLineWidth]);
    useEffect(() => { setEditorFontInput(settings.editorFontFamily); }, [settings.editorFontFamily]);
    useEffect(() => { setCodeFontInput(settings.codeFontFamily); }, [settings.codeFontFamily]);

    // Debounced save for text inputs (500ms after user stops typing)
    useEffect(() => {
        if (lineWidthInput === settings.editorLineWidth) return;
        const timer = setTimeout(() => {
            saveSettings({ ...settings, editorLineWidth: lineWidthInput });
        }, 500);
        return () => clearTimeout(timer);
    }, [lineWidthInput, settings.editorLineWidth]);

    useEffect(() => {
        if (editorFontInput === settings.editorFontFamily) return;
        const timer = setTimeout(() => {
            saveSettings({ ...settings, editorFontFamily: editorFontInput });
        }, 500);
        return () => clearTimeout(timer);
    }, [editorFontInput, settings.editorFontFamily]);

    useEffect(() => {
        if (codeFontInput === settings.codeFontFamily) return;
        const timer = setTimeout(() => {
            saveSettings({ ...settings, codeFontFamily: codeFontInput });
        }, 500);
        return () => clearTimeout(timer);
    }, [codeFontInput, settings.codeFontFamily]);

    // Immediate apply for non-text controls
    const handleChange = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);
        setSettings(newSettings);
    }, [settings]);

    const handleReset = useCallback(() => {
        saveSettings({ ...DEFAULT_SETTINGS });
        setSettings({ ...DEFAULT_SETTINGS });
    }, []);

    // Theme click handler
    const handleThemeClick = useCallback((themeId: string, mode: 'light' | 'dark') => {
        let newSettings: AppSettings;
        if (settings.theme === 'system') {
            const update: Partial<AppSettings> = mode === 'light'
                ? { lightModeTheme: themeId }
                : { darkModeTheme: themeId };
            newSettings = { ...settings, ...update };
        } else {
            const update: Partial<AppSettings> = { theme: themeId };
            if (mode === 'light') update.lightModeTheme = themeId;
            else update.darkModeTheme = themeId;
            newSettings = { ...settings, ...update };
        }
        saveSettings(newSettings);
        setSettings(newSettings);
    }, [settings]);

    // Active theme highlighting
    const activeLightTheme = settings.theme === 'system'
        ? settings.lightModeTheme
        : (lightThemes.some(theme => theme.id === settings.theme) ? settings.theme : settings.lightModeTheme);
    const activeDarkTheme = settings.theme === 'system'
        ? settings.darkModeTheme
        : (darkThemes.some(theme => theme.id === settings.theme) ? settings.theme : settings.darkModeTheme);

    // Excluded dirs management
    const addExcludedDir = useCallback(() => {
        const dir = newExcludedDir.trim();
        if (dir && !settings.excludedDirs.includes(dir)) {
            const newSettings = { ...settings, excludedDirs: [...settings.excludedDirs, dir] };
            saveSettings(newSettings);
            setSettings(newSettings);
            setNewExcludedDir('');
        }
    }, [newExcludedDir, settings]);
    const removeExcludedDir = useCallback((dir: string) => {
        const newSettings = { ...settings, excludedDirs: settings.excludedDirs.filter(d => d !== dir) };
        saveSettings(newSettings);
        setSettings(newSettings);
    }, [settings]);

    // Zoom
    const zoomPercent = Math.round(settings.zoomLevel * 100);
    const zoomIn = useCallback(async() => {
        const level = await webview.zoomIn(settings.zoomLevel);
        const newSettings = { ...settings, zoomLevel: level };
        saveSettings(newSettings);
        setSettings(newSettings);
    }, [settings]);
    const zoomOut = useCallback(async () => {
        const level = await webview.zoomOut(settings.zoomLevel);
        const newSettings = { ...settings, zoomLevel: level };
        saveSettings(newSettings);
        setSettings(newSettings);
    }, [settings]);
    const zoomReset = useCallback(async () => {
        const level = await webview.zoomReset();
        const newSettings = { ...settings, zoomLevel: level };
        saveSettings(newSettings);
        setSettings(newSettings);
    }, [settings]);

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>{t('settings.title')}</h2>
                    <button className="settings-close" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    {/* ===== Language ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.language.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.language.label')}</label>
                            <select
                                className="settings-select"
                                value={settings.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                            >
                                {LANGUAGE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {/* ===== Startup ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.startup.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.startup.label')}</label>
                            <select
                                className="settings-select"
                                value={settings.startUpAction}
                                onChange={(e) => handleChange('startUpAction', e.target.value)}
                            >
                                <option value="restore">{t('settings.startup.restore')}</option>
                                <option value="blank">{t('settings.startup.blank')}</option>
                            </select>
                        </div>
                    </section>

                    {/* ===== Theme ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.theme.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.theme.mode')}</label>
                            <select
                                className="settings-select"
                                value={settings.theme === 'system' ? 'system' : 'custom'}
                                onChange={(e) => {
                                    if (e.target.value === 'system') {
                                        handleChange('theme', 'system');
                                    } else {
                                        handleChange('theme', settings.lightModeTheme);
                                    }
                                }}
                            >
                                <option value="system">{t('settings.theme.followSystem')}</option>
                                <option value="custom">{t('settings.theme.manual')}</option>
                            </select>
                        </div>
                        {settings.theme === 'system' && (
                            <>
                                <div className="settings-row">
                                    <label className="settings-label">{t('settings.theme.lightModeTheme')}</label>
                                    <select
                                        className="settings-select"
                                        value={settings.lightModeTheme}
                                        onChange={(e) => handleChange('lightModeTheme', e.target.value)}
                                    >
                                        {lightThemes.map(theme => (
                                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="settings-row">
                                    <label className="settings-label">{t('settings.theme.darkModeTheme')}</label>
                                    <select
                                        className="settings-select"
                                        value={settings.darkModeTheme}
                                        onChange={(e) => handleChange('darkModeTheme', e.target.value)}
                                    >
                                        {darkThemes.map(theme => (
                                            <option key={theme.id} value={theme.id}>{theme.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="settings-theme-group">
                            <div className="settings-theme-group-label">{t('settings.theme.lightThemes')}</div>
                            <div className="settings-theme-grid">
                                {lightThemes.map(theme => (
                                    <button
                                        key={theme.id}
                                        className={`settings-theme-card ${activeLightTheme === theme.id ? 'active' : ''}`}
                                        onClick={() => handleThemeClick(theme.id, 'light')}
                                        title={theme.name}
                                    >
                                        <span className="settings-theme-swatch light" />
                                        <span className="settings-theme-name">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="settings-theme-group">
                            <div className="settings-theme-group-label">{t('settings.theme.darkThemes')}</div>
                            <div className="settings-theme-grid">
                                {darkThemes.map(theme => (
                                    <button
                                        key={theme.id}
                                        className={`settings-theme-card ${activeDarkTheme === theme.id ? 'active' : ''}`}
                                        onClick={() => handleThemeClick(theme.id, 'dark')}
                                        title={theme.name}
                                    >
                                        <span className="settings-theme-swatch dark" />
                                        <span className="settings-theme-name">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== Auto Save ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.autoSave.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.autoSave.enable')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoSave}
                                onChange={(e) => handleChange('autoSave', e.target.checked)}
                            />
                        </div>
                        {settings.autoSave && (
                            <div className="settings-row">
                                <label className="settings-label">{t('settings.autoSave.delay')}</label>
                                <input
                                    type="number"
                                    className="settings-input"
                                    min={1000}
                                    max={60000}
                                    step={1000}
                                    value={settings.autoSaveDelay}
                                    onChange={(e) => handleChange('autoSaveDelay', parseInt(e.target.value) || settings.autoSaveDelay)}
                                />
                                <span className="settings-unit">ms</span>
                            </div>
                        )}
                    </section>
                    
                    {/* ===== Zoom ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.zoom.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.zoom.label')}</label>
                            <div className="settings-zoom-control">
                                <button className="settings-zoom-btn" onClick={zoomOut} disabled={settings.zoomLevel <= 0.5}>−</button>
                                <span className="settings-zoom-value" onClick={zoomReset} title={t('settings.zoom.resetHint')}>
                                    {zoomPercent}%
                                </span>
                                <button className="settings-zoom-btn" onClick={zoomIn} disabled={settings.zoomLevel >= 2.0}>+</button>
                            </div>
                        </div>
                    </section>

                    {/* ===== Editor ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.editor.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editor.fontSize')}</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={12}
                                max={32}
                                value={settings.fontSize}
                                onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || settings.fontSize)}
                            />
                            <span className="settings-unit">px</span>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editor.editorFont')}</label>
                            <input
                                type="text"
                                className="settings-input settings-input-wide"
                                placeholder="Open Sans, -apple-system, sans-serif"
                                value={editorFontInput}
                                onChange={(e) => setEditorFontInput(e.target.value)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editor.lineHeight')}</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={1.2}
                                max={2.0}
                                step={0.1}
                                value={settings.lineHeight}
                                onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value) || settings.lineHeight)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editor.editorWidth')}</label>
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="800px"
                                value={lineWidthInput}
                                onChange={(e) => setLineWidthInput(e.target.value)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editor.hideLinkPopup')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.hideLinkPopup}
                                onChange={(e) => handleChange('hideLinkPopup', e.target.checked)}
                            />
                        </div>
                    </section>

                    {/* ===== Editor Behavior ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.editorBehavior.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editorBehavior.autoPairBracket')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoPairBracket}
                                onChange={(e) => handleChange('autoPairBracket', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editorBehavior.autoPairMarkdownSyntax')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoPairMarkdownSyntax}
                                onChange={(e) => handleChange('autoPairMarkdownSyntax', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editorBehavior.autoPairQuote')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoPairQuote}
                                onChange={(e) => handleChange('autoPairQuote', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.editorBehavior.hideQuickInsertHint')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.hideQuickInsertHint}
                                onChange={(e) => handleChange('hideQuickInsertHint', e.target.checked)}
                            />
                        </div>
                    </section>

                    {/* ===== Markdown ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.markdown.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.markdown.tabSize')}</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={1}
                                max={8}
                                value={settings.tabSize}
                                onChange={(e) => handleChange('tabSize', parseInt(e.target.value) || settings.tabSize)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.markdown.bulletListMarker')}</label>
                            <select
                                className="settings-select"
                                value={settings.bulletListMarker}
                                onChange={(e) => handleChange('bulletListMarker', e.target.value as '-' | '*' | '+')}
                            >
                                <option value="-">{t('settings.markdown.hyphen')}</option>
                                <option value="*">{t('settings.markdown.asterisk')}</option>
                                <option value="+">{t('settings.markdown.plus')}</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.markdown.orderListDelimiter')}</label>
                            <select
                                className="settings-select"
                                value={settings.orderListDelimiter}
                                onChange={(e) => handleChange('orderListDelimiter', e.target.value as '.' | ')')}
                            >
                                <option value=".">{t('settings.markdown.dot')}</option>
                                <option value=")">{t('settings.markdown.rightParen')}</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.markdown.preferLooseListItem')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.preferLooseListItem}
                                onChange={(e) => handleChange('preferLooseListItem', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.markdown.listIndentation')}</label>
                            <select
                                className="settings-select"
                                value={String(settings.listIndentation)}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    handleChange('listIndentation', v === 'dfm' || v === 'tab' ? v : parseInt(v));
                                }}
                            >
                                <option value="1">{t('settings.markdown.spaces', { n: '1' })}</option>
                                <option value="2">{t('settings.markdown.spaces', { n: '2' })}</option>
                                <option value="3">{t('settings.markdown.spaces', { n: '3' })}</option>
                                <option value="4">{t('settings.markdown.spaces', { n: '4' })}</option>
                                <option value="tab">{t('settings.markdown.tab')}</option>
                                <option value="dfm">{t('settings.markdown.dfm')}</option>
                            </select>
                        </div>
                    </section>

                    {/* ===== Code Block ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.codeBlock.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.codeBlock.fontSize')}</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={10}
                                max={28}
                                value={settings.codeFontSize}
                                onChange={(e) => handleChange('codeFontSize', parseInt(e.target.value) || settings.codeFontSize)}
                            />
                            <span className="settings-unit">px</span>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.codeBlock.codeFont')}</label>
                            <input
                                type="text"
                                className="settings-input settings-input-wide"
                                placeholder="SF Mono, Consolas, monospace"
                                value={codeFontInput}
                                onChange={(e) => setCodeFontInput(e.target.value)}
                            />
                        </div>
                    </section>

                    {/* ===== File ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.file.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.file.defaultEncoding')}</label>
                            <select
                                className="settings-select"
                                value={settings.defaultEncoding}
                                onChange={(e) => handleChange('defaultEncoding', e.target.value)}
                            >
                                {ENCODING_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.file.autoGuessEncoding')}</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoGuessEncoding}
                                onChange={(e) => handleChange('autoGuessEncoding', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.file.lineEnding')}</label>
                            <select
                                className="settings-select"
                                value={settings.endOfLine}
                                onChange={(e) => handleChange('endOfLine', e.target.value)}
                            >
                                <option value="default">{t('settings.file.lineEndingDefault')}</option>
                                <option value="lf">LF (Unix/macOS)</option>
                                <option value="crlf">CRLF (Windows)</option>
                            </select>
                        </div>
                        <div className="settings-subsection">
                            <div className="settings-subsection-label">{t('settings.file.excludedDirs')}</div>
                            <div className="settings-tags">
                                {settings.excludedDirs.map(dir => (
                                    <span key={dir} className="settings-tag">
                                        {dir}
                                        <button
                                            className="settings-tag-remove"
                                            onClick={() => removeExcludedDir(dir)}
                                            title={t('settings.file.remove')}
                                        >×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="settings-row">
                                <input
                                    type="text"
                                    className="settings-input settings-input-wide"
                                    placeholder={t('settings.file.dirNamePlaceholder')}
                                    value={newExcludedDir}
                                    onChange={(e) => setNewExcludedDir(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addExcludedDir();
                                    }}
                                />
                                <button
                                    className="settings-btn settings-btn-secondary settings-btn-small"
                                    onClick={addExcludedDir}
                                    disabled={!newExcludedDir.trim()}
                                >{t('settings.file.add')}</button>
                            </div>
                        </div>
                    </section>

                    {/* ===== Image ===== */}
                    <section className="settings-section">
                        <h3>{t('settings.image.title')}</h3>
                        <div className="settings-row">
                            <label className="settings-label">{t('settings.image.insertAction')}</label>
                            <select
                                className="settings-select"
                                value={settings.imageInsertAction}
                                onChange={(e) => handleChange('imageInsertAction', e.target.value)}
                            >
                                <option value="path">{t('settings.image.pathOnly')}</option>
                                <option value="folder">{t('settings.image.copyToFolder')}</option>
                            </select>
                        </div>
                        {settings.imageInsertAction === 'folder' && (
                            <div className="settings-row">
                                <label className="settings-label">{t('settings.image.targetFolder')}</label>
                                <input
                                    type="text"
                                    className="settings-input settings-input-wide"
                                    placeholder="assets/images"
                                    value={settings.imageFolderPath}
                                    onChange={(e) => handleChange('imageFolderPath', e.target.value)}
                                />
                            </div>
                        )}
                    </section>

                </div>

                <div className="settings-footer">
                    <button className="settings-btn settings-btn-secondary" onClick={handleReset}>
                        {t('settings.resetDefaults')}
                    </button>
                </div>
            </div>
        </div>
    );
}
