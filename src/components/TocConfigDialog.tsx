import React, { useState, useEffect, useRef } from 'react';

interface TocConfigDialogProps {
    onClose: () => void;
    onConfirm: (tocIncludeTopHeading: boolean, tocTitle: string) => void;
}

export default function TocConfigDialog({ onClose, onConfirm }: TocConfigDialogProps) {
    const [tocIncludeTopHeading, setTocIncludeTopHeading] = useState(true);
    const [tocTitle, setTocTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onConfirm(tocIncludeTopHeading, tocTitle.trim());
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="rename-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="rename-header">
                    <h3>目录配置</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="rename-input-container">
                        <label className="rename-label">
                            <input
                                type="checkbox"
                                checked={tocIncludeTopHeading}
                                onChange={(e) => setTocIncludeTopHeading(e.target.checked)}
                                className="rename-checkbox"
                            />
                            包含顶层标题
                        </label>
                    </div>
                    <div className="rename-input-container">
                        <label className="rename-label">目录标题：</label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="rename-input"
                            value={tocTitle}
                            onChange={(e) => setTocTitle(e.target.value)}
                            placeholder="留空显示默认标题: Table of Contents"
                        />
                    </div>
                    <div className="rename-footer">
                        <button type="button" className="rename-cancel-btn" onClick={onClose}>
                            取消
                        </button>
                        <button type="submit" className="rename-confirm-btn">
                            确定
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}