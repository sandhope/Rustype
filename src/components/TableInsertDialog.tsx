import { useState } from 'react';
import { useI18n } from '../utils/i18n';

interface TableInsertDialogProps {
    onClose: () => void;
    onConfirm: (rows: number, columns: number) => void;
}

export default function TableInsertDialog({ onClose, onConfirm }: TableInsertDialogProps) {
    const { t } = useI18n();
    const [rows, setRows] = useState(4);
    const [columns, setColumns] = useState(3);

    const handleConfirm = () => {
        onConfirm(rows, columns);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="table-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h3>{t('dialogs.table.title')}</h3>
                </div>
                <div className="dialog-body">
                    <div className="form-row">
                        <label>{t('dialogs.table.rows')}</label>
                        <div className="number-input-group">
                            <button 
                                className="number-input-btn" 
                                onClick={() => setRows(r => Math.max(1, r - 1))}
                            >
                                ▲
                            </button>
                            <input 
                                type="number" 
                                className="number-input"
                                value={rows} 
                                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                max={30}
                            />
                            <button 
                                className="number-input-btn" 
                                onClick={() => setRows(r => Math.min(30, r + 1))}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                    <div className="form-row">
                        <label>{t('dialogs.table.columns')}</label>
                        <div className="number-input-group">
                            <button 
                                className="number-input-btn" 
                                onClick={() => setColumns(c => Math.max(1, c - 1))}
                            >
                                ▲
                            </button>
                            <input 
                                type="number" 
                                className="number-input"
                                value={columns} 
                                onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                max={20}
                            />
                            <button 
                                className="number-input-btn" 
                                onClick={() => setColumns(c => Math.min(20, c + 1))}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                </div>
                <div className="dialog-footer">
                    <button className="dialog-btn dialog-btn-secondary" onClick={onClose}>
                        {t('dialogs.table.cancel')}
                    </button>
                    <button className="dialog-btn dialog-btn-primary" onClick={handleConfirm}>
                        {t('dialogs.table.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}