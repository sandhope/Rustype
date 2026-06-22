import { useState, memo } from 'react';
import { useI18n } from '../utils/i18n';
import { type FileInfo } from '../utils/file';
import TabContextMenu from './TabContextMenu';

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
    onCloseOtherTabs?: (keepTabId: string) => void;
    onCloseTabsToRight?: (currentTabId: string) => void;
    onCloseAllTabs?: () => void;
    onCloseSavedTabs?: () => void;
}

function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onTabReorder, onNewFile, onCloseOtherTabs, onCloseTabsToRight, onCloseAllTabs, onCloseSavedTabs }: TabBarProps) {
    const { t } = useI18n();
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuTabId, setContextMenuTabId] = useState<string>('');

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

    const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuTabId(tabId);
        setContextMenuVisible(true);
    };

    return (
        <div className="tab-bar" onDoubleClick={handleTabBarDoubleClick} onContextMenu={(e) => e.preventDefault()}>
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
                        onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
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
            <TabContextMenu
                visible={contextMenuVisible}
                x={contextMenuPosition.x}
                y={contextMenuPosition.y}
                currentTabId={contextMenuTabId}
                totalTabs={tabs.length}
                savedTabCount={tabs.filter(t => !t.dirty).length}
                onClose={() => setContextMenuVisible(false)}
                onCloseOther={onCloseOtherTabs || (() => {})}
                onCloseRight={onCloseTabsToRight || (() => {})}
                onCloseSaved={onCloseSavedTabs || (() => {})}
                onCloseAll={onCloseAllTabs || (() => {})}
            />
        </div>
    );
}

export default memo(TabBar, (prev, next) => {
    return prev.tabs === next.tabs
        && prev.activeTabId === next.activeTabId;
});