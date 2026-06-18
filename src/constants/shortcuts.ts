import type { EditorHandle } from '../components/Editor';

export interface ShortcutBinding {
    keys: string;
    action: string;
    editorAction?: (editor: EditorHandle) => void;
    ignoreOnFocused?: boolean;
    requireEditor?: boolean;
    ignoreInSourceMode?: boolean;
}

export const shortcuts: ShortcutBinding[] = [
    { keys: 'mod+t', action: 'newTab'},
    { keys: 'mod+n', action: 'newWindow'},
    { keys: 'mod+o', action: 'openFile'},
    { keys: 'mod+shift+o', action: 'openFolder'},
    { keys: 'mod+s', action: 'save', requireEditor: true},
    { keys: 'mod+shift+s', action: 'saveAs', requireEditor: true},
    { keys: 'mod+alt+e', action: 'exportPdf', requireEditor: true},
    { keys: 'mod+p', action: 'print', requireEditor: true},
    { keys: 'mod+comma', action: 'settings'},
    { keys: 'mod+w', action: 'closeTab', requireEditor: true},
    { keys: 'mod+shift+w', action: 'closeWindow'},
    { keys: 'mod+q', action: 'quit'},

    { keys: 'mod+z', action: 'undo', editorAction: (e) => e.undo(), requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+z', action: 'redo', editorAction: (e) => e.redo(), requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+x', action: 'cut', requireEditor: true},
    { keys: 'mod+c', action: 'copy', requireEditor: true},
    { keys: 'mod+v', action: 'paste', requireEditor: true},
    { keys: 'mod+shift+c', action: 'copyAsRich', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+v', action: 'pasteAsPlainText', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+a', action: 'selectAll', editorAction: (e) => e.selectAll(), requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+d', action: 'duplicate', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+n', action: 'createParagraph', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+d', action: 'deleteParagraph', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+f', action: 'find', requireEditor: true},
    { keys: 'f3', action: 'findNext', editorAction: (e) => e.find('next'), requireEditor: true},
    { keys: 'shift+f3', action: 'findPrevious', editorAction: (e) => e.find('previous'), requireEditor: true},
    { keys: 'mod+h', action: 'replace', requireEditor: true},
    { keys: 'mod+shift+f', action: 'findInFolder'},

    { keys: 'mod+1', action: 'heading1', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+2', action: 'heading2', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+3', action: 'heading3', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+4', action: 'heading4', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+5', action: 'heading5', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+6', action: 'heading6', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+equal, mod+alt+numpadadd', action: 'promoteHeading', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+minus, mod+alt+numpadsubtract', action: 'demoteHeading', requireEditor: true, ignoreInSourceMode: true},   
    { keys: 'mod+shift+t', action: 'table', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+k', action: 'codeFences', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+q', action: 'quoteBlock', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+m', action: 'mathBlock', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+h', action: 'htmlBlock', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+g', action: 'orderedList', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+l', action: 'bulletList', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+x', action: 'taskList', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+l', action: 'looseListItem', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+0', action: 'paragraph', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+u', action: 'horizontalRule', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+y', action: 'frontMatter', requireEditor: true, ignoreInSourceMode: true},

    { keys: 'mod+b', action: 'toggleBold', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+i', action: 'toggleItalic', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+u', action: 'toggleUnderline', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+equal, mod+shift+numpadadd', action: 'superscript', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+minus, mod+shift+numpadsubtract', action: 'subscript', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+h', action: 'highlight', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+backquote', action: 'inlineCode', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+m', action: 'inlineMath', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+x', action: 'strikethrough', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+l', action: 'insertLink', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+alt+i', action: 'insertImage', requireEditor: true, ignoreInSourceMode: true},
    { keys: 'mod+shift+r', action: 'clearFormatting', requireEditor: true, ignoreInSourceMode: true},

    { keys: 'mod+alt+m', action: 'minimizeWindow'},
    { keys: 'mod+alt+t', action: 'toggleAlwaysOnTop'},
    { keys: 'mod+equal, mod+numpadadd', action: 'zoomIn' },
    { keys: 'mod+minus, mod+numpadsubtract', action: 'zoomOut' },
    { keys: 'mod+0', action: 'zoomReset'},
    { keys: 'f11', action: 'toggleFullscreen'},

    { keys: 'mod+shift+p', action: 'commandPalette'},
    { keys: 'mod+e', action: 'sourceMode'},
    { keys: 'mod+shift+g', action: 'typewriterMode'},
    { keys: 'mod+shift+j', action: 'focusMode'},
    { keys: 'mod+j', action: 'sidebar'},
    { keys: 'mod+k', action: 'outline'},
    { keys: 'f5', action: 'reloadImages', editorAction: (e) => e.reloadImages(), requireEditor: true},
    { keys: 'mod+shift+i', action: 'openDevTools'},
    { keys: 'mod+f5', action: 'reloadWindow', ignoreOnFocused: true},
];
