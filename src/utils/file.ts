import { readTextFile, writeTextFile, stat, readDir } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import { platform } from '@tauri-apps/plugin-os';

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

/** Directory exclusion configuration */
const EXCLUDED_DIRS = new Set([
    'node_modules', 'dist', 'build', 'out', 'target',
    '.git', '.svn', '.hg',
    '__pycache__', '.pytest_cache', 'venv', '.venv',
    '.vscode', '.idea', '.vs',
    '.next', '.nuxt',
    '.asar',
]);

/**
 * Check if directory should be excluded from rendering
 * @param name Directory name
 * @param showHidden Whether to display hidden directories starting with dot
 * @param extraExcluded Additional directory names to exclude (from user settings)
 * @returns True if directory needs to be excluded
 */
function isExcludedDir(name: string, showHidden: boolean = false, extraExcluded?: Set<string>): boolean {
    if (EXCLUDED_DIRS.has(name)) return true;
    if (extraExcluded?.has(name)) return true;
    if (!showHidden && name.startsWith('.')) return true;
    return false;
}

/**
 * Judge whether a file is markdown format
 * @param name File name
 * @returns True if file extension belongs to markdown
 */
function isMarkdownFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdwn', 'mdtxt', 'mdtext'].includes(ext);
}

/**
 * Open system folder selection dialog
 * @returns Selected absolute folder path, null if cancelled
 */
export async function openFolderDialog(): Promise<string | null> {
    const selected = await open({
        directory: true,
        multiple: false,
        recursive: true,
    });
    return typeof selected === 'string' ? selected : null;
}

/**
 * Read single level of directory (core logic for lazy loading tree nodes)
 * @param dirPath Target directory absolute path
 * @param showHidden Whether to show hidden dot folders
 * @returns Root tree node containing direct children
 */
export async function readDirLevel(dirPath: string, showHidden = false, extraExcluded?: Set<string>): Promise<FileTreeNode> {
    const name = dirPath.split(/[/\\]/).pop() || dirPath;

    const root: FileTreeNode = {
        name,
        path: dirPath,
        isDir: true,
        children: [],
    };

    try {
        const entries = await readDir(dirPath);

        // Sort rule: directories first, then natural text sort for names
        entries.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name, undefined, { numeric: true });
        });

        for (const entry of entries) {
            const childPath = await join(dirPath, entry.name);
            const isDir = entry.isDirectory || (entry.isSymlink && !entry.isFile);

            if (isDir) {
                if (isExcludedDir(entry.name, showHidden, extraExcluded)) continue;

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

/**
 * Read root directory tree of project
 * @param dirPath Project root path
 * @returns Root file tree node
 */
export async function readDirectoryTree(dirPath: string, excludedDirs?: string[]): Promise<FileTreeNode> {
    const extraExcluded = excludedDirs ? new Set(excludedDirs) : undefined;
    return await readDirLevel(dirPath, false, extraExcluded);
}

/**
 * Lazy load child nodes of specified directory (used in sidebar file tree)
 * @param dirPath Target folder path to expand
 * @param showHidden Toggle display of hidden dot folders
 * @param excludedDirs Additional directory names to exclude (from user settings)
 * @returns Array of direct child tree nodes
 */
export async function loadChildren(dirPath: string, showHidden = false, excludedDirs?: string[]): Promise<FileTreeNode[]> {
    const extraExcluded = excludedDirs ? new Set(excludedDirs) : undefined;
    const node = await readDirLevel(dirPath, showHidden, extraExcluded);
    return node.children;
}

/* ==================== File Read & Write Operations ==================== */

/**
 * Open file picker dialog for selecting markdown files
 * @returns Selected file metadata, null if dialog closed
 */
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

/**
 * Read full text content from target file
 * @param filePath Absolute file path
 * @returns Plain text string of file content
 */
export async function readFileContent(filePath: string): Promise<string> {
    return await readTextFile(filePath);
}

/**
 * Detect line break format of text content
 * @param content Raw text string
 * @returns 'crlf' for Windows line break, 'lf' for Unix line break
 */
export function detectLineEnding(content: string): 'crlf' | 'lf' {
    return content.includes('\r\n') ? 'crlf' : 'lf';
}

/**
 * Get default system line break style based on OS platform
 * @returns CRLF for Windows, LF for macOS/Linux
 */
export function getDefaultLineEnding(): 'crlf' | 'lf' {
    try {
        return platform() === 'windows' ? 'crlf' : 'lf';
    } catch {
        return 'lf';
    }
}

/**
 * Save markdown content to file, open save dialog if no target path provided
 * @param content Text content to write
 * @param filePath Existing file path (optional)
 * @param lineEnding Target line break format to use
 * @returns Saved file metadata, null if save cancelled
 */
export async function saveMarkdownFile(
    content: string,
    filePath?: string,
    lineEnding: 'crlf' | 'lf' = 'lf'
): Promise<FileInfo | null> {
    let targetPath: string | undefined = filePath;

    if (!targetPath) {
        targetPath = await save({
            filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        }) ?? undefined;
    }

    if (typeof targetPath === 'string') {
        // Normalize all line breaks to LF first, then convert to target format
        // Prevents mixed line break symbols in output file
        const normalized = content.replace(/\r\n/g, '\n');
        const finalContent = lineEnding === 'crlf'
            ? normalized.replace(/\n/g, '\r\n')
            : normalized;
        await writeTextFile(targetPath, finalContent);
        return { path: targetPath, name: getFileName(targetPath) };
    }
    return null;
}

/**
 * Extract file name from absolute file path
 * @param filePath Full file path string
 * @returns Filename without directory prefix, fallback to "Untitled"
 */
export function getFileName(filePath: string): string {
    return filePath.split(/[/\\]/).pop() || 'Untitled';
}

export interface FileStat {
    mtime?: number;
    size: number;
}

/**
 * Get file metadata: modify timestamp and file size
 * @param filePath Target file path
 * @returns File stat object, null on access error
 */
export async function getFileStat(filePath: string): Promise<FileStat | null> {
    try {
        const fileStat = await stat(filePath);
        return { mtime: fileStat.mtime?.getTime(), size: fileStat.size };
    } catch (error) {
        console.error('Failed to get file stat:', error);
        return null;
    }
}

/* ==================== File System Operations (Invoke Rust Backend Commands) ==================== */

/**
 * Create empty file via Tauri Rust command
 * @param filePath Full path of new file
 */
export async function fsCreateFile(filePath: string): Promise<void> {
    await invoke('create_file', { path: filePath });
}

/**
 * Create empty directory via Tauri Rust command
 * @param dirPath Full path of new folder
 */
export async function fsCreateDirectory(dirPath: string): Promise<void> {
    await invoke('create_directory', { path: dirPath });
}

/**
 * Rename or move file / directory
 * @param oldPath Original file/folder path
 * @param newPath Target new path
 */
export async function fsRename(oldPath: string, newPath: string): Promise<void> {
    await invoke('rename_file_or_dir', { oldPath, newPath });
}

/**
 * Copy file or entire directory recursively
 * @param source Source file/folder path
 * @param destination Destination path
 */
export async function fsCopy(source: string, destination: string): Promise<void> {
    await invoke('copy_file_or_dir', { source, destination });
}

/**
 * Delete file or directory (recursive removal for folders)
 * @param path Path of file/folder to delete
 */
export async function fsRemove(path: string): Promise<void> {
    await invoke('remove_file_or_dir', { path });
}

/**
 * Locate target file/folder and reveal in system file explorer
 * @param path Path of target item
 */
export async function fsRevealInFolder(path: string): Promise<void> {
    await invoke('reveal_in_folder', { path });
}

/**
 * Check if file or directory exists at given path
 * @param filePath Path to verify
 * @returns True if file/directory exists
 */
export async function fsExists(filePath: string): Promise<boolean> {
    try {
        await stat(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Dynamically grant runtime filesystem access permission for directory
 * @param dirPath Target folder path to authorize
 */
export async function grantDirectoryAccess(dirPath: string): Promise<void> {
    await invoke('grant_directory_access', { path: dirPath });
}

/**
 * Dynamically grant runtime filesystem access permission for single file
 * @param filePath Target file path to authorize
 */
export async function grantFileAccess(filePath: string): Promise<void> {
    await invoke('grant_file_access', { path: filePath });
}