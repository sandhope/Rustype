## Development

### Install Dependencies

```bash
npm install
```

### Run Tauri Development Mode

```bash
npm run tauri dev
```

### Build Desktop Application

```bash
npm run tauri build
```

## Application Icon

> https://v2.tauri.org.cn/develop/icons/

1. Prepare a transparent PNG image of 512x512 or 1024x1024, named as app-icon.png, and place it in the project root directory
2. Execute the command to generate all platform icons (the icons will overwrite src-tauri/icons folder)

```bash
npm run tauri icon app-icon.png

# if icon not updated
cd src-tauri
cargo clean
```