import { useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch, exit } from '@tauri-apps/plugin-process';
import { zoomIn, zoomOut, zoomReset } from '../utils/webview';
import { createSecondWindow } from '../utils/webviewWindow';
import { saveSettings, type AppSettings } from '../utils/settings';
import { readText as readClipboardText } from '@tauri-apps/plugin-clipboard-manager';
import { fsRename } from '../utils/file';
import type { EditorHandle } from '../components/Editor';
import type { Tab } from '../components/TabBar';
import type { SidebarPanel } from '../components/Sidebar';
import type { TocItem } from './useAppState';
import { exportHtml, exportPdf, printDocument } from '../utils/exportActions';

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
    handleNewFile: () => void;
    handleOpenFile: () => void;
    handleOpenFolder: () => void;
    handleSaveFile: () => void;
    handleSaveAs: () => void;
    handleTabClose: (tabId: string) => void;
    setRenameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setRenameFileName: React.Dispatch<React.SetStateAction<string>>;
}

export interface UseMenuActionsReturn {
    toggleMenu: (menu: string) => void;
    handleMenuItemClick: (action: string) => Promise<void>;
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
        tabs,
        autoSave,
        setSourceMode,
        setFocusMode,
        setTabs,
        setActiveTabId,
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

    const handleMenuItemClick = useCallback(async (action: string) => {
        switch (action) {
            case 'new':
                handleNewFile();
                break;
            case 'newTab':
                handleNewFile();
                setActiveMenu(null);
                break;
            case 'newWindow':
                await createSecondWindow();
                setActiveMenu(null);
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
            case 'autoSave':
                setAutoSave(prev => !prev);
                setActiveMenu(null);
                break;
            case 'moveTo': {
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab?.file) {
                    try {
                        const result = await save({
                            defaultPath: activeTab.file.path,
                        });
                        if (typeof result === 'string') {
                            await fsRename(activeTab.file.path, result);
                            const newName = result.split('/').pop() || result.split('\\').pop() || activeTab.file.name;
                            setTabs(prev => prev.map(t =>
                                t.id === activeTabId ? { ...t, file: { ...t.file!, path: result, name: newName }, dirty: true } : t
                            ));
                        }
                    } catch (error) {
                        console.error('Failed to move file:', error);
                        alert('移动文件失败');
                    }
                } else {
                    alert('请先打开一个文件');
                }
                setActiveMenu(null);
                break;
            }
            case 'rename': {
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab?.file) {
                    setRenameFileName(activeTab.file.name);
                    setRenameDialogOpen(true);
                } else {
                    alert('请先打开一个文件');
                }
                setActiveMenu(null);
                break;
            }
            case 'exportHtml':
                await exportHtml({ tabs, activeTabId, editorRef, setActiveMenu });
                break;
            case 'exportPdf':
                await exportPdf({ tabs, activeTabId, editorRef, setActiveMenu });
                break;
            case 'print':
                await printDocument({ tabs, activeTabId, editorRef, setActiveMenu });
                break;
            case 'closeTab':
                handleTabClose(activeTabId);
                setActiveMenu(null);
                break;
            case 'closeWindow':
                getCurrentWindow().close();
                setActiveMenu(null);
                break;
            case 'quit':
                exit(0);
                break;
            case 'sidebar':
                setActiveSidebarPanel(prev => prev ? null : 'explorer');
                setActiveMenu(null);
                break;
            case 'cut': {
                const sel = document.getSelection();
                if (sel && sel.rangeCount > 0) {
                    document.execCommand('cut');
                }
                setActiveMenu(null);
                break;
            }
            case 'copy': {
                const sel = document.getSelection();
                if (sel && sel.rangeCount > 0) {
                    document.execCommand('copy');
                }
                setActiveMenu(null);
                break;
            }
            case 'paste': {
                try {
                    const text = await readClipboardText();
                    editorRef.current?.pasteText(text);
                } catch {
                    // clipboard read failed — do nothing
                }
                setActiveMenu(null);
                break;
            }
            case 'copyAsRich':
                editorRef.current?.copyAsRich?.();
                setActiveMenu(null);
                break;
            case 'copyAsHtml':
                editorRef.current?.copyAsHtml?.();
                setActiveMenu(null);
                break;
            case 'pasteAsPlainText': {
                try {
                    const text = await readClipboardText();
                    editorRef.current?.pasteText(text, true);
                } catch {
                    // clipboard read failed — do nothing
                }
                setActiveMenu(null);
                break;
            }
            case 'selectAll':
                editorRef.current?.selectAll?.();
                setActiveMenu(null);
                break;
            case 'duplicate':
                editorRef.current?.format?.('duplicate');
                setActiveMenu(null);
                break;
            case 'createParagraph':
                editorRef.current?.insertParagraph?.('after');
                setActiveMenu(null);
                break;
            case 'deleteParagraph':
                editorRef.current?.deleteParagraph?.();
                setActiveMenu(null);
                break;
            case 'find':
                setFindReplaceOpen(prev => !prev);
                setActiveMenu(null);
                break;
            case 'findNext':
                editorRef.current?.find?.('next');
                setActiveMenu(null);
                break;
            case 'findPrevious':
                editorRef.current?.find?.('previous');
                setActiveMenu(null);
                break;
            case 'replace':
                setFindReplaceOpen(prev => !prev);
                setActiveMenu(null);
                break;
            case 'findInFolder':
                setActiveSidebarPanel('search');
                setActiveMenu(null);
                break;
            case 'setLineEndingCrlf':
                setCurrentLineEnding('crlf');
                setActiveMenu(null);
                break;
            case 'setLineEndingLf':
                setCurrentLineEnding('lf');
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
            // Format actions
            case 'toggleBold':
                editorRef.current?.format?.('strong');
                setActiveMenu(null);
                break;
            case 'toggleItalic':
                editorRef.current?.format?.('em');
                setActiveMenu(null);
                break;
            case 'toggleUnderline':
                editorRef.current?.format?.('u');
                setActiveMenu(null);
                break;
            case 'superscript':
                editorRef.current?.format?.('sup');
                setActiveMenu(null);
                break;
            case 'subscript':
                editorRef.current?.format?.('sub');
                setActiveMenu(null);
                break;
            case 'highlight':
                editorRef.current?.format?.('mark');
                setActiveMenu(null);
                break;
            case 'inlineCode':
                editorRef.current?.format?.('inline_code');
                setActiveMenu(null);
                break;
            case 'inlineMath':
                editorRef.current?.format?.('inline_math');
                setActiveMenu(null);
                break;
            case 'strikethrough':
                editorRef.current?.format?.('del');
                setActiveMenu(null);
                break;
            case 'insertLink':
                editorRef.current?.format?.('link');
                setActiveMenu(null);
                break;
            case 'insertImage': {
                setActiveMenu(null);
                // Show image selector (choose file or paste link)
                editorRef.current?.showImageSelector?.();
                break;
            }
            case 'clearFormatting':
                editorRef.current?.format?.('clear');
                setActiveMenu(null);
                break;
            case 'heading1':
                editorRef.current?.updateParagraph?.('heading 1');
                setActiveMenu(null);
                break;
            case 'heading2':
                editorRef.current?.updateParagraph?.('heading 2');
                setActiveMenu(null);
                break;
            case 'heading3':
                editorRef.current?.updateParagraph?.('heading 3');
                setActiveMenu(null);
                break;
            case 'heading4':
                editorRef.current?.updateParagraph?.('heading 4');
                setActiveMenu(null);
                break;
            case 'heading5':
                editorRef.current?.updateParagraph?.('heading 5');
                setActiveMenu(null);
                break;
            case 'heading6':
                editorRef.current?.updateParagraph?.('heading 6');
                setActiveMenu(null);
                break;
            case 'promoteHeading':
                editorRef.current?.updateParagraph?.('upgrade heading');
                setActiveMenu(null);
                break;
            case 'demoteHeading':
                editorRef.current?.updateParagraph?.('degrade heading');
                setActiveMenu(null);
                break;
            case 'table':
                setTableDialogOpen(true);
                setActiveMenu(null);
                break;
            case 'codeFences':
                editorRef.current?.updateParagraph?.('pre');
                setActiveMenu(null);
                break;
            case 'quoteBlock':
                editorRef.current?.updateParagraph?.('blockquote');
                setActiveMenu(null);
                break;
            case 'mathBlock':
                editorRef.current?.updateParagraph?.('mathblock');
                setActiveMenu(null);
                break;
            case 'htmlBlock':
                editorRef.current?.updateParagraph?.('html');
                setActiveMenu(null);
                break;
            case 'orderedList':
                editorRef.current?.updateParagraph?.('ol-order');
                setActiveMenu(null);
                break;
            case 'bulletList':
                editorRef.current?.updateParagraph?.('ul-bullet');
                setActiveMenu(null);
                break;
            case 'taskList':
                editorRef.current?.updateParagraph?.('ul-task');
                setActiveMenu(null);
                break;
            case 'looseListItem':
                editorRef.current?.updateParagraph?.('loose-list-item');
                setActiveMenu(null);
                break;
            case 'paragraph':
                editorRef.current?.updateParagraph?.('paragraph');
                setActiveMenu(null);
                break;
            case 'horizontalRule':
                editorRef.current?.updateParagraph?.('hr');
                setActiveMenu(null);
                break;
            case 'frontMatter':
                editorRef.current?.updateParagraph?.('front-matter');
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
        handleTabClose,
        sourceMode,
        focusMode,
        activeTabId,
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
        setAlwaysOnTop,
        setActiveMenu,
        setCurrentLineEnding,
        setAutoSave,
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