import { useState, useRef, useEffect, useCallback } from 'react';
import type { EditorHandle } from './Editor';

interface FindReplaceProps {
    editorRef: React.RefObject<EditorHandle | null>;
    onClose: () => void;
}

export default function FindReplace({ editorRef, onClose }: FindReplaceProps) {
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
                    placeholder="查找"
                    value={findValue}
                    onChange={handleFindChange}
                />
                <button className="fr-btn" onClick={handleFindPrevious} title="上一个 (Shift+Enter)">
                    ↑
                </button>
                <button className="fr-btn" onClick={handleFindNext} title="下一个 (Enter)">
                    ↓
                </button>
                <button className="fr-btn" onClick={() => setShowReplace(prev => !prev)} title="替换">
                    {showReplace ? '隐藏' : '替换'}
                </button>
                <button className="fr-btn fr-close" onClick={onClose} title="关闭 (Esc)">
                    ×
                </button>
            </div>
            {showReplace && (
                <div className="find-replace-row">
                    <input
                        type="text"
                        className="find-input"
                        placeholder="替换为"
                        value={replaceValue}
                        onChange={(e) => setReplaceValue(e.target.value)}
                    />
                    <button className="fr-btn" onClick={handleReplace} title="替换当前">
                        替换
                    </button>
                    <button className="fr-btn" onClick={handleReplaceAll} title="替换全部">
                        全部
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
                    <span>区分大小写</span>
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
                    <span>全字匹配</span>
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
                    <span>正则表达式</span>
                </label>
                {findValue && <span className="fr-count">{matchCount} 个匹配</span>}
            </div>
        </div>
    );
}
