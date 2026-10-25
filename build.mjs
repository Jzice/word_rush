// 构建发布：把 ESM 入口（src/main.ts）→ esbuild 打包为单 IIFE，再与经典 script 标签（过渡期）
// 一并内联进 index.html，产出单文件 dist/word_rush.html。
// 用法：
//   npm run build        → 发布模式：JS 压缩+混淆（terser mangle.toplevel:false）、CSS 压缩（clean-css）
//   npm run build:dev    → 开发模式：仅内联，不压缩不混淆（便于调试）
// ⚠ 过渡期 index.html 同时含经典 <script src="src/*.js">（未迁移层）与 <script type="module" src="src/*.ts">
//   （已迁移层，最终态仅保留模块入口）；两者都内联进单文件，保持「按序拼接」的执行语义。
// ⚠ 保留原 build.mjs 的多重 fail 校验：引用文件存在/非空、孤儿文件检查（磁盘 − metafile − 经典引用）、
//   版本一致性（APP_VERSION == package.json）、APP_BUILD dev→release、产物无残留本地引用。
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";
import CleanCSS from "clean-css";
import { build } from "esbuild";

const root = dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");

const fail = (msg) => {
  console.error("❌ 构建中止：" + msg);
  process.exit(1);
};

// 递归列出 src/ 下所有文件（相对 root，统一 / 分隔）
function walkSrc(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkSrc(p));
    else out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
}

const SCRIPT_RE = /<script ((?:defer )?)src="(\/?src\/[^"]+\.js)"><\/script>/g; // 经典脚本（过渡期逐步移除）
const LINK_RE = /<link[^>]*href="(\/?src\/[^"]+\.css)"[^>]*>/g;
const MOD_RE = /<script type="module" src="(\/?src\/[^"]+\.ts)"><\/script>/g; // ESM 入口

let html = readFileSync(join(root, "index.html"), "utf8");
const jsRefs = [...html.matchAll(SCRIPT_RE)].map((m) => m[2].replace(/^\//, ""));
const cssRefs = [...html.matchAll(LINK_RE)].map((m) => m[1].replace(/^\//, ""));
const modRefs = [...html.matchAll(MOD_RE)].map((m) => m[1].replace(/^\//, ""));

// ① 经典引用必须存在且非空（模块入口由 esbuild 校验）
for (const f of [...jsRefs, ...cssRefs]) {
  if (!existsSync(join(root, f))) fail(`引用了不存在的文件：${f}`);
  if (statSync(join(root, f)).size === 0) fail(`引用了空文件：${f}`);
}

// ② esbuild 打包全部模块入口 → 单 IIFE + metafile（供孤儿校验）
let bundleCode = "";
const metaInputs = new Set();
if (modRefs.length) {
  const res = await build({
    entryPoints: modRefs.map((f) => join(root, f)),
    bundle: true,
    format: "iife",
    target: "es2020",
    treeShaking: false,
    write: false,
    metafile: true,
    legalComments: "none",
  });
  bundleCode = res.outputFiles[0].text;
  for (const k of Object.keys(res.metafile.inputs)) {
    metaInputs.add(k.split(sep).join("/").replace(/^\.\//, ""));
  }
}

// ③ 孤儿文件检查：磁盘 .ts/.js/.css −（metafile 输入 ∪ 经典引用）必须为空（排除 .d.ts / .test.ts）
const disk = walkSrc(join(root, "src"))
  .filter((f) => /\.(ts|js|css)$/.test(f))
  .filter((f) => !f.endsWith(".d.ts"))
  .filter((f) => !f.endsWith(".test.ts"))
  .filter((f) => !f.endsWith("test-setup.ts"));
const reachable = new Set([...metaInputs, ...jsRefs, ...cssRefs]);
const orphans = disk.filter((f) => !reachable.has(f)).sort();
if (orphans.length) {
  fail(
    `src/ 存在未纳入构建的文件（孤儿文件不会进入产物）：\n` +
      orphans.map((f) => `    ${f}`).join("\n") +
      `\n    请将其加入模块图（main.ts import）或 index.html 经典标签，或移出 src/。`
  );
}

const classicCodes = jsRefs.map((f) => readFileSync(join(root, f), "utf8"));

// ④ 版本一致性校验（APP_VERSION 为单一数据源，取自 src/core/version.ts 字面量；
//    esbuild 打包可能重命名顶层绑定，故不依赖打包产物里的变量名）
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const verSrc = readFileSync(join(root, "src/core/version.ts"), "utf8");
const verMatch = verSrc.match(/APP_VERSION\s*=\s*"([^"]+)"/);
if (!verMatch) fail("未找到 APP_VERSION 定义（应在 core/version）");
if (verMatch[1] !== pkg.version) {
  fail(
    `版本不一致：package.json 为 v${pkg.version}，APP_VERSION 为 v${verMatch[1]}——请同步后重新构建`
  );
}

// ── 内联（逐标签就地替换，从后往前保持索引有效；toBlock 可为异步，接收整段 match）──
async function inlineEach(re, toBlock) {
  const ms = [...html.matchAll(re)];
  let out = html;
  for (let i = ms.length - 1; i >= 0; i--) {
    const m = ms[i];
    const block = await toBlock(m);
    out = out.slice(0, m.index) + block + out.slice(m.index + m[0].length);
  }
  return out;
}

// 压缩单个 JS 文本（mangle.toplevel:false 保留 window 属性名，兜底内联事件移除后的全局调用）
async function minifyJs(code) {
  const js = await minify(code, {
    compress: true,
    mangle: { toplevel: false },
    format: { comments: false },
  });
  if (!js.code) {
    console.error("❌ JS 压缩失败:", js.error);
    process.exit(1);
  }
  return js.code;
}

// 经典脚本：保留 defer（若有）；按 dev 决定是否置 APP_BUILD=release + 压缩
const jsBlock = async (m) => {
  const def = /defer/.test(m[1] || "") ? " defer" : "";
  const rel = m[2].replace(/^\//, "");
  let code = readFileSync(join(root, rel), "utf8");
  if (!dev) code = await minifyJs(code);
  return `<script${def}>\n${code}\n</script>`;
};
html = await inlineEach(SCRIPT_RE, jsBlock);

// 模块入口：打包结果（已含全部模块；按 dev 决定是否置 release + 压缩）
// 注：esbuild 可能把顶层 APP_BUILD 重命名为 APP_BUILD2 等，故用 \w* 兼容
const modBlock = async () => {
  let code = bundleCode;
  if (!dev) {
    if (!/APP_BUILD\w*\s*=\s*"dev"/.test(code))
      fail('未找到 APP_BUILD = "dev" 标记（core/version）');
    code = code.replace(/(APP_BUILD\w*)\s*=\s*"dev"/, '$1 = "release"');
  } else if (!/APP_BUILD\w*\s*=\s*"dev"/.test(code))
    fail('未找到 APP_BUILD = "dev" 标记（core/version）');
  if (!dev) code = await minifyJs(code);
  return `<script>\n${code}\n</script>`;
};
html = await inlineEach(MOD_RE, modBlock);

// CSS：clean-css 压缩（level 1）
const cssBlock = () => {
  const raw = cssRefs.map((f) => readFileSync(join(root, f), "utf8")).join("");
  if (dev) return `<style>\n${raw}\n</style>`;
  const css = new CleanCSS({ level: 1 }).minify(raw);
  if (css.errors.length) {
    console.error("❌ CSS 压缩失败:", css.errors);
    process.exit(1);
  }
  return `<style>\n${css.styles}\n</style>`;
};
html = await inlineEach(LINK_RE, cssBlock);

// ⑤ 终检：不应再残留任何本地资源引用
if (/src="\/?src\//.test(html) || /href="\/?src\//.test(html)) {
  fail("产物中仍残留本地 script/link 引用，内联不完整");
}

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/word_rush.html"), html, "utf8");

const kb = (n) => (n / 1024).toFixed(1) + "KB";
const out = Buffer.byteLength(html);
if (dev) {
  console.log(
    `✅ 开发模式构建完成 → dist/word_rush.html（未压缩，便于调试）\n` +
      `   模块入口 ${modRefs.length} 个 + 经典脚本 ${jsRefs.length} 个 + CSS ${cssRefs.length} 个，总输出 ${kb(out)}`
  );
} else {
  console.log(
    `✅ 发布模式构建完成 → dist/word_rush.html（已压缩+混淆）\n` +
      `   模块入口 ${modRefs.length} 个 + 经典脚本 ${jsRefs.length} 个 + CSS ${cssRefs.length} 个，总输出 ${kb(out)}`
  );
}
