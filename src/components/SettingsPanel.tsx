import { useState, useCallback } from 'react';
import type { AppSettings } from '../utils/settings';

interface SettingsPanelProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
    onClose: () => void;
}

export default function SettingsPanel({ settings, onUpdate, onClose }: SettingsPanelProps) {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

    const handleChange = useCallback((key: keyof AppSettings, value: unknown) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = useCallback(() => {
        onUpdate(localSettings);
        onClose();
    }, [localSettings, onUpdate, onClose]);

    const handleReset = useCallback(() => {
        import('../utils/settings').then(({ DEFAULT_SETTINGS }) => {
            setLocalSettings(DEFAULT_SETTINGS);
        });
    }, []);

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>设置</h2>
                    <button className="settings-close" onClick={onClose}>×</button>
                </div>
                
                <div className="settings-content">
                    {/* Theme Section */}
                    <section className="settings-section">
                        <h3>主题</h3>
                        <div className="settings-row">
                            <label className="settings-label">主题模式</label>
                            <select
                                className="settings-select"
                                value={localSettings.theme}
                                onChange={(e) => handleChange('theme', e.target.value)}
                            >
                                <option value="system">跟随系统</option>
                                <option value="light">浅色</option>
                                <option value="dark">深色</option>
                            </select>
                        </div>
                    </section>

                    {/* Editor Section */}
                    <section className="settings-section">
                        <h3>编辑器</h3>
                        <div className="settings-row">
                            <label className="settings-label">字体大小</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={12}
                                max={32}
                                value={localSettings.fontSize}
                                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                            />
                            <span className="settings-unit">px</span>
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">行高</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={1.2}
                                max={2.0}
                                step={0.1}
                                value={localSettings.lineHeight}
                                onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">编辑器宽度</label>
                            <input
                                type="text"
                                className="settings-input"
                                placeholder="800px"
                                value={localSettings.editorLineWidth}
                                onChange={(e) => handleChange('editorLineWidth', e.target.value)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">代码块字体大小</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={12}
                                max={28}
                                value={localSettings.codeFontSize}
                                onChange={(e) => handleChange('codeFontSize', parseInt(e.target.value))}
                            />
                            <span className="settings-unit">px</span>
                        </div>
                    </section>

                    {/* Auto Save Section */}
                    <section className="settings-section">
                        <h3>自动保存</h3>
                        <div className="settings-row">
                            <label className="settings-label">启用自动保存</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={localSettings.autoSave}
                                onChange={(e) => handleChange('autoSave', e.target.checked)}
                            />
                        </div>
                        {localSettings.autoSave && (
                            <div className="settings-row">
                                <label className="settings-label">保存延迟</label>
                                <input
                                    type="number"
                                    className="settings-input"
                                    min={1000}
                                    max={60000}
                                    step={1000}
                                    value={localSettings.autoSaveDelay}
                                    onChange={(e) => handleChange('autoSaveDelay', parseInt(e.target.value))}
                                />
                                <span className="settings-unit">ms</span>
                            </div>
                        )}
                    </section>

                    {/* Editor Behavior Section */}
                    <section className="settings-section">
                        <h3>编辑行为</h3>
                        <div className="settings-row">
                            <label className="settings-label">自动补全括号</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={localSettings.autoPairBracket}
                                onChange={(e) => handleChange('autoPairBracket', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">自动补全 Markdown 语法</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={localSettings.autoPairMarkdownSyntax}
                                onChange={(e) => handleChange('autoPairMarkdownSyntax', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">自动补全引号</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={localSettings.autoPairQuote}
                                onChange={(e) => handleChange('autoPairQuote', e.target.checked)}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">隐藏快速插入提示</label>
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={localSettings.hideQuickInsertHint}
                                onChange={(e) => handleChange('hideQuickInsertHint', e.target.checked)}
                            />
                        </div>
                    </section>

                    {/* Markdown Section */}
                    <section className="settings-section">
                        <h3>Markdown</h3>
                        <div className="settings-row">
                            <label className="settings-label">Tab 大小</label>
                            <input
                                type="number"
                                className="settings-input"
                                min={2}
                                max={8}
                                value={localSettings.tabSize}
                                onChange={(e) => handleChange('tabSize', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="settings-row">
                            <label className="settings-label">无序列表标记</label>
                            <select
                                className="settings-select"
                                value={localSettings.bulletListMarker}
                                onChange={(e) => handleChange('bulletListMarker', e.target.value)}
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
                                value={localSettings.orderListDelimiter}
                                onChange={(e) => handleChange('orderListDelimiter', e.target.value)}
                            >
                                <option value=".">. (点)</option>
                                <option value=")">) (右括号)</option>
                            </select>
                        </div>
                    </section>
                </div>

                <div className="settings-footer">
                    <button className="settings-btn settings-btn-secondary" onClick={handleReset}>
                        重置默认
                    </button>
                    <button className="settings-btn settings-btn-primary" onClick={handleSave}>
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}