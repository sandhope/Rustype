import { useRef, useState, useEffect, useCallback } from 'react';
import Editor, { type EditorHandle } from './components/Editor';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import FindReplace from './components/FindReplace';
import SourceMode from './components/SourceMode';
import SettingsPanel from './components/SettingsPanel';
import AboutDialog from './components/AboutDialog';
import ShortcutsPanel from './components/ShortcutsPanel';
import TableInsertDialog from './components/TableInsertDialog';
import RenameDialog from './components/RenameDialog';
import MenuBar from './components/MenuBar';
import EditorContextMenu from './components/EditorContextMenu';
import { useAppState, useFileOperations, useMenuActions, useKeyboardShortcuts } from './hooks';
import { clearRecentlyOpened } from './utils/recentFiles';
import { grantDirectoryAccess, readDirectoryTree, fsRename, type FileInfo } from './utils/file';
import { join } from '@tauri-apps/api/path';
import logo from '../src-tauri/icons/128x128.png';
import './App.css';
import './styles/themes.css';

function App() {
    const editorRef = useRef<EditorHandle>(null);
    const hasSelectionRef = useRef(false);
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [isInList, setIsInList] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameFileName, setRenameFileName] = useState('');

    const {
        tabs,
        activeTabId,
        activeSidebarPanel,
        projectTree,
        recentFiles,
        recentFolders,
        setRecentFiles,
        setRecentFolders,
        promptData,
        settings,
        settingsOpen,
        aboutOpen,
        shortcutsOpen,
        findReplaceOpen,
        sourceMode,
        focusMode,
        typewriterMode,
        tocItems,
        checkingUpdate,
        alwaysOnTop,
        activeMenu,
        openSubmenu,
        autoSave,
        setAutoSave,
        setTabs,
        setActiveTabId,
        setActiveSidebarPanel,
        setProjectTree,
        setPromptData,
        setSettingsOpen,
        setAboutOpen,
        setShortcutsOpen,
        setFindReplaceOpen,
        setSourceMode,
        setFocusMode,
        setTypewriterMode,
        setTocItems,
        setCheckingUpdate,
        setAlwaysOnTop,
        setActiveMenu,
        setOpenSubmenu,
        currentLineEnding,
        setCurrentLineEnding,
        handleNewFile,
        handleTabSelect,
        handleTabClose,
        handleTabReorder,
        handleChange,
        handleSourceChange,
        activeTab,
        hasOpenFile,
    } = useAppState();

    const {
        handleOpenFolder,
        handleTreeRefresh,
        closeTabsForPath,
        handleFolderFileSelect,
        handleOpenFile,
        handleSaveFile,
        handleSaveAs,
        handleReloadFile,
        handleRecentFileSelect,
    } = useFileOperations({
        tabs,
        activeTabId,
        projectTree,
        setTabs,
        setActiveTabId,
        setProjectTree,
        setActiveSidebarPanel,
        setRecentFiles,
        setRecentFolders,
        setActiveMenu,
    });

    const { toggleMenu, handleMenuItemClick, handleSettingsUpdate, handleOutlineItemClick } = useMenuActions({
        sourceMode,
        focusMode,
        activeTabId,
        tabs,
        activeSidebarPanel,
        checkingUpdate,
        autoSave,
        setSourceMode,
        setFocusMode,
        setTabs,
        setActiveSidebarPanel,
        setFindReplaceOpen,
        setTypewriterMode,
        setTocItems,
        setSettingsOpen,
        setAboutOpen,
        setShortcutsOpen,
        setTableDialogOpen,
        setCheckingUpdate,
        setAlwaysOnTop,
        setActiveMenu,
        setCurrentLineEnding,
        setAutoSave,
        setActiveTabId,
        handleNewFile,
        handleOpenFile,
        handleOpenFolder,
        handleSaveFile,
        handleSaveAs,
        handleTabClose,
        setRenameDialogOpen,
        setRenameFileName,
    }, editorRef);

    useKeyboardShortcuts({
        findReplaceOpen,
        activeSidebarPanel,
        settingsOpen,
        aboutOpen,
        sourceMode,
        focusMode,
        setFindReplaceOpen,
        setActiveSidebarPanel,
        setSettingsOpen,
        setAboutOpen,
        setFocusMode,
        handleNewFile,
        handleOpenFile,
        handleOpenFolder,
        handleSaveFile,
        handleSaveAs,
        handleMenuAction: handleMenuItemClick,
    }, editorRef);

    const [editorCtxMenu, setEditorCtxMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        hasSelection: boolean;
    }>({ visible: false, x: 0, y: 0, hasSelection: false });

    const handleEditorSelectionChange = useCallback((hasSelection: boolean) => {
        hasSelectionRef.current = hasSelection;
        if (typewriterMode && editorRef.current) {
            editorRef.current.scrollToCursor();
        }
        if (editorRef.current?.isInList) {
            setIsInList(editorRef.current.isInList());
        }
    }, [typewriterMode]);

    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            root.classList.remove('theme-light', 'theme-dark');

            if (settings.theme === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.classList.add(isDark ? 'theme-dark' : 'theme-light');
            } else {
                root.classList.add(`theme-${settings.theme}`);
            }

            root.classList.remove('editor-font-size-12', 'editor-font-size-13', 'editor-font-size-14',
                'editor-font-size-15', 'editor-font-size-16', 'editor-font-size-17', 'editor-font-size-18',
                'editor-font-size-19', 'editor-font-size-20', 'editor-font-size-21', 'editor-font-size-22',
                'editor-font-size-23', 'editor-font-size-24');
            root.classList.add(`editor-font-size-${settings.fontSize}`);

            const lh = Math.round(settings.lineHeight * 10);
            root.classList.remove('editor-line-height-1-2', 'editor-line-height-1-3', 'editor-line-height-1-4',
                'editor-line-height-1-5', 'editor-line-height-1-6', 'editor-line-height-1-7', 'editor-line-height-1-8',
                'editor-line-height-1-9', 'editor-line-height-2-0');
            root.classList.add(`editor-line-height-${lh / 10}-${lh % 10}`);

            root.style.setProperty('--editor-area-width', settings.editorLineWidth || '800px');
        };

        applyTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (settings.theme === 'system') applyTheme();
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [settings]);

    useEffect(() => {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab && editorRef.current) {
            editorRef.current.setContent(tab.content);
        }
    }, [activeTabId]);

    useEffect(() => {
        if (activeSidebarPanel === 'outline' && editorRef.current) {
            const toc = editorRef.current.getTOC();
            setTocItems(toc);
        }
    }, [activeTabId, activeSidebarPanel, activeTab?.content]);

    useEffect(() => {
        const checkIsInList = () => {
            if (editorRef.current?.isInList) {
                setIsInList(editorRef.current.isInList());
            }
        };
        checkIsInList();
    }, [activeTabId, activeTab?.content]);

    const handleEditorContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setEditorCtxMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            hasSelection: hasSelectionRef.current,
        });
    }, []);

    const handleSettingsClose = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    const handleRecentFolderSelect = useCallback(async (folder: FileInfo) => {
        setActiveMenu(null);
        setOpenSubmenu(null);
        await grantDirectoryAccess(folder.path);
        const tree = await readDirectoryTree(folder.path);
        setProjectTree(tree);
        setActiveSidebarPanel('explorer');
    }, [setActiveMenu, setOpenSubmenu, setProjectTree, setActiveSidebarPanel]);

    const handleClearRecentlyOpened = useCallback(async () => {
        await clearRecentlyOpened();
        setActiveMenu(null);
        setOpenSubmenu(null);
    }, [setActiveMenu, setOpenSubmenu]);

    const handleMenuUndo = useCallback(() => {
        editorRef.current?.undo();
        setActiveMenu(null);
    }, [setActiveMenu]);

    const handleMenuRedo = useCallback(() => {
        editorRef.current?.redo();
        setActiveMenu(null);
    }, [setActiveMenu]);

    const handleMenuItemClickWrapper = useCallback((action: string) => {
        if (action === 'undo') {
            handleMenuUndo();
        } else if (action === 'redo') {
            handleMenuRedo();
        } else {
            handleMenuItemClick(action);
        }
    }, [handleMenuItemClick, handleMenuUndo, handleMenuRedo]);

    const appRootClass = [
        'app-root',
        sourceMode ? 'source-mode-active' : '',
        focusMode ? 'focus-mode-active' : '',
        typewriterMode ? 'typewriter-mode' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={appRootClass} onClick={() => setActiveMenu(null)}>
            <MenuBar
                activeMenu={activeMenu}
                openSubmenu={openSubmenu}
                sourceMode={sourceMode}
                focusMode={focusMode}
                typewriterMode={typewriterMode}
                activeSidebarPanel={activeSidebarPanel}
                checkingUpdate={checkingUpdate}
                alwaysOnTop={alwaysOnTop}
                recentFiles={recentFiles}
                recentFolders={recentFolders}
                isInList={isInList}
                currentLineEnding={currentLineEnding}
                autoSave={autoSave}
                onToggleMenu={toggleMenu}
                onMenuItemClick={handleMenuItemClickWrapper}
                onSetOpenSubmenu={setOpenSubmenu}
                onRecentFileSelect={handleRecentFileSelect}
                onRecentFolderSelect={handleRecentFolderSelect}
                onClearRecentlyOpened={handleClearRecentlyOpened}
            />

            <main className="app-main">
                <Sidebar
                    activePanel={activeSidebarPanel}
                    onPanelChange={setActiveSidebarPanel}
                    projectTree={projectTree}
                    onFolderFileSelect={handleFolderFileSelect}
                    activeFilePath={activeTab?.file?.path ?? null}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onOpenFolder={handleOpenFolder}
                    tocItems={tocItems}
                    onTocItemClick={handleOutlineItemClick}
                    onTreeRefresh={handleTreeRefresh}
                    onCloseTabsForPath={closeTabsForPath}
                />

                <div className="app-content">
                    {hasOpenFile && (
                        <TabBar
                            tabs={tabs}
                            activeTabId={activeTabId}
                            onTabSelect={handleTabSelect}
                            onTabClose={handleTabClose}
                            onTabReorder={handleTabReorder}
                            onNewFile={handleNewFile}
                        />
                    )}
                    {hasOpenFile ? (
                        <div className="editor-container" onContextMenu={handleEditorContextMenu}>
                            {sourceMode ? (
                                <SourceMode
                                    content={activeTab!.content}
                                    onChange={handleSourceChange}
                                />
                            ) : (
                                <Editor
                                    ref={editorRef}
                                    initialContent={activeTab!.content}
                                    onChange={handleChange}
                                    onSelectionChange={handleEditorSelectionChange}
                                />
                            )}
                            <EditorContextMenu
                                visible={editorCtxMenu.visible}
                                x={editorCtxMenu.x}
                                y={editorCtxMenu.y}
                                hasSelection={editorCtxMenu.hasSelection}
                                editorRef={editorRef}
                                onClose={() => setEditorCtxMenu(prev => ({ ...prev, visible: false }))}
                            />
                        </div>
                    ) : projectTree ? (
                        <div className="welcome-view welcome-view-folder">
                            <div className="welcome-content">
                                <div className="welcome-folder-hint">
                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" className="welcome-folder-icon">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <h2 className="welcome-folder-title">{projectTree.name}</h2>
                                    <p className="welcome-folder-subtitle">从侧边栏选择文件开始编辑</p>
                                </div>
                                <div className="welcome-actions">
                                    <button className="welcome-action-btn" onClick={handleNewFile}>
                                        <span className="welcome-action-icon">📝</span>
                                        <div className="welcome-action-text">
                                            <span className="welcome-action-label">新建文件</span>
                                            <span className="welcome-action-shortcut">Ctrl+N</span>
                                        </div>
                                    </button>
                                    <button className="welcome-action-btn" onClick={handleOpenFile}>
                                        <span className="welcome-action-icon">📂</span>
                                        <div className="welcome-action-text">
                                            <span className="welcome-action-label">打开文件</span>
                                            <span className="welcome-action-shortcut">Ctrl+O</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="welcome-view">
                            <div className="welcome-content">
                                <img src={logo} alt="Rustype" className="welcome-logo" />
                                <h1 className="welcome-title">Rustype</h1>
                                <p className="welcome-subtitle">高性能 Markdown 编辑器</p>
                                <div className="welcome-actions">
                                    <button className="welcome-action-btn" onClick={handleNewFile}>
                                        <span className="welcome-action-icon">📝</span>
                                        <div className="welcome-action-text">
                                            <span className="welcome-action-label">新建文件</span>
                                            <span className="welcome-action-shortcut">Ctrl+N</span>
                                        </div>
                                    </button>
                                    <button className="welcome-action-btn" onClick={handleOpenFile}>
                                        <span className="welcome-action-icon">📂</span>
                                        <div className="welcome-action-text">
                                            <span className="welcome-action-label">打开文件</span>
                                            <span className="welcome-action-shortcut">Ctrl+O</span>
                                        </div>
                                    </button>
                                    <button className="welcome-action-btn" onClick={handleOpenFolder}>
                                        <span className="welcome-action-icon">📁</span>
                                        <div className="welcome-action-text">
                                            <span className="welcome-action-label">打开文件夹</span>
                                            <span className="welcome-action-shortcut">Ctrl+Shift+O</span>
                                        </div>
                                    </button>
                                </div>
                                {recentFiles.length > 0 && (
                                    <div className="welcome-recent">
                                        <h3 className="welcome-recent-title">最近使用</h3>
                                        <ul className="welcome-recent-list">
                                            {recentFiles.slice(0, 5).map((file, index) => (
                                                <li
                                                    key={file.path + index}
                                                    className="welcome-recent-item"
                                                    title={file.path}
                                                    onClick={() => {
                                                        if (file.isDir) {
                                                            readDirectoryTree(file.path).then(tree => {
                                                                setProjectTree(tree);
                                                                setActiveSidebarPanel('explorer');
                                                            });
                                                        } else {
                                                            handleRecentFileSelect(file);
                                                        }
                                                    }}
                                                >
                                                    <span className="welcome-recent-icon">{file.isDir ? '📁' : '📄'}</span>
                                                    <span className="welcome-recent-name">{file.name || file.path.split(/[/\\]/).pop()}</span>
                                                    <span className="welcome-recent-path">{file.path}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {findReplaceOpen && !sourceMode && (
                        <FindReplace
                            editorRef={editorRef}
                            onClose={() => setFindReplaceOpen(false)}
                        />
                    )}
                </div>
            </main>

            {promptData && (
                <div className="modal-overlay" onClick={() => setPromptData(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>文件已被外部修改</h3>
                        <p>{promptData.filePath}</p>
                        <p style={{ color: '#666', fontSize: '13px' }}>是否重新加载文件？当前的未保存更改将丢失。</p>
                        <div className="modal-actions">
                            <button
                                className="modal-button modal-button-secondary"
                                onClick={() => setPromptData(null)}
                            >
                                取消
                            </button>
                            <button
                                className="modal-button modal-button-primary"
                                onClick={() => {
                                    handleReloadFile(promptData.tabId);
                                    setActiveTabId(promptData.tabId);
                                    setPromptData(null);
                                }}
                            >
                                重新加载
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {settingsOpen && (
                <SettingsPanel
                    settings={settings}
                    onUpdate={handleSettingsUpdate}
                    onClose={handleSettingsClose}
                />
            )}

            {aboutOpen && (
                <AboutDialog onClose={() => setAboutOpen(false)} />
            )}

            {shortcutsOpen && (
                <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />
            )}

            {tableDialogOpen && (
                <TableInsertDialog
                    onClose={() => setTableDialogOpen(false)}
                    onConfirm={(rows, columns) => {
                        editorRef.current?.createTable?.(rows, columns);
                    }}
                />
            )}

            {renameDialogOpen && (
                <RenameDialog
                    currentName={renameFileName}
                    onClose={() => setRenameDialogOpen(false)}
                    onConfirm={async (newName) => {
                        const activeTab = tabs.find(t => t.id === activeTabId);
                        if (activeTab?.file) {
                            try {
                                const dirPath = activeTab.file.path.substring(0, activeTab.file.path.lastIndexOf('/')) || 
                                               activeTab.file.path.substring(0, activeTab.file.path.lastIndexOf('\\'));
                                const fileName = newName.trim().toLowerCase().endsWith('.md') ? newName.trim() : `${newName.trim()}.md`;
                                const newPath = await join(dirPath, fileName);
                                await fsRename(activeTab.file.path, newPath);
                                setTabs(prev => prev.map(t =>
                                    t.id === activeTabId ? { ...t, file: { ...t.file!, path: newPath, name: fileName }, dirty: true } : t
                                ));
                            } catch (error) {
                                console.error('Failed to rename file:', error);
                                alert('重命名失败');
                            }
                        }
                        setRenameDialogOpen(false);
                    }}
                />
            )}
        </div>
    );
}

export default App;