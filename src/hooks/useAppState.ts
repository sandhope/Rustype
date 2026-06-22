import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { dirname } from '@tauri-apps/api/path';
import { getRecentFiles, getRecentFolders } from '../utils/recentFiles';
import { loadSettings, type AppSettings, DEFAULT_SETTINGS } from '../utils/settings';
import { setZoomLevel } from '../utils/webview';
import { loadSession, saveSession } from '../utils/session';
import { readFileContent, getFileStat, grantDirectoryAccess, grantFileAccess, readDirectoryTree, getDefaultLineEnding, saveMarkdownFile, type FileInfo, type FileTreeNode } from '../utils/file';
import type { Tab } from '../components/TabBar';
import type { SidebarPanel } from '../components/Sidebar';
import { getWelcomeMarkdown } from '../constants';
import { t } from '../utils/i18n';

let tabIdCounter = 0;
export const getNextTabId = () => `tab-${++tabIdCounter}`;

function createNewTab(file: FileInfo | null = null, content: string = getWelcomeMarkdown(), lineEnding: 'crlf' | 'lf' = getDefaultLineEnding()): Tab {
    return {
        id: getNextTabId(),
        file,
        content,
        dirty: false,
        lineEnding,
    };
}

export interface TocItem {
    content: string;
    lvl: number;
    slug: string;
    githubSlug: string;
}

export interface UseAppStateReturn {
    tabs: Tab[];
    activeTabId: string;
    activeSidebarPanel: SidebarPanel | null;
    projectTree: FileTreeNode | null;
    recentFiles: FileInfo[];
    recentFolders: FileInfo[];
    setRecentFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    setRecentFolders: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    promptData: { tabId: string; filePath: string } | null;
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    settingsOpen: boolean;
    aboutOpen: boolean;
    shortcutsOpen: boolean;
    findReplaceOpen: boolean;
    sourceMode: boolean;
    focusMode: boolean;
    typewriterMode: boolean;
    tocItems: TocItem[];
    checkingUpdate: boolean;
    alwaysOnTop: boolean;
    activeMenu: string | null;
    openSubmenu: string | null;
    autoSave: boolean;
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setProjectTree: React.Dispatch<React.SetStateAction<FileTreeNode | null>>;
    setPromptData: React.Dispatch<React.SetStateAction<{ tabId: string; filePath: string } | null>>;
    setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setFindReplaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSourceMode: React.Dispatch<React.SetStateAction<boolean>>;
    setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
    setTypewriterMode: React.Dispatch<React.SetStateAction<boolean>>;
    setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>;
    setCheckingUpdate: React.Dispatch<React.SetStateAction<boolean>>;
    setAlwaysOnTop: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenSubmenu: React.Dispatch<React.SetStateAction<string | null>>;
    setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
    currentLineEnding: 'crlf' | 'lf';
    setCurrentLineEnding: (lineEnding: 'crlf' | 'lf') => void;
    handleNewFile: () => void;
    handleTabSelect: (tabId: string) => void;
    handleTabClose: (tabId: string) => void;
    handleTabReorder: (fromIndex: number, toIndex: number) => void;
    handleChange: (content: string) => void;
    handleSourceChange: (content: string) => void;
    activeTab: Tab | null;
    hasOpenFile: boolean;
    isRestoringRef: { current: boolean };
}

export function useAppState() {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');
    const [activeSidebarPanel, setActiveSidebarPanel] = useState<SidebarPanel | null>(null);
    const [projectTree, setProjectTree] = useState<FileTreeNode | null>(null);
    const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
    const [recentFolders, setRecentFolders] = useState<FileInfo[]>([]);
    const [promptData, setPromptData] = useState<{ tabId: string; filePath: string } | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
    const [findReplaceOpen, setFindReplaceOpen] = useState(false);
    const [sourceMode, setSourceMode] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [typewriterMode, setTypewriterMode] = useState(false);
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [alwaysOnTop, setAlwaysOnTop] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [autoSave, setAutoSave] = useState(false);

    const isRestoringRef = useRef(false);
    const tabsRef = useRef<Tab[]>(tabs);
    tabsRef.current = tabs;
    const activeTabIdRef = useRef<string>(activeTabId);
    activeTabIdRef.current = activeTabId;

    useEffect(() => {
        loadSettings().then((loaded) => {
            setSettings(loaded);
            setZoomLevel(loaded.zoomLevel);
        }).catch((err) => {
            console.error('Failed to load settings:', err);
        });
    }, []);

    // Sync standalone autoSave state with settings.autoSave (from settings panel or menu)
    useEffect(() => {
        setAutoSave(settings.autoSave);
    }, [settings.autoSave]);

    useEffect(() => {
        (async () => {
            const [files, folders] = await Promise.all([getRecentFiles(), getRecentFolders()]);
            setRecentFiles(files);
            setRecentFolders(folders);
        })();
    }, []);

    useEffect(() => {
        const restore = async () => {
            const session = await loadSession();
            if (!session) return;

            isRestoringRef.current = true;

            if (session.folderPath) {
                try {
                    await grantDirectoryAccess(session.folderPath);
                    const tree = await readDirectoryTree(session.folderPath);
                    setProjectTree(tree);
                    setActiveSidebarPanel('explorer');
                } catch {
                    // Folder no longer accessible, skip
                }
            }

            if (session.tabs.length > 0) {
                const tabPromises = session.tabs.map(async (savedTab) => {
                    if (savedTab.file?.path) {
                        try {
                            await grantFileAccess(savedTab.file.path);
                            const [content, stat] = await Promise.all([
                                readFileContent(savedTab.file.path),
                                getFileStat(savedTab.file.path),
                            ]);
                            return {
                                id: getNextTabId(),
                                file: savedTab.file,
                                content,
                                dirty: false,
                                lastModified: stat?.mtime,
                                externallyModified: false,
                                lineEnding: savedTab.lineEnding ?? 'lf',
                            } as Tab;
                        } catch {
                            // File was deleted or moved, skip this tab
                            return null;
                        }
                    } else {
                        return {
                            id: getNextTabId(),
                            file: null,
                            content: savedTab.content,
                            dirty: savedTab.content !== getWelcomeMarkdown(),
                            externallyModified: false,
                            lineEnding: savedTab.lineEnding ?? 'lf',
                        } as Tab;
                    }
                });

                const results = await Promise.allSettled(tabPromises);
                const restoredTabs = results
                    .filter((r): r is PromiseFulfilledResult<Tab | null> => r.status === 'fulfilled')
                    .map(r => r.value)
                    .filter((tab): tab is Tab => tab !== null);

                if (restoredTabs.length > 0) {
                    setTabs(restoredTabs);
                    const activeIdx = session.activeTabId
                        ? parseInt(session.activeTabId.split('-').pop() || '0', 10) - 1
                        : 0;
                    const safeIdx = Math.min(activeIdx, restoredTabs.length - 1);
                    const activeTab = restoredTabs[safeIdx >= 0 ? safeIdx : 0];
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
    }, []);

    useEffect(() => {
        if (!isRestoringRef.current) {
            saveSession({
                folderPath: projectTree?.path ?? null,
                tabs: tabs.map(t => ({ file: t.file, content: t.content, lastModified: t.lastModified, lineEnding: t.lineEnding })),
                activeTabId,
            });
        }
    }, [projectTree?.path, activeTabId, tabs]);

    const handleNewFile = useCallback(() => {
        const newTab = createNewTab();
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setActiveMenu(null);
    }, []);

    const handleTabSelect = useCallback((tabId: string) => {
        const tab = tabsRef.current.find(t => t.id === tabId);
        if (tab && tab.externallyModified) {
            setPromptData({ tabId, filePath: tab.file!.path });
        } else {
            setActiveTabId(tabId);
        }
    }, []);

    const handleTabClose = useCallback((tabId: string) => {
        setTabs(prevTabs => {
            const tabIndex = prevTabs.findIndex(t => t.id === tabId);
            const tab = prevTabs[tabIndex];

            if (!tab) return prevTabs;

            if (tab.dirty) {
                const confirmed = window.confirm(t('messages.unsavedChanges', { name: tab.file?.name || 'Untitled' }));
                if (!confirmed) return prevTabs;
            }

            const newTabs = prevTabs.filter(t => t.id !== tabId);

            if (newTabs.length === 0) {
                setActiveTabId('');
            } else {
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

    const handleChange = useCallback((content: string) => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, content, dirty: true } : t
        ));
    }, [activeTabId]);

    useEffect(() => {
        if (!autoSave) return;

        const currentTab = tabs.find(t => t.id === activeTabId);
        if (!currentTab || !currentTab.file || !currentTab.dirty) return;

        const debounce = setTimeout(async () => {
            try {
                const latestTabs = tabsRef.current;
                const latestActiveTabId = activeTabIdRef.current;
                const tab = latestTabs.find(t => t.id === latestActiveTabId);
                
                if (!tab || !tab.file || !tab.dirty) return;
                
                const markdown = tab.content;
                const lineEnding = tab.lineEnding;
                await saveMarkdownFile(markdown, tab.file.path, lineEnding);
                const stat = await getFileStat(tab.file.path);
                setTabs(prev => prev.map(t =>
                    t.id === latestActiveTabId ? { ...t, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
                ));
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, settings.autoSaveDelay);

        return () => clearTimeout(debounce);
    }, [autoSave, activeTabId, settings.autoSaveDelay]);

    const handleSourceChange = useCallback((content: string) => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, content, dirty: true } : t
        ));
    }, [activeTabId]);

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId]);
    const hasOpenFile = useMemo(() => tabs.length > 0 && activeTab !== null, [tabs, activeTab]);
    const currentLineEnding = useMemo(() => activeTab?.lineEnding ?? 'lf', [activeTab]);

    const setCurrentLineEnding = useCallback((lineEnding: 'crlf' | 'lf') => {
        setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, lineEnding, dirty: true } : t
        ));
    }, [activeTabId]);

    return {
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
        setSettings,
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
        setAutoSave,
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
        isRestoringRef,
    };
}