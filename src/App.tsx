import { useRef, useState } from 'react';
import Editor, { type EditorHandle } from './components/Editor';

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

    return (
        <div className="app-root">
            <header className="app-header">
                <h1 className="app-title">Rustype</h1>
                {dirty && <span className="dirty-indicator">● 未保存</span>}
            </header>
            <main className="app-main">
                <Editor
                    ref={editorRef}
                    initialContent={WELCOME_MARKDOWN}
                    onChange={() => setDirty(true)}
                />
            </main>
        </div>
    );
}

export default App;
