import type { Muya } from '../muya';
import githubMarkdownCss from 'github-markdown-css/github-markdown.css?inline';
import katexCss from 'katex/dist/katex.css?inline';
import highlightCss from 'prismjs/themes/prism.css?inline';
import exportStyle from '../assets/styles/exportStyle.css?inline';
import footerHeaderCss from '../assets/styles/headerFooterStyle.css?inline';
import { EXPORT_DOMPURIFY_CONFIG } from '../config';
import { isHTMLElement, sanitize, unescapeHTML } from '../utils';
import loadRenderer from '../utils/diagram';

import { getHighlightHtml } from '../utils/marked';

export const getSanitizeHtml = (markdown: string, options: Record<string, unknown>) => {
  const html = getHighlightHtml(markdown, options as any);
  return sanitize(html, EXPORT_DOMPURIFY_CONFIG, false);
};

const HF_TABLE_START = '<table class="page-container">';
const HF_TABLE_END = '</table>';

const createMarkdownArticle = (html: string) => {
    return `<article class="markdown-body">${html}</article>`;
};

const createTableBody = (html: string) => {
    return `<tbody><tr><td>
  <div class="main-container">
    ${createMarkdownArticle(html)}
  </div>
</td></tr></tbody>`;
};

const HF_TABLE_FOOTER = `<tfoot class="page-footer-fake"><tr><td>
  <div class="hf-container">
    &nbsp;
  </div>
</td></tr></tfoot>`;

const createTableHeader = (options: ExportOptions) => {
    const { header, headerFooterStyled } = options;
    if (!header)
        return '';
    const { type, left, center, right } = header;
    let headerClass = type === 1 ? 'single' : '';
    headerClass += getHeaderFooterStyledClass(headerFooterStyled);
    return `<thead class="page-header ${headerClass}"><tr><th>
  <div class="hf-container">
    <div class="header-content-left">${left}</div>
    <div class="header-content">${center}</div>
    <div class="header-content-right">${right}</div>
  </div>
</th></tr></thead>`;
};

const createRealFooter = (options: ExportOptions) => {
    const { footer, headerFooterStyled } = options;
    if (!footer)
        return '';
    const { type, left, center, right } = footer;
    let footerClass = type === 1 ? 'single' : '';
    footerClass += getHeaderFooterStyledClass(headerFooterStyled);
    return `<div class="page-footer ${footerClass}">
  <div class="hf-container">
    <div class="footer-content-left">${left}</div>
    <div class="footer-content">${center}</div>
    <div class="footer-content-right">${right}</div>
  </div>
</div>`;
};

const getHeaderFooterStyledClass = (value: boolean | undefined) => {
    if (value === undefined) {
        return '';
    }
    return !value ? ' simple' : ' styled';
};

interface HeaderFooterConfig {
    type: number;
    left: string;
    center: string;
    right: string;
}

export interface ExportOptions {
    title?: string;
    extraCss?: string;
    printOptimization?: boolean;
    toc?: string;
    header?: HeaderFooterConfig;
    footer?: HeaderFooterConfig;
    headerFooterStyled?: boolean;
}

export class MarkdownToHtml {
    private _exportContainer: HTMLDivElement | null = null;
    private _mathRendererCalled = false;

    constructor(public markdown: string, public muya?: Muya) {}

    async renderMermaid() {
        const codes = this._exportContainer!.querySelectorAll(
            'code.language-mermaid',
        );
        for (const code of codes) {
            const preEle = code.parentNode;
            if (!isHTMLElement(preEle))
                continue;
            const mermaidContainer = document.createElement('div');
            mermaidContainer.innerHTML = sanitize(
                unescapeHTML(code.innerHTML),
                EXPORT_DOMPURIFY_CONFIG,
                true,
            ) as string;
            mermaidContainer.classList.add('mermaid');
            preEle.replaceWith(mermaidContainer);
        }
          const mermaid = await loadRenderer('mermaid');
          // We only export light theme, set mermaid theme to `default` for export.
          mermaid.initialize({
            securityLevel: 'strict',
            theme: 'default',
          });
          mermaid.init(undefined, this._exportContainer!.querySelectorAll('div.mermaid'));
        if (this.muya) {
            mermaid.initialize({
                securityLevel: 'strict',
                theme: this.muya.options.mermaidTheme,
            });
        }
    }

    async renderDiagram() {
      const selector =
        'code.language-vega-lite, code.language-flowchart, code.language-sequence, code.language-plantuml';

      const RENDER_MAP: Record<string, any> = {
        flowchart: await loadRenderer('flowchart'),
        sequence: await loadRenderer('sequence'),
        plantuml: await loadRenderer('plantuml'),
        'vega-lite': await loadRenderer('vega-lite'),
      };

      const codes = this._exportContainer!.querySelectorAll(selector);

      for (const code of codes) {
        const rawCode = unescapeHTML(code.innerHTML);
        const functionType = (() => {
          if (/sequence/.test(code.className))
            return 'sequence';
          else if (/plantuml/.test(code.className))
            return 'plantuml';
          else if (/flowchart/.test(code.className))
            return 'flowchart';
          else
            return 'vega-lite';
        })();
        const render = RENDER_MAP[functionType];
        const preParent = code.parentNode;
        if (!isHTMLElement(preParent))
          continue;
        const diagramContainer = document.createElement('div');
        diagramContainer.classList.add(functionType);
        preParent.replaceWith(diagramContainer);
        const options: Record<string, unknown> = {};
        if (functionType === 'vega-lite') {
          Object.assign(options, {
            actions: false,
            tooltip: false,
            renderer: 'svg',
            theme: 'latimes',
          });
        }
        else if (functionType === 'sequence') {
          Object.assign(options, {
            theme: this.muya?.options.sequenceTheme ?? 'hand',
          });
        }

        try {
          if (functionType === 'plantuml') {
            const diagram = render.parse(rawCode);
            diagramContainer.innerHTML = '';
            diagram.insertImgElement(diagramContainer);
          }
          else if (functionType === 'flowchart' || functionType === 'sequence') {
            const diagram = render.parse(rawCode);
            diagramContainer.innerHTML = '';
            diagram.drawSVG(diagramContainer, options);
          }
          else if (functionType === 'vega-lite') {
            await render(diagramContainer, JSON.parse(rawCode), options);
          }
        }
        catch {
          diagramContainer.innerHTML = '< Invalid Diagram >';
        }
      }
    }

    async renderHtml(toc?: string) {
        this._mathRendererCalled = false;
        let html = getHighlightHtml(this.markdown, {
            superSubScript: this.muya ? this.muya.options.superSubScript : false,
            footnote: this.muya ? this.muya.options.footnote : false,
            isGitlabCompatibilityEnabled: this.muya
                ? this.muya.options.isGitlabCompatibilityEnabled
                : false,
            math: this.muya ? this.muya.options.math : false,
        });

        html = sanitize(html, EXPORT_DOMPURIFY_CONFIG, false) as string;

        const exportContainer = (this._exportContainer
            = document.createElement('div'));
        exportContainer.classList.add('ag-render-container');
        exportContainer.innerHTML = html;
        document.body.appendChild(exportContainer);

        this._mathRendererCalled = exportContainer.querySelector('.katex') !== null;

        await this.renderMermaid();
        await this.renderDiagram();

        let result = exportContainer.innerHTML;
        exportContainer.remove();

        const paths = document.querySelectorAll('path[id^=raphael-marker-]');
        const def = '<defs style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">';
        result = result.replace(def, () => {
            let str = '';
            for (const path of paths)
                str += path.outerHTML;

            return `${def}${str}`;
        });

        this._exportContainer = null;

        return result;
    }

    private _prepareHtml(html: string, options: ExportOptions) {
        const { header, footer } = options;
        const appendHeaderFooter = !!header || !!footer;
        if (!appendHeaderFooter) {
            return createMarkdownArticle(html);
        }

        if (!options.extraCss) {
            options.extraCss = footerHeaderCss;
        }
        else {
            options.extraCss = footerHeaderCss + options.extraCss;
        }

        let output = HF_TABLE_START;
        if (header) {
            output += createTableHeader(options);
        }

        if (footer) {
            output += HF_TABLE_FOOTER;
            output = createRealFooter(options) + output;
        }

        output = output + createTableBody(html) + HF_TABLE_END;
        return sanitize(output, EXPORT_DOMPURIFY_CONFIG, false) as string;
    }

    async generate(options: ExportOptions = {}) {
        const { printOptimization = false } = options;

        // WORKAROUND: Hide Prism.js style when exporting or printing. Otherwise the background color is white in the dark theme.
        const highlightCssStyle = printOptimization ? `@media print { ${highlightCss} }` : highlightCss
        const html = this._prepareHtml(await this.renderHtml(options.toc), options);
        const katexCssStyle = this._mathRendererCalled ? katexCss : '';
        this._mathRendererCalled = false;

        const { title = '', extraCss = ''} = options;

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${sanitize(title, EXPORT_DOMPURIFY_CONFIG, true)}</title>
  <style>
  ${githubMarkdownCss}
  </style>
  <style>
  ${highlightCssStyle}
  </style>
  <style>
  ${katexCssStyle}
  </style>
  <style>
    .markdown-body {
      font-family: -apple-system,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }

    @media not print {
      .markdown-body {
        padding: 45px;
      }

      @media (max-width: 767px) {
        .markdown-body {
          padding: 15px;
        }
      }
    }

    .hf-container {
      color: #24292e;
      line-height: 1.3;
    }

    .markdown-body .highlight pre,
    .markdown-body pre {
      white-space: pre-wrap;
    }
    .markdown-body table {
      display: table;
    }
    .markdown-body img[data-align="center"] {
      display: block;
      margin: 0 auto;
    }
    .markdown-body img[data-align="right"] {
      display: block;
      margin: 0 0 0 auto;
    }
    .markdown-body li.task-list-item {
      list-style-type: none;
    }
    .markdown-body li > [type=checkbox] {
      margin: 0 0 0 -1.3em;
    }
    .markdown-body input[type="checkbox"] ~ p {
      margin-top: 0;
      display: inline-block;
    }
    .markdown-body ol ol,
    .markdown-body ul ol {
      list-style-type: decimal;
    }
    .markdown-body ol ol ol,
    .markdown-body ol ul ol,
    .markdown-body ul ol ol,
    .markdown-body ul ul ol {
      list-style-type: decimal;
    }
  </style>
  <style>${exportStyle}</style>
  <style>${extraCss}</style>
</head>
<body>
  ${html}
</body>
</html>`;
    }
}