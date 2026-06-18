import { getCurrentWindow } from '@tauri-apps/api/window';
import logo from '../../src-tauri/icons/128x128.png';
import type { FileInfo } from '../utils/file';
import type { SidebarPanel } from './Sidebar';
import { platform } from '@tauri-apps/plugin-os';

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
    onToggleMenu: (menu: string) => void;
    onMenuItemClick: (action: string) => void;
    onSetOpenSubmenu: (submenu: string | null) => void;
    onRecentFileSelect: (file: FileInfo) => void;
    onRecentFolderSelect: (folder: FileInfo) => void;
    onClearRecentlyOpened: () => void;
}

export default function MenuBar({
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
    onToggleMenu,
    onMenuItemClick,
    onSetOpenSubmenu,
    onRecentFileSelect,
    onRecentFolderSelect,
    onClearRecentlyOpened,
}: MenuBarProps) {
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
                            文件
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'file' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('newTab')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">新建标签页</span>
                                <span className="menu-item-shortcut">{COMMAND}+T</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('newWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">新建窗口</span>
                                <span className="menu-item-shortcut">{COMMAND}+N</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('openFile')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打开文件…</span>
                                <span className="menu-item-shortcut">{COMMAND}+O</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('openFolder')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打开文件夹…</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+O</span>
                            </div>
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenSubmenu('recent')}
                                onMouseLeave={() => onSetOpenSubmenu(null)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打开最近</span>
                                <span className="menu-item-arrow">›</span>
                                {openSubmenu === 'recent' && (
                                    <div className="menu-submenu">
                                        {(recentFolders.length === 0 && recentFiles.length === 0) ? (
                                            <div className="menu-submenu-item menu-submenu-empty">暂无最近使用</div>
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
                                                    <span className="menu-submenu-item-label">清除最近使用</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('save')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">保存</span>
                                <span className="menu-item-shortcut">{COMMAND}+S</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('saveAs')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">另存为…</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+S</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('autoSave')}>
                                <span className="menu-item-status">{autoSave ? '✓' : ''}</span>
                                <span className="menu-item-label">自动保存</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('moveTo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">移动到</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('rename')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重命名</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenSubmenu('export')}
                                onMouseLeave={() => onSetOpenSubmenu(null)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">导出</span>
                                <span className="menu-item-arrow">›</span>
                                {openSubmenu === 'export' && (
                                    <div className="menu-submenu" onClick={(e) => e.stopPropagation()}>
                                        <div className="menu-submenu-item" onClick={() => onMenuItemClick('exportHtml')}>
                                            <span className="menu-submenu-item-icon"></span>
                                            <span className="menu-submenu-item-label">导出为 HTML</span>
                                        </div>
                                        <div className="menu-submenu-item" onClick={() => onMenuItemClick('exportPdf')}>
                                            <span className="menu-submenu-item-icon"></span>
                                            <span className="menu-submenu-item-label">导出为 PDF</span>
                                            <span className="menu-submenu-item-shortcut">{COMMAND}+{ALT}+E</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('print')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打印</span>
                                <span className="menu-item-shortcut">{COMMAND}+P</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('settings')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">设置</span>
                                <span className="menu-item-shortcut">{COMMAND}+,</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('closeTab')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">关闭标签页</span>
                                <span className="menu-item-shortcut">{COMMAND}+W</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('closeWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">关闭窗口</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+W</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('quit')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">退出</span>
                                <span className="menu-item-shortcut">{COMMAND}+Q</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'edit' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('edit')}
                        >
                            编辑
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'edit' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('undo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">撤销</span>
                                <span className="menu-item-shortcut">{COMMAND}+Z</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('redo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重做</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+Z</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('cut')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">剪切</span>
                                <span className="menu-item-shortcut">{COMMAND}+X</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('copy')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">复制</span>
                                <span className="menu-item-shortcut">{COMMAND}+C</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('paste')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">粘贴</span>
                                <span className="menu-item-shortcut">{COMMAND}+V</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('copyAsRich')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">复制为富文本</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+C</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('copyAsHtml')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">复制为 HTML</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('pasteAsPlainText')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">粘贴为纯文本</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+V</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('selectAll')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">全选</span>
                                <span className="menu-item-shortcut">{COMMAND}+A</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('duplicate')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">创建副本</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+D</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('createParagraph')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">创建段落</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+N</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('deleteParagraph')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">删除段落</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+D</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('find')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">查找</span>
                                <span className="menu-item-shortcut">{COMMAND}+F</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('findNext')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">查找下一个</span>
                                <span className="menu-item-shortcut">F3</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('findPrevious')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">查找上一个</span>
                                <span className="menu-item-shortcut">Shift+F3</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('replace')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">替换</span>
                                <span className="menu-item-shortcut">{COMMAND}+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('findInFolder')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">在文件夹中查找</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+F</span>
                            </div>
                            <div className="menu-divider" />
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenSubmenu('lineEnding')}
                                onMouseLeave={() => onSetOpenSubmenu(null)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">行结束符</span>
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
                            段落
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'paragraph' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading1')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">标题 1</span>
                                <span className="menu-item-shortcut">{COMMAND}+1</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading2')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">标题 2</span>
                                <span className="menu-item-shortcut">{COMMAND}+2</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading3')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">标题 3</span>
                                <span className="menu-item-shortcut">{COMMAND}+3</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading4')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">标题 4</span>
                                <span className="menu-item-shortcut">{COMMAND}+4</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading5')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">标题 5</span>
                                <span className="menu-item-shortcut">{COMMAND}+5</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('heading6')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">标题 6</span>
                                <span className="menu-item-shortcut">{COMMAND}+6</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('promoteHeading')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">提升标题级别</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('demoteHeading')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">降低标题级别</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+-</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('table')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">表格</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+T</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('codeFences')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">代码围栏</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+K</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('quoteBlock')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">引用块</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+Q</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('mathBlock')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">数学块</span>
                                <span className="menu-item-shortcut">{COMMAND}+M</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('htmlBlock')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">HTML 块</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('orderedList')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">有序列表</span>
                                <span className="menu-item-shortcut">{COMMAND}+G</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('bulletList')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">无序列表</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+L</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('taskList')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">任务列表</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+X</span>
                            </div>
                            <div className="menu-divider" />
                            <div className={`menu-item ${!isInList ? 'disabled' : ''}`} onClick={() => isInList && onMenuItemClick('looseListItem')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">宽松列表项</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+L</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('paragraph')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">段落</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+0</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('horizontalRule')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">水平分割线</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+U</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('frontMatter')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">前置元数据</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+Y</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'format' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('format')}
                        >
                            格式
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'format' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleBold')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">粗体</span>
                                <span className="menu-item-shortcut">{COMMAND}+B</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleItalic')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">斜体</span>
                                <span className="menu-item-shortcut">{COMMAND}+I</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleUnderline')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">下划线</span>
                                <span className="menu-item-shortcut">{COMMAND}+U</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('superscript')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">上标</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('subscript')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">下标</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+-</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('highlight')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">高亮</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('inlineCode')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">行内代码</span>
                                <span className="menu-item-shortcut">{COMMAND}+`</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('inlineMath')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">行内数学</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+M</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('strikethrough')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">删除线</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+D</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('insertLink')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">超链接</span>
                                <span className="menu-item-shortcut">{COMMAND}+L</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('insertImage')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">图片</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+I</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('clearFormatting')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">清除格式</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+R</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'window' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('window')}
                        >
                            窗口
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'window' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('minimizeWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">最小化</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+M</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleAlwaysOnTop')}>
                                <span className="menu-item-status">{alwaysOnTop ? '✓' : ''}</span>
                                <span className="menu-item-label">总是在最前</span>
                                <span className="menu-item-shortcut">{COMMAND}+{ALT}+T</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomIn')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">放大文字</span>
                                <span className="menu-item-shortcut">{COMMAND}++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomOut')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">缩小文字</span>
                                <span className="menu-item-shortcut">{COMMAND}+-</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomReset')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重置文字</span>
                                <span className="menu-item-shortcut">{COMMAND}+0</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleFullscreen')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">全屏</span>
                                <span className="menu-item-shortcut">F11</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'view' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('view')}
                        >
                            视图
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'view' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('outline')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">命令面板- 未完成</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+P</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('sourceMode')}>
                                <span className="menu-item-status">{sourceMode ? '✓' : ''}</span>
                                <span className="menu-item-label">源代码模式</span>
                                <span className="menu-item-shortcut">{COMMAND}+E</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('typewriterMode')}>
                                <span className="menu-item-status">{focusMode ? '✓' : ''}</span>
                                <span className="menu-item-label">打字机模式</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+G</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('focusMode')}>
                                <span className="menu-item-status">{typewriterMode ? '✓' : ''}</span>
                                <span className="menu-item-label">专注模式</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+J</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('sidebar')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{activeSidebarPanel ? '关闭' : '打开'}侧边栏</span>
                                <span className="menu-item-shortcut">{COMMAND}+J</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('outline')}>
                                <span className="menu-item-status">{activeSidebarPanel === 'outline' ? '✓' : ''}</span>
                                <span className="menu-item-label">显示大纲</span>
                                <span className="menu-item-shortcut">{COMMAND}+K</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reloadImages')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重新加载图片</span>
                                <span className="menu-item-shortcut">F5</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('openDevTools')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">开发者工具</span>
                                <span className="menu-item-shortcut">{COMMAND}+{SHIFT}+I</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reloadWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重新加载窗口</span>
                                <span className="menu-item-shortcut">{COMMAND}+F5</span>
                            </div>
                        </div>
                    </div>

                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`menu-trigger ${activeMenu === 'help' ? 'active' : ''}`}
                            onClick={() => onToggleMenu('help')}
                        >
                            帮助
                        </div>
                        <div className={`menu-dropdown-content ${activeMenu === 'help' ? 'is-open' : ''}`}>
                            <div className="menu-item" onClick={() => onMenuItemClick('releaseNotes')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">更新日志</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('support')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">支持 Rustype</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('viewSource')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">查看源码</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reportIssue')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">报告错误</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('license')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">许可证</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('checkUpdate')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{checkingUpdate ? '检查中...' : '检查更新'}</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('shortcuts')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">键盘快捷键</span>
                                <span className="menu-item-shortcut"></span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('about')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">关于 Rustype</span>
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