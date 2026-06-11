import type { FileInfo } from './file';

const RECENT_FILES_KEY = 'rustype_recent_files';
const MAX_RECENT_FILES = 10;

export function getRecentFiles(): FileInfo[] {
    try {
        const stored = localStorage.getItem(RECENT_FILES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to get recent files:', e);
    }
    return [];
}

export function addRecentFile(file: FileInfo): void {
    try {
        const recentFiles = getRecentFiles();
        // Remove if already exists
        const filtered = recentFiles.filter(f => f.path !== file.path);
        // Add to front
        filtered.unshift(file);
        // Limit size
        const limited = filtered.slice(0, MAX_RECENT_FILES);
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(limited));
    } catch (e) {
        console.error('Failed to add recent file:', e);
    }
}

export function removeRecentFile(filePath: string): void {
    try {
        const recentFiles = getRecentFiles();
        const filtered = recentFiles.filter(f => f.path !== filePath);
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error('Failed to remove recent file:', e);
    }
}

export function clearRecentFiles(): void {
    try {
        localStorage.removeItem(RECENT_FILES_KEY);
    } catch (e) {
        console.error('Failed to clear recent files:', e);
    }
}