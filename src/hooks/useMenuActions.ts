import { useCallback, useRef } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { saveSettings, type AppSettings } from '../utils/settings';
import type { EditorHandle } from '../components/Editor';
import type { Tab } from '../components/TabBar';
import type { SidebarPanel } from '../components/Sidebar';
import type { TocItem } from './useAppState';
import { t } from '../utils/i18n';
import { actionHandlers, type MenuActionContext } from './menuActionRegistry';

interface UseMenuActionsProps {
    sourceMode: boolean;
    focusMode: boolean;
    activeTabId: string;
    tabs: Tab[];
    activeSidebarPanel: SidebarPanel | null;
    checkingUpdate: boolean;
    autoSave: boolean;
    setSourceMode: React.Dispatch<React.SetStateAction<boolean>>;
    setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setFindReplaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setTypewriterMode: React.Dispatch<React.SetStateAction<boolean>>;
    setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>;
    setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setTableDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCheckingUpdate: React.Dispatch<React.SetStateAction<boolean>>;
    setAlwaysOnTop: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
    setCurrentLineEnding: (lineEnding: 'crlf' | 'lf') => void;
    setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
    setExportingPdf: React.Dispatch<React.SetStateAction<boolean>>;
    handleNewFile: () => void;
    handleOpenFile: () => void;
    handleOpenFolder: () => void;
    handleSaveFile: () => void;
    handleSaveAs: () => void;
    handleTabClose: (tabId: string) => void;
    setRenameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setRenameFileName: React.Dispatch<React.SetStateAction<string>>;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export interface UseMenuActionsReturn {
    toggleMenu: (menu: string) => void;
    handleMenuItemClick: (action: string) => Promise<void>;
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
        tabs,
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
        handleNewFile,
        handleOpenFile,
        handleOpenFolder,
        handleSaveFile,
        handleSaveAs,
        handleTabClose,
        setRenameDialogOpen,
        setRenameFileName,
        setCommandPaletteOpen,
        settings,
        setSettings,
    } = props;

    const toggleMenu = useCallback((menu: string) => {
        setActiveMenu(prev => prev === menu ? null : menu);
    }, [setActiveMenu]);

    // handleCheckUpdate is kept as its own stable callback (complex logic, standalone)
    const handleCheckUpdate = useCallback(async () => {
        setActiveMenu(null);
        setCheckingUpdate(true);

        try {
            const update = await check();

            if (update) {
                console.log(`Update found: ${update.version} released ${update.date}, changelog: ${update.body}`);

                const shouldInstall = confirm(t('messages.updateAvailable', {
                    version: update.version,
                    date: update.date,
                    body: update.body || t('messages.noChangelog'),
                }));

                if (shouldInstall) {
                    let downloaded = 0;
                    let contentLength = 0;

                    try {
                        await update.downloadAndInstall((event) => {
                            switch (event.event) {
                                case 'Started':
                                    contentLength = event.data.contentLength ?? 0;
                                    console.log(`Download started: ${contentLength} bytes`);
                                    break;
                                case 'Progress':
                                    downloaded += event.data.chunkLength;
                                    console.log(`Downloaded ${downloaded} / ${contentLength}`);
                                    break;
                                case 'Finished':
                                    console.log('Download complete');
                                    break;
                            }
                        });

                        console.log('Update installed');
                        await relaunch();
                    } catch (installError) {
                        console.error('Failed to install update:', installError);
                        alert(t('messages.updateInstallFailed'));
                    }
                }
            } else {
                alert(t('messages.noUpdate'));
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            alert(t('messages.checkUpdateFailed'));
        } finally {
            setCheckingUpdate(false);
        }
    }, [setActiveMenu, setCheckingUpdate]);

    // Build a stable context object via ref so handleMenuItemClick never needs re-creation
    const ctxRef = useRef<MenuActionContext>(null!);
    ctxRef.current = {
        editorRef,
        tabs,
        activeTabId,
        sourceMode,
        focusMode,
        autoSave,
        settings,
        setTabs,
        setActiveTabId: props.setActiveTabId,
        setActiveSidebarPanel,
        setSourceMode,
        setFocusMode,
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
        setExportingPdf: props.setExportingPdf,
        setSettings,
        setRenameDialogOpen,
        setRenameFileName,
        setCommandPaletteOpen,
        handleNewFile,
        handleOpenFile,
        handleOpenFolder,
        handleSaveFile,
        handleSaveAs,
        handleTabClose,
        handleCheckUpdate,
    };

    const handleMenuItemClick = useCallback(async (action: string) => {
        // Handle dynamic theme actions (setTheme:themeId)
        if (action.startsWith('setTheme:')) {
            const themeId = action.slice('setTheme:'.length);
            const newSettings = { ...ctxRef.current.settings, theme: themeId };
            await saveSettings(newSettings);
            ctxRef.current.setSettings(newSettings);
            ctxRef.current.setActiveMenu(null);
            return;
        }

        const handler = actionHandlers[action];
        if (handler) await handler(ctxRef.current);
    }, []); // Empty deps — everything accessed via ref

    const handleOutlineItemClick = useCallback((item: TocItem) => {
        editorRef.current?.scrollToHeading(item.slug);
    }, [editorRef]);

    return {
        toggleMenu,
        handleMenuItemClick,
        handleOutlineItemClick,
    };
}
