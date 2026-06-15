import { useRef, useState, useCallback, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { readText as readClipboardText } from '@tauri-apps/plugin-clipboard-manager';
import { openUrl } from '@tauri-apps/plugin-opener';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import logo from '../src-tauri/icons/128x128.png';
import Editor, { type EditorHandle } from './components/Editor';
import TabBar, { type Tab } from './components/TabBar';
import Sidebar, { type SidebarPanel } from './components/Sidebar';
import FindReplace from './components/FindReplace';
import SourceMode from './components/SourceMode';
import SettingsPanel from './components/SettingsPanel';
import AboutDialog from './components/AboutDialog';
import ShortcutsPanel from './components/ShortcutsPanel';
import { openMarkdownFile, readFileContent, saveMarkdownFile, getFileStat, openFolderDialog, readDirectoryTree, grantDirectoryAccess, grantFileAccess, type FileInfo, type FileTreeNode } from './utils/file';
import { dirname } from '@tauri-apps/api/path';
import { getRecentFiles, addRecentFile, removeRecentFile, clearRecentlyOpened, getRecentFolders, addRecentFolder } from './utils/recentFiles';
import { loadSettings, saveSettings, type AppSettings, DEFAULT_SETTINGS } from './utils/settings';
import { loadSession, saveSession } from './utils/session';
import './App.css';
import './styles/themes.css';

const WELCOME_MARKDOWN = `# 欢迎使用 Rustype

Rustype 是一款**高性能 Markdown 编辑器**，基于 [muya](https://github.com/marktext/muya) 编辑器引擎。

## 功能特性

- 所见即所得 (WYSIWYG) 编辑
- 支持 **GFM** (GitHub Flavored Markdown)
- 支持数学公式 $\\sqrt{3x-1}+(1+x)^2$
- 支持代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

- 支持表格

| 快捷键 | 功能 |
| --- | --- |
| Ctrl+B | **粗体** |
| Ctrl+I | *斜体* |
| Ctrl+Z | 撤销 |

- 支持脚注[^1]

- - -

> 提示：你可以直接在上方开始编辑！

[^1]: 这是一个脚注示例。

`;

let tabIdCounter = 0;
const getNextTabId = () => `tab-${++tabIdCounter}`;

function createNewTab(file: FileInfo | null = null, content: string = WELCOME_MARKDOWN): Tab {
    return {
        id: getNextTabId(),
        file,
        content,
        dirty: false,
    };
}

interface TocItem {
    content: string;
    lvl: number;
    slug: string;
    githubSlug: string;
}

function App() {
    const editorRef = useRef<EditorHandle>(null);
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [openRecentSubmenu, setOpenRecentSubmenu] = useState(false);
    const [activeSidebarPanel, setActiveSidebarPanel] = useState<SidebarPanel | null>(null);
    const [projectTree, setProjectTree] = useState<FileTreeNode | null>(null);
    const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
    const [recentFolders, setRecentFolders] = useState<FileInfo[]>([]);
    const [promptData, setPromptData] = useState<{ tabId: string; filePath: string } | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });

    // Feature flags for current tab
    const [findReplaceOpen, setFindReplaceOpen] = useState(false);
    const [sourceMode, setSourceMode] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [typewriterMode, setTypewriterMode] = useState(false);
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [checkingUpdate, setCheckingUpdate] = useState(false);

    // Editor context menu state
    const [editorCtxMenu, setEditorCtxMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        hasSelection: boolean;
    }>({ visible: false, x: 0, y: 0, hasSelection: false });

    // Track muya selection state (kept in ref for use in handlers)
    const hasSelectionRef = useRef(false);

    // 标记是否正处于会话恢复过程中，用于避免恢复时触发保存
    const isRestoringRef = useRef(false);

    // Preserve the DOM selection across context-menu clicks so that
    // muya's clipboard handler can still read it after the menu steals focus.
    const savedSelectionRangeRef = useRef<Range | null>(null);

    const handleEditorSelectionChange = useCallback((hasSelection: boolean) => {
        hasSelectionRef.current = hasSelection;
        if (typewriterMode && editorRef.current) {
            editorRef.current.scrollToCursor();
        }
    }, [typewriterMode]);

    const activeTab = tabs.find(t => t.id === activeTabId) || null;
    const hasOpenFile = tabs.length > 0 && activeTab !== null;

    // Load settings on mount
    useEffect(() => {
        let cancelled = false;
        loadSettings().then((loaded) => {
            if (!cancelled) setSettings(loaded);
        }).catch((err) => {
            console.error('Failed to load settings:', err);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Load recent files on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [files, folders] = await Promise.all([getRecentFiles(), getRecentFolders()]);
            if (!cancelled) {
                setRecentFiles(files);
                setRecentFolders(folders);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Restore session on mount: restore folder + tabs + active tab
    useEffect(() => {
        let cancelled = false;

        const restore = async () => {
            const session = await loadSession();
            if (!session || cancelled) return;

            isRestoringRef.current = true;

            // Restore folder
            if (session.folderPath) {
                try {
                    // Grant filesystem permissions for this directory
                    await grantDirectoryAccess(session.folderPath);

                    const tree = await readDirectoryTree(session.folderPath);
                    if (!cancelled) {
                        setProjectTree(tree);
                        setActiveSidebarPanel('explorer');
                    }
                } catch {
                    // Folder no longer accessible, skip
                }
            }

            // Restore tabs (only those whose files still exist)
            if (session.tabs.length > 0 && !cancelled) {
                const restoredTabs: Tab[] = [];
                for (const savedTab of session.tabs) {
                    if (savedTab.file?.path) {
                        try {
                            await grantFileAccess(savedTab.file.path); 
                            const content = await readFileContent(savedTab.file.path);
                            const stat = await getFileStat(savedTab.file.path);
                            const tabId = getNextTabId();
                            restoredTabs.push({
                                id: tabId,
                                file: savedTab.file,
                                content,
                                dirty: false,
                                lastModified: stat?.mtime,
                                externallyModified: false,
                            });
                        } catch {
                            // File was deleted or moved, skip this tab
                        }
                    } else {
                        // Untitled tab: use saved content
                        const tabId = getNextTabId();
                        restoredTabs.push({
                            id: tabId,
                            file: null,
                            content: savedTab.content,
                            dirty: savedTab.content !== WELCOME_MARKDOWN,
                            externallyModified: false,
                        });
                    }
                }

                if (restoredTabs.length > 0 && !cancelled) {
                    setTabs(restoredTabs);
                    // Restore active tab by position (fall back to first tab)
                    const activeIdx = session.activeTabId
                        ? parseInt(session.activeTabId.split('-').pop() || '0', 10) - 1
                        : 0;
                    const safeIdx = Math.min(activeIdx, restoredTabs.length - 1);
                    const activeTab = restoredTabs[safeIdx >= 0 ? safeIdx : 0];
                    // fix restore active tab file image load failed
                    if (typeof window !== 'undefined' && activeTab.file) {
                        const fileDir = await dirname(activeTab.file.path);
                        window.DIRNAME = fileDir;
                    }
                    setActiveTabId(activeTab.id);
                }
            }

            isRestoringRef.current = false;
        };

        restore();
        return () => {
            cancelled = true;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Session persistence: save on folder change
    useEffect(() => {
        if (!isRestoringRef.current) {
            saveSession({
                folderPath: projectTree?.path ?? null,
                tabs: tabs.map(t => ({ file: t.file, content: t.content, lastModified: t.lastModified })),
                activeTabId,
            });
        }
    }, [projectTree?.path, activeTabId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Session persistence: save on tabs change
    useEffect(() => {
        if (!isRestoringRef.current) {
            saveSession({
                folderPath: projectTree?.path ?? null,
                tabs: tabs.map(t => ({ file: t.file, content: t.content, lastModified: t.lastModified })),
                activeTabId,
            });
        }
    }, [tabs]); // eslint-disable-line react-hooks/exhaustive-deps

    // Native file drag & drop support
    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Check if it's a markdown file
                if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
                    try {
                        const content = await file.text();
                        const newTab: Tab = {
                            ...createNewTab({ name: file.name, path: '' }, content),
                            dirty: true,
                        };
                        setTabs(prev => [...prev, newTab]);
                        setActiveTabId(newTab.id);
                        editorRef.current?.setContent(content);
                    } catch (error) {
                        console.error('Failed to open dropped file:', error);
                    }
                }
            }
        };

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    // Apply theme on mount and when settings change
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
            
            // Apply font size
            root.classList.remove('editor-font-size-12', 'editor-font-size-13', 'editor-font-size-14',
                'editor-font-size-15', 'editor-font-size-16', 'editor-font-size-17', 'editor-font-size-18',
                'editor-font-size-19', 'editor-font-size-20', 'editor-font-size-21', 'editor-font-size-22',
                'editor-font-size-23', 'editor-font-size-24');
            root.classList.add(`editor-font-size-${settings.fontSize}`);
            
            // Apply line height
            const lh = Math.round(settings.lineHeight * 10);
            root.classList.remove('editor-line-height-1-2', 'editor-line-height-1-3', 'editor-line-height-1-4',
                'editor-line-height-1-5', 'editor-line-height-1-6', 'editor-line-height-1-7', 'editor-line-height-1-8',
                'editor-line-height-1-9', 'editor-line-height-2-0');
            root.classList.add(`editor-line-height-${lh / 10}-${lh % 10}`);
            
            // Apply editor width
            root.style.setProperty('--editor-area-width', settings.editorLineWidth || '800px');
        };
        
        applyTheme();
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (settings.theme === 'system') applyTheme();
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [settings]);

    // Update editor when active tab changes
    useEffect(() => {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab && editorRef.current) {
            editorRef.current.setContent(tab.content);
        }
    }, [activeTabId]);

    // Periodically check for external file modifications
    useEffect(() => {
        const interval = setInterval(async () => {
            for (const tab of tabs) {
                if (!tab.file) continue;
                const stat = await getFileStat(tab.file.path);
                if (stat && tab.lastModified && stat.mtime != null && stat.mtime > tab.lastModified) {
                    setTabs(prev => prev.map(t =>
                        t.id === tab.id ? { ...t, externallyModified: true } : t
                    ));
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [tabs]);

    // Refresh TOC when tab changes
    useEffect(() => {
        if (activeSidebarPanel === 'outline' && editorRef.current) {
            const toc = editorRef.current.getTOC();
            setTocItems(toc);
        }
    }, [activeTabId, activeSidebarPanel, activeTab?.content]);

    const handleNewFile = useCallback(() => {
        const newTab = createNewTab();
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        editorRef.current?.setContent(newTab.content);
        setActiveMenu(null);
    }, []);

    const handleOpenFolder = useCallback(async () => {
        const dirPath = await openFolderDialog();
        if (!dirPath) {
            setActiveMenu(null);
            return;
        }

        // Grant filesystem permissions for this directory
        try {
            await grantDirectoryAccess(dirPath);
        } catch (error) {
            console.error('Failed to grant directory access:', error);
        }

        const tree = await readDirectoryTree(dirPath);
        setProjectTree(tree);
        setActiveSidebarPanel('explorer');
        setActiveMenu(null);

        // Add to recent folders and reload
        await addRecentFolder({ path: dirPath, name: dirPath.split(/[/\\]/).pop() || dirPath });
        setRecentFolders(await getRecentFolders());
    }, []);

    const handleTreeRefresh = useCallback(async () => {
        if (!projectTree) return;
        const tree = await readDirectoryTree(projectTree.path);
        setProjectTree(tree);
    }, [projectTree]);

    /** 关闭指定路径下的所有 tab（删除文件/文件夹时调用） */
    const closeTabsForPath = useCallback((deletedPath: string) => {
        setTabs(prev => {
            const remaining = prev.filter(t => !t.file || !t.file.path.startsWith(deletedPath));
            if (remaining.length !== prev.length) {
                setActiveTabId(activeId => {
                    const shouldChange = prev.find(t => t.id === activeId && t.file?.path.startsWith(deletedPath));
                    if (shouldChange) {
                        const newActiveId = remaining.length > 0 ? remaining[remaining.length - 1].id : '';
                        // React 会自动处理组件卸载，useEffect 清理函数会处理 muya 销毁
                        return newActiveId;
                    }
                    return activeId;
                });
            }
            return remaining;
        });
    }, []);

    const handleFolderFileSelect = useCallback(async (filePath: string) => {
        try {
            // Set window.DIRNAME for relative image path resolution
            const fileDir = await dirname(filePath);
            if (typeof window !== 'undefined') {
                window.DIRNAME = fileDir;
            }

            const fileName = filePath.split(/[/\\]/).pop() || '';
            const fileInfo: FileInfo = { path: filePath, name: fileName };

            // Check if file is already open in a tab
            const existingTab = tabs.find(t => t.file?.path === filePath);
            if (existingTab) {
                setActiveTabId(existingTab.id);
                return;
            }

            const fileContent = await readFileContent(filePath);
            const fileStat = await getFileStat(filePath);
            await addRecentFile(fileInfo);
            setRecentFolders(await getRecentFolders());

            const newTab: Tab = {
                ...createNewTab(fileInfo, fileContent),
                lastModified: fileStat?.mtime,
                externallyModified: false,
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
        } catch (error) {
            console.error('Failed to open file from folder:', error);
        }
    }, [tabs]);

    const handleOpenFile = useCallback(async () => {
        const fileInfo = await openMarkdownFile();
        if (fileInfo) {
            try {
                // Set window.DIRNAME for relative image path resolution
                const fileDir = await dirname(fileInfo.path);
                if (typeof window !== 'undefined') {
                    window.DIRNAME = fileDir;
                }

                const fileContent = await readFileContent(fileInfo.path);
                const stat = await getFileStat(fileInfo.path);
                await addRecentFile(fileInfo);
                setRecentFiles(await getRecentFiles());

                const existingTab = tabs.find(t => t.file?.path === fileInfo.path);
                if (existingTab) {
                    setActiveTabId(existingTab.id);
                    setTabs(prev => prev.map(t =>
                        t.id === existingTab.id ? { ...t, lastModified: stat?.mtime, externallyModified: false } : t
                    ));
                } else {
                    const newTab: Tab = {
                        ...createNewTab(fileInfo, fileContent),
                        lastModified: stat?.mtime,
                        externallyModified: false,
                    };
                    setTabs(prev => [...prev, newTab]);
                    setActiveTabId(newTab.id);
                    editorRef.current?.setContent(fileContent);
                }
            } catch (error) {
                console.error('Failed to read file:', error);
                alert('无法读取文件');
            }
        }
        setActiveMenu(null);
    }, [tabs]);

    const handleSaveFile = useCallback(async () => {
        if (!activeTab) return;
        const markdown = sourceMode
            ? activeTab.content
            : (editorRef.current?.getMarkdown() || activeTab.content);

        if (activeTab.file) {
            await saveMarkdownFile(markdown, activeTab.file.path);
            const stat = await getFileStat(activeTab.file.path);
            setTabs(prev => prev.map(t =>
                t.id === activeTabId ? { ...t, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
            ));
        } else {
            const savedFile = await saveMarkdownFile(markdown);
            if (savedFile) {
                const stat = await getFileStat(savedFile.path);
                setTabs(prev => prev.map(t =>
                    t.id === activeTabId ? { ...t, file: savedFile, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
                ));
                await addRecentFile(savedFile);
                setRecentFiles(await getRecentFiles());
            }
        }
        setActiveMenu(null);
    }, [activeTab, activeTabId, sourceMode]);

    const handleSaveAs = useCallback(async () => {
        if (!activeTab) return;
        const markdown = sourceMode
            ? activeTab.content
            : (editorRef.current?.getMarkdown() || activeTab.content);
        const savedFile = await saveMarkdownFile(markdown);
        if (savedFile) {
            await addRecentFile(savedFile);
            setRecentFiles(await getRecentFiles());
            const stat = await getFileStat(savedFile.path);
            setTabs(prev => prev.map(t =>
                t.id === activeTabId ? { ...t, file: savedFile, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
            ));
        }
        setActiveMenu(null);
    }, [activeTab, activeTabId, sourceMode]);

    const handleReloadFile = useCallback(async (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab || !tab.file) return;

        try {
            const fileContent = await readFileContent(tab.file.path);
            const stat = await getFileStat(tab.file.path);
            setTabs(prev => prev.map(t =>
                t.id === tabId ? { ...t, content: fileContent, lastModified: stat?.mtime, externallyModified: false, dirty: false } : t
            ));
            if (tabId === activeTabId && editorRef.current) {
                editorRef.current.setContent(fileContent);
            }
        } catch (error) {
            console.error('Failed to reload file:', error);
            alert('无法重新加载文件');
        }
    }, [tabs, activeTabId]);

    const handleChange = useCallback((content: string) => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, content, dirty: true } : t
        ));
    }, [activeTabId]);

    const handleTabSelect = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.externallyModified) {
            setPromptData({ tabId, filePath: tab.file!.path });
        } else {
            setActiveTabId(tabId);
        }
    }, [tabs]);

    const handleTabClose = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabIndex = prevTabs.findIndex(t => t.id === tabId);
            const tab = prevTabs[tabIndex];

            // 如果标签不存在，直接返回
            if (!tab) return prevTabs;

            // 如果有未保存的更改，弹出确认对话框
            if (tab.dirty) {
                const confirmed = window.confirm(`${tab.file?.name || 'Untitled'} 有未保存的更改，确定要关闭吗？`);
                if (!confirmed) return prevTabs;
            }

            const newTabs = prevTabs.filter(t => t.id !== tabId);

            if (newTabs.length === 0) {
                // 所有标签都关闭了，清空活动标签
                // React 会自动卸载 Editor 组件，useEffect 清理函数会处理 muya 销毁
                setActiveTabId('');
            } else {
                // 如果关闭的是当前活动标签，选择新的活动标签
                setActiveTabId(prevActiveId => {
                    if (tabId === prevActiveId) {
                        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
                        return newTabs[newActiveIndex].id;
                    }
                    return prevActiveId;
                });
            }

            return newTabs;
        });
    }, []);

    const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
        setTabs(prev => {
            const result = [...prev];
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);
            return result;
        });
    }, []);

    const handleRecentFileSelect = useCallback(async (file: FileInfo) => {
        try {
            // Set window.DIRNAME for relative image path resolution
            const fileDir = await dirname(file.path);
            if (typeof window !== 'undefined') {
                window.DIRNAME = fileDir;
            }

            const fileContent = await readFileContent(file.path);
            const stat = await getFileStat(file.path);

            const existingTab = tabs.find(t => t.file?.path === file.path);
            if (existingTab) {
                setActiveTabId(existingTab.id);
                setTabs(prev => prev.map(t =>
                    t.id === existingTab.id ? { ...t, lastModified: stat?.mtime, externallyModified: false } : t
                ));
            } else {
                const newTab: Tab = {
                    ...createNewTab(file, fileContent),
                    lastModified: stat?.mtime,
                    externallyModified: false,
                };
                setTabs(prev => [...prev, newTab]);
                setActiveTabId(newTab.id);
                editorRef.current?.setContent(fileContent);
            }

            // Close the sidebar panel if it's open
            // setActiveSidebarPanel(null);
        } catch (error) {
            console.error('Failed to open recent file:', error);
            await removeRecentFile(file.path);
            setRecentFiles(await getRecentFiles());
            alert('文件已不存在或无法读取');
        }
    }, [tabs]);

    const toggleMenu = useCallback((menu: string) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    }, []);

    const handleCheckUpdate = useCallback(async () => {
        setActiveMenu(null);
        setCheckingUpdate(true);
        
        try {
            const update = await check();
            
            if (update) {
                console.log(`发现更新 ${update.version} 发布于 ${update.date} 更新日志: ${update.body}`);
                
                const shouldInstall = confirm(`发现新版本 ${update.version}！\n\n发布日期：${update.date}\n\n更新日志：\n${update.body || '暂无更新日志'}\n\n是否立即安装？`);
                
                if (shouldInstall) {
                    let downloaded = 0;
                    let contentLength = 0;
                    
                    try {
                        await update.downloadAndInstall((event) => {
                            switch (event.event) {
                                case 'Started':
                                    contentLength = event.data.contentLength ?? 0;
                                    console.log(`开始下载 ${contentLength} bytes`);
                                    break;
                                case 'Progress':
                                    downloaded += event.data.chunkLength;
                                    console.log(`已下载 ${downloaded} / ${contentLength}`);
                                    break;
                                case 'Finished':
                                    console.log('下载完成');
                                    break;
                            }
                        });
                        
                        console.log('更新安装完成');
                        await relaunch();
                    } catch (installError) {
                        console.error('Failed to install update:', installError);
                        alert('更新安装失败，请手动前往 GitHub 下载最新版本');
                    }
                }
            } else {
                alert('当前已是最新版本');
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            alert('检查更新失败，请稍后重试');
        } finally {
            setCheckingUpdate(false);
        }
    }, []);

    const handleMenuItemClick = useCallback((action: string) => {
        switch (action) {
            case 'new':
                handleNewFile();
                break;
            case 'openFile':
                handleOpenFile();
                break;
            case 'openFolder':
                handleOpenFolder();
                break;
            case 'save':
                handleSaveFile();
                break;
            case 'saveAs':
                handleSaveAs();
                break;
            case 'sidebar':
                setActiveSidebarPanel(prev => prev ? null : 'explorer');
                setActiveMenu(null);
                break;
            case 'findReplace':
                setFindReplaceOpen(prev => !prev);
                setActiveMenu(null);
                break;
            case 'sourceMode':
                if (!sourceMode && editorRef.current) {
                    const md = editorRef.current.getMarkdown();
                    setTabs(prev => prev.map(t =>
                        t.id === activeTabId ? { ...t, content: md } : t
                    ));
                }
                setSourceMode(prev => !prev);
                setActiveMenu(null);
                break;
            case 'focusMode':
                const nextFocus = !focusMode;
                setFocusMode(nextFocus);
                editorRef.current?.setFocusMode(nextFocus);
                setActiveMenu(null);
                break;
            case 'typewriterMode':
                setTypewriterMode(prev => {
                    const next = !prev;
                    if (next && editorRef.current) {
                        editorRef.current.scrollToCursor();
                    }
                    return next;
                });
                setActiveMenu(null);
                break;
            case 'outline':
                if (editorRef.current) {
                    const toc = editorRef.current.getTOC();
                    setTocItems(toc);
                }
                setActiveSidebarPanel(prev => prev === 'outline' ? null : 'outline');
                setActiveMenu(null);
                break;
            case 'reloadImages':
                editorRef.current?.reloadImages();
                setActiveMenu(null);
                break;
            case 'reloadWindow':
                window.location.reload();
                setActiveMenu(null);
                break;
            case 'openDevTools':
                invoke('open_devtools');
                setActiveMenu(null);
                break;
            case 'settings':
                setSettingsOpen(true);
                setActiveMenu(null);
                break;
            case 'about':
                setAboutOpen(true);
                setActiveMenu(null);
                break;
            case 'shortcuts':
                setShortcutsOpen(true);
                setActiveMenu(null);
                break;
            case 'releaseNotes':
                openUrl('https://github.com/sandhope/Rustype/releases');
                setActiveMenu(null);
                break;
            case 'support':
                openUrl('https://opencollective.com/sandhope');
                setActiveMenu(null);
                break;
            case 'viewSource':
                openUrl('https://github.com/sandhope/Rustype');
                setActiveMenu(null);
                break;
            case 'reportIssue':
                openUrl('https://github.com/sandhope/Rustype/issues');
                setActiveMenu(null);
                break;
            case 'license':
                openUrl('https://github.com/sandhope/Rustype/blob/main/LICENSE');
                setActiveMenu(null);
                break;
            case 'checkUpdate':
                handleCheckUpdate();
                break;
        }
    }, [handleNewFile, handleOpenFile, handleOpenFolder, handleSaveFile, handleSaveAs, sourceMode, focusMode, activeTabId]);

    const handleSettingsUpdate = useCallback(async (newSettings: AppSettings) => {
        setSettings(newSettings);
        await saveSettings(newSettings);
    }, []);

    const handleSettingsClose = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    const handleSourceChange = useCallback((content: string) => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, content, dirty: true } : t
        ));
    }, [activeTabId]);

    const handleOutlineItemClick = useCallback((item: TocItem) => {
        editorRef.current?.scrollToHeading(item.slug);
    }, []);

    // Editor context menu handlers
    const handleEditorContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // Save the DOM selection before the menu steals focus
        const sel = document.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
        } else {
            savedSelectionRangeRef.current = null;
        }
        setEditorCtxMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            hasSelection: hasSelectionRef.current,
        });
    }, []);

    const handleEditorCtxAction = useCallback(async (action: string) => {
        setEditorCtxMenu(prev => ({ ...prev, visible: false }));
        const editor = editorRef.current;
        if (!editor) return;

        const domNode = editor.getDomNode();
        if (!domNode) return;

        // Restore the saved selection so muya's clipboard can read it
        const needsSelection = ['cut', 'copy', 'copy-rich', 'copy-html', 'paste', 'paste-plain'].includes(action);
        if (needsSelection && savedSelectionRangeRef.current) {
            const sel = document.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedSelectionRangeRef.current);
            }
        }

        switch (action) {
            case 'insert-before':
                editor.insertParagraph('before');
                break;
            case 'insert-after':
                editor.insertParagraph('after');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste': {
                try {
                    const text = await readClipboardText();
                    // Re-restore selection (may have been lost during async await)
                    if (savedSelectionRangeRef.current) {
                        const sel = document.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(savedSelectionRangeRef.current);
                        }
                    }
                    editor.pasteText(text);
                } catch {
                    // clipboard read failed — do nothing
                }
                break;
            }
            case 'copy-rich':
                editor.copyAsRich();
                break;
            case 'copy-html':
                editor.copyAsHtml();
                break;
            case 'paste-plain': {
                try {
                    const text = await readClipboardText();
                    // Re-restore selection (may have been lost during async await)
                    if (savedSelectionRangeRef.current) {
                        const sel = document.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(savedSelectionRangeRef.current);
                        }
                    }
                    editor.pasteText(text, true);
                } catch {
                    // clipboard read failed — do nothing
                }
                break;
            }
        }

        savedSelectionRangeRef.current = null;
    }, []);

    // Close editor context menu on click elsewhere or Escape
    useEffect(() => {
        if (!editorCtxMenu.visible) return;
        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.editor-context-menu')) return;
            setEditorCtxMenu(prev => ({ ...prev, visible: false }));
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setEditorCtxMenu(prev => ({ ...prev, visible: false }));
        };
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editorCtxMenu.visible]);

    // Keyboard shortcuts - placed after all callbacks are defined
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') {
                    if (findReplaceOpen) setFindReplaceOpen(false);
                    if (activeSidebarPanel === 'outline') setActiveSidebarPanel(null);
                    if (settingsOpen) setSettingsOpen(false);
                    if (aboutOpen) setAboutOpen(false);
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        handleNewFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleOpenFolder();
                        } else {
                            handleOpenFile();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        handleSaveFile();
                        break;
                    case 'f':
                        e.preventDefault();
                        setFindReplaceOpen(prev => !prev);
                        break;
                    case 'z':
                        if (!sourceMode) {
                            e.preventDefault();
                            editorRef.current?.undo();
                        }
                        break;
                    case 'y':
                        if (!sourceMode) {
                            e.preventDefault();
                            editorRef.current?.redo();
                        }
                        break;
                    case ',':
                        e.preventDefault();
                        setSettingsOpen(true);
                        break;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
                if (e.key === 'S' || e.key === 's') {
                    e.preventDefault();
                    handleSaveAs();
                }
                if (e.key === 'F' || e.key === 'f') {
                    e.preventDefault();
                    setFocusMode(prev => {
                        const next = !prev;
                        editorRef.current?.setFocusMode(next);
                        return next;
                    });
                }
            }

            if (e.key === 'Escape') {
                if (findReplaceOpen) setFindReplaceOpen(false);
                if (activeSidebarPanel === 'outline') setActiveSidebarPanel(null);
                if (settingsOpen) setSettingsOpen(false);
                if (aboutOpen) setAboutOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [findReplaceOpen, activeSidebarPanel, settingsOpen, aboutOpen, sourceMode, handleNewFile, handleOpenFile, handleSaveFile, handleSaveAs]);

    const appRootClass = [
        'app-root',
        sourceMode ? 'source-mode-active' : '',
        focusMode ? 'focus-mode-active' : '',
        typewriterMode ? 'typewriter-mode' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={appRootClass} onClick={() => setActiveMenu(null)}>
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
                                onClick={() => toggleMenu('file')}
                            >
                                文件
                            </div>
                            <div className={`menu-dropdown-content ${activeMenu === 'file' ? 'is-open' : ''}`}>
                                <div className="menu-item" onClick={() => handleMenuItemClick('new')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">新建</span>
                                    <span className="menu-item-shortcut">Ctrl+N</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('openFile')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">打开文件…</span>
                                    <span className="menu-item-shortcut">Ctrl+O</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('openFolder')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">打开文件夹…</span>
                                    <span className="menu-item-shortcut">Ctrl+Shift+O</span>
                                </div>
                                <div
                                    className="menu-item menu-item-submenu"
                                    onMouseEnter={() => setOpenRecentSubmenu(true)}
                                    onMouseLeave={() => setOpenRecentSubmenu(false)}
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
                                                    {/* Recent Folders Section */}
                                                    {recentFolders.length > 0 && (
                                                        <>
                                                            {recentFolders.map((folder, index) => (
                                                                <div
                                                                    key={`folder-${folder.path}-${index}`}
                                                                    className="menu-submenu-item"
                                                                    title={folder.path}
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenu(null);
                                                                        setOpenRecentSubmenu(false);
                                                                        await grantDirectoryAccess(folder.path);
                                                                        const tree = await readDirectoryTree(folder.path);
                                                                        setProjectTree(tree);
                                                                        setActiveSidebarPanel('explorer');
                                                                    }}
                                                                >
                                                                    <span className="menu-submenu-item-icon">📂</span>
                                                                    <span className="menu-submenu-item-label">{folder.path}</span>
                                                                </div>
                                                            ))}
                                                            <div className="menu-submenu-divider" />
                                                        </>
                                                    )}

                                                    {/* Recent Files Section */}
                                                    {recentFiles.length > 0 && (
                                                        <>
                                                            {recentFiles.map((file, index) => (
                                                                <div
                                                                    key={`file-${file.path}-${index}`}
                                                                    className="menu-submenu-item"
                                                                    title={file.path}
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenu(null);
                                                                        setOpenRecentSubmenu(false);
                                                                        await grantFileAccess(file.path);
                                                                        handleRecentFileSelect(file);
                                                                    }}
                                                                >
                                                                    <span className="menu-submenu-item-icon">📝</span>
                                                                    <span className="menu-submenu-item-label">{file.path}</span>
                                                                </div>
                                                            ))}
                                                            <div className="menu-submenu-divider" />
                                                        </>
                                                    )}

                                                    {/* Clear All Button */}
                                                    <div
                                                        className="menu-submenu-item menu-submenu-item-danger"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await clearRecentlyOpened();
                                                            setRecentFiles([]);
                                                            setRecentFolders([]);
                                                            setActiveMenu(null);
                                                            setOpenRecentSubmenu(false);
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
                                <div className="menu-item" onClick={() => handleMenuItemClick('save')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">保存</span>
                                    <span className="menu-item-shortcut">Ctrl+S</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('saveAs')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">另存为…</span>
                                    <span className="menu-item-shortcut">Ctrl+Shift+S</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('settings')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">设置</span>
                                    <span className="menu-item-shortcut">Ctrl+,</span>
                                </div>
                            </div>
                        </div>

                        <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div
                                className={`menu-trigger ${activeMenu === 'edit' ? 'active' : ''}`}
                                onClick={() => toggleMenu('edit')}
                            >
                                编辑
                            </div>
                            <div className={`menu-dropdown-content ${activeMenu === 'edit' ? 'is-open' : ''}`}>
                                <div className="menu-item" onClick={() => handleMenuItemClick('findReplace')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">查找 / 替换</span>
                                    <span className="menu-item-shortcut">Ctrl+F</span>
                                </div>
                                <div className="menu-item" onClick={() => { editorRef.current?.undo(); setActiveMenu(null); }}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">撤销</span>
                                    <span className="menu-item-shortcut">Ctrl+Z</span>
                                </div>
                                <div className="menu-item" onClick={() => { editorRef.current?.redo(); setActiveMenu(null); }}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">重做</span>
                                    <span className="menu-item-shortcut">Ctrl+Y</span>
                                </div>
                            </div>
                        </div>

                        <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div
                                className={`menu-trigger ${activeMenu === 'view' ? 'active' : ''}`}
                                onClick={() => toggleMenu('view')}
                            >
                                视图
                            </div>
                            <div className={`menu-dropdown-content ${activeMenu === 'view' ? 'is-open' : ''}`}>
                                <div className="menu-item" onClick={() => handleMenuItemClick('outline')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">命令面板- 未完成</span>
                                    <span className="menu-item-shortcut">Ctrl+Shift+P</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('sourceMode')}>
                                    <span className="menu-item-status">{sourceMode ? '✓' : ''}</span>
                                    <span className="menu-item-label">源代码模式</span>
                                    <span className="menu-item-shortcut">Ctrl+E</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('focusMode')}>
                                    <span className="menu-item-status">{focusMode ? '✓' : ''}</span>
                                    <span className="menu-item-label">专注模式</span>
                                    <span className="menu-item-shortcut">Ctrl+Shift+J</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('typewriterMode')}>
                                    <span className="menu-item-status">{typewriterMode ? '✓' : ''}</span>
                                    <span className="menu-item-label">打字机模式</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('sidebar')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">{activeSidebarPanel ? '关闭' : '打开'}侧边栏</span>
                                    <span className="menu-item-shortcut">Ctrl+J</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('outline')}>
                                    <span className="menu-item-status">{activeSidebarPanel === 'outline' ? '✓' : ''}</span>
                                    <span className="menu-item-label">显示大纲</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('reloadImages')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">重新加载图片</span>
                                    <span className="menu-item-shortcut">F5</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('openDevTools')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">打开开发者工具</span>
                                    <span className="menu-item-shortcut">Alt+Ctrl+I</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('reloadWindow')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">重新加载窗口</span>
                                    <span className="menu-item-shortcut">Ctrl+F5</span>
                                </div>
                            </div>
                        </div>

                        <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div
                                className={`menu-trigger ${activeMenu === 'help' ? 'active' : ''}`}
                                onClick={() => toggleMenu('help')}
                            >
                                帮助
                            </div>
                            <div className={`menu-dropdown-content ${activeMenu === 'help' ? 'is-open' : ''}`}>
                                <div className="menu-item" onClick={() => handleMenuItemClick('releaseNotes')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">更新日志</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('support')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">支持 Rustype</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('viewSource')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">查看源码</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('reportIssue')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">报告错误</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('license')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">许可证</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('checkUpdate')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">{checkingUpdate ? '检查中...' : '检查更新'}</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('shortcuts')}>
                                    <span className="menu-item-status"></span>
                                    <span className="menu-item-label">键盘快捷键</span>
                                    <span className="menu-item-shortcut"></span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('about')}>
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
                            {editorCtxMenu.visible && (
                                <div
                                    className="editor-context-menu"
                                    style={{ left: editorCtxMenu.x, top: editorCtxMenu.y }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="editor-context-item" onClick={() => handleEditorCtxAction('insert-before')}>
                                        在前面插入段落
                                    </div>
                                    <div className="editor-context-item" onClick={() => handleEditorCtxAction('insert-after')}>
                                        在后面插入段落
                                    </div>
                                    <div className="editor-context-divider" />
                                    <div
                                        className={`editor-context-item${editorCtxMenu.hasSelection ? '' : ' disabled'}`}
                                        onClick={() => editorCtxMenu.hasSelection && handleEditorCtxAction('cut')}
                                    >
                                        <span>剪切</span>
                                        <span className="editor-context-shortcut">Ctrl+X</span>
                                    </div>
                                    <div
                                        className={`editor-context-item${editorCtxMenu.hasSelection ? '' : ' disabled'}`}
                                        onClick={() => editorCtxMenu.hasSelection && handleEditorCtxAction('copy')}
                                    >
                                        <span>复制</span>
                                        <span className="editor-context-shortcut">Ctrl+C</span>
                                    </div>
                                    <div className="editor-context-item" onClick={() => handleEditorCtxAction('paste')}>
                                        <span>粘贴</span>
                                        <span className="editor-context-shortcut">Ctrl+V</span>
                                    </div>
                                    <div className="editor-context-divider" />
                                    <div
                                        className={`editor-context-item${editorCtxMenu.hasSelection ? '' : ' disabled'}`}
                                        onClick={() => editorCtxMenu.hasSelection && handleEditorCtxAction('copy-rich')}
                                    >
                                        复制为富文本
                                    </div>
                                    <div
                                        className={`editor-context-item${editorCtxMenu.hasSelection ? '' : ' disabled'}`}
                                        onClick={() => editorCtxMenu.hasSelection && handleEditorCtxAction('copy-html')}
                                    >
                                        复制为 HTML
                                    </div>
                                    <div className="editor-context-item" onClick={() => handleEditorCtxAction('paste-plain')}>
                                        粘贴为纯文本
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : projectTree ? (
                        /* Scenario 2: Empty folder open — compact hint since sidebar shows the tree */
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
                        /* Scenario 1: No file/folder open — full welcome view */
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
        </div>
    );
}

export default App;
