## 开发环境

### 安装依赖

```bash
npm install
```

### 启动 Tauri 开发模式

```bash
npm run tauri dev
```

### 构建桌面应用

```bash
npm run tauri build
```

### 打包特定平台

#### Windows
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

#### macOS
```bash
# Intel Mac
npm run tauri build -- --target x86_64-apple-darwin

# Apple Silicon (M1/M2)
npm run tauri build -- --target aarch64-apple-darwin

# 通用二进制（同时支持 Intel 和 Apple Silicon）
npm run tauri build -- --target universal-apple-darwin
```

#### Linux
```bash
# Debian/Ubuntu (.deb)
npm run tauri build -- --target x86_64-unknown-linux-gnu

# RPM (.rpm)
npm run tauri build -- --target x86_64-unknown-linux-gnu

# AppImage
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

> **注意：** 交叉编译需要在目标平台上进行，或使用相应的交叉编译工具链。建议在各自的目标操作系统上进行构建以获得最佳兼容性。

## 应用图标

> https://v2.tauri.org.cn/develop/icons/

1. 准备一张 512x512 或 1024x1024 的透明 PNG 图片，命名为 app-icon.png，放在项目根目录
2. 执行命令，自动生成所有平台所需的图标（会覆盖 src-tauri/icons 文件夹）

```bash
npm run tauri icon app-icon.png

# 如果图标未更新
cd src-tauri
cargo clean
```
