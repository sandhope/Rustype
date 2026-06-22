import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../utils/i18n';
import type { EditorHandle } from './Editor';

interface FindReplaceProps {
    editorRef: React.RefObject<EditorHandle | null>;
    onClose: () => void;
}

export default function FindReplace({ editorRef, onClose }: FindReplaceProps) {
    const { t } = useI18n();
    const [findValue, setFindValue] = useState('');
    const [replaceValue, setReplaceValue] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [isRegexp, setIsRegexp] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const [matchCount, setMatchCount] = useState(0);
    const findInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (findInputRef.current) {
            findInputRef.current.focus();
        }
    }, []);

    const runSearch = useCallback((value: string) => {
        if (!editorRef.current) return;
        const opts = {
            isCaseSensitive: caseSensitive,
            isWholeWord: wholeWord,
            isRegexp,
        };
        editorRef.current.search(value, opts);
        try {
            const search = (editorRef.current as any).muya?.search;
            if (search) {
                setMatchCount(search.matches?.length || 0);
            }
        } catch {
            // ignore
        }
    }, [editorRef, caseSensitive, wholeWord, isRegexp]);

    const handleFindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFindValue(value);
        runSearch(value);
    };

    const handleFindNext = () => {
        editorRef.current?.find('next');
    };

    const handleFindPrevious = () => {
        editorRef.current?.find('previous');
    };

    const handleReplace = () => {
        if (!findValue) return;
        editorRef.current?.replace(replaceValue, {
            isSingle: true,
            isRegexp,
            isCaseSensitive: caseSensitive,
            isWholeWord: wholeWord,
        });
    };

    const handleReplaceAll = () => {
        if (!findValue) return;
        editorRef.current?.replace(replaceValue, {
            isSingle: false,
            isRegexp,
            isCaseSensitive: caseSensitive,
            isWholeWord: wholeWord,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            if (e.ctrlKey || e.metaKey) {
                handleFindPrevious();
            } else {
                handleFindNext();
            }
        }
    };

    return (
        <div className="find-replace-panel" onKeyDown={handleKeyDown}>
            <div className="find-replace-row">
                <input
                    ref={findInputRef}
                    type="text"
                    className="find-input"
                    placeholder={t('findReplace.findPlaceholder')}
                    value={findValue}
                    onChange={handleFindChange}
                />
                <button className="fr-btn" onClick={handleFindPrevious} title={t('findReplace.previous')}>
                    ↑
                </button>
                <button className="fr-btn" onClick={handleFindNext} title={t('findReplace.next')}>
                    ↓
                </button>
                <button className="fr-btn" onClick={() => setShowReplace(prev => !prev)} title={showReplace ? t('findReplace.hide') : t('findReplace.replace')}>
                    {showReplace ? t('findReplace.hide') : t('findReplace.replace')}
                </button>
                <button className="fr-btn fr-close" onClick={onClose} title={t('findReplace.close')}>
                    ×
                </button>
            </div>
            {showReplace && (
                <div className="find-replace-row">
                    <input
                        type="text"
                        className="find-input"
                        placeholder={t('findReplace.replacePlaceholder')}
                        value={replaceValue}
                        onChange={(e) => setReplaceValue(e.target.value)}
                    />
                    <button className="fr-btn" onClick={handleReplace} title={t('findReplace.replaceCurrent')}>
                        {t('findReplace.replace')}
                    </button>
                    <button className="fr-btn" onClick={handleReplaceAll} title={t('findReplace.replaceAll')}>
                        {t('findReplace.replaceAll')}
                    </button>
                </div>
            )}
            <div className="find-replace-options">
                <label className="fr-option">
                    <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => {
                            setCaseSensitive(e.target.checked);
                            if (findValue) runSearch(findValue);
                        }}
                    />
                    <span>{t('findReplace.caseSensitive')}</span>
                </label>
                <label className="fr-option">
                    <input
                        type="checkbox"
                        checked={wholeWord}
                        onChange={(e) => {
                            setWholeWord(e.target.checked);
                            if (findValue) runSearch(findValue);
                        }}
                    />
                    <span>{t('findReplace.wholeWord')}</span>
                </label>
                <label className="fr-option">
                    <input
                        type="checkbox"
                        checked={isRegexp}
                        onChange={(e) => {
                            setIsRegexp(e.target.checked);
                            if (findValue) runSearch(findValue);
                        }}
                    />
                    <span>{t('findReplace.regex')}</span>
                </label>
                {findValue && <span className="fr-count">{t('findReplace.matchCount', { count: matchCount })}</span>}
            </div>
        </div>
    );
}
