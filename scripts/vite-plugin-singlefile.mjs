// 单文件构建插件：Vite/Rollup 产出（IIFE chunk + 独立 CSS）→ 全部内联进 HTML → dist/word_rush.html。
// 取代原 build.mjs 的收尾职责，并保留其全部 fail-fast 校验：
//   ① 版本一致性（APP_VERSION == package.json.version）
//   ② 孤儿文件检查（磁盘 src/**/*.{ts,css} − 模块图 − index.html 引用）
//   ③ 产物终检（不得残留本地 script/link 引用、不得有 type="module"）
// 关键细节：
//   · Vite 会把 <script type="module"> 提升到 <head>，内联成经典脚本后必须回迁到 </body> 前，
//     否则顶层代码（boot 的 $("#amb") 等）会在 DOM 就绪前执行而崩溃。
//   · 内联脚本必须是经典 <script>（非 type="module"），以保证 file:// 双击即玩。
//   · 外链 CDN（PeerJS、Google Fonts）以 https?: 开头，一律跳过、原样保留。
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (msg) => {
  console.error("❌ 构建中止：" + msg);
  process.exit(1);
};
const norm = (p) => p.split(sep).join("/");
const relOf = (absOrRel) => norm(relative(root, String(absOrRel).split("?")[0]));

// 递归列出目录下所有文件（相对 root，统一 / 分隔）
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(relOf(p));
  }
  return out;
}

// 本地（非 CDN）资源：src/href 以 http(s) 开头的一律不匹配（PeerJS、Google Fonts 原样保留）
const LOCAL_JS_TAG = () =>
  /<script[^>]+src="(?!https?:)[^"]+\.js"[^>]*>\s*<\/script>/g;
const LOCAL_CSS_TAG = () => /<link[^>]+href="(?!https?:)[^"]+\.css"[^>]*>/g;

export function singleFile({ dev = false, outFile = "word_rush.html" } = {}) {
  let outKb = "0",
    cssKb = "0";
  return {
    name: "word-rush-singlefile",
    apply: "build",
    // 必须在 vite:build-html 之后执行——HTML 资产由它生成，之后才能内联与改名
    enforce: "post",

    // ① 版本一致性：APP_VERSION 为单一数据源（取自 src/core/version.ts 字面量）
    buildStart() {
      const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
      const verSrc = readFileSync(join(root, "src/core/version.ts"), "utf8");
      const m = verSrc.match(/APP_VERSION\s*=\s*"([^"]+)"/);
      if (!m) fail("未找到 APP_VERSION 定义（应在 src/core/version.ts）");
      if (m[1] !== pkg.version) {
        fail(
          `版本不一致：package.json 为 v${pkg.version}，APP_VERSION 为 v${m[1]}——请同步后重新构建`
        );
      }
    },

    // ② 孤儿文件检查：磁盘 src/** −（Rollup 模块图 ∪ index.html 引用）必须为空
    buildEnd() {
      const reachable = new Set();
      for (const id of this.getModuleIds()) reachable.add(relOf(id));
      const html = readFileSync(join(root, "index.html"), "utf8");
      for (const m of html.matchAll(/(?:src|href)="\/?(src\/[^"]+)"/g))
        reachable.add(m[1]);

      const disk = walk(join(root, "src"))
        .filter((f) => /\.(ts|css)$/.test(f))
        .filter((f) => !f.endsWith(".d.ts"))
        .filter((f) => !f.endsWith(".test.ts"))
        .filter((f) => !f.endsWith("test-setup.ts"));
      const orphans = disk.filter((f) => !reachable.has(f)).sort();
      if (orphans.length) {
        fail(
          `src/ 存在未纳入构建的文件（孤儿文件不会进入产物）：\n` +
            orphans.map((f) => `    ${f}`).join("\n") +
            `\n    请将其加入模块图（src/main.ts import）或 index.html 引用，或移出 src/。`
        );
      }
    },

    // ③ 内联 JS/CSS → 单文件，并改名输出
    generateBundle(_opts, bundle) {
      const htmlKey = Object.keys(bundle).find((k) => k.endsWith(".html"));
      if (!htmlKey) fail("未找到 HTML 产物（Vite 未从 index.html 构建？）");
      const jsKey = Object.keys(bundle).find(
        (k) => bundle[k].type === "chunk" && bundle[k].isEntry
      );
      if (!jsKey) fail("未找到入口 JS chunk（应为 IIFE，供内联为经典脚本）");
      const cssKey = Object.keys(bundle).find((k) => k.endsWith(".css"));

      let html = bundle[htmlKey].source.toString();
      // </script 出现在 JS 字符串里会提前闭合标签，统一转义（JS 中 "\/" 等价 "/"）
      const js = bundle[jsKey].code.replace(/<\/script/gi, "<\\/script");
      const css = cssKey ? String(bundle[cssKey].source) : "";

      // CSS：就地替换为 <style>（保持在 <head>，级联顺序不变）
      html = html.replace(LOCAL_CSS_TAG(), () => `<style>\n${css}\n</style>`);
      // JS：先摘掉 Vite 注入的入口脚本标签（可能在 <head>），再回迁到 </body> 前
      html = html.replace(LOCAL_JS_TAG(), "");
      if (!/<\/body>/i.test(html)) fail("HTML 产物缺少 </body>，无法回迁内联脚本");
      html = html.replace(/<\/body>/i, `<script>\n${js}\n</script>\n</body>`);

      // 产物终检：不应残留任何本地资源引用，也不应是 module 脚本
      if (LOCAL_JS_TAG().test(html) || LOCAL_CSS_TAG().test(html))
        fail("产物中仍残留本地 script/link 引用，内联不完整");
      if (/type="module"/.test(html)) fail("产物中仍有 type=\"module\" 脚本（file:// 下不可用）");
      if (/src="\/?src\/|href="\/?src\//.test(html))
        fail("产物中仍残留 src/ 本地引用，内联不完整");

      // 被内联的 chunk/asset 不再落盘；HTML 改名输出
      delete bundle[htmlKey];
      delete bundle[jsKey];
      if (cssKey) delete bundle[cssKey];
      this.emitFile({ type: "asset", fileName: outFile, source: html });

      outKb = (Buffer.byteLength(html) / 1024).toFixed(1);
      cssKb = (Buffer.byteLength(css) / 1024).toFixed(1);
    },

    writeBundle() {
      console.log(
        dev
          ? `✅ 开发模式构建完成 → dist/${outFile}（未压缩，便于调试）`
          : `✅ 发布模式构建完成 → dist/${outFile}（已压缩+混淆）`
      );
      console.log(
        `   单文件输出 ${outKb}KB（含内联 CSS ${cssKb}KB），无外部本地依赖`
      );
    },
  };
}
