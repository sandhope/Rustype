import { useCallback, useEffect } from 'react';
import { dirname } from '@tauri-apps/api/path';
import { openMarkdownFile, readFileContent, saveMarkdownFile, getFileStat, openFolderDialog, readDirectoryTree, grantDirectoryAccess, detectLineEnding, type FileInfo, type FileTreeNode } from '../utils/file';
import { getRecentFiles, addRecentFile, removeRecentFile, getRecentFolders, addRecentFolder } from '../utils/recentFiles';
import type { Tab } from '../components/TabBar';
import type { SidebarPanel } from '../components/Sidebar';
import { getNextTabId } from './useAppState';

interface UseFileOperationsProps {
    tabs: Tab[];
    activeTabId: string;
    projectTree: FileTreeNode | null;
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
    setProjectTree: React.Dispatch<React.SetStateAction<FileTreeNode | null>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setRecentFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    setRecentFolders: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseFileOperationsReturn {
    handleOpenFolder: () => void;
    handleTreeRefresh: () => void;
    closeTabsForPath: (deletedPath: string) => void;
    handleFolderFileSelect: (filePath: string) => void;
    handleOpenFile: () => void;
    handleSaveFile: () => void;
    handleSaveAs: () => void;
    handleReloadFile: (tabId: string) => void;
    handleRecentFileSelect: (file: FileInfo) => void;
}

export function useFileOperations({
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
}: UseFileOperationsProps): UseFileOperationsReturn {
    const handleOpenFolder = useCallback(async () => {
        const dirPath = await openFolderDialog();
        if (!dirPath) {
            setActiveMenu(null);
            return;
        }

        try {
            await grantDirectoryAccess(dirPath);
        } catch (error) {
            console.error('Failed to grant directory access:', error);
        }

        const tree = await readDirectoryTree(dirPath);
        setProjectTree(tree);
        setActiveSidebarPanel('explorer');
        setActiveMenu(null);

        await addRecentFolder({ path: dirPath, name: dirPath.split(/[/\\]/).pop() || dirPath });
        setRecentFolders(await getRecentFolders());
    }, [setProjectTree, setActiveSidebarPanel, setActiveMenu, setRecentFolders]);

    const handleTreeRefresh = useCallback(async () => {
        if (!projectTree) return;
        const tree = await readDirectoryTree(projectTree.path);
        setProjectTree(tree);
    }, [projectTree, setProjectTree]);

    const closeTabsForPath = useCallback((deletedPath: string) => {
        setTabs(prev => {
            const remaining = prev.filter(t => !t.file || !t.file.path.startsWith(deletedPath));
            if (remaining.length !== prev.length) {
                setActiveTabId(activeId => {
                    const shouldChange = prev.find(t => t.id === activeId && t.file?.path.startsWith(deletedPath));
                    if (shouldChange) {
                        const newActiveId = remaining.length > 0 ? remaining[remaining.length - 1].id : '';
                        return newActiveId;
                    }
                    return activeId;
                });
            }
            return remaining;
        });
    }, [setTabs, setActiveTabId]);

    const handleFolderFileSelect = useCallback(async (filePath: string) => {
        try {
            const fileDir = await dirname(filePath);
            if (typeof window !== 'undefined') {
                window.DIRNAME = fileDir;
            }

            const fileName = filePath.split(/[/\\]/).pop() || '';
            const fileInfo: FileInfo = { path: filePath, name: fileName };

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
                id: getNextTabId(),
                file: fileInfo,
                content: fileContent,
                dirty: false,
                lastModified: fileStat?.mtime,
                externallyModified: false,
                lineEnding: detectLineEnding(fileContent),
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
        } catch (error) {
            console.error('Failed to open file from folder:', error);
        }
    }, [tabs, setTabs, setActiveTabId, setRecentFolders]);

    const handleOpenFile = useCallback(async () => {
        const fileInfo = await openMarkdownFile();
        if (fileInfo) {
            try {
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
                        id: getNextTabId(),
                        file: fileInfo,
                        content: fileContent,
                        dirty: false,
                        lastModified: stat?.mtime,
                        externallyModified: false,
                        lineEnding: detectLineEnding(fileContent),
                    };
                    setTabs(prev => [...prev, newTab]);
                    setActiveTabId(newTab.id);
                }
            } catch (error) {
                console.error('Failed to read file:', error);
                alert('无法读取文件');
            }
        }
        setActiveMenu(null);
    }, [tabs, setTabs, setActiveTabId, setRecentFiles, setActiveMenu]);

    const handleSaveFile = useCallback(async () => {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;

        const markdown = activeTab.content;
        const lineEnding = activeTab.lineEnding;

        if (activeTab.file) {
            await saveMarkdownFile(markdown, activeTab.file.path, lineEnding);
            const stat = await getFileStat(activeTab.file.path);
            setTabs(prev => prev.map(t =>
                t.id === activeTabId ? { ...t, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
            ));
        } else {
            const savedFile = await saveMarkdownFile(markdown, undefined, lineEnding);
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
    }, [tabs, activeTabId, setTabs, setRecentFiles, setActiveMenu]);

    const handleSaveAs = useCallback(async () => {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;

        const markdown = activeTab.content;
        const lineEnding = activeTab.lineEnding;
        const savedFile = await saveMarkdownFile(markdown, undefined, lineEnding);
        if (savedFile) {
            await addRecentFile(savedFile);
            setRecentFiles(await getRecentFiles());
            const stat = await getFileStat(savedFile.path);
            setTabs(prev => prev.map(t =>
                t.id === activeTabId ? { ...t, file: savedFile, content: markdown, dirty: false, lastModified: stat?.mtime, externallyModified: false } : t
            ));
        }
        setActiveMenu(null);
    }, [tabs, activeTabId, setTabs, setRecentFiles, setActiveMenu]);

    const handleReloadFile = useCallback(async (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab || !tab.file) return;

        try {
            const fileContent = await readFileContent(tab.file.path);
            const stat = await getFileStat(tab.file.path);
            setTabs(prev => prev.map(t =>
                t.id === tabId
                    ? {
                        ...t,
                        content: fileContent,
                        lastModified: stat?.mtime,
                        externallyModified: false,
                        dirty: false,
                        lineEnding: detectLineEnding(fileContent),
                    }
                    : t
            ));
            if (tabId === activeTabId) {
                setActiveTabId(tabId);
            }
        } catch (error) {
            console.error('Failed to reload file:', error);
            alert('无法重新加载文件');
        }
    }, [tabs, activeTabId, setTabs, setActiveTabId]);

    const handleRecentFileSelect = useCallback(async (file: FileInfo) => {
        try {
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
                    id: getNextTabId(),
                    file: file,
                    content: fileContent,
                    dirty: false,
                    lastModified: stat?.mtime,
                    externallyModified: false,
                    lineEnding: detectLineEnding(fileContent),
                };
                setTabs(prev => [...prev, newTab]);
                setActiveTabId(newTab.id);
            }
        } catch (error) {
            console.error('Failed to open recent file:', error);
            await removeRecentFile(file.path);
            setRecentFiles(await getRecentFiles());
            alert('文件已不存在或无法读取');
        }
    }, [tabs, setTabs, setActiveTabId, setRecentFiles]);

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
    }, [tabs, setTabs]);

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
                if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
                    try {
                        const content = await file.text();
                        const newTab: Tab = {
                            id: getNextTabId(),
                            file: { name: file.name, path: '' },
                            content,
                            dirty: true,
                            lineEnding: detectLineEnding(content),
                        };
                        setTabs(prev => [...prev, newTab]);
                        setActiveTabId(newTab.id);
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
    }, [setTabs, setActiveTabId]);

    return {
        handleOpenFolder,
        handleTreeRefresh,
        closeTabsForPath,
        handleFolderFileSelect,
        handleOpenFile,
        handleSaveFile,
        handleSaveAs,
        handleReloadFile,
        handleRecentFileSelect,
    };
}