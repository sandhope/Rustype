declare module '@muyajs/core' {
    export interface IMuyaOptions {
        fontSize?: number;
        lineHeight?: number;
        focusMode?: boolean;
        trimUnnecessaryCodeBlockEmptyLines?: boolean;
        preferLooseListItem?: boolean;
        autoPairBracket?: boolean;
        autoPairMarkdownSyntax?: boolean;
        autoPairQuote?: boolean;
        bulletListMarker?: string;
        orderListDelimiter?: string;
        tabSize?: number;
        codeBlockLineNumbers?: boolean;
        listIndentation?: number;
        frontMatter?: boolean;
        frontmatterType?: string;
        mermaidTheme?: string;
        vegaTheme?: string;
        sequenceTheme?: string;
        hideQuickInsertHint?: boolean;
        hideLinkPopup?: boolean;
        autoCheck?: boolean;
        spellcheckEnabled?: boolean;
        superSubScript?: boolean;
        footnote?: boolean;
        math?: boolean;
        isGitlabCompatibilityEnabled?: boolean;
        autoMoveCheckedToEnd?: boolean;
        disableHtml?: boolean;
        locale?: { name: string; resource: Record<string, string> };
        json?: any[];
        markdown?: string;
        clipboardFilePath?: () => Promise<string>;
        imageAction?: (state: { src: string; alt: string; title: string }) => Promise<string>;
        getPathForFile?: (file: File) => string;
    }

    export interface IMuyaPluginConstructor {
        pluginName: string;
        new (muya: Muya, options?: any): any;
    }

    export interface ITocItem {
        slug: string;
        content: string;
        level: number;
        githubSlug: string;
    }

    export class Muya {
        static plugins: any[];
        static use(plugin: IMuyaPluginConstructor, options?: Record<string, unknown>): void;
        constructor(element: HTMLElement, options?: Partial<IMuyaOptions>);
        init(): void;
        locale(object: { name: string; resource: Record<string, string> }): void;
        on(event: string, listener: (...args: any[]) => void): void;
        off(event: string, listener: (...args: any[]) => void): void;
        once(event: string, listener: (...args: any[]) => void): void;
        getState(): any;
        getMarkdown(): string;
        getTOC(): ITocItem[];
        undo(): void;
        redo(): void;
        clearHistory(): void;
        setContent(content: any[] | string, autoFocus?: boolean): void;
        replaceContent(content: any[] | string): boolean;
        setOptions(options: Partial<IMuyaOptions>, forceRender?: boolean): void;
        focus(): void;
        blur(isRemoveAllRange?: boolean, unSelect?: boolean): void;
        selectAll(): void;
        format(type: string): void;
        search(value: string, opts?: Record<string, unknown>): void;
        find(action: 'previous' | 'next'): void;
        replace(value: string, opt?: { isSingle?: boolean; isRegexp?: boolean }): void;
        invalidateImageCache(): void;
        destroy(): void;
    }

    export const en: { name: string; resource: Record<string, string> };
    export const zhCN: { name: string; resource: Record<string, string> };
    export const zhTW: { name: string; resource: Record<string, string> };
    export const de: { name: string; resource: Record<string, string> };
    export const fr: { name: string; resource: Record<string, string> };
    export const ja: { name: string; resource: Record<string, string> };
    export const ko: { name: string; resource: Record<string, string> };
    export const es: { name: string; resource: Record<string, string> };
    export const pt: { name: string; resource: Record<string, string> };

    export class EmojiSelector { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class FootnoteTool { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class InlineFormatToolbar { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class ImageEditTool { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class ImageToolBar { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class ImageResizeBar { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class CodeBlockLanguageSelector { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class LinkTools { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class ParagraphFrontButton { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class ParagraphFrontMenu { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class TableChessboard { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class TableColumnToolbar { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class ParagraphQuickInsertMenu { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class TableDragBar { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class TableRowColumMenu { static pluginName: string; constructor(muya: Muya, options?: any); }
    export class PreviewToolBar { static pluginName: string; constructor(muya: Muya, options?: any); }

    export class MarkdownToHtml {
        constructor(markdown: string);
        generate(): Promise<string>;
    }

    export function renderToStaticHTML(blocks: any[], options?: Record<string, unknown>): string;
    export function escapeHTML(str: string): string;
    export function sanitize(str: string): string;
    export function wordCount(str: string): { word: number; char: number };
    export function generateGithubSlug(str: string): string;
    export function stableSlug(block: any): string;
}

declare module '@muyajs/core/assets/styles/*.css' {}
