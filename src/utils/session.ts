import type { FileInfo } from './file';

/** 单个标签页的可恢复数据 */
export interface SavedTab {
    file: FileInfo | null;
    content: string;
    lastModified?: number;
}

/** 完整会话状态 */
export interface SessionState {
    folderPath: string | null;
    tabs: SavedTab[];
    activeTabId: string | null;
}

const SESSION_KEY = 'rustype_session';

/**
 * 保存当前会话（文件夹路径 + 所有标签页 + 当前活动标签）。
 * 仅保存文件路径和内容，不保存 DOM 引用或临时状态。
 */
export function saveSession(state: SessionState): void {
    try {
        // 移除 dirty/externallyModified 等临时状态，只保留持久化数据
        const persistable: SessionState = {
            folderPath: state.folderPath,
            activeTabId: state.activeTabId,
            tabs: state.tabs.map(tab => ({
                file: tab.file,
                content: tab.content,
                lastModified: tab.lastModified,
            })),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(persistable));
    } catch (e) {
        console.error('Failed to save session:', e);
    }
}

/**
 * 加载上次会话。如果无记录或解析失败，返回 null。
 */
export function loadSession(): SessionState | null {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            return JSON.parse(stored) as SessionState;
        }
    } catch (e) {
        console.error('Failed to load session:', e);
    }
    return null;
}

/**
 * 清除会话记录（退出时可选调用，或用户手动清除时调用）。
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error('Failed to clear session:', e);
    }
}
