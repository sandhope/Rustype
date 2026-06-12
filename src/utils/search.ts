import { readTextFile, readDir, type DirEntry } from '@tauri-apps/plugin-fs';

// ---------------------------------------------------------------------------
// 类型定义（对齐 marktext 中 Sidebar 的 SearchResult/SearchMatch 形状）
// ---------------------------------------------------------------------------

/** [[startLine, startCh], [endLine, endCh]] —— 行号从 0 开始 */
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
    /** 最多返回多少个文件的结果（避免过多结果阻塞 UI），默认 100 */
    maxFileResults?: number;
    /** 单个文件内最多返回多少条匹配，默认 200 */
    maxMatchesPerFile?: number;
    /** 可选的进度回调：已处理文件数 / 总文件数 */
    onProgress?: (done: number, total: number) => void;
}

// ---------------------------------------------------------------------------
// 目录排除 & 文件过滤（与 file.ts 保持一致的规则）
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

/** 递归收集所有需要搜索的 Markdown 文件路径 */
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
            // 权限/访问错误，继续处理其他目录
            console.warn(`无法读取目录 ${currentPath}:`, err);
        }
    }

    return results;
}

// ---------------------------------------------------------------------------
// 单个文件内执行匹配
// ---------------------------------------------------------------------------

/**
 * 对给定内容执行搜索，返回所有匹配项。
 * 逐行扫描 —— 返回的 lineText 会去除末尾换行符以保持展示整洁。
 */
function searchInContent(content: string, keyword: string, options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const maxMatches = options.maxMatchesPerFile ?? 200;
    if (!keyword) return matches;

    // 根据选项构建搜索 RegExp
    let pattern: RegExp;
    try {
        if (options.isRegexp) {
            const flags = options.isCaseSensitive ? 'g' : 'gi';
            pattern = new RegExp(keyword, flags);
        } else {
            // 非正则：对关键字中的元字符进行转义
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wrapped = options.isWholeWord ? `\\b${escaped}\\b` : escaped;
            const flags = options.isCaseSensitive ? 'g' : 'gi';
            pattern = new RegExp(wrapped, flags);
        }
    } catch (err) {
        // 非法正则（例如未闭合的括号）—— 返回空列表
        console.warn('搜索关键字非法：', err);
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
            // 零宽匹配时手动前进，避免无限循环
            if (m[0].length === 0) pattern.lastIndex++;
        }
    }

    return matches;
}

// ---------------------------------------------------------------------------
// 对外暴露的入口函数
// ---------------------------------------------------------------------------

export interface SearchSession {
    cancel: () => void;
    /** 以 Promise 形式返回最终结果，便于使用方 await */
    promise: Promise<SearchResult[]>;
}

/**
 * 在给定目录下递归搜索所有 Markdown 文件中包含 keyword 的内容。
 *
 * 注意：为避免阻塞 UI，这里是串行读取文件（也可改为分块异步）。
 * 调用方可以通过 session.cancel() 中途取消搜索（例如用户修改了关键字）。
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

        // 第一步：先列出候选文件清单
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
                // 个别文件读取失败不阻断整体搜索
                console.warn(`读取文件失败 ${filePath}:`, err);
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
