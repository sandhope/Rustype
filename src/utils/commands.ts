/**
 * Command registry for the Command Palette.
 *
 * Each command maps to an action string handled by `useMenuActions`.
 * Shortcut text is auto-generated from `shortcuts.ts` key bindings.
 */

import { shortcuts } from '../constants/shortcuts';
import { allThemes } from './themes';
import { t } from '../utils/i18n';

export interface Command {
    id: string;
    description: string;
    shortcut?: string;
    category?: string;
}

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/** Convert hotkey string like "mod+shift+p" to display text "Ctrl+Shift+P" */
function formatShortcut(keys: string): string {
    // Take first alternative if comma-separated
    const primary = keys.split(',')[0].trim();
    return primary
        .replace(/mod/gi, isMac ? '⌘' : 'Ctrl')
        .replace(/shift/gi, isMac ? '⇧' : 'Shift')
        .replace(/alt/gi, isMac ? '⌥' : 'Alt')
        .replace(/ctrl/gi, 'Ctrl')
        .replace(/numpadadd/gi, '+')
        .replace(/numpadsubtract/gi, '-')
        .replace(/backquote/gi, '`')
        .replace(/comma/gi, ',')
        .replace(/equal/gi, '=')
        .replace(/minus/gi, '-')
        .replace(/\b(\w)/g, (_, c) => c.toUpperCase())
        .replace(/\+/g, isMac ? '' : '+');
}

// Build a map: action -> shortcut display text (first key binding wins)
const shortcutMap = new Map<string, string>();
for (const s of shortcuts) {
    if (!shortcutMap.has(s.action)) {
        shortcutMap.set(s.action, formatShortcut(s.keys));
    }
}

/** Return all available commands with shortcut text populated. */
export function getAllCommands(): Command[] {
    const commandDefs: Omit<Command, 'shortcut'>[] = [
        // File
        { id: 'newTab', description: t('commands.newTab'), category: t('commandCategories.file') },
        { id: 'newWindow', description: t('commands.newWindow'), category: t('commandCategories.file') },
        { id: 'openFile', description: t('commands.openFile'), category: t('commandCategories.file') },
        { id: 'openFolder', description: t('commands.openFolder'), category: t('commandCategories.file') },
        { id: 'save', description: t('commands.save'), category: t('commandCategories.file') },
        { id: 'saveAs', description: t('commands.saveAs'), category: t('commandCategories.file') },
        { id: 'exportPdf', description: t('commands.exportPdf'), category: t('commandCategories.file') },
        { id: 'print', description: t('commands.print'), category: t('commandCategories.file') },
        { id: 'closeTab', description: t('commands.closeTab'), category: t('commandCategories.file') },
        { id: 'closeWindow', description: t('commands.closeWindow'), category: t('commandCategories.file') },
        { id: 'quit', description: t('commands.quit'), category: t('commandCategories.file') },
        { id: 'settings', description: t('commands.settings'), category: t('commandCategories.file') },

        // Edit
        { id: 'undo', description: t('commands.undo'), category: t('commandCategories.edit') },
        { id: 'redo', description: t('commands.redo'), category: t('commandCategories.edit') },
        { id: 'cut', description: t('commands.cut'), category: t('commandCategories.edit') },
        { id: 'copy', description: t('commands.copy'), category: t('commandCategories.edit') },
        { id: 'paste', description: t('commands.paste'), category: t('commandCategories.edit') },
        { id: 'selectAll', description: t('commands.selectAll'), category: t('commandCategories.edit') },
        { id: 'duplicate', description: t('commands.duplicate'), category: t('commandCategories.edit') },
        { id: 'createParagraph', description: t('commands.createParagraph'), category: t('commandCategories.edit') },
        { id: 'deleteParagraph', description: t('commands.deleteParagraph'), category: t('commandCategories.edit') },
        { id: 'find', description: t('commands.find'), category: t('commandCategories.edit') },
        { id: 'findNext', description: t('commands.findNext'), category: t('commandCategories.edit') },
        { id: 'findPrevious', description: t('commands.findPrevious'), category: t('commandCategories.edit') },
        { id: 'replace', description: t('commands.replace'), category: t('commandCategories.edit') },
        { id: 'findInFolder', description: t('commands.findInFolder'), category: t('commandCategories.edit') },
        { id: 'copyAsRich', description: t('commands.copyAsRich'), category: t('commandCategories.edit') },
        { id: 'pasteAsPlainText', description: t('commands.pasteAsPlainText'), category: t('commandCategories.edit') },

        // Paragraph
        { id: 'heading1', description: t('commands.heading1'), category: t('commandCategories.paragraph') },
        { id: 'heading2', description: t('commands.heading2'), category: t('commandCategories.paragraph') },
        { id: 'heading3', description: t('commands.heading3'), category: t('commandCategories.paragraph') },
        { id: 'heading4', description: t('commands.heading4'), category: t('commandCategories.paragraph') },
        { id: 'heading5', description: t('commands.heading5'), category: t('commandCategories.paragraph') },
        { id: 'heading6', description: t('commands.heading6'), category: t('commandCategories.paragraph') },
        { id: 'promoteHeading', description: t('commands.promoteHeading'), category: t('commandCategories.paragraph') },
        { id: 'demoteHeading', description: t('commands.demoteHeading'), category: t('commandCategories.paragraph') },
        { id: 'table', description: t('commands.table'), category: t('commandCategories.paragraph') },
        { id: 'codeFences', description: t('commands.codeFences'), category: t('commandCategories.paragraph') },
        { id: 'quoteBlock', description: t('commands.quoteBlock'), category: t('commandCategories.paragraph') },
        { id: 'mathBlock', description: t('commands.mathBlock'), category: t('commandCategories.paragraph') },
        { id: 'htmlBlock', description: t('commands.htmlBlock'), category: t('commandCategories.paragraph') },
        { id: 'orderedList', description: t('commands.orderedList'), category: t('commandCategories.paragraph') },
        { id: 'bulletList', description: t('commands.bulletList'), category: t('commandCategories.paragraph') },
        { id: 'taskList', description: t('commands.taskList'), category: t('commandCategories.paragraph') },
        { id: 'looseListItem', description: t('commands.looseListItem'), category: t('commandCategories.paragraph') },
        { id: 'paragraph', description: t('commands.paragraph'), category: t('commandCategories.paragraph') },
        { id: 'horizontalRule', description: t('commands.horizontalRule'), category: t('commandCategories.paragraph') },
        { id: 'frontMatter', description: t('commands.frontMatter'), category: t('commandCategories.paragraph') },

        // Format
        { id: 'toggleBold', description: t('commands.bold'), category: t('commandCategories.format') },
        { id: 'toggleItalic', description: t('commands.italic'), category: t('commandCategories.format') },
        { id: 'toggleUnderline', description: t('commands.underline'), category: t('commandCategories.format') },
        { id: 'highlight', description: t('commands.highlight'), category: t('commandCategories.format') },
        { id: 'strikethrough', description: t('commands.strikethrough'), category: t('commandCategories.format') },
        { id: 'inlineCode', description: t('commands.inlineCode'), category: t('commandCategories.format') },
        { id: 'inlineMath', description: t('commands.inlineMath'), category: t('commandCategories.format') },
        { id: 'superscript', description: t('commands.superscript'), category: t('commandCategories.format') },
        { id: 'subscript', description: t('commands.subscript'), category: t('commandCategories.format') },
        { id: 'insertLink', description: t('commands.insertLink'), category: t('commandCategories.format') },
        { id: 'insertImage', description: t('commands.insertImage'), category: t('commandCategories.format') },
        { id: 'clearFormatting', description: t('commands.clearFormatting'), category: t('commandCategories.format') },

        // View
        { id: 'commandPalette', description: t('commands.commandPalette'), category: t('commandCategories.view') },
        { id: 'sourceMode', description: t('commands.sourceMode'), category: t('commandCategories.view') },
        { id: 'typewriterMode', description: t('commands.typewriterMode'), category: t('commandCategories.view') },
        { id: 'focusMode', description: t('commands.focusMode'), category: t('commandCategories.view') },
        { id: 'sidebar', description: t('commands.sidebar'), category: t('commandCategories.view') },
        { id: 'outline', description: t('commands.outline'), category: t('commandCategories.view') },
        { id: 'reloadImages', description: t('commands.reloadImages'), category: t('commandCategories.view') },
        { id: 'openDevTools', description: t('commands.devTools'), category: t('commandCategories.view') },
        { id: 'reloadWindow', description: t('commands.reloadWindow'), category: t('commandCategories.view') },

        // Theme (dynamically generated from theme registry)
        { id: 'setTheme:system', description: t('commands.themeSystem'), category: t('commandCategories.theme') },
        ...allThemes.map(theme => ({
            id: `setTheme:${theme.id}`,
            description: `${t('commands.themePrefix')}${theme.name}`,
            category: t('commandCategories.theme'),
        })),

        // Window
        { id: 'minimizeWindow', description: t('commands.minimizeWindow'), category: t('commandCategories.window') },
        { id: 'toggleAlwaysOnTop', description: t('commands.toggleAlwaysOnTop'), category: t('commandCategories.window') },
        { id: 'zoomIn', description: t('commands.zoomIn'), category: t('commandCategories.window') },
        { id: 'zoomOut', description: t('commands.zoomOut'), category: t('commandCategories.window') },
        { id: 'zoomReset', description: t('commands.zoomReset'), category: t('commandCategories.window') },
        { id: 'toggleFullscreen', description: t('commands.toggleFullscreen'), category: t('commandCategories.window') },
    ];

    return commandDefs.map(cmd => ({
        ...cmd,
        shortcut: shortcutMap.get(cmd.id),
    }));
}
