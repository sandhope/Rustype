import { copyFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface ImageConfig {
    /** 'path' = insert path as-is; 'folder' = copy to target folder */
    action: string;
    /** Target folder path relative to project root (e.g. 'assets/images') */
    folderPath: string;
    /** Absolute path to project root */
    projectRoot: string;
    /** Absolute path to the current file's directory */
    fileDir: string;
}

/** Mutable config updated by App.tsx whenever settings or active file change. */
let currentConfig: ImageConfig = {
    action: 'path',
    folderPath: 'assets/images',
    projectRoot: '',
    fileDir: '',
};

export function updateImageConfig(config: Partial<ImageConfig>): void {
    currentConfig = { ...currentConfig, ...config };
}

const IMAGE_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.bmp', '.ico', '.tiff', '.tif', '.avif',
]);

function getExtension(name: string): string {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function isImageFile(name: string): boolean {
    return IMAGE_EXTENSIONS.has(getExtension(name));
}

/**
 * Generate a unique file name to avoid overwriting existing files.
 * If "photo.png" exists, returns "photo-1.png", "photo-2.png", etc.
 */
async function uniqueFileName(dir: string, baseName: string): Promise<string> {
    const ext = getExtension(baseName);
    const nameWithoutExt = baseName.slice(0, baseName.length - ext.length);
    let candidate = baseName;
    let counter = 1;

    while (await exists(await join(dir, candidate)).catch(() => false)) {
        candidate = `${nameWithoutExt}-${counter}${ext}`;
        counter++;
    }

    return candidate;
}

/**
 * Core image action handler. Called by both ImageEditTool plugin and
 * Muya-level options (clipboard paste / drag-drop).
 *
 * - 'path' mode: returns the source path as-is.
 * - 'folder' mode: copies the image file into the configured folder
 *   (relative to project root) and returns a relative path from the
 *   current file's directory.
 */
export async function handleImageAction(state: { src: unknown }): Promise<string> {
    const src = state.src;
    if (!src) return '';

    // Normalize src to a string path
    let srcPath: string;
    if (typeof src === 'string') {
        srcPath = src;
    } else if (typeof File !== 'undefined' && src instanceof File) {
        // Browser File object — create a temporary object URL
        try {
            return URL.createObjectURL(src);
        } catch {
            return '';
        }
    } else if (typeof src === 'object' && src !== null && 'path' in (src as any)) {
        srcPath = String((src as any).path);
    } else {
        try {
            return String(src);
        } catch {
            return '';
        }
    }

    // URLs and data URIs are passed through as-is
    if (/^https?:\/\//.test(srcPath) || srcPath.startsWith('data:') || srcPath.startsWith('blob:')) {
        return srcPath;
    }

    // 'path' mode: return the source path unchanged
    if (currentConfig.action !== 'folder') {
        return srcPath;
    }

    // 'folder' mode: copy image to target folder
    if (!currentConfig.projectRoot) {
        console.warn('[image] No project root set, falling back to path mode');
        return srcPath;
    }

    try {
        const targetDir = await join(currentConfig.projectRoot, currentConfig.folderPath);

        // Ensure target directory exists
        if (!await exists(targetDir).catch(() => false)) {
            await mkdir(targetDir, { recursive: true });
        }

        // Generate unique file name
        const baseName = srcPath.split(/[/\\]/).pop() || `image-${Date.now()}.png`;
        const fileName = await uniqueFileName(targetDir, baseName);
        const targetPath = await join(targetDir, fileName);

        // Copy the file
        await copyFile(srcPath, targetPath);

        // Compute relative path from the current file's directory
        if (currentConfig.fileDir) {
            return computeRelativePath(currentConfig.fileDir, targetPath);
        }

        // Fallback: relative to project root
        return `${currentConfig.folderPath}/${fileName}`;
    } catch (err) {
        console.error('[image] Failed to copy image to folder:', err);
        return srcPath;
    }
}

/**
 * Compute a POSIX-style relative path from `fromDir` to `toFile`.
 * Falls back to the absolute `toFile` path if computation fails.
 */
function computeRelativePath(fromDir: string, toFile: string): string {
    try {
        // Normalize separators to forward slashes
        const from = fromDir.replace(/\\/g, '/');
        const to = toFile.replace(/\\/g, '/');

        const fromParts = from.split('/').filter(Boolean);
        const toParts = to.split('/').filter(Boolean);

        // Find common prefix length
        let common = 0;
        while (
            common < fromParts.length &&
            common < toParts.length &&
            fromParts[common].toLowerCase() === toParts[common].toLowerCase()
        ) {
            common++;
        }

        const ups = fromParts.length - common;
        const downs = toParts.slice(common);

        if (ups === 0 && downs.length === 0) return '.';
        const parts = Array(ups).fill('..').concat(downs);
        return parts.join('/');
    } catch {
        return toFile;
    }
}

/**
 * Resolve clipboard file path for image paste.
 * On Tauri/Windows, clipboard may contain a file path via NativeFileList.
 * Returns the path if it's an image file, otherwise empty string.
 */
export async function resolveClipboardFilePath(): Promise<string> {
    try {
        // Tauri clipboard plugin — check if there's a file path on the clipboard
        const clipboard = await import('@tauri-apps/plugin-clipboard-manager');
        // Try reading as text first (some environments put file paths as text)
        const text = await clipboard.readText();
        if (text && isImageFile(text.trim())) {
            const path = text.trim();
            if (await exists(path).catch(() => false)) {
                return path;
            }
        }
    } catch {
        // Clipboard plugin not available
    }
    return '';
}

/**
 * Resolve a dragged File object to its filesystem path.
 * In Tauri's webview, File objects from drag events have a `path` property.
 */
export function resolveFilePathForFile(file: File): string {
    return (file as any).path || '';
}
