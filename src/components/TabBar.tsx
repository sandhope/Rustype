import { useState } from 'react';
import { useI18n } from '../utils/i18n';
import { type FileInfo } from '../utils/file';

export interface Tab {
    id: string;
    file: FileInfo | null;
    content: string;
    dirty: boolean;
    lastModified?: number;
    externallyModified?: boolean;
    lineEnding: 'crlf' | 'lf';
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabSelect: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onTabReorder?: (fromIndex: number, toIndex: number) => void;
    onNewFile?: () => void;
}

export default function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onTabReorder, onNewFile }: TabBarProps) {
    const { t } = useI18n();
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index && onTabReorder) {
            onTabReorder(dragIndex, index);
            setDragIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDragIndex(null);
    };

    const handleTabBarDoubleClick = () => {
        if (onNewFile) {
            onNewFile();
        }
    };

    return (
        <div className="tab-bar" onDoubleClick={handleTabBarDoubleClick}>
            <div className="tab-list">
                {tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        className={`tab ${tab.id === activeTabId ? 'active' : ''} ${tab.dirty ? 'dirty' : ''} ${tab.externallyModified ? 'externally-modified' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onTabSelect(tab.id)}
                        title={tab.externallyModified ? t('tab.externallyModified') : tab.file?.path || t('tab.untitled')}
                    >
                        <span className="tab-name">
                            {tab.file?.name || 'Untitled'}
                        </span>
                        {tab.externallyModified && <span className="tab-external-dot">⚠</span>}
                        {tab.dirty && <span className="tab-dirty-dot">●</span>}
                        <button
                            className="tab-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(tab.id);
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
