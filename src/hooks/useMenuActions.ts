import { useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { zoomIn, zoomOut, zoomReset } from '../utils/webview';
import { saveSettings, type AppSettings } from '../utils/settings';
import type { EditorHandle } from '../components/Editor';
import type { Tab } from '../components/TabBar';
import type { SidebarPanel } from '../components/Sidebar';
import type { TocItem } from './useAppState';

interface UseMenuActionsProps {
    sourceMode: boolean;
    focusMode: boolean;
    activeTabId: string;
    tabs: Tab[];
    activeSidebarPanel: SidebarPanel | null;
    checkingUpdate: boolean;
    setSourceMode: React.Dispatch<React.SetStateAction<boolean>>;
    setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setFindReplaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setTypewriterMode: React.Dispatch<React.SetStateAction<boolean>>;
    setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>;
    setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCheckingUpdate: React.Dispatch<React.SetStateAction<boolean>>;
    setAlwaysOnTop: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
    handleNewFile: () => void;
    handleOpenFile: () => void;
    handleOpenFolder: () => void;
    handleSaveFile: () => void;
    handleSaveAs: () => void;
}

export interface UseMenuActionsReturn {
    toggleMenu: (menu: string) => void;
    handleMenuItemClick: (action: string) => void;
    handleSettingsUpdate: (newSettings: AppSettings) => Promise<void>;
    handleOutlineItemClick: (item: TocItem) => void;
}

export function useMenuActions(
    props: UseMenuActionsProps,
    editorRef: React.RefObject<EditorHandle | null>
): UseMenuActionsReturn {
    const {
        sourceMode,
        focusMode,
        activeTabId,
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
        setCheckingUpdate,
        setAlwaysOnTop,
        setActiveMenu,
        handleNewFile,
        handleOpenFile,
        handleOpenFolder,
        handleSaveFile,
        handleSaveAs,
    } = props;

    const toggleMenu = useCallback((menu: string) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    }, [setActiveMenu]);

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
    }, [setActiveMenu, setCheckingUpdate]);

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
            case 'minimizeWindow':
                getCurrentWindow().minimize();
                setActiveMenu(null);
                break;
            case 'toggleAlwaysOnTop':
                setAlwaysOnTop(prev => {
                    const next = !prev;
                    getCurrentWindow().setAlwaysOnTop(next);
                    return next;
                });
                setActiveMenu(null);
                break;
            case 'zoomIn':
                zoomIn();
                break;
            case 'zoomOut':
                zoomOut();
                break;
            case 'zoomReset':
                zoomReset();
                break;
            case 'toggleFullscreen':
                invoke('toggle_fullscreen');
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
    }, [
        handleNewFile,
        handleOpenFile,
        handleOpenFolder,
        handleSaveFile,
        handleSaveAs,
        sourceMode,
        focusMode,
        activeTabId,
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
        setAlwaysOnTop,
        setActiveMenu,
        handleCheckUpdate,
        editorRef,
    ]);

    const handleSettingsUpdate = useCallback(async (newSettings: AppSettings) => {
        await saveSettings(newSettings);
    }, []);

    const handleOutlineItemClick = useCallback((item: TocItem) => {
        editorRef.current?.scrollToHeading(item.slug);
    }, [editorRef]);

    return {
        toggleMenu,
        handleMenuItemClick,
        handleSettingsUpdate,
        handleOutlineItemClick,
    };
}