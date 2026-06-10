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
