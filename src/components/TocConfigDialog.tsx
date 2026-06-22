import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../utils/i18n';

interface TocConfigDialogProps {
    onClose: () => void;
    onConfirm: (tocIncludeTopHeading: boolean, tocTitle: string) => void;
}

export default function TocConfigDialog({ onClose, onConfirm }: TocConfigDialogProps) {
    const { t } = useI18n();
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
                    <h3>{t('dialogs.toc.title')}</h3>
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
                            {t('dialogs.toc.includeTopHeading')}
                        </label>
                    </div>
                    <div className="rename-input-container">
                        <label className="rename-label">{t('dialogs.toc.tocTitle')}</label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="rename-input"
                            value={tocTitle}
                            onChange={(e) => setTocTitle(e.target.value)}
                            placeholder={t('dialogs.toc.titlePlaceholder')}
                        />
                    </div>
                    <div className="rename-footer">
                        <button type="button" className="rename-cancel-btn" onClick={onClose}>
                            {t('dialogs.toc.cancel')}
                        </button>
                        <button type="submit" className="rename-confirm-btn">
                            {t('dialogs.toc.confirm')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}