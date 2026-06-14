# Rustype

<img src="src-tauri/icons/128x128@2x.png" alt="Logo" width="128" height="128">

Lightweight & High-performance Markdown Desktop Editor

[中文 README](README.zh.md)

## Background

marktext delivers an outstanding real-time Markdown editing experience in the industry. Drawing on its well-polished Markdown interaction logic and editing capabilities as our functional baseline, this project features a full-stack technical architecture refactor, alongside a brand-new, independently redesigned overall user experience.

## Tech Stack

- Tauri
- React

## Features

### Lazy-loading Directory Tree
- Initially loads and displays only the root directory to avoid performance issues caused by loading deeply nested directories
- Child directory contents are loaded dynamically only when the user expands a directory
- Ideal for large projects or file structures with deep nesting

### OpenRecent
- Files and folders displayed in separate sections

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

Sincere gratitude to the open-source project [marktext](https://github.com/marktext/marktext). Its mature and complete Markdown editing implementation has offered invaluable ideas and inspiration for the design and development of this project.

## License

This project is licensed under the **Rustype Custom License (RPCL v1.0)**, which allows free use and modification of the source code, subject to the following restrictions:

- ❌ **Not allowed** to distribute derivative works on any app store
- ❌ **Not allowed** for commercial use (requires written authorization)
- ❌ **Not allowed** to use the "Rustype" name or related branding
- ✅ **Allowed** for personal and non-commercial use

For full license terms, see: [LICENSE](LICENSE)

For commercial licensing inquiries: `fuxing.zhang@qq.com`
