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
            { description: '自动保存', keys: [] },
            { description: '移动到', keys: [] },
            { description: '重命名', keys: [] },
            { description: '导入', keys: [] },
            { description: '导出为HTML', keys: [] },
            { description: '导出为PDF', keys: ['Ctrl', 'Alt', 'E'] },
            { description: '打印', keys: ['Ctrl', 'P'] },
            { description: '设置', keys: ['Ctrl', ','] },
            { description: '关闭标签页', keys: ['Ctrl', 'W'] },
            { description: '关闭窗口', keys: ['Ctrl', 'Shift', 'W'] },
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
            { description: '复制为富文本', keys: ['Ctrl', 'Shift', 'C'] },
            { description: '复制为HTML', keys: [] },
            { description: '粘贴为纯文本', keys: ['Ctrl', 'Shift', 'V'] },
            { description: '全选', keys: ['Ctrl', 'A'] },
            { description: '创建副本', keys: ['Ctrl', 'Alt', 'D'] },
            { description: '创建段落', keys: ['Ctrl', 'Shift', 'N'] },
            { description: '删除段落', keys: ['Ctrl', 'Shift', 'D'] },
            { description: '查找', keys: ['Ctrl', 'F'] },
            { description: '查找下一个', keys: ['F3'] },
            { description: '查找上一个', keys: ['Shift', 'F3'] },    
            { description: '替换', keys: ['Ctrl', 'R'] },
            { description: '在文件夹中查找', keys: ['Ctrl', 'Shift', 'F'] },
        ],
    },
    {
        category: '段落',
        shortcuts: [
            { description: '标题1', keys: ['Ctrl', '1'] },
            { description: '标题2', keys: ['Ctrl', '2'] },
            { description: '标题3', keys: ['Ctrl', '3'] },
            { description: '标题4', keys: ['Ctrl', '4'] },
            { description: '标题5', keys: ['Ctrl', '5'] },
            { description: '标题6', keys: ['Ctrl', '6'] },
            { description: '提升标题级别', keys: ['Ctrl', 'Alt', '+'] },
            { description: '降低标题级别', keys: ['Ctrl', 'Alt', '-'] },
            { description: '表格', keys: ['Ctrl', 'Shift', 'T'] },
            { description: '代码围栏', keys: ['Ctrl', 'Shift', 'K'] },
            { description: '引用块', keys: ['Ctrl', 'Shift', 'Q'] },
            { description: '数学块', keys: ['Ctrl', 'Alt', 'N'] },
            { description: 'HTML块', keys: ['Ctrl', 'Alt', 'H'] },
            { description: '有序列表', keys: ['Ctrl', 'G'] },
            { description: '无序列表', keys: ['Ctrl', 'H'] },
            { description: '任务列表', keys: ['Ctrl', 'Alt', 'X'] },
            { description: '宽松列表项', keys: ['Ctrl', 'Alt', 'L'] },
            { description: '段落', keys: ['Ctrl', 'Shift', '0'] },
            { description: '水平分割线', keys: ['Ctrl', 'Shift', 'U'] },
            { description: '前置元数据', keys: ['Ctrl', 'Alt', 'Y'] },
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