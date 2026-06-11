import { useState, useCallback } from 'react';
import type { FileInfo, FileTreeNode } from '../utils/file';
import { loadChildren } from '../utils/file';

interface SidebarProps {
    isOpen: boolean;
    recentFiles: FileInfo[];
    projectTree: FileTreeNode | null;
    onFolderFileSelect: (filePath: string) => void;
    onClose: () => void;
}

function FolderTreeNode({
    node,
    depth,
    onFileClick,
    onLoadChildren,
}: {
    node: FileTreeNode;
    depth: number;
    onFileClick: (filePath: string) => void;
    onLoadChildren: (dirPath: string) => Promise<FileTreeNode[]>;
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
                    <span className={`tree-arrow ${expanded ? 'expanded' : ''}`}>▶</span>
                    <span className="tree-folder-icon">{expanded ? '📂' : '📁'}</span>
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
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    }

    // 文件节点
    return (
        <div
            className="tree-file"
            style={{ paddingLeft: `${depth * 16 + 28}px` }}
            onClick={() => onFileClick(node.path)}
            title={node.path}
        >
            <span className="tree-file-icon">📄</span>
            <span className="tree-file-name">{node.name}</span>
        </div>
    );
}

export default function Sidebar({
    isOpen,
    recentFiles,
    projectTree,
    onFolderFileSelect,
    onClose,
}: SidebarProps) {
    const handleLoadChildren = useCallback(async (dirPath: string): Promise<FileTreeNode[]> => {
        return await loadChildren(dirPath);
    }, []);

    if (!isOpen || !projectTree) return null;

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <span className="sidebar-title">文件</span>
                <button className="sidebar-close" onClick={onClose}>×</button>
            </div>

            <div className="sidebar-content">
                {/* 项目目录树 */}
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
                                />
                            ))
                        ) : (
                            <div className="sidebar-empty">空项目</div>
                        )}
                    </div>
                </div>

                {/* 最近文件 */}
                <div className="sidebar-section">
                    <div className="sidebar-section-title">最近文件</div>
                    {recentFiles.length === 0 ? (
                        <div className="sidebar-empty">暂无最近文件</div>
                    ) : (
                        <div className="file-list">
                            {recentFiles.map((file, index) => (
                                <div
                                    key={file.path + index}
                                    className="file-item"
                                    onClick={() => onFolderFileSelect(file.path)} // 或使用 onFileSelect 如果有
                                    title={file.path}
                                >
                                    <span className="file-icon">📄</span>
                                    <span className="file-name">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}