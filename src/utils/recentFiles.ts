import { LazyStore } from '@tauri-apps/plugin-store';
import type { FileInfo } from './file';

const RECENT_FILES_KEY = 'recentFiles';
const RECENT_FOLDERS_KEY = 'recentFolders';
const MAX_RECENT_ITEMS = 10;

const recentStore = new LazyStore('recent.bin');

export async function getRecentFiles(): Promise<FileInfo[]> {
    try {
        const stored = await recentStore.get<FileInfo[]>(RECENT_FILES_KEY);
        if (stored) {
            return stored;
        }
    } catch (e) {
        console.error('Failed to get recent files:', e);
    }
    return [];
}

export async function getRecentFolders(): Promise<FileInfo[]> {
    try {
        const stored = await recentStore.get<FileInfo[]>(RECENT_FOLDERS_KEY);
        if (stored) {
            return stored;
        }
    } catch (e) {
        console.error('Failed to get recent folders:', e);
    }
    return [];
}

export async function addRecentFile(file: FileInfo): Promise<void> {
    try {
        const recentFiles = await getRecentFiles();
        const filtered = recentFiles.filter(f => f.path !== file.path);
        filtered.unshift(file);
        const limited = filtered.slice(0, MAX_RECENT_ITEMS);
        await recentStore.set(RECENT_FILES_KEY, limited);
        await recentStore.save();
    } catch (e) {
        console.error('Failed to add recent file:', e);
    }
}

export async function addRecentFolder(folder: FileInfo): Promise<void> {
    try {
        const recentFolders = await getRecentFolders();
        const filtered = recentFolders.filter(f => f.path !== folder.path);
        filtered.unshift(folder);
        const limited = filtered.slice(0, MAX_RECENT_ITEMS);
        await recentStore.set(RECENT_FOLDERS_KEY, limited);
        await recentStore.save();
    } catch (e) {
        console.error('Failed to add recent folder:', e);
    }
}

export async function removeRecentFile(filePath: string): Promise<void> {
    try {
        const recentFiles = await getRecentFiles();
        const filtered = recentFiles.filter(f => f.path !== filePath);
        await recentStore.set(RECENT_FILES_KEY, filtered);
        await recentStore.save();
    } catch (e) {
        console.error('Failed to remove recent file:', e);
    }
}

export async function clearRecentlyOpened(): Promise<void> {
    try {
        await recentStore.delete(RECENT_FILES_KEY);
        await recentStore.delete(RECENT_FOLDERS_KEY);
        await recentStore.save();
    } catch (e) {
        console.error('Failed to clear recently opened:', e);
    }
}
