import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

const MUYA_SRC = path.resolve(__dirname, "src/muya/src");
const APP_NODE_MODULES = path.resolve(__dirname, "node_modules");

// Handle `?inline` CSS imports from muya source. Returns the CSS text as
// an ESM default export via a virtual module.
function muyaInlineCssPlugin() {
  const INLINE_KEY = "\0muya-inline:";
  const targets = new Map([
    [
      "github-markdown-css/github-markdown-light.css?inline",
      path.join(APP_NODE_MODULES, "github-markdown-css/github-markdown-light.css"),
    ],
    [
      "katex/dist/katex.css?inline",
      path.join(APP_NODE_MODULES, "katex/dist/katex.css"),
    ],
    [
      "prismjs/themes/prism.css?inline",
      path.join(APP_NODE_MODULES, "prismjs/themes/prism.css"),
    ],
  ]);

  return {
    name: "muya-inline-css",
    resolveId(id: string) {
      if (targets.has(id)) return INLINE_KEY + id;
      // Relative ?inline CSS from muya's own source (assets/styles/...)
      if (id.endsWith("?inline") && id.includes("src/muya")) {
        return INLINE_KEY + id;
      }
      return null;
    },
    load(id: string) {
      if (!id.startsWith(INLINE_KEY)) return null;
      const key = id.slice(INLINE_KEY.length);
      let filePath: string | undefined;
      if (targets.has(key)) {
        filePath = targets.get(key);
      } else if (key.endsWith("?inline")) {
        filePath = key.slice(0, -"?inline".length);
      }
      if (filePath && fs.existsSync(filePath)) {
        return "export default " + JSON.stringify(fs.readFileSync(filePath, "utf-8")) + ";";
      }
      return "export default \"\";";
    },
  };
}

// CommonJS deps that muya depends on (need pre-bundling)
const COMMONJS_DEPS = [
  "@floating-ui/dom",
  "@marktext/file-icons",
  "dompurify",
  "execall",
  "fast-diff",
  "flowchart.js",
  "fuse.js",
  "html-tags",
  "intl-segmenter-polyfill",
  "joplin-turndown-plugin-gfm",
  "katex",
  "marked",
  "marked-highlight",
  "mermaid",
  "ot-json1",
  "ot-text-unicode",
  "plantuml-encoder",
  "prismjs",
  "prismjs/components.js",
  "prismjs/dependencies",
  "rxjs",
  "snabbdom",
  "snabbdom-to-html",
  "snapsvg-cjs",
  "turndown",
  "underscore",
  "vega",
  "vega-embed",
  "vega-lite",
  "webfontloader",
];

export default defineConfig({
  plugins: [react(), muyaInlineCssPlugin()],

  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        useDefineForClassFields: true,
        experimentalDecorators: true,
        target: "es2022",
      },
    }),
  },

  resolve: {
    alias: {
      "@muyajs/core": MUYA_SRC,
    },
  },

  optimizeDeps: {
    entries: ["src/**/*.tsx", "src/**/*.ts"],
    include: COMMONJS_DEPS,
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || false,
    hmr: process.env.TAURI_DEV_HOST
      ? {
          protocol: "ws",
          host: process.env.TAURI_DEV_HOST,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
