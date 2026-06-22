import { useState, useEffect, useRef } from 'react';
import { platform } from '@tauri-apps/plugin-os';
import { useI18n } from '../utils/i18n';

interface ShortcutsPanelProps {
    onClose: () => void;
}

interface ShortcutItem {
    category: string;
    shortcuts: Array<{
        description: string;
        keys: string[];
    }>;
}

// const isMac = /Mac/.test(navigator.platform);
const isMac = platform() === 'macos';

const COMMAND = isMac ? '⌘' : 'Ctrl'
const SHIFT = isMac ? '⇧' : 'Shift'
const ALT = isMac ? '⌥' : 'Alt'

function getShortcutsData(t: (key: string) => string): ShortcutItem[] {
    return [
        {
            category: t('shortcutCategories.file'),
            shortcuts: [
                { description: t('shortcuts.newTab'), keys: [COMMAND, 'T'] },
                { description: t('shortcuts.newWindow'), keys: [COMMAND, 'N'] },
                { description: t('shortcuts.openFile'), keys: [COMMAND, 'O'] },
                { description: t('shortcuts.openFolder'), keys: [COMMAND, SHIFT, 'O'] },
                { description: t('shortcuts.save'), keys: [COMMAND, 'S'] },
                { description: t('shortcuts.saveAs'), keys: [COMMAND, SHIFT, 'S'] },
                { description: t('shortcuts.autoSave'), keys: [] },
                { description: t('shortcuts.moveTo'), keys: [] },
                { description: t('shortcuts.rename'), keys: [] },
                { description: t('shortcuts.exportHtml'), keys: [] },
                { description: t('shortcuts.exportPdf'), keys: [COMMAND, ALT, 'E'] },
                { description: t('shortcuts.print'), keys: [COMMAND, 'P'] },
                { description: t('shortcuts.settings'), keys: [COMMAND, ','] },
                { description: t('shortcuts.closeTab'), keys: [COMMAND, 'W'] },
                { description: t('shortcuts.closeWindow'), keys: [COMMAND, SHIFT, 'W'] },
                { description: t('shortcuts.quit'), keys: [COMMAND, 'Q'] },
            ],
        },
        {
            category: t('shortcutCategories.edit'),
            shortcuts: [
                { description: t('shortcuts.undo'), keys: [COMMAND, 'Z'] },
                { description: t('shortcuts.redo'), keys: [COMMAND, SHIFT, 'Z'] },
                { description: t('shortcuts.cut'), keys: [COMMAND, 'X'] },
                { description: t('shortcuts.copy'), keys: [COMMAND, 'C'] },
                { description: t('shortcuts.paste'), keys: [COMMAND, 'V'] },
                { description: t('shortcuts.copyAsRich'), keys: [COMMAND, SHIFT, 'C'] },
                { description: t('shortcuts.copyAsHtml'), keys: [] },
                { description: t('shortcuts.pasteAsPlainText'), keys: [COMMAND, SHIFT, 'V'] },
                { description: t('shortcuts.selectAll'), keys: [COMMAND, 'A'] },
                { description: t('shortcuts.duplicate'), keys: [COMMAND, ALT, 'D'] },
                { description: t('shortcuts.createParagraph'), keys: [COMMAND, SHIFT, 'N'] },
                { description: t('shortcuts.deleteParagraph'), keys: [COMMAND, SHIFT, 'D'] },
                { description: t('shortcuts.find'), keys: [COMMAND, 'F'] },
                { description: t('shortcuts.findNext'), keys: ['F3'] },
                { description: t('shortcuts.findPrevious'), keys: [SHIFT, 'F3'] },
                { description: t('shortcuts.replace'), keys: [COMMAND, 'H'] },
                { description: t('shortcuts.findInFolder'), keys: [COMMAND, SHIFT, 'F'] },
            ],
        },
        {
            category: t('shortcutCategories.paragraph'),
            shortcuts: [
                { description: t('shortcuts.heading1'), keys: [COMMAND, '1'] },
                { description: t('shortcuts.heading2'), keys: [COMMAND, '2'] },
                { description: t('shortcuts.heading3'), keys: [COMMAND, '3'] },
                { description: t('shortcuts.heading4'), keys: [COMMAND, '4'] },
                { description: t('shortcuts.heading5'), keys: [COMMAND, '5'] },
                { description: t('shortcuts.heading6'), keys: [COMMAND, '6'] },
                { description: t('shortcuts.promoteHeading'), keys: [COMMAND, ALT, '+'] },
                { description: t('shortcuts.demoteHeading'), keys: [COMMAND, ALT, '-'] },
                { description: t('shortcuts.table'), keys: [COMMAND, SHIFT, 'T'] },
                { description: t('shortcuts.codeFences'), keys: [COMMAND, SHIFT, 'K'] },
                { description: t('shortcuts.quoteBlock'), keys: [COMMAND, SHIFT, 'Q'] },
                { description: t('shortcuts.mathBlock'), keys: [COMMAND, 'M'] },
                { description: t('shortcuts.htmlBlock'), keys: [COMMAND, ALT, 'H'] },
                { description: t('shortcuts.orderedList'), keys: [COMMAND, 'G'] },
                { description: t('shortcuts.bulletList'), keys: [COMMAND, SHIFT, 'L'] },
                { description: t('shortcuts.taskList'), keys: [COMMAND, ALT, 'X'] },
                { description: t('shortcuts.looseListItem'), keys: [COMMAND, ALT, 'L'] },
                { description: t('shortcuts.paragraph'), keys: [COMMAND, SHIFT, '0'] },
                { description: t('shortcuts.horizontalRule'), keys: [COMMAND, SHIFT, 'U'] },
                { description: t('shortcuts.frontMatter'), keys: [COMMAND, ALT, 'Y'] },
            ],
        },
        {
            category: t('shortcutCategories.format'),
            shortcuts: [
                { description: t('shortcuts.bold'), keys: [COMMAND, 'B'] },
                { description: t('shortcuts.italic'), keys: [COMMAND, 'I'] },
                { description: t('shortcuts.underline'), keys: [COMMAND, 'U'] },
                { description: t('shortcuts.superscript'), keys: [COMMAND, SHIFT, '+'] },
                { description: t('shortcuts.subscript'), keys: [COMMAND, SHIFT, '-'] },
                { description: t('shortcuts.highlight'), keys: [COMMAND, SHIFT, 'H'] },
                { description: t('shortcuts.inlineCode'), keys: [COMMAND, '`'] },
                { description: t('shortcuts.inlineMath'), keys: [COMMAND, SHIFT, 'M'] },
                { description: t('shortcuts.strikethrough'), keys: [COMMAND, SHIFT, 'X'] },
                { description: t('shortcuts.link'), keys: [COMMAND, 'L'] },
                { description: t('shortcuts.image'), keys: [COMMAND, ALT, 'I'] },
                { description: t('shortcuts.clearFormatting'), keys: [COMMAND, SHIFT, 'R'] },
            ],
        },
        {
            category: t('shortcutCategories.window'),
            shortcuts: [
                { description: t('shortcuts.minimize'), keys: [COMMAND, ALT, 'M'] },
                { description: t('shortcuts.alwaysOnTop'), keys: [COMMAND, ALT, 'T'] },
                { description: t('shortcuts.zoomIn'), keys: [COMMAND, '+'] },
                { description: t('shortcuts.zoomOut'), keys: [COMMAND, '-'] },
                { description: t('shortcuts.zoomReset'), keys: [COMMAND, '0'] },
                { description: t('shortcuts.fullscreen'), keys: ['F11'] },
            ],
        },
        {
            category: t('shortcutCategories.view'),
            shortcuts: [
                { description: t('shortcuts.commandPalette'), keys: [COMMAND, SHIFT, 'P'] },
                { description: t('shortcuts.sourceMode'), keys: [COMMAND, 'E'] },
                { description: t('shortcuts.typewriterMode'), keys: [COMMAND, SHIFT, 'G'] },
                { description: t('shortcuts.focusMode'), keys: [COMMAND, SHIFT, 'J'] },
                { description: t('shortcuts.openSidebar'), keys: [COMMAND, 'J'] },
                { description: t('shortcuts.outline'), keys: [COMMAND, 'K'] },
                { description: t('shortcuts.reloadImages'), keys: ['F5'] },
                { description: t('shortcuts.devTools'), keys: [COMMAND, SHIFT, 'I'] },
                { description: t('shortcuts.reloadWindow'), keys: [COMMAND, 'F5'] },
            ],
        },
        {
            category: t('shortcutCategories.help'),
            shortcuts: [
                { description: t('shortcuts.releaseNotes'), keys: [] },
                { description: t('shortcuts.support'), keys: [] },
                { description: t('shortcuts.viewSource'), keys: [] },
                { description: t('shortcuts.reportIssue'), keys: [] },
                { description: t('shortcuts.license'), keys: [] },
                { description: t('shortcuts.checkUpdate'), keys: [] },
                { description: t('shortcuts.keyboardShortcuts'), keys: [] },
                { description: t('shortcuts.about'), keys: [] },
            ],
        },
    ];
}

export default function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
    const { t } = useI18n();
    const [isMaximized, setIsMaximized] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const shortcutsData = getShortcutsData(t);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleDoubleClick = () => {
        setIsMaximized(!isMaximized);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={containerRef}
                className={`shortcuts-panel ${isMaximized ? 'maximized' : ''}`}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={handleDoubleClick}
            >
                <div className="shortcuts-header">
                    <h2>{t('dialogs.shortcuts.title')}</h2>
                    <button className="shortcuts-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="shortcuts-content">
                    {shortcutsData.map((item, index) => (
                        <div key={index} className="shortcuts-category">
                            <h3 className="category-title">{item.category}</h3>
                            <div className="shortcuts-list">
                                {item.shortcuts.map((shortcut, idx) => (
                                    <div key={idx} className="shortcut-item">
                                        <span className="shortcut-description">{shortcut.description}</span>
                                        <div className="shortcut-keys">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <span key={keyIdx} className="shortcut-key">
                                                    {key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="shortcuts-footer">
                    <span className="footer-hint">{t('dialogs.shortcuts.dblClickHint')}</span>
                </div>
            </div>
        </div>
    );
}
