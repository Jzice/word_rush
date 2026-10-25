/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Vite 仅作开发服务器（提供 TS 即时转换 / HMR）。
// 生产构建不走 Vite（由 build.mjs 自管单文件内联管线），故 build.rollupOptions 仅兜底。
export default defineConfig({
  root: ".",
  server: { open: true, port: 5173 },
  build: { rollupOptions: { input: "index.html" }, outDir: "dist-vite" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
  },
});
