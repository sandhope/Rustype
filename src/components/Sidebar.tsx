import { useState, useCallback, useRef, useEffect } from 'react';
import type { FileTreeNode } from '../utils/file';
import { watch } from '@tauri-apps/plugin-fs';
import folderIcon from '../assets/folder.svg';
import folderOpenIcon from '../assets/folder_open.svg';

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
}

/* ==================== 剪贴板状态（模块级，跨组件共享） ==================== */
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
 * 生成复制后的文件名：file.txt → file copy.txt → file copy 2.txt → ...
 * copyIndex 从 1 开始，1 时省略数字
 */
function generateCopyName(name: string, copyIndex: number): string {
    const dotIdx = name.lastIndexOf('.');
    const baseName = dotIdx > 0 ? name.substring(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.substring(dotIdx) : '';
    const suffix = copyIndex === 1 ? ' copy' : ` copy ${copyIndex}`;
    return `${baseName}${suffix}${ext}`;
}

/* ==================== 右键菜单 ==================== */
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
    // 粘贴目标：文件夹节点直接粘贴到自身，文件节点粘贴到其父目录，空白区粘贴到项目根
    const pasteTarget = isBlankArea
        ? state.rootPath
        : state.node!.isDir
            ? state.node!.path
            : getParentPath(state.node!.path);
    // 剪切到同目录不允许；复制到同目录允许（自动加 copy 后缀）；无剪贴板不允许
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
                新建文件
            </div>
            <div className="tree-context-item" onClick={() => { onNewDir(); onClose(); }}>
                新建目录
            </div>
            <div className="tree-context-divider" />
            {!isBlankArea && (
                <>
                    <div className="tree-context-item" onClick={() => { onCopy(); onClose(); }}>
                        复制
                    </div>
                    <div className="tree-context-item" onClick={() => { onCut(); onClose(); }}>
                        剪切
                    </div>
                </>
            )}
            <div
                className={`tree-context-item${canPaste ? '' : ' disabled'}`}
                onClick={() => { if (canPaste) { onPaste(); onClose(); } }}
            >
                粘贴
            </div>
            <div className="tree-context-divider" />
            {!isBlankArea && (
                <>
                    <div className="tree-context-item" onClick={() => { onRename(); onClose(); }}>
                        重命名
                    </div>
                    <div className="tree-context-item tree-context-danger" onClick={() => { onTrash(); onClose(); }}>
                        移动到废纸篓
                    </div>
                    <div className="tree-context-divider" />
                </>
            )}
            <div className="tree-context-item" onClick={() => { onReveal(); onClose(); }}>
                在文件夹中显示
            </div>
        </div>
    );
}

/* ==================== 内联重命名输入 ==================== */
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

/* ==================== 内联新建输入 ==================== */
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

/* ==================== 目录树节点 ==================== */
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

    // refreshKey 变化时，如果目录已展开则重新加载子节点
    useEffect(() => {
        if (expanded && node.isDir) {
            onLoadChildren(node.path).then(setChildren).catch(console.error);
        }
    }, [refreshKey]);

    const isRenaming = nodeAction.type === 'rename' && nodeAction.targetPath === node.path;
    const isCreatingFile = nodeAction.type === 'newFile' && nodeAction.parentPath === node.path;
    const isCreatingDir = nodeAction.type === 'newDir' && nodeAction.parentPath === node.path;

    // 新建文件/目录时自动展开当前目录
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
            const newPath = await join(node.path, name);
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
            const newPath = await join(parentPath, newName);
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
                            <img src={folderOpenIcon} width="16" height="16" alt="Open Folder" />
                        ) : (
                            <img src={folderIcon} width="16" height="16" alt="Folder" />
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
                                    placeholder="新文件名"
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
                                    <img src={folderIcon} width="16" height="16" alt="Folder" />
                                </span>
                                <InlineCreate
                                    placeholder="新目录名"
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

    // 文件节点
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

/* ==================== Sidebar 主组件 ==================== */
export default function Sidebar({
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

    const bumpRefresh = useCallback(() => {
        onTreeRefresh();
        setRefreshKey((k) => k + 1);
    }, [onTreeRefresh]);

    // 监听项目目录的文件系统变更
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
        return await loadChildren(dirPath);
    }, []);

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
            // 空白区右键：在项目根目录新建
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
            // 空白区右键：在项目根目录新建
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
                // 剪切：同目录不允许
                const srcDir = getParentPath(path);
                if (srcDir === targetDir) {
                    clearClipboard();
                    return;
                }
            }

            // 检查目标路径是否已存在同名文件，存在则自动加 copy 后缀
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
            // 空白区右键：打开项目根目录的父目录
            fsRevealInFolder(projectTree.path);
        }
    }, [contextMenu.node, projectTree]);

    const panelTitle = activePanel === 'explorer' ? '资源管理器'
        : activePanel === 'search' ? '搜索'
        : activePanel === 'outline' ? '大纲'
        : '';

    return (
        <div className="sidebar-wrapper">
            {/* Activity Bar - icon strip */}
            <div className="activity-bar">
                <div className="activity-bar-top">
                    <button
                        className={`activity-bar-icon ${activePanel === 'explorer' ? 'active' : ''}`}
                        onClick={() => handleIconClick('explorer')}
                        title="资源管理器"
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M17.5 0h-9L7 1.5V6H2.5L1 7.5v15.07L2.5 24h12.07L16 22.57V18h4.7l1.3-1.43V4.5L17.5 0zm0 2.12l2.38 2.38H17.5V2.12zm-3 20.38h-12v-15H7v9.07L8.5 18h6v4.5zm6-6h-12v-15H16V6h4.5v10.5z"/>
                        </svg>
                    </button>
                    <button
                        className={`activity-bar-icon ${activePanel === 'search' ? 'active' : ''}`}
                        onClick={() => handleIconClick('search')}
                        title="搜索"
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M15.25 0a8.25 8.25 0 0 0-6.18 13.72L1 21.79l1.42 1.42 8.07-8.07A8.25 8.25 0 1 0 15.25.01V0zm0 14.5a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z"/>
                        </svg>
                    </button>
                    <button
                        className={`activity-bar-icon ${activePanel === 'outline' ? 'active' : ''}`}
                        onClick={() => handleIconClick('outline')}
                        title="大纲"
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
                        title="设置"
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Panel */}
            {activePanel && (
                <div className="sidebar">
                    <div className="sidebar-header">
                        <span className="sidebar-title">{panelTitle}</span>
                    </div>

                    <div className="sidebar-content" onContextMenu={(e) => {
                        // 拦截整个 sidebar-content 的右键，阻止系统默认菜单
                        e.preventDefault();
                        // 如果不是从节点冒泡上来的，显示空白区菜单
                        if (!(e.target as HTMLElement).closest('.tree-folder, .tree-file')) {
                            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node: null, rootPath: projectTree?.path ?? null });
                        }
                    }}>
                        {activePanel === 'explorer' && (
                            projectTree ? (
                                <div className="sidebar-section">
                                    <span className="sidebar-section-title">{projectTree.name}</span>
                                    <div className="project-tree">
                                        {/* 根目录层级的新建输入框 */}
                                        {nodeAction.type === 'newFile' && nodeAction.parentPath === projectTree.path && (
                                            <div
                                                className="tree-file tree-creating"
                                                style={{ paddingLeft: `28px` }}
                                            >
                                                <InlineCreate
                                                    placeholder="新文件名"
                                                    onConfirm={async (name: string) => {
                                                        try {
                                                            const newPath = await join(projectTree.path, name);
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
                                                    <img src={folderIcon} width="16" height="16" alt="Folder" />
                                                </span>
                                                <InlineCreate
                                                    placeholder="新目录名"
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
                                                <div className="sidebar-empty-text">空项目</div>
                                                <button className="sidebar-empty-action" onClick={handleContextNewFile}>新建文件</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="sidebar-empty">
                                    <div className="sidebar-empty-icon">📂</div>
                                    <button className="sidebar-empty-action" onClick={onOpenFolder}>打开文件夹</button>
                                </div>
                            )
                        )}

                        {activePanel === 'search' && (
                            <div className="sidebar-empty">搜索功能开发中…</div>
                        )}

                        {activePanel === 'outline' && (
                            <div className="sidebar-section">
                                {tocItems.length === 0 ? (
                                    <div className="sidebar-empty">文档中没有标题</div>
                                ) : (
                                    <ul className="outline-list">
                                        {tocItems.map((item, index) => (
                                            <li
                                                key={item.slug + '-' + index}
                                                className={`outline-item outline-level-${item.lvl}`}
                                                onClick={() => onTocItemClick(item)}
                                            >
                                                {item.content || '(空)'}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
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
