import { useState, useCallback } from 'react';
import type { FileTreeNode } from '../utils/file';
import { loadChildren } from '../utils/file';
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
    tocItems: { content: string; lvl: number; slug: string; githubSlug: string }[];
    onTocItemClick: (item: { content: string; lvl: number; slug: string; githubSlug: string }) => void;
}

function FolderTreeNode({
    node,
    depth,
    onFileClick,
    onLoadChildren,
    activeFilePath,
}: {
    node: FileTreeNode;
    depth: number;
    onFileClick: (filePath: string) => void;
    onLoadChildren: (dirPath: string) => Promise<FileTreeNode[]>;
    activeFilePath: string | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileTreeNode[]>(node.children);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!node.isDir) return;

        const nextExpanded = !expanded;
        setExpanded(nextExpanded);

        // 懒加载：第一次展开时加载子节点
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

    if (node.isDir) {
        return (
            <div className="tree-folder">
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
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                            <path d={expanded
                                ? "M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V5.5A1.5 1.5 0 0 0 14.5 4H7.7l-1.15-1.15A1.5 1.5 0 0 0 5.5 2H1.5z"
                                : "M1.5 2A1.5 1.5 0 0 0 0 3.5v2A1.5 1.5 0 0 0 1.5 7h13A1.5 1.5 0 0 0 16 5.5V5a1.5 1.5 0 0 0-1.5-1.5H7.7L6.56 2.35A1.5 1.5 0 0 0 5.5 2h-4zM1.5 8A1.5 1.5 0 0 0 0 9.5v3A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 14.5 8h-13z"
                            }/>
                        </svg>
                    </span>
                    <span className="tree-folder-name" title={node.path}>
                        {node.name}
                    </span>
                    {loading && <span className="tree-loading">加载中...</span>}
                </div>

                {expanded && (
                    <div className="tree-folder-children">
                        {children.length > 0 && (
                            children.map((child) => (
                                <FolderTreeNode
                                    key={child.path}
                                    node={child}
                                    depth={depth + 1}
                                    onFileClick={onFileClick}
                                    onLoadChildren={onLoadChildren}
                                    activeFilePath={activeFilePath}
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
            title={node.path}
        >
            <span className={`tree-file-icon ${(fileIcons.getClassByName(node.name) || '').split(/\s/).join(' ')}`.trim()} />
            <span className="tree-file-name">{node.name}</span>
        </div>
    );
}

export default function Sidebar({
    activePanel,
    onPanelChange,
    projectTree,
    onFolderFileSelect,
    activeFilePath,
    onOpenSettings,
    tocItems,
    onTocItemClick,
}: SidebarProps) {
    const handleLoadChildren = useCallback(async (dirPath: string): Promise<FileTreeNode[]> => {
        return await loadChildren(dirPath);
    }, []);

    const handleIconClick = (panel: SidebarPanel) => {
        onPanelChange(activePanel === panel ? null : panel);
    };

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

                    <div className="sidebar-content">
                        {activePanel === 'explorer' && (
                            projectTree ? (
                                <div className="sidebar-section">
                                    <div className="sidebar-section-title">{projectTree.name}</div>
                                    <div className="project-tree">
                                        {projectTree.children.length > 0 ? (
                                            projectTree.children.map((child) => (
                                                <FolderTreeNode
                                                    key={child.path}
                                                    node={child}
                                                    depth={0}
                                                    onFileClick={onFolderFileSelect}
                                                    onLoadChildren={handleLoadChildren}
                                                    activeFilePath={activeFilePath}
                                                />
                                            ))
                                        ) : (
                                            <div className="sidebar-empty">空项目</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="sidebar-empty">尚未打开文件夹</div>
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
        </div>
    );
}
