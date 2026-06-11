import { useEffect, useRef } from 'react';

interface SourceModeProps {
    content: string;
    onChange: (content: string) => void;
}

export default function SourceMode({ content, onChange }: SourceModeProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current && textareaRef.current.value !== content) {
            textareaRef.current.value = content;
        }
    }, [content]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);
            target.value = newValue;
            target.selectionStart = target.selectionEnd = start + 4;
            onChange(newValue);
        }
    };

    return (
        <div className="source-mode">
            <textarea
                ref={textareaRef}
                className="source-textarea"
                defaultValue={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="输入 Markdown..."
                spellCheck={false}
            />
        </div>
    );
}
