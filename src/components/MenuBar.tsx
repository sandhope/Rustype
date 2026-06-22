import { memo } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import logo from '../../src-tauri/icons/128x128.png';
import type { FileInfo } from '../utils/file';
import type { SidebarPanel } from './Sidebar';
import { lightThemes, darkThemes } from '../utils/themes';
import { platform } from '@tauri-apps/plugin-os';
import { useI18n } from '../utils/i18n';

const isMac = platform() === 'macos';

const COMMAND = isMac ? '⌘' : 'Ctrl'
const SHIFT = isMac ? '⇧' : 'Shift'
const ALT = isMac ? '⌥' : 'Alt'

interface MenuBarProps {
    activeMenu: string | null;
    openSubmenu: string | null;
    sourceMode: boolean;
    focusMode: boolean;
    typewriterMode: boolean;
    activeSidebarPanel: SidebarPanel | null;
    checkingUpdate: boolean;
    alwaysOnTop: boolean;
    recentFiles: FileInfo[];
    recentFolders: FileInfo[];
    isInList: boolean;
    currentLineEnding: 'crlf' | 'lf';
    autoSave: boolean;
    theme: string;
    onToggleMenu: (menu: string) => void;
    onMenuItemClick: (action: string) => void;
    onSetOpenSubmenu: (submenu: string | null) => void;
    onRecentFileSelect: (file: FileInfo) => void;
    onRecentFolderSelect: (folder: FileInfo) => void;
    onClearRecentlyOpened: () => void;
}

function MenuBar({
    activeMenu,
    openSubmenu,
    sourceMode,
    focusMode,
    typewriterMode,
    activeSidebarPanel,
    checkingUpdate,
    alwaysOnTop,
    recentFiles,
    recentFolders,
    isInList,
    currentLineEnding,
    autoSave,
    theme,
    onToggleMenu,
    onMenuItemClick,
    onSetOpenSubmenu,
    onRecentFileSelect,
    onRecentFolderSelect,
    onClearRecentlyOpened,
}: MenuBarProps) {
    const { t } = useI18n();
    return (
        <header className="app-header">
            <div className="title-bar">
                <div className="app-title">
                    <img src={logo} alt="Rustype" width="20" height="20" />
                    <span className="app-name">Rustype</span>
                </div>
                <div className="menu-bar">
                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'file' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('file')}
                        >
                            {t('menu.file.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'file' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('newTab')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.newTab')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+T</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('newWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.newWindow')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+N</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('openFile')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.openFile')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+O</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('openFolder')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.openFolder')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+O</span>
                            </div>
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenSubmenu('recent')}
                                onMouseLeave={() => onSetOpenSubmenu(null)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.openRecent')}</span>
                                <span className="menu-item-arrow">›</span>
                                {openSubmenu === 'recent' && (
                                    <div className="menu-submenu">
                                        {(recentFolders.length === 0 && recentFiles.length === 0) ? (
                                            <div className="menu-submenu-item menu-submenu-empty">{t('menu.file.noRecent')}</div>
                                        ) : (
                                            <>
                                                {recentFolders.length > 0 && (
                                                    <>
                                                        {recentFolders.map((folder, index) => (
                                                            <div
                                                                key={`folder-${folder.path}-${index}`}
                                                                className="menu-submenu-item"
                                                                title={folder.path}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRecentFolderSelect(folder);
                                                                }}
                                                            >
                                                                <span className="menu-submenu-item-icon">📂</span>
                                                                <span className="menu-submenu-item-label">{folder.path}</span>
                                                            </div>
                                                        ))}
                                                        <div className="menu-submenu-divider" />
                                                    </>
                                                )}
                                                {recentFiles.length > 0 && (
                                                    <>
                                                        {recentFiles.map((file, index) => (
                                                            <div
                                                                key={`file-${file.path}-${index}`}
                                                                className="menu-submenu-item"
                                                                title={file.path}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRecentFileSelect(file);
                                                                }}
                                                            >
                                                                <span className="menu-submenu-item-icon">📝</span>
                                                                <span className="menu-submenu-item-label">{file.path}</span>
                                                            </div>
                                                        ))}
                                                        <div className="menu-submenu-divider" />
                                                    </>
                                                )}
                                                <div
                                                    className="menu-submenu-item menu-submenu-item-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onClearRecentlyOpened();
                                                    }}
                                                >
                                                    <span className="menu-submenu-item-label">{t('menu.file.clearRecent')}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('save')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.save')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+S</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('saveAs')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.saveAs')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+S</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('autoSave')}>
                                <span className="menu-item-status">{autoSave ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.file.autoSave')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('moveTo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.moveTo')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('rename')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.rename')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenSubmenu('export')}
                                onMouseLeave={() => onSetOpenSubmenu(null)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.export')}</span>
                                <span className="menu-item-arrow">›</span>
                                {openSubmenu === 'export' && (
                                    <div className="menu-submenu" onClick={(e) => e.stopPropagation()}>
                                        <div className="menu-submenu-item" onClick={() => onMenuItemClick('exportHtml')}>
                                            <span className="menu-submenu-item-icon"></span>
                                            <span className="menu-submenu-item-label">{t('menu.file.exportHtml')}</span>
                                        </div>
                                        <div className="menu-submenu-item" onClick={() => onMenuItemClick('exportPdf')}>
                                            <span className="menu-submenu-item-icon"></span>
                                            <span className="menu-submenu-item-label">{t('menu.file.exportPdf')}</span>
                                            <span className="menu-submenu-item-shortcut">{COMMAND}+{ALT}+E</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('print')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.print')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+P</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('settings')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.settings')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+,</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('closeTab')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.closeTab')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+W</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('closeWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.closeWindow')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+W</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('quit')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.file.quit')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+Q</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'edit' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('edit')}
                        >
                            {t('menu.edit.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'edit' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('undo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.undo')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+Z</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('redo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.redo')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+Z</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('cut')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.cut')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+X</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('copy')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.copy')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+C</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('paste')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.paste')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+V</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('copyAsRich')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.copyAsRich')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+C</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('copyAsHtml')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.copyAsHtml')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('pasteAsPlainText')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.pasteAsPlainText')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+V</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('selectAll')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.selectAll')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+A</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('duplicate')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.duplicate')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+D</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('createParagraph')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.createParagraph')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+N</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('deleteParagraph')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.deleteParagraph')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+D</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('find')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.find')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+F</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('findNext')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.findNext')}</span>
                                <span className="menu-item-shortcut">F3</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('findPrevious')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.findPrevious')}</span>
                                <span className="menu-item-shortcut">Shift+F3</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('replace')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.replace')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('findInFolder')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.findInFolder')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+F</span>
                            </div>
                            <div className="menu-divider" />
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenSubmenu('lineEnding')}
                                onMouseLeave={() => onSetOpenSubmenu(null)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.edit.lineEnding')}</span>
                                <span className="menu-item-arrow">›</span>
                                {openSubmenu === 'lineEnding' && (
                                    <div className="menu-submenu" onClick={(e) => e.stopPropagation()}>
                                        <div className="menu-submenu-item" onClick={() => onMenuItemClick('setLineEndingCrlf')}>
                                            <span className="menu-submenu-item-status">{currentLineEnding === 'crlf' ? '●' : '○'}</span>
                                            <span className="menu-submenu-item-label">CRLF (Windows)</span>
                                        </div>
                                        <div className="menu-submenu-item" onClick={() => onMenuItemClick('setLineEndingLf')}>
                                            <span className="menu-submenu-item-status">{currentLineEnding === 'lf' ? '●' : '○'}</span>
                                            <span className="menu-submenu-item-label">LF (Unix/macOS)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'paragraph' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('paragraph')}
                        >
                            {t('menu.paragraph.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'paragraph' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading1')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.heading1')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+1</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading2')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.heading2')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+2</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading3')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.heading3')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+3</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading4')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.heading4')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+4</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading5')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.heading5')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+5</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading6')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.heading6')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+6</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('promoteHeading')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.promoteHeading')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('demoteHeading')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.demoteHeading')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+-</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('table')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.table')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+T</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('codeFences')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.codeFences')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+K</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('quoteBlock')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.quoteBlock')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+Q</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('mathBlock')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.mathBlock')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+M</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('htmlBlock')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.htmlBlock')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('orderedList')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.orderedList')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+G</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('bulletList')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.bulletList')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+L</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('taskList')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.taskList')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+X</span>
                            </div>
                            <div className="menu-divider" />
                            <div className={`menu-item ${!isInList ? 'disabled' : ''}`} onClick={() => isInList && onMenuItemClick('looseListItem')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.looseListItem')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+L</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('paragraph')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.paragraph')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+0</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('horizontalRule')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.horizontalRule')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+U</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('frontMatter')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.paragraph.frontMatter')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+Y</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'format' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('format')}
                        >
                            {t('menu.format.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'format' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleBold')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.bold')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+B</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleItalic')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.italic')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+I</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleUnderline')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.underline')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+U</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('superscript')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.superscript')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('subscript')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.subscript')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+-</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('highlight')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.highlight')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('inlineCode')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.inlineCode')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+`</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('inlineMath')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.inlineMath')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+M</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('strikethrough')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.strikethrough')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+D</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('insertLink')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.link')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+L</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('insertImage')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.image')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+I</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('clearFormatting')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.format.clearFormatting')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+R</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'window' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('window')}
                        >
                            {t('menu.window.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'window' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('minimizeWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.window.minimize')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+M</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleAlwaysOnTop')}>
                                <span className="menu-item-status">{alwaysOnTop ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.window.alwaysOnTop')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+T</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomIn')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.window.zoomIn')}</span>
                                <span className="menu-item-shortcut">{COMMAND}++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomOut')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.window.zoomOut')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+-</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomReset')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.window.zoomReset')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+0</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleFullscreen')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.window.fullscreen')}</span>
                                <span className="menu-item-shortcut">F11</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'theme' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('theme')}
                        >
                            {t('menu.theme.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'theme' ? 'is-open scrollable' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('setTheme:system')}>
                                <span className="menu-item-status">{theme === 'system' ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.theme.followSystem')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item disabled">
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label" style={{ opacity: 0.5, fontSize: '11px' }}>{t('menu.theme.lightThemes')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            {lightThemes.map(th => (
                                <div key={th.id} className="menu-item" onClick={() => onMenuItemClick(`setTheme:${th.id}`)}>
                                    <span className="menu-item-status">{theme === th.id ? '✓' : ''}</span>
                                    <span className="menu-item-label">{th.name}</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                            ))}
                            <div className="menu-divider" />
                            <div className="menu-item disabled">
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label" style={{ opacity: 0.5, fontSize: '11px' }}>{t('menu.theme.darkThemes')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            {darkThemes.map(th => (
                                <div key={th.id} className="menu-item" onClick={() => onMenuItemClick(`setTheme:${th.id}`)}>
                                    <span className="menu-item-status">{theme === th.id ? '✓' : ''}</span>
                                    <span className="menu-item-label">{th.name}</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'view' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('view')}
                        >
                            {t('menu.view.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'view' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('commandPalette')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.view.commandPalette')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+P</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('sourceMode')}>
                                <span className="menu-item-status">{sourceMode ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.view.sourceMode')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+E</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('typewriterMode')}>
                                <span className="menu-item-status">{typewriterMode ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.view.typewriterMode')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+G</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('focusMode')}>
                                <span className="menu-item-status">{focusMode ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.view.focusMode')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+J</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('sidebar')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.view.sidebar', { action: activeSidebarPanel ? t('menu.view.closeSidebar') : t('menu.view.openSidebar') })}</span>
                                <span className="menu-item-shortcut">{COMMAND}+J</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('outline')}>
                                <span className="menu-item-status">{activeSidebarPanel === 'outline' ? '✓' : ''}</span>
                                <span className="menu-item-label">{t('menu.view.outline')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+K</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reloadImages')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.view.reloadImages')}</span>
                                <span className="menu-item-shortcut">F5</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('openDevTools')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.view.devTools')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+I</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reloadWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.view.reloadWindow')}</span>
                                <span className="menu-item-shortcut">{COMMAND}+F5</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'help' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('help')}
                        >
                            {t('menu.help.title')}
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'help' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('releaseNotes')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.releaseNotes')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('support')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.support')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('viewSource')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.viewSource')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reportIssue')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.reportIssue')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('license')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.license')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('checkUpdate')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{checkingUpdate ? t('menu.help.checking') : t('menu.help.checkUpdate')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('shortcuts')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.shortcuts')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('about')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{t('menu.help.about')}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="window-controls">
                    <button className="window-control-btn" onClick={() => getCurrentWindow().minimize()}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="6" y1="12" x2="18" y2="12" />
                        </svg>
                    </button>
                    <button className="window-control-btn" onClick={() => getCurrentWindow().toggleMaximize()}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="6" y="6" width="12" height="12" rx="1" />
                        </svg>
                    </button>
                    <button className="window-control-btn window-control-close" onClick={() => getCurrentWindow().close()}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="6" y1="6" x2="18" y2="18" />
                            <line x1="18" y1="6" x2="6" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default memo(MenuBar, (prev, next) => {
    return prev.activeMenu === next.activeMenu
        && prev.openSubmenu === next.openSubmenu
        && prev.sourceMode === next.sourceMode
        && prev.focusMode === next.focusMode
        && prev.recentFiles === next.recentFiles
        && prev.recentFolders === next.recentFolders;
});