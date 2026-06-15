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
