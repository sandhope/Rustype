import { useRef, useState, useCallback } from 'react';
import Editor, { type EditorHandle } from './components/Editor';
import { openMarkdownFile, readFileContent, saveMarkdownFile, type FileInfo } from './utils/file';

const WELCOME_MARKDOWN = `# 欢迎使用 Rustype

Rustype 是一款**高性能 Markdown 编辑器**，基于 [muya](https://github.com/marktext/muya) 编辑器引擎。

## 功能特性

- 所见即所得 (WYSIWYG) 编辑
- 支持 **GFM** (GitHub Flavored Markdown)
- 支持数学公式 $\\sqrt{3x-1}+(1+x)^2$
- 支持代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

- 支持表格

| 快捷键 | 功能 |
| --- | --- |
| Ctrl+B | **粗体** |
| Ctrl+I | *斜体* |
| Ctrl+Z | 撤销 |

- 支持脚注[^1]

- - -

> 提示：你可以直接在上方开始编辑！

[^1]: 这是一个脚注示例。
`;

function App() {
    const editorRef = useRef<EditorHandle>(null);
    const [dirty, setDirty] = useState(false);
    const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
    const [content, setContent] = useState(WELCOME_MARKDOWN);

    const handleNewFile = useCallback(() => {
        if (dirty) {
            const confirmed = window.confirm('当前文件有未保存的更改，确定要新建文件吗？');
            if (!confirmed) return;
        }
        setContent(WELCOME_MARKDOWN);
        setCurrentFile(null);
        setDirty(false);
        editorRef.current?.setContent(WELCOME_MARKDOWN);
    }, [dirty]);

    const handleOpenFile = useCallback(async () => {
        if (dirty) {
            const confirmed = window.confirm('当前文件有未保存的更改，确定要打开新文件吗？');
            if (!confirmed) return;
        }

        const fileInfo = await openMarkdownFile();
        if (fileInfo) {
            try {
                const fileContent = await readFileContent(fileInfo.path);
                setContent(fileContent);
                setCurrentFile(fileInfo);
                setDirty(false);
                editorRef.current?.setContent(fileContent);
            } catch (error) {
                console.error('Failed to read file:', error);
                alert('无法读取文件');
            }
        }
    }, [dirty]);

    const handleSaveFile = useCallback(async () => {
        const markdown = editorRef.current?.getMarkdown() || content;
        
        if (currentFile) {
            await saveMarkdownFile(markdown, currentFile.path);
            setDirty(false);
        } else {
            const savedFile = await saveMarkdownFile(markdown);
            if (savedFile) {
                setCurrentFile(savedFile);
                setDirty(false);
            }
        }
    }, [currentFile, content]);

    const handleSaveAs = useCallback(async () => {
        const markdown = editorRef.current?.getMarkdown() || content;
        const savedFile = await saveMarkdownFile(markdown);
        if (savedFile) {
            setCurrentFile(savedFile);
            setDirty(false);
        }
    }, [content]);

    const handleChange = useCallback(() => {
        setDirty(true);
    }, []);

    const handleTitleBarClick = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('menu-item')) {
            const action = target.dataset.action;
            switch (action) {
                case 'new':
                    handleNewFile();
                    break;
                case 'open':
                    handleOpenFile();
                    break;
                case 'save':
                    handleSaveFile();
                    break;
                case 'saveAs':
                    handleSaveAs();
                    break;
            }
        }
    }, [handleNewFile, handleOpenFile, handleSaveFile, handleSaveAs]);

    const fileName = currentFile?.name || 'Untitled';

    return (
        <div className="app-root">
            <header className="app-header" onClick={handleTitleBarClick}>
                <div className="menu-bar">
                    <div className="menu-item" data-action="new">新建</div>
                    <div className="menu-item" data-action="open">打开</div>
                    <div className="menu-item" data-action="save">保存</div>
                    <div className="menu-item" data-action="saveAs">另存为</div>
                </div>
                <div className="file-info">
                    <span className="file-name">{fileName}</span>
                    {dirty && <span className="dirty-indicator">● 未保存</span>}
                </div>
            </header>
            <main className="app-main">
                <Editor
                    ref={editorRef}
                    initialContent={content}
                    onChange={handleChange}
                />
            </main>
        </div>
    );
}

export default App;
