/**
 * Command registry for the Command Palette.
 *
 * Each command maps to an action string handled by `useMenuActions`.
 * Shortcut text is auto-generated from `shortcuts.ts` key bindings.
 */

import { shortcuts } from '../constants/shortcuts';
import { allThemes } from './themes';

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

// Human-readable descriptions for every action used in the palette.
// Order determines display order in the command list.
const commandDefs: Omit<Command, 'shortcut'>[] = [
    // File
    { id: 'newTab', description: '新建标签页', category: '文件' },
    { id: 'newWindow', description: '新建窗口', category: '文件' },
    { id: 'openFile', description: '打开文件', category: '文件' },
    { id: 'openFolder', description: '打开文件夹', category: '文件' },
    { id: 'save', description: '保存', category: '文件' },
    { id: 'saveAs', description: '另存为', category: '文件' },
    { id: 'exportPdf', description: '导出为 PDF', category: '文件' },
    { id: 'print', description: '打印', category: '文件' },
    { id: 'closeTab', description: '关闭标签页', category: '文件' },
    { id: 'closeWindow', description: '关闭窗口', category: '文件' },
    { id: 'quit', description: '退出', category: '文件' },
    { id: 'settings', description: '设置', category: '文件' },

    // Edit
    { id: 'undo', description: '撤销', category: '编辑' },
    { id: 'redo', description: '重做', category: '编辑' },
    { id: 'cut', description: '剪切', category: '编辑' },
    { id: 'copy', description: '复制', category: '编辑' },
    { id: 'paste', description: '粘贴', category: '编辑' },
    { id: 'selectAll', description: '全选', category: '编辑' },
    { id: 'duplicate', description: '复制段落', category: '编辑' },
    { id: 'createParagraph', description: '新建段落', category: '编辑' },
    { id: 'deleteParagraph', description: '删除段落', category: '编辑' },
    { id: 'find', description: '查找', category: '编辑' },
    { id: 'findNext', description: '查找下一个', category: '编辑' },
    { id: 'findPrevious', description: '查找上一个', category: '编辑' },
    { id: 'replace', description: '替换', category: '编辑' },
    { id: 'findInFolder', description: '在文件夹中查找', category: '编辑' },
    { id: 'copyAsRich', description: '复制为富文本', category: '编辑' },
    { id: 'pasteAsPlainText', description: '粘贴为纯文本', category: '编辑' },

    // Paragraph
    { id: 'heading1', description: '一级标题', category: '段落' },
    { id: 'heading2', description: '二级标题', category: '段落' },
    { id: 'heading3', description: '三级标题', category: '段落' },
    { id: 'heading4', description: '四级标题', category: '段落' },
    { id: 'heading5', description: '五级标题', category: '段落' },
    { id: 'heading6', description: '六级标题', category: '段落' },
    { id: 'promoteHeading', description: '提升标题级别', category: '段落' },
    { id: 'demoteHeading', description: '降低标题级别', category: '段落' },
    { id: 'table', description: '插入表格', category: '段落' },
    { id: 'codeFences', description: '代码块', category: '段落' },
    { id: 'quoteBlock', description: '引用块', category: '段落' },
    { id: 'mathBlock', description: '数学公式', category: '段落' },
    { id: 'htmlBlock', description: 'HTML 块', category: '段落' },
    { id: 'orderedList', description: '有序列表', category: '段落' },
    { id: 'bulletList', description: '无序列表', category: '段落' },
    { id: 'taskList', description: '任务列表', category: '段落' },
    { id: 'looseListItem', description: '宽松列表项', category: '段落' },
    { id: 'paragraph', description: '正文段落', category: '段落' },
    { id: 'horizontalRule', description: '水平线', category: '段落' },
    { id: 'frontMatter', description: 'Front Matter', category: '段落' },

    // Format
    { id: 'toggleBold', description: '加粗', category: '格式' },
    { id: 'toggleItalic', description: '斜体', category: '格式' },
    { id: 'toggleUnderline', description: '下划线', category: '格式' },
    { id: 'highlight', description: '高亮', category: '格式' },
    { id: 'strikethrough', description: '删除线', category: '格式' },
    { id: 'inlineCode', description: '行内代码', category: '格式' },
    { id: 'inlineMath', description: '行内数学公式', category: '格式' },
    { id: 'superscript', description: '上标', category: '格式' },
    { id: 'subscript', description: '下标', category: '格式' },
    { id: 'insertLink', description: '插入链接', category: '格式' },
    { id: 'insertImage', description: '插入图片', category: '格式' },
    { id: 'clearFormatting', description: '清除格式', category: '格式' },

    // View
    { id: 'commandPalette', description: '命令面板', category: '视图' },
    { id: 'sourceMode', description: '切换源代码模式', category: '视图' },
    { id: 'typewriterMode', description: '切换打字机模式', category: '视图' },
    { id: 'focusMode', description: '切换专注模式', category: '视图' },
    { id: 'sidebar', description: '切换侧边栏', category: '视图' },
    { id: 'outline', description: '显示大纲', category: '视图' },
    { id: 'reloadImages', description: '重新加载图片', category: '视图' },
    { id: 'openDevTools', description: '开发者工具', category: '视图' },
    { id: 'reloadWindow', description: '重新加载窗口', category: '视图' },

    // Theme (dynamically generated from theme registry)
    { id: 'setTheme:system', description: '主题: 跟随系统', category: '主题' },
    ...allThemes.map(t => ({
        id: `setTheme:${t.id}`,
        description: `主题: ${t.name}`,
        category: '主题',
    })),

    // Window
    { id: 'minimizeWindow', description: '最小化窗口', category: '窗口' },
    { id: 'toggleAlwaysOnTop', description: '切换窗口置顶', category: '窗口' },
    { id: 'zoomIn', description: '放大', category: '窗口' },
    { id: 'zoomOut', description: '缩小', category: '窗口' },
    { id: 'zoomReset', description: '重置缩放', category: '窗口' },
    { id: 'toggleFullscreen', description: '切换全屏', category: '窗口' },
];

/** Return all available commands with shortcut text populated. */
export function getAllCommands(): Command[] {
    return commandDefs.map(cmd => ({
        ...cmd,
        shortcut: shortcutMap.get(cmd.id),
    }));
}
