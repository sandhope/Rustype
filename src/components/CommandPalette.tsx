import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '../utils/i18n';
import { getAllCommands, type Command } from '../utils/commands';

interface CommandPaletteProps {
    onAction: (action: string) => void;
    onClose: () => void;
}

export default function CommandPalette({ onAction, onClose }: CommandPaletteProps) {
    const { t } = useI18n();
    const allCommands = useMemo(() => getAllCommands(), []);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Filter commands by query (fuzzy match on description + category)
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return allCommands;
        return allCommands.filter(
            cmd =>
                cmd.description.toLowerCase().includes(q) ||
                (cmd.category && cmd.category.toLowerCase().includes(q)) ||
                cmd.id.toLowerCase().includes(q)
        );
    }, [query, allCommands]);

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Auto-focus input on mount
    useEffect(() => {
        const timer = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, []);

    // Scroll selected item into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const item = list.children[selectedIndex] as HTMLElement | undefined;
        item?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const execute = useCallback((cmd: Command) => {
        onAction(cmd.id);
    }, [onAction]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1 >= filtered.length ? 0 : prev + 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev <= 0 ? filtered.length - 1 : prev - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    execute(filtered[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [filtered, selectedIndex, execute, onClose]);

    return (
        <div className="command-palette-overlay" onMouseDown={(e) => {
            // Close when clicking the overlay background (not the palette itself)
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="command-palette" onMouseDown={(e) => e.stopPropagation()}>
                <div className="command-palette-input-wrapper">
                    <input
                        ref={inputRef}
                        className="command-palette-input"
                        type="text"
                        placeholder={t('commandPalette.placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                {filtered.length > 0 && (
                    <ul className="command-palette-list" ref={listRef}>
                        {filtered.map((cmd, index) => (
                            <li
                                key={cmd.id}
                                className={`command-palette-item${index === selectedIndex ? ' active' : ''}`}
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => execute(cmd)}
                            >
                                <span className="command-palette-item-desc">{cmd.description}</span>
                                {cmd.shortcut && (
                                    <span className="command-palette-item-shortcut">
                                        {cmd.shortcut.split('+').map((key, i, arr) => (
                                            <kbd key={i}>{key}{i < arr.length - 1 ? '+' : ''}</kbd>
                                        ))}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
