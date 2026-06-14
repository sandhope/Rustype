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

## 添加 Tauri v2 签名配置（Updater + 平台签名）

### 第一步：生成 Updater 签名密钥（最重要，必做）

在项目根目录运行以下命令：

```bash
npx tauri signer generate -w ~/.tauri/rustype.key
```

- 会提示你输入密码（推荐设置一个强密码）。
- 生成后会得到两个文件：
  - `~/.tauri/rustype.key` → **私钥**（保密）
  - `~/.tauri/rustype.key.pub` → **公钥**（需要复制到配置中）

**复制公钥内容**（运行下面命令查看）：

```bash
cat ~/.tauri/rustype.key.pub
```

### 第二步：修改 `tauri.conf.json`

在 `plugins` 下面添加 updater 配置，并填入公钥：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "你的公钥内容（从 .key.pub 文件复制）",
      "endpoints": [
        "https://github.com/你的用户名/rustype/releases/latest/download/latest.json"
      ]
    }
  }
}
```

### 第三步：GitHub Secrets 设置（用于 CI 签名）

进入你的仓库 → **Settings → Secrets and variables → Actions → New repository secret**，添加以下两个：

1. **Name**: `TAURI_SIGNING_PRIVATE_KEY`  
   **Value**: 私钥文件全部内容（`cat ~/.tauri/rustype.key`）

2. **Name**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`  
   **Value**: 你刚才设置的密码（如果没设密码就留空）

### 第四步：更新 GitHub Workflow（推荐）

在 `.github/workflows/publish.yml` 的 `tauri-action` 步骤中加上环境变量：

```yaml
- uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
  with:
    tagName: app-v__VERSION__
    releaseName: 'App v__VERSION__'
    releaseBody: 'See the assets to download this version and install.'
    releaseDraft: true
    prerelease: false
    args: ${{ matrix.args }}
```

---

### windows 代码签名

> https://tauri.app/zh-cn/distribute/sign/windows

## 发布

### release 发布

```bash
release.sh
```

### tag 触发

```yml
on:
  push:
    tags:
      - 'app-v*'
```

```bash
git tag v1.0.0
git push origin v1.0.0
```
