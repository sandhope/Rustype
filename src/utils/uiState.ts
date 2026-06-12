import { LazyStore } from '@tauri-apps/plugin-store';

const SIDEBAR_WIDTH_KEY = 'sidebarWidth';
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 600;

const uiStore = new LazyStore('ui.bin');

export function getDefaultSidebarWidth(): number {
    return DEFAULT_SIDEBAR_WIDTH;
}

function clampSidebarWidth(value: number): number {
    return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value));
}

export async function loadSidebarWidth(): Promise<number> {
    try {
        const stored = await uiStore.get<number>(SIDEBAR_WIDTH_KEY);
        if (typeof stored === 'number' && !Number.isNaN(stored)) {
            return clampSidebarWidth(stored);
        }
    } catch (e) {
        console.error('Failed to load sidebar width:', e);
    }
    return DEFAULT_SIDEBAR_WIDTH;
}

export async function saveSidebarWidth(width: number): Promise<void> {
    try {
        await uiStore.set(SIDEBAR_WIDTH_KEY, clampSidebarWidth(width));
        await uiStore.save();
    } catch (e) {
        console.error('Failed to save sidebar width:', e);
    }
}
