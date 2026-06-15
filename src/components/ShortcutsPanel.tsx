import { useState, useEffect, useRef } from 'react';

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

const shortcutsData: ShortcutItem[] = [
    {
        category: '文件',
        shortcuts: [
            { description: '新建标签页', keys: ['Ctrl', 'T'] },
            { description: '新建窗口', keys: ['Ctrl', 'N'] },
            { description: '打开文件', keys: ['Ctrl', 'O'] },
            { description: '打开文件夹', keys: ['Ctrl', 'Shift', 'O'] },
            { description: '保存', keys: ['Ctrl', 'S'] },
            { description: '另存为', keys: ['Ctrl', 'Shift', 'S'] },
            { description: '打印', keys: ['Ctrl', 'P'] },
            { description: '退出', keys: ['Ctrl', 'Q'] },
        ],
    },
    {
        category: '编辑',
        shortcuts: [
            { description: '撤销', keys: ['Ctrl', 'Z'] },
            { description: '重做', keys: ['Ctrl', 'Shift', 'Z'] },
            { description: '剪切', keys: ['Ctrl', 'X'] },
            { description: '复制', keys: ['Ctrl', 'C'] },
            { description: '粘贴', keys: ['Ctrl', 'V'] },
            { description: '全选', keys: ['Ctrl', 'A'] },
            { description: '查找', keys: ['Ctrl', 'F'] },
            { description: '替换', keys: ['Ctrl', 'R'] },
        ],
    },
    {
        category: '格式',
        shortcuts: [
            { description: '粗体', keys: ['Ctrl', 'B'] },
            { description: '斜体', keys: ['Ctrl', 'I'] },
            { description: '下划线', keys: ['Ctrl', 'U'] },
            { description: '上标', keys: ['Ctrl', 'Shift', '+'] },
            { description: '下标', keys: ['Ctrl', 'Shift', '-'] },
            { description: '高亮', keys: ['Ctrl', 'Shift', 'H'] },
            { description: '行内代码', keys: ['Ctrl', '`'] },
            { description: '行内数学', keys: ['Ctrl', 'Shift', 'M'] },
            { description: '删除线', keys: ['Ctrl', 'D'] },
            { description: '超链接', keys: ['Ctrl', 'L'] },
            { description: '图片', keys: ['Ctrl', 'Alt', 'I'] },
            { description: '清除格式', keys: ['Ctrl', 'Shift', 'R'] },
        ],
    },
    {
        category: '窗口',
        shortcuts: [
            { description: '最小化', keys: ['Ctrl', 'M'] },
            { description: '总是在最前', keys: ['Ctrl', 'Alt', 'T'] },
            { description: '放大文字', keys: ['Ctrl', '+'] },
            { description: '缩小文字', keys: ['Ctrl', '-'] },
            { description: '重置文字', keys: ['Ctrl', '0'] },
            { description: '全屏', keys: ['F11'] },
        ],
    },
    {
        category: '视图',
        shortcuts: [
            { description: '命令面板', keys: ['Ctrl', 'Shift', 'P'] },
            { description: '源代码模式', keys: ['Ctrl', 'E'] },
            { description: '打字机模式', keys: ['Ctrl', 'Shift', 'G'] },
            { description: '专注模式', keys: ['Ctrl', 'Shift', 'J'] },
            { description: '打开侧边栏', keys: ['Ctrl', 'J'] },
            { description: '显示大纲', keys: ['Ctrl', 'K'] },
            { description: '重新加载图片', keys: ['F5'] },
            { description: '开发者工具', keys: ['Ctrl', 'Shift', 'I'] },
            { description: '重新加载窗口', keys: ['Ctrl', 'F5'] },
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