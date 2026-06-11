interface TocItem {
    content: string;
    lvl: number;
    slug: string;
    githubSlug: string;
}

interface OutlineProps {
    items: TocItem[];
    onClose: () => void;
    onItemClick?: (item: TocItem) => void;
}

export default function Outline({ items, onClose, onItemClick }: OutlineProps) {
    return (
        <div className="outline-panel">
            <div className="outline-header">
                <span className="outline-title">大纲</span>
                <button className="outline-close" onClick={onClose}>×</button>
            </div>
            <div className="outline-content">
                {items.length === 0 ? (
                    <div className="outline-empty">文档中没有标题</div>
                ) : (
                    <ul className="outline-list">
                        {items.map((item, index) => (
                            <li
                                key={item.slug + '-' + index}
                                className={`outline-item outline-level-${item.lvl}`}
                                onClick={() => onItemClick?.(item)}
                            >
                                {item.content || '(空)'}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
