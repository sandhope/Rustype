import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../utils/i18n';

interface RenameDialogProps {
    currentName: string;
    onClose: () => void;
    onConfirm: (newName: string) => void;
}

export default function RenameDialog({ currentName, onClose, onConfirm }: RenameDialogProps) {
    const { t } = useI18n();
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
                    <h3>{t('dialogs.rename.title')}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="rename-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            className="rename-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('dialogs.rename.placeholder')}
                        />
                    </div>
                    <div className="rename-footer">
                        <button type="button" className="rename-cancel-btn" onClick={onClose}>
                            {t('dialogs.rename.cancel')}
                        </button>
                        <button type="submit" className="rename-confirm-btn">
                            {t('dialogs.rename.confirm')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}