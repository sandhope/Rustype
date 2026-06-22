import { useEffect, useCallback, memo } from 'react';
import { useI18n } from '../utils/i18n';

interface TabContextMenuProps {
    visible: boolean;
    x: number;
    y: number;
    currentTabId: string;
    totalTabs: number;
    savedTabCount: number;
    onClose: () => void;
    onCloseOther: (tabId: string) => void;
    onCloseRight: (tabId: string) => void;
    onCloseAll: () => void;
    onCloseSaved: () => void;
}

function TabContextMenu({
    visible,
    x,
    y,
    currentTabId,
    totalTabs,
    savedTabCount,
    onClose,
    onCloseOther,
    onCloseRight,
    onCloseAll,
    onCloseSaved,
}: TabContextMenuProps) {
    const { t } = useI18n();

    useEffect(() => {
        if (!visible) return;

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.tab-context-menu')) return;
            onClose();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [visible, onClose]);

    const handleAction = useCallback((action: string) => {
        onClose();
        switch (action) {
            case 'closeOther':
                onCloseOther(currentTabId);
                break;
            case 'closeRight':
                onCloseRight(currentTabId);
                break;
            case 'closeSaved':
                onCloseSaved();
                break;
            case 'closeAll':
                onCloseAll();
                break;
        }
    }, [currentTabId, onClose, onCloseOther, onCloseRight, onCloseAll, onCloseSaved]);

    if (!visible) return null;

    return (
        <div
            className="tab-context-menu"
            style={{ left: x, top: y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className={`tab-context-item${totalTabs <= 1 ? ' disabled' : ''}`}
                onClick={() => totalTabs > 1 && handleAction('closeOther')}
            >
                {t('tabContextMenu.closeOther')}
            </div>
            <div
                className={`tab-context-item${totalTabs <= 1 ? ' disabled' : ''}`}
                onClick={() => totalTabs > 1 && handleAction('closeRight')}
            >
                {t('tabContextMenu.closeRight')}
            </div>
            <div className="tab-context-divider" />
            <div
                className={`tab-context-item${savedTabCount === 0 ? ' disabled' : ''}`}
                onClick={() => savedTabCount > 0 && handleAction('closeSaved')}
            >
                {t('tabContextMenu.closeSaved')}
            </div>
            <div
                className={`tab-context-item${totalTabs === 0 ? ' disabled' : ''}`}
                onClick={() => totalTabs > 0 && handleAction('closeAll')}
            >
                {t('tabContextMenu.closeAll')}
            </div>
        </div>
    );
}

export default memo(TabContextMenu, (prev, next) => {
    return prev.visible === next.visible
        && prev.x === next.x
        && prev.y === next.y
        && prev.currentTabId === next.currentTabId
        && prev.totalTabs === next.totalTabs;
});