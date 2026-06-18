import { useHotkeys, type HotkeyCallback } from 'react-hotkeys-hook';
import type { EditorHandle } from '../components/Editor';
import type { SidebarPanel } from '../components/Sidebar';
import { shortcuts, type ShortcutBinding } from '../constants/shortcuts';

interface UseKeyboardShortcutsProps {
    findReplaceOpen: boolean;
    activeSidebarPanel: SidebarPanel | null;
    settingsOpen: boolean;
    aboutOpen: boolean;
    sourceMode: boolean;
    commandPaletteOpen: boolean;
    setFindReplaceOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveSidebarPanel: React.Dispatch<React.SetStateAction<SidebarPanel | null>>;
    setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleMenuAction: (action: string) => void;
}

// Used for useHotkeys method 1
const { shortcutsMap, allHotkeys } = (() => {
    const map = new Map<string, ShortcutBinding>();

    for (const shortcut of shortcuts) {
        for (const key of shortcut.keys.split(',')) {
            map.set(key.trim().toLowerCase(), shortcut);
        }
    }

    return {
        shortcutsMap: map,
        allHotkeys: [...map.keys()]
    };
})();

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
        commandPaletteOpen,
        setFindReplaceOpen,
        setActiveSidebarPanel,
        setSettingsOpen,
        setAboutOpen,
        setCommandPaletteOpen,
        handleMenuAction,
    } = props;

    // Handle Escape key
    const handleEscape = () => {
        console.log(settingsOpen);
        if (commandPaletteOpen) setCommandPaletteOpen(false);
        if (findReplaceOpen) setFindReplaceOpen(false);
        if (activeSidebarPanel === 'outline') setActiveSidebarPanel(null);
        if (settingsOpen) setSettingsOpen(false);
        if (aboutOpen) setAboutOpen(false);
    };

    useHotkeys('escape', handleEscape, {
        enableOnFormTags: true,
        enableOnContentEditable: true,
    }, [commandPaletteOpen, findReplaceOpen, activeSidebarPanel, settingsOpen, aboutOpen]);

    // method 1
    const handleShortcut: HotkeyCallback = (e, handler) => {
            const shortcut = shortcutsMap.get(handler.hotkey);
            if (!shortcut) {
                console.log('Unknown shortcut:', handler.hotkey);
                return;
            };
            
            const target = e.target as HTMLElement;
            const isFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (shortcut.ignoreOnFocused && isFocused) return;

            e.preventDefault();

            if (shortcut.ignoreInSourceMode && sourceMode) return;
            if (shortcut.requireEditor && !editorRef.current) return;

            if (shortcut.editorAction && editorRef.current) {
                shortcut.editorAction(editorRef.current);
            }

            handleMenuAction(shortcut.action);
    };
    useHotkeys(allHotkeys, handleShortcut, {
        enableOnFormTags: true,
        enableOnContentEditable: true,
    }, [sourceMode, handleMenuAction]);

    // method 2
    // shortcuts.forEach((shortcut) => {
    //     const handleShortcut: HotkeyCallback = (e) => {
    //         const target = e.target as HTMLElement;
    //         const isFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    //         if (shortcut.ignoreOnFocused && isFocused) return;

    //         e.preventDefault();

    //         if (shortcut.ignoreInSourceMode && sourceMode) return;
    //         if (shortcut.requireEditor && !editorRef.current) return;

    //         if (shortcut.editorAction && editorRef.current) {
    //             shortcut.editorAction(editorRef.current);
    //         }

    //         handleMenuAction(shortcut.action);
    //     };

    //     // Listening to the produced character
    //     // If you care about the character itself — for example, you want ? to open a help dialog 
    //     // whether the user is on a US layout (shift+/) or a German layout (shift+ß) — 
    //     // set useKey: true and pass the character directly:

    //     // Watch out for + and ,
    //     // By default, + is the splitKey that joins keys in a combination, and , is the delimiter that separates multiple hotkeys. 
    //     // To listen for those characters themselves, either switch to the physical-key approach (Equal/Comma) or change the option:
    //     // // Listen to the '+' character by changing the splitKey
    //     // useHotkeys('ctrl-+', addItem, { splitKey: '-' })

    //     useHotkeys(shortcut.keys, handleShortcut, {
    //         enableOnFormTags: true,
    //         enableOnContentEditable: true,
    //         /**
    //          * enabling this will prevent other shortcuts from working, like Ctrl+C, Ctrl+V, etc.
    //          * you need to handle them in handleShortcut
    //          */
    //         //preventDefault: true,
    //     }, [sourceMode, handleMenuAction]);
    // });
}
