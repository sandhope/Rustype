import { useState, useCallback, useEffect } from 'react';
import type { AppSettings } from '../utils/settings';
import { DEFAULT_SETTINGS, saveSettings } from '../utils/settings';
import { lightThemes, darkThemes } from '../utils/themes';
import * as webview from '../utils/webview';

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
        : (lightThemes.some(t => t.id === settings.theme) ? settings.theme : settings.lightModeTheme);
    const activeDarkTheme = settings.theme === 'system'
        ? settings.darkModeTheme
        : (darkThemes.some(t => t.id === settings.theme) ? settings.theme : settings.darkModeTheme);

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
                    <h2>设置</h2>
                    <button className="settings-close" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    {/* ===== Theme ===== */}
                    <section className="settings-section">
                        <h3>主题</h3>
                        <div className="settings-row">
                            <label className="settings-label">主题模式</label>
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
                                <option value="system">跟随系统</option>
                                <option value="custom">手动选择</option>
                            </select>
                        </div>
                        {settings.theme === 'system' && (
                            <>
                                <div className="settings-row">
                                    <label className="settings-label">亮色模式主题</label>
                                    <select
                                        className="settings-select"
                                        value={settings.lightModeTheme}
                                        onChange={(e) => handleChange('lightModeTheme', e.target.value)}
                                    >
                                        {lightThemes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="settings-row">
                                    <label className="settings-label">暗色模式主题</label>
                                    <select
                                        className="settings-select"
                                        value={settings.darkModeTheme}
                                        onChange={(e) => handleChange('darkModeTheme', e.target.value)}
                                    >
                                        {darkThemes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="settings-theme-group">
                            <div className="settings-theme-group-label">浅色主题</div>
                            <div className="settings-theme-grid">
                                {lightThemes.map(t => (
                                    <button
                                        key={t.id}
                                        className={`settings-theme-card ${activeLightTheme === t.id ? 'active' : ''}`}
                                        onClick={() => handleThemeClick(t.id, 'light')}
                                        title={t.name}
                                    >
                                        <span className="settings-theme-swatch light" />
                                        <span className="settings-theme-name">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="settings-theme-group">
                            <div className="settings-theme-group-label">深色主题</div>
                            <div className="settings-theme-grid">
                                {darkThemes.map(t => (
                                    <button
                                        key={t.id}
                                        className={`settings-theme-card ${activeDarkTheme === t.id ? 'active' : ''}`}
                                        onClick={() => handleThemeClick(t.id, 'dark')}
                                        title={t.name}
                                    >
                                        <span className="settings-theme-swatch dark" />
                                        <span className="settings-theme-name">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== Zoom ===== */}
                    <section className="settings-section">
                        <h3>缩放</h3>
                        <div className="settings-row">
                            <label className="settings-label">界面缩放</label>
                            <div className="settings-zoom-control">
                                <button className="settings-zoom-btn" onClick={zoomOut} disabled={settings.zoomLevel <= 0.5}>−</button>
                                <span className="settings-zoom-value" onClick={zoomReset} title="点击重置为 100%">
                                    {zoomPercent}%
                                </span>
                                <button className="settings-zoom-btn" onClick={zoomIn} disabled={settings.zoomLevel >= 2.0}>+</button>
                            </div>
                        </div>
                    </section>

                    {/* ===== Editor ===== */}
                    <section className="settings-section">
                        <h3>编辑器</h3>
                        <div className="settings-row">
                            <label className="settings-label">字体大小</label>
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
                            <label className="settings-label">编辑器字体</label>
                            <input
                                type="text"
                                className="settings-input settings-input-wide"
                                placeholder="Open Sans, -apple-system, sans-serif"
                                value={editorFontInput}
                                onChange={(e) => setEditorFontInput(e.target.value)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">行高</label>
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
                            <label className="settings-label">编辑器宽度</label>
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="800px"
                                value={lineWidthInput}
                                onChange={(e) => setLineWidthInput(e.target.value)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">隐藏链接提示</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.hideLinkPopup}
                                onChange={(e) => handleChange('hideLinkPopup', e.target.checked)}
                            />
                        </div>
                    </section>

                    {/* ===== Code Block ===== */}
                    <section className="settings-section">
                        <h3>代码块</h3>
                        <div className="settings-row">
                            <label className="settings-label">字体大小</label>
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
                            <label className="settings-label">代码字体</label>
                            <input
                                type="text"
                                className="settings-input settings-input-wide"
                                placeholder="SF Mono, Consolas, monospace"
                                value={codeFontInput}
                                onChange={(e) => setCodeFontInput(e.target.value)}
                            />
                        </div>
                    </section>

                    {/* ===== Editor Behavior ===== */}
                    <section className="settings-section">
                        <h3>编辑行为</h3>
                        <div className="settings-row">
                            <label className="settings-label">自动补全括号</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoPairBracket}
                                onChange={(e) => handleChange('autoPairBracket', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">自动补全 Markdown 语法</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoPairMarkdownSyntax}
                                onChange={(e) => handleChange('autoPairMarkdownSyntax', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">自动补全引号</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoPairQuote}
                                onChange={(e) => handleChange('autoPairQuote', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">隐藏快速插入提示</label>
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
                        <h3>Markdown</h3>
                        <div className="settings-row">
                            <label className="settings-label">Tab 大小</label>
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
                            <label className="settings-label">无序列表标记</label>
                            <select
                                className="settings-select"
                                value={settings.bulletListMarker}
                                onChange={(e) => handleChange('bulletListMarker', e.target.value as '-' | '*' | '+')}
                            >
                                <option value="-">- (连字符)</option>
                                <option value="*">* (星号)</option>
                                <option value="+">+ (加号)</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">有序列表分隔符</label>
                            <select
                                className="settings-select"
                                value={settings.orderListDelimiter}
                                onChange={(e) => handleChange('orderListDelimiter', e.target.value as '.' | ')')}
                            >
                                <option value=".">. (点)</option>
                                <option value=")">) (右括号)</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">宽松列表项</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.preferLooseListItem}
                                onChange={(e) => handleChange('preferLooseListItem', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">列表缩进</label>
                            <select
                                className="settings-select"
                                value={String(settings.listIndentation)}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    handleChange('listIndentation', v === 'dfm' || v === 'tab' ? v : parseInt(v));
                                }}
                            >
                                <option value="1">1 空格</option>
                                <option value="2">2 空格</option>
                                <option value="3">3 空格</option>
                                <option value="4">4 空格</option>
                                <option value="tab">Tab</option>
                                <option value="dfm">DFM (4 空格)</option>
                            </select>
                        </div>
                    </section>

                    {/* ===== Auto Save ===== */}
                    <section className="settings-section">
                        <h3>自动保存</h3>
                        <div className="settings-row">
                            <label className="settings-label">启用自动保存</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoSave}
                                onChange={(e) => handleChange('autoSave', e.target.checked)}
                            />
                        </div>
                        {settings.autoSave && (
                            <div className="settings-row">
                                <label className="settings-label">保存延迟</label>
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

                    {/* ===== File ===== */}
                    <section className="settings-section">
                        <h3>文件</h3>
                        <div className="settings-row">
                            <label className="settings-label">默认编码</label>
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
                            <label className="settings-label">自动猜测编码</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={settings.autoGuessEncoding}
                                onChange={(e) => handleChange('autoGuessEncoding', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">行尾符</label>
                            <select
                                className="settings-select"
                                value={settings.endOfLine}
                                onChange={(e) => handleChange('endOfLine', e.target.value)}
                            >
                                <option value="default">默认</option>
                                <option value="lf">LF (Unix/macOS)</option>
                                <option value="crlf">CRLF (Windows)</option>
                            </select>
                        </div>
                        <div className="settings-subsection">
                            <div className="settings-subsection-label">忽略目录</div>
                            <div className="settings-tags">
                                {settings.excludedDirs.map(dir => (
                                    <span key={dir} className="settings-tag">
                                        {dir}
                                        <button
                                            className="settings-tag-remove"
                                            onClick={() => removeExcludedDir(dir)}
                                            title="移除"
                                        >×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="settings-row">
                                <input
                                    type="text"
                                    className="settings-input settings-input-wide"
                                    placeholder="输入目录名称"
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
                                >添加</button>
                            </div>
                        </div>
                    </section>

                    {/* ===== Image ===== */}
                    <section className="settings-section">
                        <h3>图片</h3>
                        <div className="settings-row">
                            <label className="settings-label">插入图片时</label>
                            <select
                                className="settings-select"
                                value={settings.imageInsertAction}
                                onChange={(e) => handleChange('imageInsertAction', e.target.value)}
                            >
                                <option value="path">仅插入路径</option>
                                <option value="folder">复制到指定文件夹</option>
                            </select>
                        </div>
                        {settings.imageInsertAction === 'folder' && (
                            <div className="settings-row">
                                <label className="settings-label">目标文件夹</label>
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

                    {/* ===== Startup ===== */}
                    <section className="settings-section">
                        <h3>启动</h3>
                        <div className="settings-row">
                            <label className="settings-label">启动时</label>
                            <select
                                className="settings-select"
                                value={settings.startUpAction}
                                onChange={(e) => handleChange('startUpAction', e.target.value)}
                            >
                                <option value="restore">恢复上次编辑状态</option>
                                <option value="blank">打开空白页</option>
                            </select>
                        </div>
                    </section>

                    {/* ===== Language ===== */}
                    <section className="settings-section">
                        <h3>语言</h3>
                        <div className="settings-row">
                            <label className="settings-label">界面语言</label>
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
                </div>

                <div className="settings-footer">
                    <button className="settings-btn settings-btn-secondary" onClick={handleReset}>
                        重置默认
                    </button>
                </div>
            </div>
        </div>
    );
}
