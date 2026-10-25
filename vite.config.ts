/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { singleFile } from "./scripts/vite-plugin-singlefile.mjs";

// Vite 同时承担开发服务器与生产构建：
//   npm run dev        → vite（TS 即时转换 / HMR）
//   npm run build      → vite build（生产模式：terser 压缩+混淆，CSS 压缩，内联为单文件）
//   npm run build:dev  → vite build --mode development --minify false（不压缩，便于调试）
// 单文件产物 dist/word_rush.html 由 scripts/vite-plugin-singlefile.mjs 收尾：
// 内联 JS/CSS、脚本回迁 </body> 前、改名输出，并保留原 build.mjs 的 fail-fast 校验。
export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    server: { open: true, port: 5173 },
    // 让 APP_BUILD 在「构建模式」而非「正则替换」下确定，dev/development 一律为 dev
    define: { "import.meta.env.PROD": JSON.stringify(!dev) },
    build: {
      target: "es2020",
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
      reportCompressedSize: false,
      cssCodeSplit: false, // 单文件产物：CSS 必须合并为一个
      modulePreload: false, // 无拆包，不需要 modulepreload
      minify: dev ? false : "terser",
      // 仅生产模式给 terser 配置（否则 Vite 会提示「未启用 terser」）
      terserOptions: dev
        ? undefined
        : {
            compress: true,
            mangle: { toplevel: false },
            format: { comments: false },
          },
      cssMinify: !dev,
      rollupOptions: {
        input: "index.html",
        // IIFE：内联后是经典脚本（file:// 双击即玩）；无动态 import，可直接单块输出
        output: { format: "iife", inlineDynamicImports: true },
      },
    },
    plugins: [singleFile({ dev })],
    test: {
      include: ["src/**/*.test.ts"],
      environment: "node",
      setupFiles: ["./src/test-setup.ts"],
    },
  };
});
