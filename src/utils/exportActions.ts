import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { message } from '@tauri-apps/plugin-dialog';
import type { EditorHandle } from '../components/Editor';
import type { Tab } from '../components/TabBar';
import { getCssForOptions, getHtmlToc, type PdfCssOptions, type HtmlTocOptions, type TocEntry } from './export';
import MarkdownPrint from '../services/printService';

interface ExportActionsProps {
    tabs: Tab[];
    activeTabId: string;
    editorRef: React.RefObject<EditorHandle | null>;
    setActiveMenu: React.Dispatch<React.SetStateAction<string | null>>;
}

export async function exportHtml(props: ExportActionsProps): Promise<void> {
    const { tabs, activeTabId, editorRef, setActiveMenu } = props;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) {
        await message('请先打开一个文件', { title: '错误', kind: 'error' });
        setActiveMenu(null);
        return;
    }

    let defaultPath = 'Untitled.html';
    if (activeTab.file?.path) {
        const baseName = activeTab.file.path.replace(/\.md$/i, '');
        defaultPath = `${baseName}.html`;
    }
    try {
        const targetPath = await save({
            defaultPath,
            filters: [{ name: 'HTML Files', extensions: ['html'] }],
        });

        if (!targetPath) {
            setActiveMenu(null);
            return;
        }

        const opts: PdfCssOptions = {
            type: 'styledHtml',
            pageMarginTop: 20,
            pageMarginRight: 20,
            pageMarginBottom: 20,
            pageMarginLeft: 20,
            fontSize: 16,
            lineHeight: 1.5,
            autoNumberingHeadings: false,
            showFrontMatter: true,
        };

        const tocOptions: HtmlTocOptions = {
            tocIncludeTopHeading: false,
            tocTitle: '',
        };

        const extraCss = await getCssForOptions(opts);
        const toc = editorRef.current?.getTOC() || [];
        const htmlToc = getHtmlToc(toc as unknown as TocEntry[], tocOptions);
        const htmlTitle = activeTab.file?.name?.replace(/\.md$/i, '') || 'Untitled';
        const htmlContent = await editorRef.current?.exportStyledHTML({
            title: htmlTitle,
            printOptimization: false,
            extraCSS: extraCss,
            toc: htmlToc,
        });

        if (htmlContent) {
            await writeTextFile(targetPath, htmlContent);
            await message('HTML 导出成功！', { title: '成功', kind: 'info' });
        }
    } catch (error) {
        console.error('Export HTML failed:', error);
        await message('HTML 导出失败', { title: '错误', kind: 'error' });
    }

    setActiveMenu(null);
}

export async function exportPdf(props: ExportActionsProps): Promise<void> {
    const { tabs, activeTabId, editorRef, setActiveMenu } = props;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) {
        await message('请先打开一个文件', { title: '错误', kind: 'error' });
        setActiveMenu(null);
        return;
    }

    const baseName = activeTab.file?.path?.replace(/\.md$/i, '') 
        || activeTab.file?.name?.replace(/\.md$/i, '') 
        || 'Untitled';

    try {
        const targetPath = await save({
            defaultPath: `${baseName}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
        });

        if (!targetPath) {
            setActiveMenu(null);
            return;
        }

        const opts: PdfCssOptions = {
            type: 'pdf',
            pageMarginTop: 20,
            pageMarginRight: 20,
            pageMarginBottom: 20,
            pageMarginLeft: 20,
            fontSize: 14,
            lineHeight: 1.5,
            autoNumberingHeadings: false,
            showFrontMatter: true,
        };

        const tocOptions: HtmlTocOptions = {
            tocIncludeTopHeading: true,
            tocTitle: '',
        };

        const extraCss = await getCssForOptions(opts);
        const toc = editorRef.current?.getTOC() || [];
        const htmlToc = getHtmlToc(toc as unknown as TocEntry[], tocOptions);

        const html = await editorRef.current?.exportStyledHTML({
            title: '',
            printOptimization: true,
            extraCSS: extraCss,
            toc: htmlToc,
        });

        if (html) {
            // todo: 拿到tauri后端去渲染 或者 纯前端渲染方案
            // await writeFile(targetPath, new Uint8Array(arrayBuffer));
            // await message('PDF 导出成功！', { title: '成功', kind: 'info' });
        }
    } catch (error) {
        console.error('Export PDF failed:', error);
        await message('PDF 导出失败', { title: '错误', kind: 'error' });
    }

    setActiveMenu(null);
}

export async function printDocument(props: ExportActionsProps): Promise<void> {
    const { tabs, activeTabId, editorRef, setActiveMenu } = props;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) {
        await message('请先打开一个文件', { title: '错误', kind: 'error' });
        setActiveMenu(null);
        return;
    }

    const printer = new MarkdownPrint();

    try {
        const opts: PdfCssOptions = {
            type: 'print',
            pageMarginTop: 20,
            pageMarginRight: 20,
            pageMarginBottom: 20,
            pageMarginLeft: 20,
            fontSize: 14,
            lineHeight: 1.5,
            autoNumberingHeadings: false,
            showFrontMatter: true,
        };

        const tocOptions: HtmlTocOptions = {
            tocIncludeTopHeading: true,
            tocTitle: '',
        };

        const extraCss = await getCssForOptions(opts);
        const toc = editorRef.current?.getTOC() || [];
        const htmlToc = getHtmlToc(toc as unknown as TocEntry[], tocOptions);

        const html = await editorRef.current?.exportStyledHTML({
            title: '',
            printOptimization: true,
            extraCSS: extraCss,
            toc: htmlToc,
        });

        if (html) {
            printer.renderMarkdown(html, true);
            window.print();;
        }
    } catch (error) {
        console.error('Print failed:', error);
        await message('打印失败', { title: '错误', kind: 'error' });
    } finally {
        setTimeout(() => {
            printer.clearup();
            console.log('Printing finished, temporary DOM has been safely cleaned up');
        }, 1000);
    }

    setActiveMenu(null);
}