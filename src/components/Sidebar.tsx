import { useState, useCallback, useRef, useEffect, memo } from 'react';
import type { FileTreeNode } from '../utils/file';
import { watch } from '@tauri-apps/plugin-fs';


import {
    loadChildren,
    fsCreateFile,
    fsCreateDirectory,
    fsRename,
    fsCopy,
    fsRemove,
    fsRevealInFolder,
    fsExists,
} from '../utils/file';
import { join } from '@tauri-apps/api/path';
import fileIcons from '../muya/src/ui/utils/fileIcons';
import '../muya/src/ui/utils/fileIcons'; // side-effect: imports CSS
import {
    searchInFolder,
    type SearchResult as FolderSearchResult,
    type SearchMatch as FolderSearchMatch,
} from '../utils/search';
import { loadSidebarWidth, saveSidebarWidth, getDefaultSidebarWidth } from '../utils/uiState';
import { useI18n } from '../utils/i18n';

export type SidebarPanel = 'explorer' | 'search' | 'outline';

interface SidebarProps {
    activePanel: SidebarPanel | null;
    onPanelChange: (panel: SidebarPanel | null) => void;
    projectTree: FileTreeNode | null;
    onFolderFileSelect: (filePath: string) => void;
    activeFilePath: string | null;
    onOpenSettings: () => void;
    onOpenFolder: () => void;
    tocItems: { content: string; lvl: number; slug: string; githubSlug: string }[];
    onTocItemClick: (item: { content: string; lvl: number; slug: string; githubSlug: string }) => void;
    onTreeRefresh: () => void;
    onCloseTabsForPath: (path: string) => void;
    excludedDirs?: string[];
}

/* ==================== Clipboard state (module-level, shared across components) ==================== */
let clipboardPath: string | null = null;
let clipboardIsCut = false;

function setClipboard(path: string, isCut: boolean) {
    clipboardPath = path;
    clipboardIsCut = isCut;
}

function getClipboard(): { path: string | null; isCut: boolean } {
    return { path: clipboardPath, isCut: clipboardIsCut };
}

function clearClipboard() {
    clipboardPath = null;
    clipboardIsCut = false;
}

function getParentPath(filePath: string): string | null {
    const idx = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return idx > 0 ? filePath.substring(0, idx) : null;
}

/**
 * Generate a new file name for a copy operation.
 * @param name The original file name.
 * @param copyIndex The index of the copy operation, starting from 1.
 * @returns The new file name with a suffix like "copy.txt" or "copy 2.txt".
 */
function generateCopyName(name: string, copyIndex: number): string {
    const dotIdx = name.lastIndexOf('.');
    const baseName = dotIdx > 0 ? name.substring(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.substring(dotIdx) : '';
    const suffix = copyIndex === 1 ? ' copy' : ` copy ${copyIndex}`;
    return `${baseName}${suffix}${ext}`;
}

/* ==================== Context menu (module-level, shared across components) ==================== */
interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    node: FileTreeNode | null;
    rootPath: string | null;
}

function ContextMenu({
    state,
    onClose,
    onNewFile,
    onNewDir,
    onCopy,
    onCut,
    onPaste,
    onRename,
    onTrash,
    onReveal,
}: {
    state: ContextMenuState;
    onClose: () => void;
    onNewFile: () => void;
    onNewDir: () => void;
    onCopy: () => void;
    onCut: () => void;
    onPaste: () => void;
    onRename: () => void;
    onTrash: () => void;
    onReveal: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useI18n();

    useEffect(() => {
        if (!state.visible) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [state.visible, onClose]);

    if (!state.visible) return null;

    const isBlankArea = !state.node;
    const { path: clipPath, isCut: clipIsCut } = getClipboard();
    // Paste target: Folder nodes paste directly into themselves, file nodes paste into their parent directory, and blank areas paste into the project root.
    const pasteTarget = isBlankArea
        ? state.rootPath
        : state.node!.isDir
            ? state.node!.path
            : getParentPath(state.node!.path);
    // Cut to the same directory is not allowed; copy to the same directory is allowed (with a copy suffix); no clipboard is allowed
    const srcDir = clipPath ? getParentPath(clipPath) : null;
    const sameDir = srcDir !== null && srcDir === pasteTarget;
    const canPaste = clipPath !== null && pasteTarget !== null && !(clipIsCut && sameDir);

    return (
        <div
            ref={menuRef}
            className="tree-context-menu"
            style={{ left: state.x, top: state.y }}
        >
            <div className="tree-context-item" onClick={() => { onNewFile(); onClose(); }}>
                {t('contextMenu.newFile')}
            </div>
            <div className="tree-context-item" onClick={() => { onNewDir(); onClose(); }}>
                {t('contextMenu.newFolder')}
            </div>
            <div className="tree-context-divider" />
            {!isBlankArea && (
                <>
                    <div className="tree-context-item" onClick={() => { onCopy(); onClose(); }}>
                        {t('contextMenu.copy')}
                    </div>
                    <div className="tree-context-item" onClick={() => { onCut(); onClose(); }}>
                        {t('contextMenu.cut')}
                    </div>
                </>
            )}
            <div
                className={`tree-context-item${canPaste ? '' : ' disabled'}`}
                onClick={() => { if (canPaste) { onPaste(); onClose(); } }}
            >
                {t('contextMenu.paste')}
            </div>
            <div className="tree-context-divider" />
            {!isBlankArea && (
                <>
                    <div className="tree-context-item" onClick={() => { onRename(); onClose(); }}>
                        {t('contextMenu.rename')}
                    </div>
                    <div className="tree-context-item tree-context-danger" onClick={() => { onTrash(); onClose(); }}>
                        {t('contextMenu.moveToTrash')}
                    </div>
                    <div className="tree-context-divider" />
                </>
            )}
            <div className="tree-context-item" onClick={() => { onReveal(); onClose(); }}>
                {t('contextMenu.revealInFolder')}
            </div>
        </div>
    );
}

/* ==================== Inline rename input ==================== */
function InlineRename({
    initialName,
    onConfirm,
    onCancel,
}: {
    initialName: string;
    onConfirm: (newName: string) => void;
    onCancel: () => void;
}) {
    const [value, setValue] = useState(initialName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (value.trim() && value.trim() !== initialName) {
                onConfirm(value.trim());
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        if (value.trim() && value.trim() !== initialName) {
            onConfirm(value.trim());
        } else {
            onCancel();
        }
    };

    return (
        <input
            ref={inputRef}
            className="tree-rename-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
        />
    );
}

/* ==================== Inline create input ==================== */
function InlineCreate({
    placeholder,
    onConfirm,
    onCancel,
}: {
    placeholder: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
}) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (value.trim()) {
                onConfirm(value.trim());
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        if (value.trim()) {
            onConfirm(value.trim());
        } else {
            onCancel();
        }
    };

    return (
        <input
            ref={inputRef}
            className="tree-rename-input"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
        />
    );
}

/* ==================== Folder tree node ==================== */
type NodeAction =
    | { type: 'none' }
    | { type: 'rename'; targetPath: string }
    | { type: 'newFile'; parentPath: string }
    | { type: 'newDir'; parentPath: string };

function FolderTreeNode({
    node,
    depth,
    onFileClick,
    onLoadChildren,
    activeFilePath,
    onContextMenu,
    onTreeRefresh,
    nodeAction,
    onActionDone,
    refreshKey,
}: {
    node: FileTreeNode;
    depth: number;
    onFileClick: (filePath: string) => void;
    onLoadChildren: (dirPath: string) => Promise<FileTreeNode[]>;
    activeFilePath: string | null;
    onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
    onTreeRefresh: () => void;
    nodeAction: NodeAction;
    onActionDone: () => void;
    refreshKey: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileTreeNode[]>(node.children);
    const [loading, setLoading] = useState(false);
    const { t } = useI18n();

    // When refreshKey changes, reload children if the directory is expanded
    useEffect(() => {
        if (expanded && node.isDir) {
            onLoadChildren(node.path).then(setChildren).catch(console.error);
        }
    }, [refreshKey]);

    const isRenaming = nodeAction.type === 'rename' && nodeAction.targetPath === node.path;
    const isCreatingFile = nodeAction.type === 'newFile' && nodeAction.parentPath === node.path;
    const isCreatingDir = nodeAction.type === 'newDir' && nodeAction.parentPath === node.path;

    // When creating a file or directory, expand the current directory
    useEffect(() => {
        if ((isCreatingFile || isCreatingDir) && !expanded) {
            setExpanded(true);
        }
    }, [isCreatingFile, isCreatingDir]);

    const handleToggle = async () => {
        if (!node.isDir) return;

        const nextExpanded = !expanded;
        setExpanded(nextExpanded);

        if (nextExpanded && children.length === 0) {
            setLoading(true);
            try {
                const loadedChildren = await onLoadChildren(node.path);
                setChildren(loadedChildren);
            } catch (error) {
                console.error('Failed to load children:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, node);
    };

    const handleNewFile = async (name: string) => {
        onActionDone();
        try {
            // Ensure the file name ends with .md
            const fileName = name.endsWith('.md') ? name : `${name}.md`;
            const newPath = await join(node.path, fileName);
            await fsCreateFile(newPath);
            if (!expanded) setExpanded(true);
            const loadedChildren = await onLoadChildren(node.path);
            setChildren(loadedChildren);
            onTreeRefresh();
        } catch (error) {
            console.error('Failed to create file:', error);
        }
    };

    const handleNewDir = async (name: string) => {
        onActionDone();
        try {
            const newPath = await join(node.path, name);
            await fsCreateDirectory(newPath);
            if (!expanded) setExpanded(true);
            const loadedChildren = await onLoadChildren(node.path);
            setChildren(loadedChildren);
            onTreeRefresh();
        } catch (error) {
            console.error('Failed to create directory:', error);
        }
    };

    const handleRename = async (newName: string) => {
        onActionDone();
        try {
            const parentPath = node.path.substring(0, node.path.lastIndexOf('/') !== -1 ? node.path.lastIndexOf('/') : node.path.lastIndexOf('\\'));
            const fileName = !node.isDir && !newName.trim().toLowerCase().endsWith('.md') 
                ? `${newName.trim()}.md` 
                : newName.trim();
            const newPath = await join(parentPath, fileName);
            await fsRename(node.path, newPath);
            onTreeRefresh();
        } catch (error) {
            console.error('Failed to rename:', error);
        }
    };

    if (node.isDir) {
        return (
            <div className="tree-folder" onContextMenu={handleContextMenu}>
                <div
                    className="tree-folder-header"
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={handleToggle}
                >
                    <span className={`tree-arrow ${expanded ? 'expanded' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                            <path fill="currentColor" d="M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512 340.864 831.872a30.59 30.59 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"></path>
                        </svg>
                    </span>
                    <span className="tree-folder-icon">
                        {expanded ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.42782 7.2487C4.43495 6.97194 4.65009 6.75 4.91441 6.75H13.5293C13.7935 6.75 14.007 6.97194 13.9998 7.2487C13.9628 8.6885 13.7533 12.75 12.5721 12.75H3.375C4.55631 12.75 4.3907 8.6885 4.42782 7.2487Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                                <path d="M5.19598 12.625H3.66515C3.42618 12.625 3.22289 12.4453 3.18626 12.2017L1.94333 3.93602C1.89776 3.63295 2.12496 3.35938 2.42223 3.35938H5.78585C6.11241 3.35938 6.41702 3.52903 6.59618 3.81071L6.94517 4.35938H9.92811C10.4007 4.35938 10.8044 4.71102 10.8836 5.1917L11.1251 6.65624" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.8 13C13.1183 13 13.4235 12.8761 13.6486 12.6554C13.8735 12.4349 14 12.1356 14 11.8236V5.94118C14 5.62916 13.8735 5.32992 13.6486 5.10929C13.4235 4.88866 13.1183 4.76471 12.8 4.76471H8.06C7.8593 4.76664 7.66133 4.71919 7.48418 4.6267C7.30703 4.53421 7.15637 4.39964 7.046 4.2353L6.56 3.52941C6.45073 3.36675 6.30199 3.23322 6.1271 3.14082C5.95221 3.04842 5.75666 3.00004 5.558 3H3.2C2.88174 3 2.57651 3.12395 2.35148 3.34458C2.12643 3.56521 2 3.86445 2 4.17647V11.8236C2 12.1356 2.12643 12.4349 2.35148 12.6554C2.57651 12.8761 2.88174 13 3.2 13H12.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </span>
                    {isRenaming ? (
                        <InlineRename
                            initialName={node.name}
                            onConfirm={handleRename}
                            onCancel={onActionDone}
                        />
                    ) : (
                        <span className="tree-folder-name" title={node.path}>
                            {node.name}
                        </span>
                    )}
                    {loading && <span className="tree-loading">
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                            <path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5.75.75 0 0 1 1.5 0 8 8 0 1 1-8-8 .75.75 0 0 1 0 1.5z"/>
                        </svg>
                    </span>}
                </div>

                {expanded && (
                    <div className="tree-folder-children">
                        {isCreatingFile && (
                            <div
                                className="tree-file tree-creating"
                                style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
                            >
                                <InlineCreate
                                    placeholder={t('sidebar.newFileName')}
                                    onConfirm={handleNewFile}
                                    onCancel={onActionDone}
                                />
                            </div>
                        )}
                        {isCreatingDir && (
                            <div
                                className="tree-folder-header tree-creating"
                                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                            >
                                <span className="tree-arrow" />
                                <span className="tree-folder-icon">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.8 13C13.1183 13 13.4235 12.8761 13.6486 12.6554C13.8735 12.4349 14 12.1356 14 11.8236V5.94118C14 5.62916 13.8735 5.32992 13.6486 5.10929C13.4235 4.88866 13.1183 4.76471 12.8 4.76471H8.06C7.8593 4.76664 7.66133 4.71919 7.48418 4.6267C7.30703 4.53421 7.15637 4.39964 7.046 4.2353L6.56 3.52941C6.45073 3.36675 6.30199 3.23322 6.1271 3.14082C5.95221 3.04842 5.75666 3.00004 5.558 3H3.2C2.88174 3 2.57651 3.12395 2.35148 3.34458C2.12643 3.56521 2 3.86445 2 4.17647V11.8236C2 12.1356 2.12643 12.4349 2.35148 12.6554C2.57651 12.8761 2.88174 13 3.2 13H12.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </span>
                                <InlineCreate
                                    placeholder={t('sidebar.newFolderName')}
                                    onConfirm={handleNewDir}
                                    onCancel={onActionDone}
                                />
                            </div>
                        )}
                        {children.length > 0 && (
                            children.map((child) => (
                                <FolderTreeNode
                                    key={child.path}
                                    node={child}
                                    depth={depth + 1}
                                    onFileClick={onFileClick}
                                    onLoadChildren={onLoadChildren}
                                    activeFilePath={activeFilePath}
                                    onContextMenu={onContextMenu}
                                    onTreeRefresh={onTreeRefresh}
                                    nodeAction={nodeAction}
                                    onActionDone={onActionDone}
                                    refreshKey={refreshKey}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    }

    // File node component
    const isActive = activeFilePath === node.path;
    return (
        <div
            className={`tree-file${isActive ? ' active' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 28}px` }}
            onClick={() => onFileClick(node.path)}
            onContextMenu={handleContextMenu}
            title={node.path}
        >
            {isRenaming ? (
                <InlineRename
                    initialName={node.name}
                    onConfirm={handleRename}
                    onCancel={onActionDone}
                />
            ) : (
                <>
                    <span className={`tree-file-icon ${(fileIcons.getClassByName(node.name) || '').split(/\s/).join(' ')}`.trim()} />
                    <span className="tree-file-name">{node.name}</span>
                </>
            )}
        </div>
    );
}

/* ==================== Search result line highlight component ==================== */
function HighlightedLine({ match }: { match: FolderSearchMatch }) {
    const { range, lineText } = match;
    const startCh = range[0][1];
    const endCh = range[1][1];
    const before = lineText.substring(0, startCh);
    const middle = lineText.substring(startCh, endCh);
    const after = lineText.substring(endCh);
    return (
        <>
            <span>{before}</span>
            <span className="search-highlight">{middle}</span>
            <span>{after}</span>
        </>
    );
}

/* ==================== Sidebar main component ==================== */
const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 600;

function Sidebar({
    activePanel,
    onPanelChange,
    projectTree,
    onFolderFileSelect,
    activeFilePath,
    onOpenSettings,
    onOpenFolder,
    tocItems,
    onTocItemClick,
    onTreeRefresh,
    onCloseTabsForPath,
    excludedDirs,
}: SidebarProps) {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        node: null,
        rootPath: null,
    });
    const [nodeAction, setNodeAction] = useState<NodeAction>({ type: 'none' });
    const [refreshKey, setRefreshKey] = useState(0);
    const { t } = useI18n();

    // -----------------------------------------------------------------------
    // Search panel state
    // -----------------------------------------------------------------------
    const [keyword, setKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<FolderSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isWholeWord, setIsWholeWord] = useState(false);
    const [isRegexp, setIsRegexp] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);
    const activeSearchSessionRef = useRef<{ cancel: () => void } | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus search input when search panel is activated
    useEffect(() => {
        if (activePanel === 'search') {
            searchInputRef.current?.focus();
        }
    }, [activePanel]);

    // Search once when project is opened and keyword is set
    const handleRequestOpenFolder = useCallback(() => {
        onOpenFolder();
    }, [onOpenFolder]);

    const runSearch = useCallback(
        async (
            nextKeyword: string,
            opts: { caseSensitive: boolean; wholeWord: boolean; regexp: boolean },
        ) => {
            if (!projectTree || !nextKeyword) {
                setSearchResults([]);
                return;
            }

            // Cancel the previous search session if it's still running
            if (activeSearchSessionRef.current) {
                activeSearchSessionRef.current.cancel();
                activeSearchSessionRef.current = null;
            }

            setIsSearching(true);
            const session = searchInFolder(projectTree.path, nextKeyword, {
                isCaseSensitive: opts.caseSensitive,
                isWholeWord: opts.wholeWord,
                isRegexp: opts.regexp,
            });
            activeSearchSessionRef.current = session;

            try {
                const results = await session.promise;
                setSearchResults(results);
            } catch (err) {
                console.error('搜索失败：', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
                if (activeSearchSessionRef.current === session) {
                    activeSearchSessionRef.current = null;
                }
            }
        },
        [projectTree],
    );

    // Search when keyword changes, with debounce to avoid frequent calls
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        if (!keyword) {
            setSearchResults([]);
            return;
        }

        debounceTimerRef.current = setTimeout(() => {
            runSearch(keyword, {
                caseSensitive: isCaseSensitive,
                wholeWord: isWholeWord,
                regexp: isRegexp,
            });
        }, 250);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };
    }, [keyword, isCaseSensitive, isWholeWord, isRegexp, runSearch]);

    // Search when the projectTree changes
    useEffect(() => {
        if (!projectTree) {
            setSearchResults([]);
            return;
        }
        if (keyword) {
            runSearch(keyword, {
                caseSensitive: isCaseSensitive,
                wholeWord: isWholeWord,
                regexp: isRegexp,
            });
        }
    }, [projectTree?.path]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleFileExpand = useCallback((filePath: string) => {
        setExpandedFiles((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
    }, []);

    const handleMatchClick = useCallback(
        async (filePath: string) => {
            try {
                // Set window.DIRNAME in the parent component and then trigger onFolderFileSelect
                onFolderFileSelect(filePath);
            } catch (err) {
                console.error('打开搜索结果失败：', err);
            }
        },
        [onFolderFileSelect],
    );

    const totalMatches = searchResults.reduce((sum, r) => sum + r.matches.length, 0);

    // -----------------------------------------------------------------------
    // Search panel state
    // -----------------------------------------------------------------------

    // Sidebar width (supports drag-and-drop adjustment)
    const [sidebarWidth, setSidebarWidth] = useState<number>(getDefaultSidebarWidth());

    // Load sidebar width from store on startup
    useEffect(() => {
        let cancelled = false;
        loadSidebarWidth().then((width) => {
            if (!cancelled) setSidebarWidth(width);
        }).catch(() => {
            /* ignore */
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Handle sidebar width drag-and-drop adjustment
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarWidth;
        let currentWidth = startWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta));
            currentWidth = newWidth;
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            saveSidebarWidth(currentWidth).catch((err) => {
                console.error('Failed to persist sidebar width:', err);
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [sidebarWidth]);

    const bumpRefresh = useCallback(() => {
        onTreeRefresh();
        setRefreshKey((k) => k + 1);
    }, [onTreeRefresh]);

    // Watch project directory for file system changes
    useEffect(() => {
        if (!projectTree?.path) return;

        let stopWatch: (() => void) | null = null;
        let cancelled = false;

        const startWatching = async () => {
            try {
                stopWatch = await watch(
                    projectTree.path,
                    () => {
                        if (!cancelled) bumpRefresh();
                    },
                    { recursive: true, delayMs: 1000 }
                );
            } catch (error) {
                console.error('Failed to watch project directory:', error);
            }
        };

        startWatching();

        return () => {
            cancelled = true;
            stopWatch?.();
        };
    }, [projectTree?.path, bumpRefresh]);

    const handleLoadChildren = useCallback(async (dirPath: string): Promise<FileTreeNode[]> => {
        return await loadChildren(dirPath, false, excludedDirs);
    }, [excludedDirs]);

    const handleIconClick = (panel: SidebarPanel) => {
        onPanelChange(activePanel === panel ? null : panel);
    };

    const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            node,
            rootPath: projectTree?.path ?? null,
        });
    }, [projectTree]);

    const closeContextMenu = useCallback(() => {
        setContextMenu((prev) => ({ ...prev, visible: false }));
    }, []);

    const handleActionDone = useCallback(() => {
        setNodeAction({ type: 'none' });
    }, []);

    const handleContextNewFile = useCallback(() => {
        if (!contextMenu.node) {
            // Empty area right-click: create in project root directory
            if (projectTree) setNodeAction({ type: 'newFile', parentPath: projectTree.path });
            return;
        }
        const parentPath = contextMenu.node.isDir ? contextMenu.node.path : getParentPath(contextMenu.node.path);
        if (parentPath) {
            setNodeAction({ type: 'newFile', parentPath });
        }
    }, [contextMenu.node, projectTree]);

    const handleContextNewDir = useCallback(() => {
        if (!contextMenu.node) {
            // Empty area right-click: create in project root directory
            if (projectTree) setNodeAction({ type: 'newDir', parentPath: projectTree.path });
            return;
        }
        const parentPath = contextMenu.node.isDir ? contextMenu.node.path : getParentPath(contextMenu.node.path);
        if (parentPath) {
            setNodeAction({ type: 'newDir', parentPath });
        }
    }, [contextMenu.node, projectTree]);

    const handleContextCopy = useCallback(() => {
        if (contextMenu.node) {
            setClipboard(contextMenu.node.path, false);
        }
    }, [contextMenu.node]);

    const handleContextCut = useCallback(() => {
        if (contextMenu.node) {
            setClipboard(contextMenu.node.path, true);
        }
    }, [contextMenu.node]);

    const handleContextPaste = useCallback(async () => {
        const { path, isCut } = getClipboard();
        if (!path) return;

        let targetDir: string | null;
        if (!contextMenu.node) {
            targetDir = projectTree?.path ?? null;
        } else {
            targetDir = contextMenu.node.isDir ? contextMenu.node.path : getParentPath(contextMenu.node.path);
        }
        if (!targetDir) return;

        try {
            const srcName = path.split(/[/\\]/).pop() || '';
            let destName = srcName;

            if (isCut) {
                // Cut: same directory is not allowed
                const srcDir = getParentPath(path);
                if (srcDir === targetDir) {
                    clearClipboard();
                    return;
                }
            }

            // Check if target path already exists
            const directPath = await join(targetDir, destName);
            if (await fsExists(directPath)) {
                let copyIndex = 1;
                do {
                    destName = generateCopyName(srcName, copyIndex);
                    const testPath = await join(targetDir, destName);
                    if (!(await fsExists(testPath))) break;
                    copyIndex++;
                } while (copyIndex < 100);
            }

            const destPath = await join(targetDir, destName);
            await fsCopy(path, destPath);
            if (isCut) {
                await fsRemove(path);
                onCloseTabsForPath(path);
                clearClipboard();
            }
            bumpRefresh();
        } catch (error) {
            console.error('Failed to paste:', error);
        }
    }, [contextMenu.node, projectTree, bumpRefresh, onCloseTabsForPath]);

    const handleContextRename = useCallback(() => {
        if (contextMenu.node) {
            setNodeAction({ type: 'rename', targetPath: contextMenu.node.path });
        }
    }, [contextMenu.node]);

    const handleContextTrash = useCallback(async () => {
        if (!contextMenu.node) return;
        try {
            await fsRemove(contextMenu.node.path);
            onCloseTabsForPath(contextMenu.node.path);
            bumpRefresh();
        } catch (error) {
            console.error('Failed to move to trash:', error);
        }
    }, [contextMenu.node, bumpRefresh, onCloseTabsForPath]);

    const handleContextReveal = useCallback(() => {
        if (contextMenu.node) {
            fsRevealInFolder(contextMenu.node.path);
        } else if (projectTree) {
            // Empty area right-click: open parent directory of project root directory
            fsRevealInFolder(projectTree.path);
        }
    }, [contextMenu.node, projectTree]);

    const panelTitle = activePanel === 'explorer' ? t('sidebar.explorer')
        : activePanel === 'search' ? t('sidebar.search')
        : activePanel === 'outline' ? t('sidebar.outline')
        : '';

    return (
        <div className="sidebar-wrapper">
            {/* Activity Bar - icon strip */}
            <div className="activity-bar">
                <div className="activity-bar-top">
                    <button
                        className={`activity-bar-icon ${activePanel === 'explorer' ? 'active' : ''}`}
                        onClick={() => handleIconClick('explorer')}
                        title={t('sidebar.explorer')}
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M17.5 0h-9L7 1.5V6H2.5L1 7.5v15.07L2.5 24h12.07L16 22.57V18h4.7l1.3-1.43V4.5L17.5 0zm0 2.12l2.38 2.38H17.5V2.12zm-3 20.38h-12v-15H7v9.07L8.5 18h6v4.5zm6-6h-12v-15H16V6h4.5v10.5z"/>
                        </svg>
                    </button>
                    <button
                        className={`activity-bar-icon ${activePanel === 'search' ? 'active' : ''}`}
                        onClick={() => handleIconClick('search')}
                        title={t('sidebar.search')}
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M15.25 0a8.25 8.25 0 0 0-6.18 13.72L1 21.79l1.42 1.42 8.07-8.07A8.25 8.25 0 1 0 15.25.01V0zm0 14.5a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z"/>
                        </svg>
                    </button>
                    <button
                        className={`activity-bar-icon ${activePanel === 'outline' ? 'active' : ''}`}
                        onClick={() => handleIconClick('outline')}
                        title={t('sidebar.outline')}
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M3 3h8v2H3V3zm0 4h8v2H3V7zm0 4h8v2H3v-2zm0 4h8v2H3v-2zm10-12h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-12h4v2h-4V3zm0 4h4v2h-4V7zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z"/>
                        </svg>
                    </button>
                </div>
                <div className="activity-bar-bottom">
                    <button
                        className="activity-bar-icon"
                        onClick={onOpenSettings}
                        title={t('menu.file.settings')}
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Panel */}
            {activePanel && (
                <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
                    <div className="sidebar-header">
                        <span className="sidebar-title">{panelTitle}</span>
                    </div>

                    <div className="sidebar-content" onContextMenu={(e) => {
                        // Intercept all sidebar-content right-clicks, preventing system default menu
                        e.preventDefault();
                        e.stopPropagation();
                        // Show empty area menu if right-click is not on a node element
                        if (!(e.target as HTMLElement).closest('.tree-folder, .tree-file')) {
                            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node: null, rootPath: projectTree?.path ?? null });
                        }
                    }}>
                        {activePanel === 'explorer' && (
                            projectTree ? (
                                <div className="sidebar-section">
                                    <span className="sidebar-section-title">{projectTree.name}</span>
                                    <div className="project-tree">
                                        {/* Root directory level new file input */}
                                        {nodeAction.type === 'newFile' && nodeAction.parentPath === projectTree.path && (
                                            <div
                                                className="tree-file tree-creating"
                                                style={{ paddingLeft: `28px` }}
                                            >
                                                <InlineCreate
                                                    placeholder={t('sidebar.newFileName')}
                                                    onConfirm={async (name: string) => {
                                                        try {
                                                            // Add file name with .md suffix
                                                            const fileName = name.endsWith('.md') ? name : `${name}.md`;
                                                            const newPath = await join(projectTree.path, fileName);
                                                            await fsCreateFile(newPath);
                                                            onTreeRefresh();
                                                        } catch (error) {
                                                            console.error('Failed to create file:', error);
                                                        }
                                                        handleActionDone();
                                                    }}
                                                    onCancel={handleActionDone}
                                                />
                                            </div>
                                        )}
                                        {nodeAction.type === 'newDir' && nodeAction.parentPath === projectTree.path && (
                                            <div
                                                className="tree-folder-header tree-creating"
                                                style={{ paddingLeft: `8px` }}
                                            >
                                                <span className="tree-arrow" />
                                                <span className="tree-folder-icon">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12.8 13C13.1183 13 13.4235 12.8761 13.6486 12.6554C13.8735 12.4349 14 12.1356 14 11.8236V5.94118C14 5.62916 13.8735 5.32992 13.6486 5.10929C13.4235 4.88866 13.1183 4.76471 12.8 4.76471H8.06C7.8593 4.76664 7.66133 4.71919 7.48418 4.6267C7.30703 4.53421 7.15637 4.39964 7.046 4.2353L6.56 3.52941C6.45073 3.36675 6.30199 3.23322 6.1271 3.14082C5.95221 3.04842 5.75666 3.00004 5.558 3H3.2C2.88174 3 2.57651 3.12395 2.35148 3.34458C2.12643 3.56521 2 3.86445 2 4.17647V11.8236C2 12.1356 2.12643 12.4349 2.35148 12.6554C2.57651 12.8761 2.88174 13 3.2 13H12.8Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </span>
                                                <InlineCreate
                                                    placeholder={t('sidebar.newFolderName')}
                                                    onConfirm={async (name: string) => {
                                                        try {
                                                            const newPath = await join(projectTree.path, name);
                                                            await fsCreateDirectory(newPath);
                                                            onTreeRefresh();
                                                        } catch (error) {
                                                            console.error('Failed to create directory:', error);
                                                        }
                                                        handleActionDone();
                                                    }}
                                                    onCancel={handleActionDone}
                                                />
                                            </div>
                                        )}
                                        {projectTree.children.length > 0 ? (
                                            projectTree.children.map((child) => (
                                                <FolderTreeNode
                                                    key={child.path}
                                                    node={child}
                                                    depth={0}
                                                    onFileClick={onFolderFileSelect}
                                                    onLoadChildren={handleLoadChildren}
                                                    activeFilePath={activeFilePath}
                                                    onContextMenu={handleContextMenu}
                                                    onTreeRefresh={onTreeRefresh}
                                                    nodeAction={nodeAction}
                                                    onActionDone={handleActionDone}
                                                    refreshKey={refreshKey}
                                                />
                                            ))
                                        ) : (
                                            <div className="sidebar-empty">
                                                <div className="sidebar-empty-icon">📋</div>
                                                <div className="sidebar-empty-text">{t('sidebar.emptyProject')}</div>
                                                <button className="sidebar-empty-action" onClick={handleContextNewFile}>{t('sidebar.newFile')}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="sidebar-empty">
                                    <div className="sidebar-empty-icon">📂</div>
                                    <button className="sidebar-empty-action" onClick={onOpenFolder}>{t('sidebar.openFolder')}</button>
                                </div>
                            )
                        )}

                        {activePanel === 'search' && (
                            <div className="sidebar-section sidebar-search-section">
                                {/* Search input box + controls buttons */}
                                <div className="search-wrapper">
                                    <input
                                        ref={searchInputRef}
                                        className="search-input"
                                        type="text"
                                        value={keyword}
                                        placeholder={projectTree ? t('sidebar.searchPlaceholder') : t('sidebar.searchPlaceholderNoFolder')}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setKeyword('');
                                        }}
                                    />
                                    <div className="search-controls">
                                        <span
                                            className={`search-toggle ${isCaseSensitive ? 'active' : ''}`}
                                            title={t('findReplace.caseSensitive')}
                                            onClick={() => setIsCaseSensitive((v) => !v)}
                                        >
                                            Aa
                                        </span>
                                        <span
                                            className={`search-toggle ${isWholeWord ? 'active' : ''}`}
                                            title={t('findReplace.wholeWord')}
                                            onClick={() => setIsWholeWord((v) => !v)}
                                        >
                                            W
                                        </span>
                                        <span
                                            className={`search-toggle ${isRegexp ? 'active' : ''}`}
                                            title={t('findReplace.regex')}
                                            onClick={() => setIsRegexp((v) => !v)}
                                        >
                                            .*
                                        </span>
                                    </div>
                                </div>

                                {/* Search status prompt */}
                                {!projectTree && (
                                    <div className="search-empty">
                                        <div className="sidebar-empty-icon">🔍</div>
                                        <div className="sidebar-empty-text">{t('sidebar.openFolderFirst')}</div>
                                        <button
                                            className="sidebar-empty-action"
                                            onClick={handleRequestOpenFolder}
                                        >
                                            {t('sidebar.openFolder')}
                                        </button>
                                    </div>
                                )}

                                {projectTree && keyword && isSearching && (
                                    <div className="search-status">{t('sidebar.searching')}</div>
                                )}

                                {projectTree && keyword && !isSearching && searchResults.length === 0 && (
                                    <div className="search-empty">
                                        <div className="sidebar-empty-icon">🔍</div>
                                        <div className="sidebar-empty-text">{t('sidebar.noResults', { keyword })}</div>
                                    </div>
                                )}

                                {/* Search result info */}
                                {projectTree && searchResults.length > 0 && (
                                    <div className="search-result-info">
                                        {t('sidebar.matchCount', { files: searchResults.length, matches: totalMatches })}
                                    </div>
                                )}

                                {/* Result list */}
                                <div className="search-result-list">
                                    {searchResults.map((result) => {
                                        const filename = result.filePath.split(/[/\\]/).pop() || result.filePath;
                                        const isExpanded = expandedFiles[result.filePath] !== false; // Default expanded
                                        const matchCount = result.matches.length;
                                        return (
                                            <div className="search-result-file" key={result.filePath}>
                                                <div
                                                    className="search-result-file-header"
                                                    onClick={() => toggleFileExpand(result.filePath)}
                                                    title={result.filePath}
                                                >
                                                    <span className={`search-expand-arrow ${isExpanded ? 'expanded' : ''}`}>
                                                        <svg viewBox="0 0 1024 1024" width="10" height="10" fill="currentColor">
                                                            <path d="M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512 340.864 831.872a30.59 30.59 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z" />
                                                        </svg>
                                                    </span>
                                                    <span className={`search-file-icon ${(fileIcons.getClassByName(filename) || '').split(/\s/).join(' ')}`.trim()} />
                                                    <span className="search-file-name">{filename}</span>
                                                    <span className="search-match-count">{matchCount}</span>
                                                </div>

                                                {isExpanded && (
                                                    <div className="search-matches">
                                                        {result.matches.slice(0, 20).map((match, idx) => {
                                                            const [start] = match.range;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="search-match-line"
                                                                    title={match.lineText}
                                                                    onClick={() => handleMatchClick(result.filePath)}
                                                                >
                                                                    <span className="search-match-line-num">{start[0] + 1}</span>
                                                                    <span className="search-match-text">
                                                                        <HighlightedLine match={match} />
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                        {matchCount > 20 && (
                                                            <div className="search-more-hint">
                                                                {t('sidebar.moreMatches', { count: matchCount - 20 })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activePanel === 'outline' && (
                            <div className="sidebar-section">
                                {tocItems.length === 0 ? (
                                    <div className="sidebar-empty">{t('sidebar.noHeadings')}</div>
                                ) : (
                                    <ul className="outline-list">
                                        {tocItems.map((item, index) => (
                                            <li
                                                key={item.slug + '-' + index}
                                                className={`outline-item outline-level-${item.lvl}`}
                                                onClick={() => onTocItemClick(item)}
                                            >
                                                {item.content || t('sidebar.empty')}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <div
                        className="sidebar-resizer"
                        onMouseDown={handleResizeStart}
                        title={t('sidebar.dragResize')}
                    />
                </div>
            )}

            <ContextMenu
                state={contextMenu}
                onClose={closeContextMenu}
                onNewFile={handleContextNewFile}
                onNewDir={handleContextNewDir}
                onCopy={handleContextCopy}
                onCut={handleContextCut}
                onPaste={handleContextPaste}
                onRename={handleContextRename}
                onTrash={handleContextTrash}
                onReveal={handleContextReveal}
            />
        </div>
    );
}

export default memo(Sidebar, (prev, next) => {
    return prev.activePanel === next.activePanel
        && prev.projectTree === next.projectTree
        && prev.activeFilePath === next.activeFilePath
        && prev.tocItems === next.tocItems;
});