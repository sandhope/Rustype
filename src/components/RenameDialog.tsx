import React, { useState, useEffect, useRef } from 'react';

interface RenameDialogProps {
    currentName: string;
    onClose: () => void;
    onConfirm: (newName: string) => void;
}

export default function RenameDialog({ currentName, onClose, onConfirm }: RenameDialogProps) {
    const [newName, setNewName] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newName.trim()) {
            onConfirm(newName.trim());
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="rename-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="rename-header">
                    <h3>重命名</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="rename-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            className="rename-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="输入新文件名"
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