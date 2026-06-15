import { getCurrentWindow } from '@tauri-apps/api/window';
import logo from '../../src-tauri/icons/128x128.png';
import type { FileInfo } from '../utils/file';
import type { SidebarPanel } from './Sidebar';

interface MenuBarProps {
    activeMenu: string | null;
    openRecentSubmenu: boolean;
    sourceMode: boolean;
    focusMode: boolean;
    typewriterMode: boolean;
    activeSidebarPanel: SidebarPanel | null;
    checkingUpdate: boolean;
    alwaysOnTop: boolean;
    recentFiles: FileInfo[];
    recentFolders: FileInfo[];
    onToggleMenu: (menu: string) => void;
    onMenuItemClick: (action: string) => void;
    onSetOpenRecentSubmenu: (open: boolean) => void;
    onRecentFileSelect: (file: FileInfo) => void;
    onRecentFolderSelect: (folder: FileInfo) => void;
    onClearRecentlyOpened: () => void;
}

export default function MenuBar({
    activeMenu,
    openRecentSubmenu,
    sourceMode,
    focusMode,
    typewriterMode,
    activeSidebarPanel,
    checkingUpdate,
    alwaysOnTop,
    recentFiles,
    recentFolders,
    onToggleMenu,
    onMenuItemClick,
    onSetOpenRecentSubmenu,
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
                            <div className="menu-item" onClick={() => onMenuItemClick('new')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">新建</span>
                                <span className="menu-item-shortcut">Ctrl+N</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('openFile')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打开文件…</span>
                                <span className="menu-item-shortcut">Ctrl+O</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('openFolder')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打开文件夹…</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+O</span>
                            </div>
                            <div
                                className="menu-item menu-item-submenu"
                                onMouseEnter={() => onSetOpenRecentSubmenu(true)}
                                onMouseLeave={() => onSetOpenRecentSubmenu(false)}
                            >
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">打开最近</span>
                                <span className="menu-item-arrow">›</span>
                                {openRecentSubmenu && (
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
                                <span className="menu-item-shortcut">Ctrl+S</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('saveAs')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">另存为…</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+S</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('settings')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">设置</span>
                                <span className="menu-item-shortcut">Ctrl+,</span>
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
                            <div className="menu-item" onClick={() => onMenuItemClick('findReplace')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">查找 / 替换</span>
                                <span className="menu-item-shortcut">Ctrl+F</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('undo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">撤销</span>
                                <span className="menu-item-shortcut">Ctrl+Z</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('redo')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重做</span>
                                <span className="menu-item-shortcut">Ctrl+Y</span>
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
                                <span className="menu-item-shortcut">Ctrl+B</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleItalic')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">斜体</span>
                                <span className="menu-item-shortcut">Ctrl+I</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleUnderline')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">下划线</span>
                                <span className="menu-item-shortcut">Ctrl+U</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('superscript')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">上标</span>
                                <span className="menu-item-shortcut">Ctrl+Shift++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('subscript')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">下标</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+-</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('highlight')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">高亮</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+H</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('inlineCode')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">行内代码</span>
                                <span className="menu-item-shortcut">Ctrl+`</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('inlineMath')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">行内数学</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+M</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('strikethrough')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">删除线</span>
                                <span className="menu-item-shortcut">Ctrl+D</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('insertLink')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">超链接</span>
                                <span className="menu-item-shortcut">Ctrl+L</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('insertImage')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">图片</span>
                                <span className="menu-item-shortcut">Ctrl+Alt+I</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('clearFormatting')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">清除格式</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+R</span>
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
                                <span className="menu-item-shortcut">Ctrl+M</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('toggleAlwaysOnTop')}>
                                <span className="menu-item-status">{alwaysOnTop ? '✓' : ''}</span>
                                <span className="menu-item-label">总是在最前</span>
                                <span className="menu-item-shortcut">Ctrl+Alt+T</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomIn')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">放大文字</span>
                                <span className="menu-item-shortcut">Ctrl++</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomOut')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">缩小文字</span>
                                <span className="menu-item-shortcut">Ctrl+-</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('zoomReset')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重置文字</span>
                                <span className="menu-item-shortcut">Ctrl+0</span>
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
                                <span className="menu-item-shortcut">Ctrl+Shift+P</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('sourceMode')}>
                                <span className="menu-item-status">{sourceMode ? '✓' : ''}</span>
                                <span className="menu-item-label">源代码模式</span>
                                <span className="menu-item-shortcut">Ctrl+E</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('typewriterMode')}>
                                <span className="menu-item-status">{focusMode ? '✓' : ''}</span>
                                <span className="menu-item-label">打字机模式</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+G</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('focusMode')}>
                                <span className="menu-item-status">{typewriterMode ? '✓' : ''}</span>
                                <span className="menu-item-label">专注模式</span>
                                <span className="menu-item-shortcut">Ctrl+Shift+J</span>
                            </div>
                            <div className="menu-divider" />
                            <div className="menu-item" onClick={() => onMenuItemClick('sidebar')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">{activeSidebarPanel ? '关闭' : '打开'}侧边栏</span>
                                <span className="menu-item-shortcut">Ctrl+J</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('outline')}>
                                <span className="menu-item-status">{activeSidebarPanel === 'outline' ? '✓' : ''}</span>
                                <span className="menu-item-label">显示大纲</span>
                                <span className="menu-item-shortcut">Ctrl+K</span>
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
                                <span className="menu-item-shortcut">Ctrl+Shift+I</span>
                            </div>
                            <div className="menu-item" onClick={() => onMenuItemClick('reloadWindow')}>
                                <span className="menu-item-status"></span>
                                <span className="menu-item-label">重新加载窗口</span>
                                <span className="menu-item-shortcut">Ctrl+F5</span>
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