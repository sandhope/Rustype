import { useEffect, useCallback } from 'react';
import type { EditorHandle } from '../components/Editor';
import type { SidebarPanel } from '../components/Sidebar';

interface UseKeyboardShortcutsProps {
    findReplaceOpen: boolean;
    activeSidebarPanel: SidebarPanel | null;
    settingsOpen: boolean;
    aboutOpen: boolean;
    sourceMode: boolean;
    focusMode: boolean;
    setFindReplaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
    handleNewFile: () => void;
    handleOpenFile: () => void;
    handleOpenFolder: () => void;
    handleSaveFile: () => void;
    handleSaveAs: () => void;
    handleMenuAction: (action: string) => void;
}

export function useKeyboardShortcuts(
    props: UseKeyboardShortcutsProps,
    editorRef: React.RefObject<EditorHandle | null>
) {
    const {
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
        handleMenuAction,
    } = props;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

        // Single-modifier Ctrl/Cmd shortcuts
        // Examples:
        // Ctrl+B -> toggleBold
        // Ctrl+I -> toggleItalic
        // Ctrl+U -> toggleUnderline
        // Ctrl+E -> sourceMode
        // Ctrl+J -> sidebar
        // Ctrl+K -> outline
        // Ctrl+M -> minimizeWindow
        // Ctrl+- -> zoomOut
        // Ctrl+0 -> zoomReset
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    if (!sourceMode) {
                        e.preventDefault();
                        handleMenuAction('toggleBold');
                    }
                    break;
                case 'i':
                    if (!sourceMode) {
                        e.preventDefault();
                        handleMenuAction('toggleItalic');
                    }
                    break;
                case 'u':
                    if (!sourceMode) {
                        e.preventDefault();
                        handleMenuAction('toggleUnderline');
                    }
                    break;
                case '`':
                    if (!sourceMode) {
                        e.preventDefault();
                        handleMenuAction('inlineCode');
                    }
                    break;
                case 'l':
                    if (!sourceMode) {
                        e.preventDefault();
                        handleMenuAction('insertLink');
                    }
                    break;
                case 'd':
                    if (!sourceMode) {
                        e.preventDefault();
                        handleMenuAction('strikethrough');
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    handleNewFile();
                    break;
                case 'e':
                    e.preventDefault();
                    handleMenuAction('sourceMode');
                    break;
                case 'j':
                    e.preventDefault();
                    handleMenuAction('sidebar');
                    break;
                case 'k':
                    e.preventDefault();
                    handleMenuAction('outline');
                    break;
                case 'm':
                    e.preventDefault();
                    handleMenuAction('minimizeWindow');
                    break;
                case '-':
                    e.preventDefault();
                    handleMenuAction('zoomOut');
                    break;
                case '+':
                    e.preventDefault();
                    handleMenuAction('zoomIn');
                    break;
                case '0':
                    e.preventDefault();
                    handleMenuAction('zoomReset');
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

        // Ctrl+Shift shortcuts
        // Examples:
        // Ctrl+Shift+M -> inlineMath
        // Ctrl+Shift+H -> highlight
        // Ctrl+Shift+R -> clearFormatting
        // Ctrl+Shift+F -> toggle focus mode
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
            if (e.key === 'S' || e.key === 's') {
                e.preventDefault();
                handleSaveAs();
            }
            if (e.key === 'J' || e.key === 'j') {
                e.preventDefault();
                setFocusMode(prev => {
                    const next = !prev;
                    editorRef.current?.setFocusMode(next);
                    return next;
                });
            }
            if (!sourceMode) {
                // Ctrl+Shift++ -> zoomIn (mapped before superscript to prefer zoom)
                if (e.key === '+') {
                    e.preventDefault();
                    handleMenuAction('zoomIn');
                }
                if (e.key === 'M' || e.key === 'm') {
                    e.preventDefault();
                    handleMenuAction('inlineMath');
                }
                if (e.key === 'H' || e.key === 'h') {
                    e.preventDefault();
                    handleMenuAction('highlight');
                }
                if (e.key === 'G' || e.key === 'g') {
                    e.preventDefault();
                    handleMenuAction('typewriterMode');
                }
                if (e.key === 'R' || e.key === 'r') {
                    e.preventDefault();
                    handleMenuAction('clearFormatting');
                }
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    handleMenuAction('superscript');
                }
                // Ctrl+Shift+I -> open devtools
                if (e.key === 'I' || e.key === 'i') {
                    e.preventDefault();
                    handleMenuAction('openDevTools');
                }
            }
        }

        // Ctrl+= without Shift -> subscript
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === '=')) {
            if (!sourceMode) {
                e.preventDefault();
                handleMenuAction('subscript');
            }
        }

        // Ctrl+Alt+I -> insert image
        if ((e.ctrlKey || e.metaKey) && e.altKey && !e.shiftKey) {
            if (!sourceMode && (e.key === 'I' || e.key === 'i')) {
                e.preventDefault();
                handleMenuAction('insertImage');
            }
            // Ctrl+Alt+T -> toggle always on top
            if (!sourceMode && (e.key === 'T' || e.key === 't')) {
                e.preventDefault();
                handleMenuAction('toggleAlwaysOnTop');
            }
        }

        // F11 -> toggle fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            handleMenuAction('toggleFullscreen');
        }

        // F5 / Ctrl+F5 -> reload images or reload window
        if (e.key === 'F5') {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleMenuAction('reloadWindow');
            } else {
                e.preventDefault();
                handleMenuAction('reloadImages');
            }
        }

        if (e.key === 'Escape') {
            if (findReplaceOpen) setFindReplaceOpen(false);
            if (activeSidebarPanel === 'outline') setActiveSidebarPanel(null);
            if (settingsOpen) setSettingsOpen(false);
            if (aboutOpen) setAboutOpen(false);
        }
    }, [
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
        editorRef,
    ]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
