import { readTextFile, writeTextFile, BaseDirectory, stat } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';

export interface FileInfo {
    path: string;
    name: string;
}

export async function openMarkdownFile(): Promise<FileInfo | null> {
    const selected = await open({
        multiple: false,
        filters: [
            {
                name: 'Markdown Files',
                extensions: ['md', 'markdown'],
            },
            {
                name: 'All Files',
                extensions: ['*'],
            },
        ],
    });

    if (typeof selected === 'string') {
        return {
            path: selected,
            name: selected.split(/[/\\]/).pop() || '',
        };
    }

    return null;
}

export async function readFileContent(filePath: string): Promise<string> {
    return await readTextFile(filePath, { dir: BaseDirectory.None });
}

export async function saveMarkdownFile(content: string, filePath?: string): Promise<FileInfo | null> {
    if (filePath) {
        await writeTextFile(filePath, content, { dir: BaseDirectory.None });
        return {
            path: filePath,
            name: filePath.split(/[/\\]/).pop() || '',
        };
    }

    const selected = await save({
        filters: [
            {
                name: 'Markdown Files',
                extensions: ['md', 'markdown'],
            },
            {
                name: 'All Files',
                extensions: ['*'],
            },
        ],
    });

    if (typeof selected === 'string') {
        await writeTextFile(selected, content, { dir: BaseDirectory.None });
        return {
            path: selected,
            name: selected.split(/[/\\]/).pop() || '',
        };
    }

    return null;
}

export function getFileName(filePath: string): string {
    return filePath.split(/[/\\]/).pop() || 'Untitled';
}

export interface FileStat {
    mtime?: number;
    size: number;
}

export async function getFileStat(filePath: string): Promise<FileStat | null> {
    try {
        const fileStat = await stat(filePath, { dir: BaseDirectory.None });
        return {
            mtime: fileStat.mtime,
            size: fileStat.size,
        };
    } catch (error) {
        console.error('Failed to get file stat:', error);
        return null;
    }
}