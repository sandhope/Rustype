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
        category: '文件操作',
        shortcuts: [
            { description: '新建文件', keys: ['Ctrl', 'N'] },
            { description: '打开文件', keys: ['Ctrl', 'O'] },
            { description: '关闭当前文件', keys: ['Ctrl', 'W'] },
            { description: '保存', keys: ['Ctrl', 'S'] },
            { description: '另存为', keys: ['Ctrl', 'Shift', 'S'] },
        ],
    },
    {
        category: '编辑操作',
        shortcuts: [
            { description: '撤销', keys: ['Ctrl', 'Z'] },
            { description: '重做', keys: ['Ctrl', 'Y'] },
            { description: '剪切', keys: ['Ctrl', 'X'] },
            { description: '复制', keys: ['Ctrl', 'C'] },
            { description: '粘贴', keys: ['Ctrl', 'V'] },
            { description: '全选', keys: ['Ctrl', 'A'] },
            { description: '查找 / 替换', keys: ['Ctrl', 'F'] },
        ],
    },
    {
        category: '视图操作',
        shortcuts: [
            { description: '切换源代码模式', keys: ['Ctrl', 'Shift', 'M'] },
            { description: '切换聚焦模式', keys: ['Ctrl', 'Shift', 'F'] },
            { description: '切换打字机模式', keys: ['Ctrl', 'Shift', 'T'] },
            { description: '显示设置', keys: ['Ctrl', ','] },
            { description: '显示侧边栏', keys: ['Ctrl', 'B'] },
        ],
    },
    {
        category: '窗口操作',
        shortcuts: [
            { description: '关闭设置面板', keys: ['Escape'] },
            { description: '关闭对话框', keys: ['Escape'] },
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