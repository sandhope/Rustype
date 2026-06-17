import { sanitize, escapeHTML, unescapeHTML } from '../muya/src/utils';
import { EXPORT_DOMPURIFY_CONFIG } from '../muya/src/config';
import { generateGithubSlug } from '../muya/src/utils/slug';

export interface PdfCssOptions {
    type?: string;
    pageMarginTop?: number;
    pageMarginRight?: number;
    pageMarginBottom?: number;
    pageMarginLeft?: number;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number | string;
    autoNumberingHeadings?: boolean;
    showFrontMatter?: boolean;
    theme?: string;
    headerFooterFontSize?: number;
    [key: string]: unknown;
}

const FALLBACK_FONT_FAMILIES =
    '"Open Sans","Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"';

const autoNumberingHeadingsCss = `body {counter-reset: h2}
h2 {counter-reset: h3}
h3 {counter-reset: h4}
h4 {counter-reset: h5}
h5 {counter-reset: h6}
h2:before {counter-increment: h2; content: counter(h2) ". "}
h3:before {counter-increment: h3; content: counter(h2) "." counter(h3) ". "}
h4:before {counter-increment: h4; content: counter(h2) "." counter(h3) "." counter(h4) ". "}
h5:before {counter-increment: h5; content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) ". "}
h6:before {counter-increment: h6; content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) "." counter(h6) ". "}
h2.nocount:before, h3.nocount:before, h4.nocount:before, h5.nocount:before, h6.nocount:before { content: ""; counter-increment: none }`;

export const getCssForOptions = async(options: PdfCssOptions): Promise<string> => {
    const {
        type,
        pageMarginTop,
        pageMarginRight,
        pageMarginBottom,
        pageMarginLeft,
        fontFamily,
        fontSize,
        lineHeight,
        autoNumberingHeadings,
        showFrontMatter,
        theme,
        headerFooterFontSize
    } = options;
    const isPrintable = type !== 'styledHtml';

    let output = '';
    if (isPrintable) {
        output += `@media print{@page{
      margin: ${pageMarginTop}mm ${pageMarginRight}mm ${pageMarginBottom}mm ${pageMarginLeft}mm;}`;
    }

    output += '.markdown-body{';
    if (fontFamily) {
        output += `font-family:"${fontFamily}",${FALLBACK_FONT_FAMILIES};`;
        output = `.hf-container{font-family:"${fontFamily}",${FALLBACK_FONT_FAMILIES};}${output}`;
    }
    if (fontSize) {
        output += `font-size:${fontSize}px;`;
    }
    if (lineHeight) {
        output += `line-height:${lineHeight};`;
    }
    output += '}';

    if (autoNumberingHeadings) {
        output += autoNumberingHeadingsCss;
    }

    if (!showFrontMatter) {
        output += 'pre.front-matter{display:none!important;}';
    }

    if (headerFooterFontSize) {
        output += `.page-header .hf-container,
    .page-footer-fake .hf-container,
    .page-footer .hf-container {
      font-size: ${headerFooterFontSize}px;
    }`;
    }

    if (isPrintable) {
        output += '}';
    }
    return unescapeHTML(sanitize(escapeHTML(output), EXPORT_DOMPURIFY_CONFIG, false)) as string;
};

export interface TocEntry {
    lvl: number;
    content: string;
    slug?: string;
    [key: string]: unknown;
}

export interface HtmlTocOptions {
    tocIncludeTopHeading?: boolean;
    tocTitle?: string;
    [key: string]: unknown;
}

const generateHtmlToc = (
    tocList: TocEntry[],
    currentLevel: number,
    options: HtmlTocOptions
): string => {
    if (!tocList || tocList.length === 0) {
        return '';
    }

    const topLevel = tocList[0].lvl;
    if (!options.tocIncludeTopHeading && topLevel <= 1) {
        tocList.shift();
        return generateHtmlToc(tocList, currentLevel, options);
    } else if (topLevel <= currentLevel) {
        return '';
    }

    const shifted = tocList.shift() as TocEntry;
    const { content, lvl } = shifted;
    const slug = generateGithubSlug(content);

    let html = `<li><span><a class="toc-h${lvl}" href="#${slug}">${content}</a><span class="dots"></span></span>`;

    if (tocList.length !== 0 && tocList[0].lvl > lvl) {
        html += '<ul>' + generateHtmlToc(tocList, lvl, options) + '</ul>';
    }

    html += '</li>' + generateHtmlToc(tocList, currentLevel, options);
    return html;
};

export const getHtmlToc = (toc: TocEntry[], options: HtmlTocOptions = {}): string => {
    const list = JSON.parse(JSON.stringify(toc));
    const tocList = generateHtmlToc(list, 0, options);
    if (!tocList) {
        return '';
    }

    const title = options.tocTitle ? options.tocTitle : 'Table of Contents';
    const html = `<div class="toc-container"><p class="toc-title">${title}</p><ul class="toc-list">${tocList}</ul></div>`;
    return sanitize(html, EXPORT_DOMPURIFY_CONFIG, false) as string;
};