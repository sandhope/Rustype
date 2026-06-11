import { useRef, useState, useCallback, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import logo from '../src-tauri/icons/32x32.png';
import Editor, { type EditorHandle } from './components/Editor';
import TabBar, { type Tab } from './components/TabBar';
import Sidebar from './components/Sidebar';
import FindReplace from './components/FindReplace';
import SourceMode from './components/SourceMode';
import Outline from './components/Outline';
import SettingsPanel from './components/SettingsPanel';
import AboutDialog from './components/AboutDialog';
import { openMarkdownFile, readFileContent, saveMarkdownFile, getFileStat, type FileInfo } from './utils/file';
import { getRecentFiles, addRecentFile, removeRecentFile } from './utils/recentFiles';
import { loadSettings, saveSettings, type AppSettings } from './utils/settings';
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
    const [tabs, setTabs] = useState<Tab[]>([createNewTab()]);
    const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
    const [promptData, setPromptData] = useState<{ tabId: string; filePath: string } | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings>(loadSettings());

    // Feature flags for current tab
    const [findReplaceOpen, setFindReplaceOpen] = useState(false);
    const [sourceMode, setSourceMode] = useState(false);
    const [outlineOpen, setOutlineOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [typewriterMode, setTypewriterMode] = useState(false);
    const [tocItems, setTocItems] = useState<TocItem[]>([]);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    // Load recent files on mount
    useEffect(() => {
        setRecentFiles(getRecentFiles());
    }, []);

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
                try {
                    const stat = await getFileStat(tab.file.path);
                    if (stat && tab.lastModified && stat.mtime > tab.lastModified) {
                        setTabs(prev => prev.map(t =>
                            t.id === tab.id ? { ...t, externallyModified: true } : t
                        ));
                    }
                } catch (e) {
                    // File may have been deleted — ignore
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [tabs]);

    // Refresh TOC when tab changes
    useEffect(() => {
        if (outlineOpen && editorRef.current) {
            const toc = editorRef.current.getTOC();
            setTocItems(toc);
        }
    }, [activeTabId, outlineOpen, activeTab.content]);

    const handleNewFile = useCallback(() => {
        const newTab = createNewTab();
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        editorRef.current?.setContent(newTab.content);
        setActiveMenu(null);
    }, []);

    const handleOpenFile = useCallback(async () => {
        const fileInfo = await openMarkdownFile();
        if (fileInfo) {
            try {
                const fileContent = await readFileContent(fileInfo.path);
                const stat = await getFileStat(fileInfo.path);
                addRecentFile(fileInfo);
                setRecentFiles(getRecentFiles());

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
                addRecentFile(savedFile);
                setRecentFiles(getRecentFiles());
                const stat = await getFileStat(savedFile.path);
                setTabs(prev => prev.map(t =>
                    t.id === activeTabId ? { ...t, file: savedFile, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
                ));
            }
        }
        setActiveMenu(null);
    }, [activeTab, activeTabId, sourceMode]);

    const handleSaveAs = useCallback(async () => {
        const markdown = sourceMode
            ? activeTab.content
            : (editorRef.current?.getMarkdown() || activeTab.content);
        const savedFile = await saveMarkdownFile(markdown);
        if (savedFile) {
            addRecentFile(savedFile);
            setRecentFiles(getRecentFiles());
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

    const handleChange = useCallback(() => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, dirty: true } : t
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
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        const tab = tabs[tabIndex];

        if (tab.dirty) {
            const confirmed = window.confirm(`${tab.file?.name || 'Untitled'} 有未保存的更改，确定要关闭吗？`);
            if (!confirmed) return;
        }

        const newTabs = tabs.filter(t => t.id !== tabId);

        if (newTabs.length === 0) {
            const newTab = createNewTab();
            setTabs([newTab]);
            setActiveTabId(newTab.id);
            editorRef.current?.setContent(newTab.content);
        } else {
            setTabs(newTabs);
            if (tabId === activeTabId) {
                const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
                setActiveTabId(newTabs[newActiveIndex].id);
            }
        }
    }, [tabs, activeTabId]);

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

            setSidebarOpen(false);
        } catch (error) {
            console.error('Failed to open recent file:', error);
            removeRecentFile(file.path);
            setRecentFiles(getRecentFiles());
            alert('文件已不存在或无法读取');
        }
    }, [tabs]);

    const toggleMenu = useCallback((menu: string) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    }, []);

    const handleMenuItemClick = useCallback((action: string) => {
        switch (action) {
            case 'new':
                handleNewFile();
                break;
            case 'open':
                handleOpenFile();
                break;
            case 'save':
                handleSaveFile();
                break;
            case 'saveAs':
                handleSaveAs();
                break;
            case 'sidebar':
                setSidebarOpen(prev => !prev);
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
                setTypewriterMode(prev => !prev);
                setActiveMenu(null);
                break;
            case 'outline':
                if (editorRef.current) {
                    const toc = editorRef.current.getTOC();
                    setTocItems(toc);
                }
                setOutlineOpen(prev => !prev);
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
        }
    }, [handleNewFile, handleOpenFile, handleSaveFile, handleSaveAs, sourceMode, focusMode, activeTabId]);

    const handleSidebarClose = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const handleSettingsUpdate = useCallback((newSettings: AppSettings) => {
        setSettings(newSettings);
        saveSettings(newSettings);
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
        // Find the heading block and scroll to it
        try {
            const muya = (editorRef.current as any);
            if (muya?.muya?.editor?.scrollPage) {
                const scrollPage = muya.muya.editor.scrollPage;
                for (const node of scrollPage.children.iterator()) {
                    const blockName = node.blockName;
                    if (blockName === 'atx-heading' || blockName === 'setext-heading') {
                        const head = node.children.head;
                        const text = head?.text ?? '';
                        const content = blockName === 'setext-heading'
                            ? text.trim()
                            : text.replace(/^\s*#{1,6}\s+/, '').trim();
                        if (content === item.content && node.domNode) {
                            node.domNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }, []);

    // Keyboard shortcuts - placed after all callbacks are defined
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') {
                    if (findReplaceOpen) setFindReplaceOpen(false);
                    if (outlineOpen) setOutlineOpen(false);
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
                        handleOpenFile();
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
                if (outlineOpen) setOutlineOpen(false);
                if (settingsOpen) setSettingsOpen(false);
                if (aboutOpen) setAboutOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [findReplaceOpen, outlineOpen, settingsOpen, aboutOpen, sourceMode, handleNewFile, handleOpenFile, handleSaveFile, handleSaveAs]);

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
                                    <span className="menu-item-label">新建</span>
                                    <span className="menu-item-shortcut">Ctrl+N</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('open')}>
                                    <span className="menu-item-label">打开</span>
                                    <span className="menu-item-shortcut">Ctrl+O</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('save')}>
                                    <span className="menu-item-label">保存</span>
                                    <span className="menu-item-shortcut">Ctrl+S</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('saveAs')}>
                                    <span className="menu-item-label">另存为</span>
                                    <span className="menu-item-shortcut">Ctrl+Shift+S</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('sidebar')}>
                                    <span className="menu-item-label">{sidebarOpen ? '关闭' : '打开'} 最近文件</span>
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
                                    <span className="menu-item-label">查找 / 替换</span>
                                    <span className="menu-item-shortcut">Ctrl+F</span>
                                </div>
                                <div className="menu-item" onClick={() => { editorRef.current?.undo(); setActiveMenu(null); }}>
                                    <span className="menu-item-label">撤销</span>
                                    <span className="menu-item-shortcut">Ctrl+Z</span>
                                </div>
                                <div className="menu-item" onClick={() => { editorRef.current?.redo(); setActiveMenu(null); }}>
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
                                <div className="menu-item" onClick={() => handleMenuItemClick('sourceMode')}>
                                    <span className="menu-item-label">源代码模式</span>
                                    <span className="menu-item-shortcut">{sourceMode ? '✓' : ''}</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('focusMode')}>
                                    <span className="menu-item-label">聚焦模式</span>
                                    <span className="menu-item-shortcut">{focusMode ? '✓' : ''}</span>
                                </div>
                                <div className="menu-item" onClick={() => handleMenuItemClick('typewriterMode')}>
                                    <span className="menu-item-label">打字机模式</span>
                                    <span className="menu-item-shortcut">{typewriterMode ? '✓' : ''}</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('outline')}>
                                    <span className="menu-item-label">显示大纲</span>
                                    <span className="menu-item-shortcut">{outlineOpen ? '✓' : ''}</span>
                                </div>
                                <div className="menu-divider" />
                                <div className="menu-item" onClick={() => handleMenuItemClick('settings')}>
                                    <span className="menu-item-label">设置</span>
                                    <span className="menu-item-shortcut">Ctrl+,</span>
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
                                <div className="menu-item" onClick={() => handleMenuItemClick('about')}>
                                    <span className="menu-item-label">关于 Rustype</span>
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
                    isOpen={sidebarOpen}
                    recentFiles={recentFiles}
                    onFileSelect={handleRecentFileSelect}
                    onClose={handleSidebarClose}
                />

                <div className="app-content">
                    <TabBar
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabSelect={handleTabSelect}
                        onTabClose={handleTabClose}
                        onTabReorder={handleTabReorder}
                    />
                    <div className="editor-container">
                        {sourceMode ? (
                            <SourceMode
                                content={activeTab.content}
                                onChange={handleSourceChange}
                            />
                        ) : (
                            <Editor
                                ref={editorRef}
                                initialContent={activeTab.content}
                                onChange={handleChange}
                            />
                        )}
                    </div>

                    {findReplaceOpen && !sourceMode && (
                        <FindReplace
                            editorRef={editorRef}
                            onClose={() => setFindReplaceOpen(false)}
                        />
                    )}

                    {outlineOpen && !sourceMode && (
                        <Outline
                            items={tocItems}
                            onClose={() => setOutlineOpen(false)}
                            onItemClick={handleOutlineItemClick}
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
        </div>
    );
}

export default App;
