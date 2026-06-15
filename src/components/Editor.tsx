import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
    Muya,
    zhCN,
    EmojiSelector,
    FootnoteTool,
    InlineFormatToolbar,
    ImageEditTool,
    ImageToolBar,
    ImageResizeBar,
    CodeBlockLanguageSelector,
    LinkTools,
    ParagraphFrontButton,
    ParagraphFrontMenu,
    TableChessboard,
    TableColumnToolbar,
    ParagraphQuickInsertMenu,
    TableDragBar,
    TableRowColumMenu,
    PreviewToolBar,
    stableSlug,
} from '@muyajs/core';
import type { IMuyaOptions } from '@muyajs/core';
import '@muyajs/core/assets/styles/index.css';
import '@muyajs/core/assets/styles/blockSyntax.css';
import '@muyajs/core/assets/styles/inlineSyntax.css';
import '@muyajs/core/assets/styles/prismjs/light.theme.css';

export interface EditorHandle {
    getMarkdown: () => string;
    setContent: (content: string, autoFocus?: boolean) => void;
    focus: () => void;
    blur: (isRemoveAllRange?: boolean, unSelect?: boolean) => void;
    undo: () => void;
    redo: () => void;
    selectAll: () => void;
    search: (value: string, opts?: Record<string, unknown>) => void;
    find: (action: 'previous' | 'next') => void;
    replace: (replaceValue: string, opts?: Record<string, unknown>) => void;
    getTOC: () => Array<{ content: string; lvl: number; slug: string; githubSlug: string }>;
    scrollToHeading: (slug: string) => void;
    scrollToCursor: () => void;
    setFocusMode: (focusMode: boolean) => void;
    reloadImages: () => void;
    setOptions: (options: Record<string, unknown>, forceRender?: boolean) => void;
    insertParagraph: (location: 'before' | 'after') => void;
    copyAsRich: () => void;
    copyAsHtml: () => void;
    pasteAsPlainText: () => void;
    pasteText: (text: string, asPlainText?: boolean) => void;
    getDomNode: () => HTMLElement | null;
    dispose: () => void;
}

interface EditorProps {
    initialContent?: string;
    onChange?: (markdown: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onSelectionChange?: (hasSelection: boolean) => void;
    options?: Partial<IMuyaOptions>;
}

const DEFAULT_OPTIONS: Partial<IMuyaOptions> = {
    frontMatter: true,
    footnote: true,
    math: true,
    superSubScript: true,
    isGitlabCompatibilityEnabled: true,
    codeBlockLineNumbers: true,
    focusMode: false,
    spellcheckEnabled: false,
    disableHtml: false,
    autoPairBracket: true,
    autoPairMarkdownSyntax: true,
    autoPairQuote: true,
    autoCheck: false,
    autoMoveCheckedToEnd: false,
    preferLooseListItem: true,
    hideQuickInsertHint: false,
    hideLinkPopup: false,
    trimUnnecessaryCodeBlockEmptyLines: false,
    bulletListMarker: '-',
    orderListDelimiter: '.',
    frontmatterType: '-',
    mermaidTheme: 'default',
    vegaTheme: 'latimes',
    fontSize: 16,
    lineHeight: 1.6,
    tabSize: 4,
    listIndentation: 1,
};

let pluginsRegistered = false;

function ensurePlugins() {
    if (pluginsRegistered) return;
    pluginsRegistered = true;

    Muya.use(EmojiSelector);
    Muya.use(FootnoteTool);
    Muya.use(InlineFormatToolbar);
    Muya.use(ImageEditTool, {
        imagePathPicker: async () => '',
        imageAction: async (state: { src: string }) => state.src,
    });
    Muya.use(ImageToolBar);
    Muya.use(ImageResizeBar);
    Muya.use(CodeBlockLanguageSelector);
    Muya.use(LinkTools, {
        jumpClick: (linkInfo: { href?: string } | null) => {
            const href = linkInfo?.href;
            if (href && /^https?:\/\//.test(href))
                window.open(href, '_blank', 'noopener,noreferrer');
        },
    });
    Muya.use(ParagraphFrontButton);
    Muya.use(ParagraphFrontMenu);
    Muya.use(TableChessboard);
    Muya.use(TableColumnToolbar);
    Muya.use(ParagraphQuickInsertMenu);
    Muya.use(TableDragBar);
    Muya.use(TableRowColumMenu);
    Muya.use(PreviewToolBar);
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
    { initialContent = '', onChange, onFocus, onBlur, onSelectionChange, options },
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const muyaRef = useRef<Muya | null>(null);
    const muyaContainerRef = useRef<HTMLDivElement | null>(null);
    const destroyedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    const onFocusRef = useRef(onFocus);
    const onBlurRef = useRef(onBlur);
    const onSelectionChangeRef = useRef(onSelectionChange);

    onChangeRef.current = onChange;
    onFocusRef.current = onFocus;
    onBlurRef.current = onBlur;
    onSelectionChangeRef.current = onSelectionChange;

    useEffect(() => {
        destroyedRef.current = false;

        ensurePlugins();
        const container = containerRef.current;

        if (!container) {
            return;
        }

        // If muya already exists (StrictMode re-mount), reuse it
        if (muyaRef.current) {
            return;
        }

        // 创建一个内层容器给 muya 使用
        // 这样可以隔离 React 和 muya 的 DOM 操作
        const muyaContainer = document.createElement('div');
        muyaContainer.className = 'muya-container';
        muyaContainerRef.current = muyaContainer;
        container.appendChild(muyaContainer);

        let muya: Muya;
        try {
            muya = new Muya(muyaContainer, {
                ...DEFAULT_OPTIONS,
                ...options,
                markdown: initialContent,
            });
        }
        catch (err) {
            // 如果初始化失败，清理创建的容器
            try { container.removeChild(muyaContainer); } catch {}
            muyaContainerRef.current = null;
            return;
        }
        try {
            muya.locale(zhCN);
            muya.init();
        }
        catch (err) {
            // 如果初始化失败，清理创建的容器
            try { container.removeChild(muyaContainer); } catch {}
            muyaContainerRef.current = null;
            return;
        }
        muyaRef.current = muya;

        muya.on('json-change', () => {
            onChangeRef.current?.(muya.getMarkdown());
        });
        muya.on('focus', () => onFocusRef.current?.());
        muya.on('blur', () => onBlurRef.current?.());
        muya.on('selection-change', (data: { type: string }) => {
            onSelectionChangeRef.current?.(data.type === 'Range');
        });

        // muya.init() creates the scrollPage and attaches the contenteditable
        // to the DOM. Give it one micro-task to settle before we try to focus,
        // otherwise the initial _setCursor() call races with DOM attachment.
        requestAnimationFrame(() => {
            muya.focus();
        });

        return () => {
            const muyaToDestroy = muyaRef.current;
            const muyaContainer = muyaContainerRef.current;
            destroyedRef.current = true;

            // 如果 muya 已经被 dispose 方法清理过，跳过重复清理
            if (!muyaToDestroy) {
                return;
            }

            // 隐藏浮动工具
            (muyaToDestroy as any).hideAllFloatTools?.();

            // 将 muya 的容器从 React 容器中分离
            // 这样 React 在卸载时只会清理空的外层容器，不会与 muya 的清理冲突
            if (muyaContainer && container) {
                try {
                    if (muyaContainer.parentNode === container) {
                        container.removeChild(muyaContainer);
                    }
                } catch {}
            }
            muyaContainerRef.current = null;

            // 现在可以安全地销毁 muya，它的 DOM 已经与 React 分离
            setTimeout(() => {
                if (destroyedRef.current && muyaRef.current === muyaToDestroy) {
                    muyaToDestroy.destroy();
                    muyaRef.current = null;
                }
            }, 0);
        };
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            getMarkdown: () => muyaRef.current?.getMarkdown() ?? '',
            setContent: (content: string, autoFocus: boolean = false) => {
                muyaRef.current?.setContent(content, autoFocus);
            },
            focus: () => {
                muyaRef.current?.focus();
            },
            blur: (isRemoveAllRange = false, unSelect = false) => {
                muyaRef.current?.blur(isRemoveAllRange, unSelect);
            },
            undo: () => {
                muyaRef.current?.undo();
            },
            redo: () => {
                muyaRef.current?.redo();
            },
            selectAll: () => {
                muyaRef.current?.selectAll();
            },
            search: (value: string, opts = {}) => {
                muyaRef.current?.search(value, opts);
            },
            find: (action: 'previous' | 'next') => {
                muyaRef.current?.find(action);
            },
            replace: (replaceValue: string, opts = {}) => {
                muyaRef.current?.replace(replaceValue, opts);
            },
            getTOC: () => {
                return (muyaRef.current?.getTOC?.() as any) ?? [];
            },
            scrollToHeading: (slug: string) => {
                const muya = muyaRef.current as any;
                if (!muya?.editor?.scrollPage) return;
                const { scrollPage } = muya.editor;
                for (const node of scrollPage.children.iterator()) {
                    const { blockName } = node;
                    if (blockName !== 'atx-heading' && blockName !== 'setext-heading')
                        continue;
                    if (stableSlug(node) === slug) {
                        node.domNode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        const content = node.firstContentInDescendant?.();
                        content?.setCursor(0, 0, true);
                        return;
                    }
                }
            },
            setFocusMode: (focusMode: boolean) => {
                muyaRef.current?.setOptions({ focusMode });
            },
            reloadImages: () => {
                muyaRef.current?.invalidateImageCache();
            },
            scrollToCursor: () => {
                const muya = muyaRef.current as any;
                
                if (!muya?.domNode) {
                    return;
                }
                
                const container = muya.domNode;
                
                const sel = document.getSelection();
                if (!sel || sel.rangeCount === 0) {
                    return;
                }
                
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                if (!rect) {
                    return;
                }
                
                const STANDARD_Y = 320;
                const containerRect = container.getBoundingClientRect();
                const cursorYRelativeToContainer = rect.top - containerRect.top;
                const targetScrollTop = container.scrollTop + cursorYRelativeToContainer - STANDARD_Y;
                
                container.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            },
            setOptions: (options: Record<string, unknown>, forceRender = false) => {
                muyaRef.current?.setOptions?.(options, forceRender);
            },
            insertParagraph: (location: 'before' | 'after') => {
                (muyaRef.current as any)?.insertParagraph?.(location);
            },
            copyAsRich: () => {
                (muyaRef.current as any)?.copyAsRich?.();
            },
            copyAsHtml: () => {
                (muyaRef.current as any)?.copyAsHtml?.();
            },
            pasteAsPlainText: () => {
                (muyaRef.current as any)?.pasteAsPlainText?.();
            },
            pasteText: (text: string, asPlainText = false) => {
                const muya = muyaRef.current as any;
                if (!muya?.domNode) return;
                const dt = new DataTransfer();
                dt.setData('text/plain', text);
                if (asPlainText && muya.editor?.clipboard) {
                    muya.editor.clipboard.pasteType = 'pasteAsPlainText';
                }
                muya.domNode.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
                if (asPlainText && muya.editor?.clipboard) {
                    muya.editor.clipboard.pasteType = 'normal';
                }
            },
            getDomNode: () => {
                return (muyaRef.current as any)?.domNode ?? null;
            },
            dispose: () => {
                const muyaToDestroy = muyaRef.current;
                const muyaContainer = muyaContainerRef.current;
                const container = containerRef.current;
                if (!muyaToDestroy) return;

                // 隐藏浮动工具
                (muyaToDestroy as any).hideAllFloatTools?.();

                // 将 muya 的容器从 React 容器中分离
                // 这样 React 在卸载时只会清理空的外层容器，不会与 muya 的清理冲突
                if (muyaContainer && container) {
                    try {
                        if (muyaContainer.parentNode === container) {
                            container.removeChild(muyaContainer);
                        }
                    } catch {}
                }
                muyaContainerRef.current = null;

                // 现在可以安全地销毁 muya，它的 DOM 已经与 React 分离
                muyaToDestroy.destroy();
                muyaRef.current = null;
            },
        }),
        [],
    );

    return <div className="rustype-editor" ref={containerRef} />;
});

export default Editor;
