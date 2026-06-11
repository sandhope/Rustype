import { useState } from 'react';
import type { FileInfo } from '../utils/file';

interface SidebarProps {
    isOpen: boolean;
    recentFiles: FileInfo[];
    onFileSelect: (file: FileInfo) => void;
    onClose: () => void;
}

export default function Sidebar({ isOpen, recentFiles, onFileSelect, onClose }: SidebarProps) {
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

    const toggleDir = (dirPath: string) => {
        setExpandedDirs(prev => {
            const next = new Set(prev);
            if (next.has(dirPath)) {
                next.delete(dirPath);
            } else {
                next.add(dirPath);
            }
            return next;
        });
    };

    const getFileName = (path: string) => path.split(/[/\\]/).pop() || path;

    const getDirName = (path: string) => {
        const parts = path.split(/[/\\]/);
        return parts.length > 1 ? parts[parts.length - 2] : parts[0];
    };

    if (!isOpen) return null;

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <span className="sidebar-title">文件</span>
                <button className="sidebar-close" onClick={onClose}>×</button>
            </div>
            
            <div className="sidebar-content">
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
                                    onClick={() => onFileSelect(file)}
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