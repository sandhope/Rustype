import { LazyStore } from '@tauri-apps/plugin-store';
import type { FileInfo } from './file';

/** Restorable data for a single tab */
export interface SavedTab {
    file: FileInfo | null;
    content: string;
    lastModified?: number;
    lineEnding?: 'crlf' | 'lf';
}

/** Complete session state */
export interface SessionState {
    folderPath: string | null;
    tabs: SavedTab[];
    activeTabId: string | null;
}

const SESSION_STORE_KEY = 'session';

const sessionStore = new LazyStore('session.bin');

/**
 * Save the current session (folder path + all tabs + currently active tab).
 * Only saves file paths and content, excluding DOM references or temporary states.
 */
export async function saveSession(state: SessionState): Promise<void> {
    try {
        const persistable: SessionState = {
            folderPath: state.folderPath,
            activeTabId: state.activeTabId,
            tabs: state.tabs.map(tab => ({
                file: tab.file,
                content: tab.content,
                lastModified: tab.lastModified,
                lineEnding: tab.lineEnding,
            })),
        };
        await sessionStore.set(SESSION_STORE_KEY, persistable);
        await sessionStore.save();
    } catch (e) {
        console.error('Failed to save session:', e);
    }
}

/**
 * Load the previous session. Returns null if no record exists or parsing fails.
 */
export async function loadSession(): Promise<SessionState | null> {
    try {
        const stored = await sessionStore.get<SessionState>(SESSION_STORE_KEY);
        if (stored) {
            return stored;
        }
    } catch (e) {
        console.error('Failed to load session:', e);
    }
    return null;
}

/**
 * Clear the session record. Can be optionally called on exit, or when manually cleared by the user.
 */
export async function clearSession(): Promise<void> {
    try {
        await sessionStore.delete(SESSION_STORE_KEY);
        await sessionStore.save();
    } catch (e) {
        console.error('Failed to clear session:', e);
    }
}
