// 构建发布：读取 index.html，将 src/style.css 与 src/main.js 内联为单一 dist/word_rush.html。
// 用法：
//   npm run build          → 发布模式：JS 压缩+混淆（terser mangle）、CSS 压缩（clean-css）
//   npm run build:dev      → 开发模式：仅内联，不压缩不混淆（便于调试）
// ⚠ 仅替换精确匹配的标签，改动 index.html 中这两个标签会静默失败。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";
import CleanCSS from "clean-css";

const root = dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");

const rawJs = readFileSync(join(root, "src/main.js"), "utf8");
const rawCss = readFileSync(join(root, "src/style.css"), "utf8");

let jsCode = rawJs;
let cssCode = rawCss;

if (!dev) {
  // 1. CSS 压缩（level 1 保守优化：去空白/注释，避免激进合并影响主题变量）
  const css = new CleanCSS({ level: 1 }).minify(rawCss);
  if (css.errors.length) {
    console.error("❌ CSS 压缩失败:", css.errors);
    process.exit(1);
  }
  cssCode = css.styles;

  // 2. JS 压缩 + 混淆（mangle 局部变量/函数名；toplevel:false 保留顶层函数名，
  //    index.html 内联 onclick 依赖 go/openMode 等全局函数，混淆会使其失效）
  const js = await minify(rawJs, {
    compress: true,
    mangle: { toplevel: false },
    format: { comments: false },
  });
  if (!js.code) {
    console.error("❌ JS 压缩失败:", js.error);
    process.exit(1);
  }
  jsCode = js.code;
}

// 3. 内联进 index.html（标签模式与原脚本保持一致：href="src/style.css"、src="src/main.js"）
const html = readFileSync(join(root, "index.html"), "utf8")
  .replace(/<link[^>]*href="\/?src\/style\.css"[^>]*>/, () => `<style>\n${cssCode}\n</style>`)
  .replace(/<script src="\/?src\/main\.js"><\/script>/, () => `<script>\n${jsCode}\n</script>`);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/word_rush.html"), html, "utf8");

const kb = (n) => (n / 1024).toFixed(1) + "KB";
const out = Buffer.byteLength(html);
if (dev) {
  console.log(
    `✅ 开发模式构建完成 → dist/word_rush.html（未压缩，便于调试）\n` +
      `   总输出 ${kb(out)}`
  );
} else {
  console.log(
    `✅ 发布模式构建完成 → dist/word_rush.html（已压缩+混淆）\n` +
      `   main.js  ${kb(Buffer.byteLength(rawJs))} → ${kb(Buffer.byteLength(jsCode))}\n` +
      `   style.css ${kb(Buffer.byteLength(rawCss))} → ${kb(Buffer.byteLength(cssCode))}\n` +
      `   总输出 ${kb(out)}`
  );
}
