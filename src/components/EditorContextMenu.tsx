import { useEffect, useRef, useCallback, memo } from 'react';
import { useI18n } from '../utils/i18n';
import { readText as readClipboardText } from '@tauri-apps/plugin-clipboard-manager';
import type { EditorHandle } from './Editor';

interface EditorContextMenuProps {
    visible: boolean;
    x: number;
    y: number;
    hasSelection: boolean;
    editorRef: React.RefObject<EditorHandle | null>;
    onClose: () => void;
}

function EditorContextMenu({
    visible,
    x,
    y,
    hasSelection,
    editorRef,
    onClose,
}: EditorContextMenuProps) {
    const { t } = useI18n();
    const savedSelectionRangeRef = useRef<Range | null>(null);

    useEffect(() => {
        if (!visible) return;

        const sel = document.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
        } else {
            savedSelectionRangeRef.current = null;
        }

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.editor-context-menu')) return;
            onClose();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [visible, onClose]);

    const handleAction = useCallback(async (action: string) => {
        onClose();
        const editor = editorRef.current;
        if (!editor) return;

        const domNode = editor.getDomNode();
        if (!domNode) return;

        const needsSelection = ['cut', 'copy', 'copy-rich', 'copy-html', 'paste', 'paste-plain'].includes(action);
        if (needsSelection && savedSelectionRangeRef.current) {
            const sel = document.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedSelectionRangeRef.current);
            }
        }

        switch (action) {
            case 'insert-before':
                editor.insertParagraph('before');
                break;
            case 'insert-after':
                editor.insertParagraph('after');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste': {
                try {
                    const text = await readClipboardText();
                    if (savedSelectionRangeRef.current) {
                        const sel = document.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(savedSelectionRangeRef.current);
                        }
                    }
                    editor.pasteText(text);
                } catch {
                    // clipboard read failed — do nothing
                }
                break;
            }
            case 'copy-rich':
                editor.copyAsRich();
                break;
            case 'copy-html':
                editor.copyAsHtml();
                break;
            case 'paste-plain': {
                try {
                    const text = await readClipboardText();
                    if (savedSelectionRangeRef.current) {
                        const sel = document.getSelection();
                        if (sel) {
                            sel.removeAllRanges();
                            sel.addRange(savedSelectionRangeRef.current);
                        }
                    }
                    editor.pasteText(text, true);
                } catch {
                    // clipboard read failed — do nothing
                }
                break;
            }
        }

        savedSelectionRangeRef.current = null;
    }, [editorRef, onClose]);

    if (!visible) return null;

    return (
        <div
            className="editor-context-menu"
            style={{ left: x, top: y }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="editor-context-item" onClick={() => handleAction('insert-before')}>
                {t('editorContextMenu.insertBefore')}
            </div>
            <div className="editor-context-item" onClick={() => handleAction('insert-after')}>
                {t('editorContextMenu.insertAfter')}
            </div>
            <div className="editor-context-divider" />
            <div
                className={`editor-context-item${hasSelection ? '' : ' disabled'}`}
                onClick={() => hasSelection && handleAction('cut')}
            >
                <span>{t('editorContextMenu.cut')}</span>
                <span className="editor-context-shortcut">Ctrl+X</span>
            </div>
            <div
                className={`editor-context-item${hasSelection ? '' : ' disabled'}`}
                onClick={() => hasSelection && handleAction('copy')}
            >
                <span>{t('editorContextMenu.copy')}</span>
                <span className="editor-context-shortcut">Ctrl+C</span>
            </div>
            <div className="editor-context-item" onClick={() => handleAction('paste')}>
                <span>{t('editorContextMenu.paste')}</span>
                <span className="editor-context-shortcut">Ctrl+V</span>
            </div>
            <div className="editor-context-divider" />
            <div
                className={`editor-context-item${hasSelection ? '' : ' disabled'}`}
                onClick={() => hasSelection && handleAction('copy-rich')}
            >
                {t('editorContextMenu.copyAsRich')}
            </div>
            <div
                className={`editor-context-item${hasSelection ? '' : ' disabled'}`}
                onClick={() => hasSelection && handleAction('copy-html')}
            >
                {t('editorContextMenu.copyAsHtml')}
            </div>
            <div className="editor-context-item" onClick={() => handleAction('paste-plain')}>
                {t('editorContextMenu.pasteAsPlainText')}
            </div>
        </div>
    );
}

export default memo(EditorContextMenu, (prev, next) => {
    return prev.visible === next.visible
        && prev.x === next.x
        && prev.y === next.y
        && prev.hasSelection === next.hasSelection;
});