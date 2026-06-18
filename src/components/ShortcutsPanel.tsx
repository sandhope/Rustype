import { useState, useEffect, useRef } from 'react';
import { platform } from '@tauri-apps/plugin-os';

interface ShortcutsPanelProps {
    onClose: () => void;
}

interface ShortcutItem {
    category: string;
    shortcuts: Array<{
        description: string;
        keys: string[];
    }>;
}

// const isMac = /Mac/.test(navigator.platform);
const isMac = platform() === 'macos';

const COMMAND = isMac ? '⌘' : 'Ctrl'
const SHIFT = isMac ? '⇧' : 'Shift'
const ALT = isMac ? '⌥' : 'Alt'

const shortcutsData: ShortcutItem[] = [
    {
        category: '文件',
        shortcuts: [
            { description: '新建标签页', keys: [COMMAND, 'T'] },
            { description: '新建窗口', keys: [COMMAND, 'N'] },
            { description: '打开文件', keys: [COMMAND, 'O'] },
            { description: '打开文件夹', keys: [COMMAND, SHIFT, 'O'] },
            { description: '保存', keys: [COMMAND, 'S'] },
            { description: '另存为', keys: [COMMAND, SHIFT, 'S'] },
            { description: '自动保存', keys: [] },
            { description: '移动到', keys: [] },
            { description: '重命名', keys: [] },
            { description: '导出为HTML', keys: [] },
            { description: '导出为PDF', keys: [COMMAND, ALT, 'E'] },
            { description: '打印', keys: [COMMAND, 'P'] },
            { description: '设置', keys: [COMMAND, ','] },
            { description: '关闭标签页', keys: [COMMAND, 'W'] },
            { description: '关闭窗口', keys: [COMMAND, SHIFT, 'W'] },
            { description: '退出', keys: [COMMAND, 'Q'] },
        ],
    },
    {
        category: '编辑',
        shortcuts: [
            { description: '撤销', keys: [COMMAND, 'Z'] },
            { description: '重做', keys: [COMMAND, SHIFT, 'Z'] },
            { description: '剪切', keys: [COMMAND, 'X'] },
            { description: '复制', keys: [COMMAND, 'C'] },
            { description: '粘贴', keys: [COMMAND, 'V'] },
            { description: '复制为富文本', keys: [COMMAND, SHIFT, 'C'] },
            { description: '复制为HTML', keys: [] },
            { description: '粘贴为纯文本', keys: [COMMAND, SHIFT, 'V'] },
            { description: '全选', keys: [COMMAND, 'A'] },
            { description: '创建副本', keys: [COMMAND, ALT, 'D'] },
            { description: '创建段落', keys: [COMMAND, SHIFT, 'N'] },
            { description: '删除段落', keys: [COMMAND, SHIFT, 'D'] },
            { description: '查找', keys: [COMMAND, 'F'] },
            { description: '查找下一个', keys: ['F3'] },
            { description: '查找上一个', keys: [SHIFT, 'F3'] },    
            { description: '替换', keys: [COMMAND, 'H'] },
            { description: '在文件夹中查找', keys: [COMMAND, SHIFT, 'F'] },
        ],
    },
    {
        category: '段落',
        shortcuts: [
            { description: '标题1', keys: [COMMAND, '1'] },
            { description: '标题2', keys: [COMMAND, '2'] },
            { description: '标题3', keys: [COMMAND, '3'] },
            { description: '标题4', keys: [COMMAND, '4'] },
            { description: '标题5', keys: [COMMAND, '5'] },
            { description: '标题6', keys: [COMMAND, '6'] },
            { description: '提升标题级别', keys: [COMMAND, ALT, '+'] },
            { description: '降低标题级别', keys: [COMMAND, ALT, '-'] },
            { description: '表格', keys: [COMMAND, SHIFT, 'T'] },
            { description: '代码围栏', keys: [COMMAND, SHIFT, 'K'] },
            { description: '引用块', keys: [COMMAND, SHIFT, 'Q'] },
            { description: '数学块', keys: [COMMAND, 'M'] },
            { description: 'HTML块', keys: [COMMAND, ALT, 'H'] },
            { description: '有序列表', keys: [COMMAND, 'G'] },
            { description: '无序列表', keys: [COMMAND, SHIFT, 'L'] },
            { description: '任务列表', keys: [COMMAND, ALT, 'X'] },
            { description: '宽松列表项', keys: [COMMAND, ALT, 'L'] },
            { description: '段落', keys: [COMMAND, SHIFT, '0'] },
            { description: '水平分割线', keys: [COMMAND, SHIFT, 'U'] },
            { description: '前置元数据', keys: [COMMAND, ALT, 'Y'] },
        ],
    },
    {
        category: '格式',
        shortcuts: [
            { description: '粗体', keys: [COMMAND, 'B'] },
            { description: '斜体', keys: [COMMAND, 'I'] },
            { description: '下划线', keys: [COMMAND, 'U'] },
            { description: '上标', keys: [COMMAND, SHIFT, '+'] },
            { description: '下标', keys: [COMMAND, SHIFT, '-'] },
            { description: '高亮', keys: [COMMAND, SHIFT, 'H'] },
            { description: '行内代码', keys: [COMMAND, '`'] },
            { description: '行内数学', keys: [COMMAND, SHIFT, 'M'] },
            { description: '删除线', keys: [COMMAND, SHIFT, 'D'] },
            { description: '超链接', keys: [COMMAND, 'L'] },
            { description: '图片', keys: [COMMAND, ALT, 'I'] },
            { description: '清除格式', keys: [COMMAND, SHIFT, 'R'] },
        ],
    },
    {
        category: '窗口',
        shortcuts: [
            { description: '最小化', keys: [COMMAND, ALT, 'M'] },
            { description: '总是在最前', keys: [COMMAND, ALT, 'T'] },
            { description: '放大文字', keys: [COMMAND, '+'] },
            { description: '缩小文字', keys: [COMMAND, '-'] },
            { description: '重置文字', keys: [COMMAND, '0'] },
            { description: '全屏', keys: ['F11'] },
        ],
    },
    {
        category: '视图',
        shortcuts: [
            { description: '命令面板', keys: [COMMAND, SHIFT, 'P'] },
            { description: '源代码模式', keys: [COMMAND, 'E'] },
            { description: '打字机模式', keys: [COMMAND, SHIFT, 'G'] },
            { description: '专注模式', keys: [COMMAND, SHIFT, 'J'] },
            { description: '打开侧边栏', keys: [COMMAND, 'J'] },
            { description: '显示大纲', keys: [COMMAND, 'K'] },
            { description: '重新加载图片', keys: ['F5'] },
            { description: '开发者工具', keys: [COMMAND, SHIFT, 'I'] },
            { description: '重新加载窗口', keys: [COMMAND, 'F5'] },
        ],
    },
    {
        category: '帮助',
        shortcuts: [
            { description: '更新日志', keys: [] },
            { description: '支持Rustype', keys: [] },
            { description: '查看源码', keys: [] },
            { description: '报告错误', keys: [] },
            { description: '许可证', keys: [] },
            { description: '检查更新', keys: [] },
            { description: '键盘快捷键', keys: [] },
            { description: '关于Rustype', keys: [] },
        ],
    },
];

export default function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
    const [isMaximized, setIsMaximized] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleDoubleClick = () => {
        setIsMaximized(!isMaximized);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={containerRef}
                className={`shortcuts-panel ${isMaximized ? 'maximized' : ''}`}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={handleDoubleClick}
            >
                <div className="shortcuts-header">
                    <h2>键盘快捷键</h2>
                    <button className="shortcuts-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="shortcuts-content">
                    {shortcutsData.map((item, index) => (
                        <div key={index} className="shortcuts-category">
                            <h3 className="category-title">{item.category}</h3>
                            <div className="shortcuts-list">
                                {item.shortcuts.map((shortcut, idx) => (
                                    <div key={idx} className="shortcut-item">
                                        <span className="shortcut-description">{shortcut.description}</span>
                                        <div className="shortcut-keys">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <span key={keyIdx} className="shortcut-key">
                                                    {key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="shortcuts-footer">
                    <span className="footer-hint">双击窗口可最大化</span>
                </div>
            </div>
        </div>
    );
}