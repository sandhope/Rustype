import { getCurrentWindow } from '@tauri-apps/api/window';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { readText as readClipboardText } from '@tauri-apps/plugin-clipboard-manager';
import { exit } from '@tauri-apps/plugin-process';
import { zoomIn, zoomOut, zoomReset } from '../utils/webview';
import { createSecondWindow } from '../utils/webviewWindow';
import { saveSettings, type AppSettings } from '../utils/settings';
import { fsRename } from '../utils/file';
import type { EditorHandle } from '../components/Editor';
import type { Tab } from '../components/TabBar';
import type { SidebarPanel } from '../components/Sidebar';
import type { TocItem } from './useAppState';
import { exportHtml, exportPdf, printDocument } from '../utils/exportActions';
import { t } from '../utils/i18n';

export interface MenuActionContext {
    editorRef: React.RefObject<EditorHandle | null>;
    tabs: Tab[];
    activeTabId: string;
    sourceMode: boolean;
    focusMode: boolean;
    autoSave: boolean;
    settings: AppSettings;
    setTabs: React.Dispatch<React.SetStateAction<Tab[]>>;
    setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setSourceMode: React.Dispatch<React.SetStateAction<boolean>>;
    setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
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
    setExportingPdf: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentLineEnding: (lineEnding: 'crlf' | 'lf') => void;
    setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    setRenameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setRenameFileName: React.Dispatch<React.SetStateAction<string>>;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleNewFile: () => void;
    handleOpenFile: () => void;
    handleOpenFolder: () => void;
    handleSaveFile: () => void;
    handleSaveAs: () => void;
    handleTabClose: (tabId: string) => void;
    handleCheckUpdate: () => Promise<void>;
}

export type MenuActionHandler = (ctx: MenuActionContext) => void | Promise<void>;

// Helper to create format handlers
const formatAction = (type: string): MenuActionHandler => (ctx) => {
    ctx.editorRef.current?.format?.(type);
    ctx.setActiveMenu(null);
};

// Helper to create block/paragraph handlers
const blockAction = (type: string): MenuActionHandler => (ctx) => {
    ctx.editorRef.current?.updateParagraph?.(type);
    ctx.setActiveMenu(null);
};

export const actionHandlers: Record<string, MenuActionHandler> = {
    // ── File actions ──
    'new': (ctx) => {
        ctx.handleNewFile();
    },
    'newTab': (ctx) => {
        ctx.handleNewFile();
        ctx.setActiveMenu(null);
    },
    'newWindow': async (ctx) => {
        await createSecondWindow();
        ctx.setActiveMenu(null);
    },
    'openFile': (ctx) => {
        ctx.handleOpenFile();
    },
    'openFolder': (ctx) => {
        ctx.handleOpenFolder();
    },
    'save': (ctx) => {
        ctx.handleSaveFile();
    },
    'saveAs': (ctx) => {
        ctx.handleSaveAs();
    },
    'autoSave': async (ctx) => {
        const newAutoSave = !ctx.autoSave;
        ctx.setAutoSave(newAutoSave);
        const newSettings = { ...ctx.settings, autoSave: newAutoSave };
        await saveSettings(newSettings);
        ctx.setSettings(newSettings);
        ctx.setActiveMenu(null);
    },
    'moveTo': async (ctx) => {
        const activeTab = ctx.tabs.find(t => t.id === ctx.activeTabId);
        if (activeTab?.file) {
            try {
                const result = await save({
                    defaultPath: activeTab.file.path,
                });
                if (typeof result === 'string') {
                    await fsRename(activeTab.file.path, result);
                    const newName = result.split('/').pop() || result.split('\\').pop() || activeTab.file.name;
                    ctx.setTabs(prev => prev.map(t =>
                        t.id === ctx.activeTabId ? { ...t, file: { ...t.file!, path: result, name: newName }, dirty: true } : t
                    ));
                }
            } catch (error) {
                console.error('Failed to move file:', error);
                alert(t('messages.moveFileFailed'));
            }
        } else {
            alert(t('messages.openFileFirst'));
        }
        ctx.setActiveMenu(null);
    },
    'rename': (ctx) => {
        const activeTab = ctx.tabs.find(t => t.id === ctx.activeTabId);
        if (activeTab?.file) {
            ctx.setRenameFileName(activeTab.file.name);
            ctx.setRenameDialogOpen(true);
        } else {
            alert(t('messages.openFileFirst'));
        }
        ctx.setActiveMenu(null);
    },
    'exportHtml': async (ctx) => {
        await exportHtml({ tabs: ctx.tabs, activeTabId: ctx.activeTabId, editorRef: ctx.editorRef, setActiveMenu: ctx.setActiveMenu });
    },
    'exportPdf': async (ctx) => {
        await exportPdf({ tabs: ctx.tabs, activeTabId: ctx.activeTabId, editorRef: ctx.editorRef, setActiveMenu: ctx.setActiveMenu, setExportingPdf: ctx.setExportingPdf });
    },
    'print': async (ctx) => {
        await printDocument({ tabs: ctx.tabs, activeTabId: ctx.activeTabId, editorRef: ctx.editorRef, setActiveMenu: ctx.setActiveMenu });
    },
    'closeTab': (ctx) => {
        ctx.handleTabClose(ctx.activeTabId);
        ctx.setActiveMenu(null);
    },
    'closeWindow': (ctx) => {
        getCurrentWindow().close();
        ctx.setActiveMenu(null);
    },
    'quit': () => {
        exit(0);
    },

    // ── Edit actions ──
    'cut': (ctx) => {
        const sel = document.getSelection();
        if (sel && sel.rangeCount > 0) {
            document.execCommand('cut');
        }
        ctx.setActiveMenu(null);
    },
    'copy': (ctx) => {
        const sel = document.getSelection();
        if (sel && sel.rangeCount > 0) {
            document.execCommand('copy');
        }
        ctx.setActiveMenu(null);
    },
    'paste': async (ctx) => {
        try {
            const text = await readClipboardText();
            ctx.editorRef.current?.pasteText(text);
        } catch {
            // clipboard read failed — do nothing
        }
        ctx.setActiveMenu(null);
    },
    'copyAsRich': (ctx) => {
        ctx.editorRef.current?.copyAsRich?.();
        ctx.setActiveMenu(null);
    },
    'copyAsHtml': (ctx) => {
        ctx.editorRef.current?.copyAsHtml?.();
        ctx.setActiveMenu(null);
    },
    'pasteAsPlainText': async (ctx) => {
        try {
            const text = await readClipboardText();
            ctx.editorRef.current?.pasteText(text, true);
        } catch {
            // clipboard read failed — do nothing
        }
        ctx.setActiveMenu(null);
    },
    'selectAll': (ctx) => {
        ctx.editorRef.current?.selectAll?.();
        ctx.setActiveMenu(null);
    },
    'duplicate': formatAction('duplicate'),
    'createParagraph': (ctx) => {
        ctx.editorRef.current?.insertParagraph?.('after');
        ctx.setActiveMenu(null);
    },
    'deleteParagraph': (ctx) => {
        ctx.editorRef.current?.deleteParagraph?.();
        ctx.setActiveMenu(null);
    },

    // ── View actions ──
    'sidebar': (ctx) => {
        ctx.setActiveSidebarPanel(prev => prev ? null : 'explorer');
        ctx.setActiveMenu(null);
    },
    'find': (ctx) => {
        ctx.setFindReplaceOpen(prev => !prev);
        ctx.setActiveMenu(null);
    },
    'findNext': (ctx) => {
        ctx.editorRef.current?.find?.('next');
        ctx.setActiveMenu(null);
    },
    'findPrevious': (ctx) => {
        ctx.editorRef.current?.find?.('previous');
        ctx.setActiveMenu(null);
    },
    'replace': (ctx) => {
        ctx.setFindReplaceOpen(prev => !prev);
        ctx.setActiveMenu(null);
    },
    'findInFolder': (ctx) => {
        ctx.setActiveSidebarPanel('search');
        ctx.setActiveMenu(null);
    },
    'setLineEndingCrlf': (ctx) => {
        ctx.setCurrentLineEnding('crlf');
        ctx.setActiveMenu(null);
    },
    'setLineEndingLf': (ctx) => {
        ctx.setCurrentLineEnding('lf');
        ctx.setActiveMenu(null);
    },
    'sourceMode': (ctx) => {
        if (!ctx.sourceMode && ctx.editorRef.current) {
            const md = ctx.editorRef.current.getMarkdown();
            ctx.setTabs(prev => prev.map(t =>
                t.id === ctx.activeTabId ? { ...t, content: md } : t
            ));
        }
        ctx.setSourceMode(prev => !prev);
        ctx.setActiveMenu(null);
    },
    'focusMode': (ctx) => {
        const nextFocus = !ctx.focusMode;
        ctx.setFocusMode(nextFocus);
        ctx.editorRef.current?.setFocusMode(nextFocus);
        ctx.setActiveMenu(null);
    },
    'typewriterMode': (ctx) => {
        ctx.setTypewriterMode(prev => {
            const next = !prev;
            if (next && ctx.editorRef.current) {
                ctx.editorRef.current.scrollToCursor();
            }
            return next;
        });
        ctx.setActiveMenu(null);
    },
    'outline': (ctx) => {
        if (ctx.editorRef.current) {
            const toc = ctx.editorRef.current.getTOC();
            ctx.setTocItems(toc);
        }
        ctx.setActiveSidebarPanel(prev => prev === 'outline' ? null : 'outline');
        ctx.setActiveMenu(null);
    },
    'commandPalette': (ctx) => {
        ctx.setCommandPaletteOpen(true);
        ctx.setActiveMenu(null);
    },
    'reloadImages': (ctx) => {
        ctx.editorRef.current?.reloadImages();
        ctx.setActiveMenu(null);
    },
    'reloadWindow': (ctx) => {
        window.location.reload();
        ctx.setActiveMenu(null);
    },
    'openDevTools': (ctx) => {
        invoke('open_devtools');
        ctx.setActiveMenu(null);
    },
    'minimizeWindow': (ctx) => {
        getCurrentWindow().minimize();
        ctx.setActiveMenu(null);
    },
    'toggleAlwaysOnTop': (ctx) => {
        ctx.setAlwaysOnTop(prev => {
            const next = !prev;
            getCurrentWindow().setAlwaysOnTop(next);
            return next;
        });
        ctx.setActiveMenu(null);
    },
    'toggleFullscreen': (ctx) => {
        invoke('toggle_fullscreen');
        ctx.setActiveMenu(null);
    },

    // ── Theme actions ──
    'themeSystem': async (ctx) => {
        const newSettings = { ...ctx.settings, theme: 'system' };
        await saveSettings(newSettings);
        ctx.setSettings(newSettings);
        ctx.setActiveMenu(null);
    },
    'themeLight': async (ctx) => {
        const newSettings = { ...ctx.settings, theme: 'cadmium-light' };
        await saveSettings(newSettings);
        ctx.setSettings(newSettings);
        ctx.setActiveMenu(null);
    },
    'themeDark': async (ctx) => {
        const newSettings = { ...ctx.settings, theme: 'cadmium-dark' };
        await saveSettings(newSettings);
        ctx.setSettings(newSettings);
        ctx.setActiveMenu(null);
    },
    'setTheme': async (ctx) => {
        // Dead case — kept for completeness. The prefix check in useMenuActions handles setTheme:xxx.
        const newSettings = { ...ctx.settings, theme: 'system' };
        await saveSettings(newSettings);
        ctx.setSettings(newSettings);
        ctx.setActiveMenu(null);
    },

    // ── Format actions ──
    'toggleBold': formatAction('strong'),
    'toggleItalic': formatAction('em'),
    'toggleUnderline': formatAction('u'),
    'superscript': formatAction('sup'),
    'subscript': formatAction('sub'),
    'highlight': formatAction('mark'),
    'inlineCode': formatAction('inline_code'),
    'inlineMath': formatAction('inline_math'),
    'strikethrough': formatAction('del'),
    'insertLink': formatAction('link'),
    'insertImage': (ctx) => {
        ctx.setActiveMenu(null);
        ctx.editorRef.current?.showImageSelector?.();
    },
    'clearFormatting': formatAction('clear'),

    // ── Block actions ──
    'heading1': blockAction('heading 1'),
    'heading2': blockAction('heading 2'),
    'heading3': blockAction('heading 3'),
    'heading4': blockAction('heading 4'),
    'heading5': blockAction('heading 5'),
    'heading6': blockAction('heading 6'),
    'promoteHeading': blockAction('upgrade heading'),
    'demoteHeading': blockAction('degrade heading'),
    'table': (ctx) => {
        ctx.setTableDialogOpen(true);
        ctx.setActiveMenu(null);
    },
    'codeFences': blockAction('pre'),
    'quoteBlock': blockAction('blockquote'),
    'mathBlock': blockAction('mathblock'),
    'htmlBlock': blockAction('html'),
    'orderedList': blockAction('ol-order'),
    'bulletList': blockAction('ul-bullet'),
    'taskList': blockAction('ul-task'),
    'looseListItem': blockAction('loose-list-item'),
    'paragraph': blockAction('paragraph'),
    'horizontalRule': blockAction('hr'),
    'frontMatter': blockAction('front-matter'),

    // ── Zoom actions ──
    'zoomIn': async (ctx) => {
        const level = await zoomIn(ctx.settings.zoomLevel);
        const newSettings = { ...ctx.settings, zoomLevel: level };
        ctx.setSettings(newSettings);
        saveSettings(newSettings);
    },
    'zoomOut': async (ctx) => {
        const level = await zoomOut(ctx.settings.zoomLevel);
        const newSettings = { ...ctx.settings, zoomLevel: level };
        ctx.setSettings(newSettings);
        saveSettings(newSettings);
    },
    'zoomReset': async (ctx) => {
        const level = await zoomReset();
        const newSettings = { ...ctx.settings, zoomLevel: level };
        ctx.setSettings(newSettings);
        saveSettings(newSettings);
    },

    // ── Settings / Help actions ──
    'settings': (ctx) => {
        ctx.setSettingsOpen(true);
        ctx.setActiveMenu(null);
    },
    'about': (ctx) => {
        ctx.setAboutOpen(true);
        ctx.setActiveMenu(null);
    },
    'shortcuts': (ctx) => {
        ctx.setShortcutsOpen(true);
        ctx.setActiveMenu(null);
    },
    'releaseNotes': (ctx) => {
        openUrl('https://github.com/sandhope/Rustype/releases');
        ctx.setActiveMenu(null);
    },
    'support': (ctx) => {
        openUrl('https://opencollective.com/sandhope');
        ctx.setActiveMenu(null);
    },
    'viewSource': (ctx) => {
        openUrl('https://github.com/sandhope/Rustype');
        ctx.setActiveMenu(null);
    },
    'reportIssue': (ctx) => {
        openUrl('https://github.com/sandhope/Rustype/issues');
        ctx.setActiveMenu(null);
    },
    'license': (ctx) => {
        openUrl('https://github.com/sandhope/Rustype/blob/main/LICENSE');
        ctx.setActiveMenu(null);
    },
    'checkUpdate': (ctx) => {
        ctx.handleCheckUpdate();
    },
};
