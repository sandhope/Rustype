import { readTextFile, readDir, type DirEntry } from '@tauri-apps/plugin-fs';

// ---------------------------------------------------------------------------
// Type definitions (aligned with marktext Sidebar's SearchResult/SearchMatch shape)
// ---------------------------------------------------------------------------

/** [[startLine, startCh], [endLine, endCh]] -- line numbers are 0-based */
export type SearchRange = [[number, number], [number, number]];

export interface SearchMatch {
    lineText: string;
    range: SearchRange;
}

export interface SearchResult {
    filePath: string;
    matches: SearchMatch[];
}

export interface SearchOptions {
    isCaseSensitive?: boolean;
    isWholeWord?: boolean;
    isRegexp?: boolean;
    /** Max number of files to return results for (prevents UI blocking), default 100 */
    maxFileResults?: number;
    /** Max matches per file, default 200 */
    maxMatchesPerFile?: number;
    /** Optional progress callback: processed files / total files */
    onProgress?: (done: number, total: number) => void;
}

// ---------------------------------------------------------------------------
// Directory exclusion & file filtering (rules aligned with file.ts)
// ---------------------------------------------------------------------------

const EXCLUDED_DIRS = new Set([
    'node_modules', 'dist', 'build', 'out', 'target',
    '.git', '.svn', '.hg',
    '__pycache__', '.pytest_cache', 'venv', '.venv',
    '.vscode', '.idea', '.vs',
    '.next', '.nuxt',
]);

function isExcludedDir(name: string): boolean {
    if (EXCLUDED_DIRS.has(name)) return true;
    return name.startsWith('.');
}

function isMarkdownFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdwn', 'mdtxt', 'mdtext'].includes(ext);
}

/** Recursively collect all Markdown file paths to search */
async function collectMarkdownFiles(rootPath: string): Promise<string[]> {
    const results: string[] = [];
    const stack: string[] = [rootPath];

    while (stack.length > 0) {
        const currentPath = stack.pop()!;
        try {
            const entries: DirEntry[] = await readDir(currentPath);
            for (const entry of entries) {
                const childPath = `${currentPath.replace(/[\\/]+$/, '')}/${entry.name}`;
                if (entry.isDirectory) {
                    if (isExcludedDir(entry.name)) continue;
                    stack.push(childPath);
                } else if (isMarkdownFile(entry.name)) {
                    results.push(childPath);
                }
            }
        } catch (err) {
            // Permission/access error, continue processing other directories
            console.warn(`Failed to read directory ${currentPath}:`, err);
        }
    }

    return results;
}

// ---------------------------------------------------------------------------
// Execute matching within a single file
// ---------------------------------------------------------------------------

/**
 * Search given content and return all matches.
 * Line-by-line scan -- trailing newlines stripped from lineText for display.
 */
function searchInContent(content: string, keyword: string, options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const maxMatches = options.maxMatchesPerFile ?? 200;
    if (!keyword) return matches;

    // Build search RegExp from options
    let pattern: RegExp;
    try {
        if (options.isRegexp) {
            const flags = options.isCaseSensitive ? 'g' : 'gi';
            pattern = new RegExp(keyword, flags);
        } else {
            // Non-regex: escape metacharacters in keyword
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wrapped = options.isWholeWord ? `\\b${escaped}\\b` : escaped;
            const flags = options.isCaseSensitive ? 'g' : 'gi';
            pattern = new RegExp(wrapped, flags);
        }
    } catch (err) {
        // Invalid regex (e.g. unclosed parenthesis) -- return empty list
        console.warn('Invalid search keyword:', err);
        return matches;
    }

    const lines = content.split(/\r?\n/);
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        if (matches.length >= maxMatches) break;
        const line = lines[lineIdx];
        if (!line) continue;

        let m: RegExpExecArray | null;
        pattern.lastIndex = 0;
        while ((m = pattern.exec(line)) !== null && matches.length < maxMatches) {
            const start = m.index;
            const end = start + m[0].length;
            matches.push({
                lineText: line,
                range: [[lineIdx, start], [lineIdx, end]],
            });
            // Advance manually on zero-width match to avoid infinite loop
            if (m[0].length === 0) pattern.lastIndex++;
        }
    }

    return matches;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface SearchSession {
    cancel: () => void;
    /** Returns final results as a Promise for awaiting */
    promise: Promise<SearchResult[]>;
}

/**
 * Recursively search all Markdown files under the given directory for keyword.
 *
 * File reads are serial to avoid blocking the UI (can be changed to chunked async).
 * Caller can cancel mid-search via session.cancel() (e.g. when keyword changes).
 */
export function searchInFolder(
    rootPath: string,
    keyword: string,
    options: SearchOptions = {},
): SearchSession {
    let cancelled = false;
    const maxFiles = options.maxFileResults ?? 100;

    const promise: Promise<SearchResult[]> = (async () => {
        if (!keyword || !rootPath) return [];

        // Step 1: collect candidate file list
        const files = await collectMarkdownFiles(rootPath);
        if (cancelled) return [];

        const total = files.length;
        const resultList: SearchResult[] = [];

        for (let i = 0; i < files.length; i++) {
            if (cancelled) break;
            if (resultList.length >= maxFiles) break;

            const filePath = files[i];
            try {
                const content = await readTextFile(filePath);
                if (cancelled) break;
                const matches = searchInContent(content, keyword, options);
                if (matches.length > 0) {
                    resultList.push({ filePath, matches });
                }
            } catch (err) {
                // Individual file read failure does not block overall search
                console.warn(`Failed to read file ${filePath}:`, err);
            }

            try {
                options.onProgress?.(i + 1, total);
            } catch {
                /* ignore */
            }
        }

        return resultList;
    })();

    return {
        cancel: () => {
            cancelled = true;
        },
        promise,
    };
}
