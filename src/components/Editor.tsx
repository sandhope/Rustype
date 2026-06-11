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
    setFocusMode: (focusMode: boolean) => void;
    setOptions: (options: Record<string, unknown>, forceRender?: boolean) => void;
}

interface EditorProps {
    initialContent?: string;
    onChange?: (markdown: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
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
    { initialContent = '', onChange, onFocus, onBlur, options },
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const muyaRef = useRef<Muya | null>(null);
    const destroyedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    const onFocusRef = useRef(onFocus);
    const onBlurRef = useRef(onBlur);

    onChangeRef.current = onChange;
    onFocusRef.current = onFocus;
    onBlurRef.current = onBlur;

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

        let muya: Muya;
        try {
            muya = new Muya(container, {
                ...DEFAULT_OPTIONS,
                ...options,
                markdown: initialContent,
            });
        }
        catch (err) {
            return;
        }
        try {
            muya.locale(zhCN);
            muya.init();
        }
        catch (err) {
            return;
        }
        muyaRef.current = muya;

        muya.on('json-change', () => {
            onChangeRef.current?.(muya.getMarkdown());
        });
        muya.on('focus', () => onFocusRef.current?.());
        muya.on('blur', () => onBlurRef.current?.());

        // muya.init() creates the scrollPage and attaches the contenteditable
        // to the DOM. Give it one micro-task to settle before we try to focus,
        // otherwise the initial _setCursor() call races with DOM attachment.
        requestAnimationFrame(() => {
            muya.focus();
        });

        return () => {
            // Delay destruction to handle StrictMode's double invocation
            // If the component re-mounts quickly, we keep the muya instance
            const muyaToDestroy = muyaRef.current;
            destroyedRef.current = true;
            requestAnimationFrame(() => {
                if (destroyedRef.current && muyaToDestroy) {
                    muyaToDestroy.destroy();
                    if (muyaRef.current === muyaToDestroy) {
                        muyaRef.current = null;
                    }
                }
            });
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
            setFocusMode: (focusMode: boolean) => {
                muyaRef.current?.setOptions({ focusMode });
            },
            setOptions: (options: Record<string, unknown>, forceRender = false) => {
                muyaRef.current?.setOptions?.(options, forceRender);
            },
        }),
        [],
    );

    return <div className="rustype-editor" ref={containerRef} />;
});

export default Editor;
