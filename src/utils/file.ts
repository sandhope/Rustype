import { readTextFile, writeTextFile, BaseDirectory, stat, readDir, type DirEntry } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

export interface FileInfo {
    path: string;
    name: string;
    isDir?: boolean;
}

export interface FileTreeNode {
    name: string;
    path: string;
    isDir: boolean;
    children: FileTreeNode[];
}

/** 目录排除配置 */
const EXCLUDED_DIRS = new Set([
    'node_modules', 'dist', 'build', 'out', 'target',
    '.git', '.svn', '.hg',
    '__pycache__', '.pytest_cache', 'venv', '.venv',
    '.vscode', '.idea', '.vs',
    '.next', '.nuxt',
    '.asar',
]);

function isExcludedDir(name: string, showHidden: boolean = false): boolean {
    if (EXCLUDED_DIRS.has(name)) return true;
    if (!showHidden && name.startsWith('.')) return true;
    return false;
}

function isMarkdownFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdwn', 'mdtxt', 'mdtext'].includes(ext);
}

/** 打开文件夹对话框 */
export async function openFolderDialog(): Promise<string | null> {
    const selected = await open({
        directory: true,
        multiple: false,
        recursive: true,
    });
    return typeof selected === 'string' ? selected : null;
}

/** 只读取一层目录（懒加载核心） */
export async function readDirLevel(dirPath: string, showHidden = false): Promise<FileTreeNode> {
    const name = dirPath.split(/[/\\]/).pop() || dirPath;

    const root: FileTreeNode = {
        name,
        path: dirPath,
        isDir: true,
        children: [],
    };

    try {
        const entries = await readDir(dirPath);

        entries.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
        });

        for (const entry of entries) {
            const childPath = await join(dirPath, entry.name);
            const isDir = entry.isDirectory || (entry.isSymlink && !entry.isFile);

            if (isDir) {
                if (isExcludedDir(entry.name, showHidden)) continue;

                root.children.push({
                    name: entry.name,
                    path: childPath,
                    isDir: true,
                    children: [],
                });
            } else if (isMarkdownFile(entry.name)) {
                root.children.push({
                    name: entry.name,
                    path: childPath,
                    isDir: false,
                    children: [],
                });
            }
        }
    } catch (error) {
        console.error(`Failed to read directory: ${dirPath}`, error);
    }

    return root;
}

/** 读取项目根目录 */
export async function readDirectoryTree(dirPath: string): Promise<FileTreeNode> {
    return await readDirLevel(dirPath);
}

/** 懒加载：加载子节点（Sidebar 中使用） */
export async function loadChildren(dirPath: string, showHidden = false): Promise<FileTreeNode[]> {
    const node = await readDirLevel(dirPath, showHidden);
    return node.children;
}

/* ==================== 文件读写操作 ==================== */

export async function openMarkdownFile(): Promise<FileInfo | null> {
    const selected = await open({
        multiple: false,
        filters: [
            { name: 'Markdown Files', extensions: ['md', 'markdown'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });

    if (typeof selected === 'string') {
        return { path: selected, name: getFileName(selected) };
    }
    return null;
}

export async function readFileContent(filePath: string): Promise<string> {
    return await readTextFile(filePath, { dir: BaseDirectory.None });
}

export async function saveMarkdownFile(content: string, filePath?: string): Promise<FileInfo | null> {
    let targetPath = filePath;

    if (!targetPath) {
        targetPath = await save({
            filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
    }

    if (typeof targetPath === 'string') {
        await writeTextFile(targetPath, content, { dir: BaseDirectory.None });
        return { path: targetPath, name: getFileName(targetPath) };
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
        return { mtime: fileStat.mtime, size: fileStat.size };
    } catch {
        console.error('Failed to get file stat:', error);
        return null;
    }
}

/* ==================== 文件系统操作（通过 Rust 命令） ==================== */

export async function fsCreateFile(filePath: string): Promise<void> {
    await invoke('create_file', { path: filePath });
}

export async function fsCreateDirectory(dirPath: string): Promise<void> {
    await invoke('create_directory', { path: dirPath });
}

export async function fsRename(oldPath: string, newPath: string): Promise<void> {
    await invoke('rename_file_or_dir', { oldPath, newPath });
}

export async function fsCopy(source: string, destination: string): Promise<void> {
    await invoke('copy_file_or_dir', { source, destination });
}

export async function fsRemove(path: string): Promise<void> {
    await invoke('remove_file_or_dir', { path });
}

export async function fsRevealInFolder(path: string): Promise<void> {
    await invoke('reveal_in_folder', { path });
}

export async function fsExists(filePath: string): Promise<boolean> {
    try {
        await stat(filePath, { dir: BaseDirectory.None });
        return true;
    } catch {
        return false;
    }
}