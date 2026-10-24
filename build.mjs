// 构建发布：读取 index.html，将 src/ 下按序引用的 CSS/JS 模块内联为单一 dist/word_rush.html。
// 用法：
//   npm run build          → 发布模式：JS 压缩+混淆（terser mangle）、CSS 压缩（clean-css）
//   npm run build:dev      → 开发模式：仅内联，不压缩不混淆（便于调试）
// ⚠ index.html 中本地 script/link 标签的顺序即模块加载顺序（经典脚本共享全局作用域，
//   顶层 function 声明挂 window，供内联 onclick 调用；terser 以 mangle.toplevel:false 保留顶层名）。
// ⚠ 构建期执行多重校验，任何不一致直接报错退出，杜绝「改文件名/路径后静默产出坏包」：
//   ① index.html 引用顺序/内容 == EXPECTED_JS / EXPECTED_CSS 预期清单
//   ② 引用清单中的文件必须存在且非空
//   ③ src/ 磁盘上的 .js/.css 必须全部被引用（无孤儿文件）
//   ④ APP_VERSION（src/core/version.js）== package.json version（防版本漂移）；
//      发布构建自动将 APP_BUILD 置为 "release"
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";
import CleanCSS from "clean-css";

const root = dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");

// ── 预期模块清单（顺序即加载顺序，须与 index.html 标签顺序逐项一致） ──
const EXPECTED_JS = [
  // core：版本信息（无依赖，须最先）
  "src/core/version.js",
  // core：基础层
  "src/core/utils.js",
  // data：词库数据
  "src/data/books.js",
  "src/data/dynamic.js",
  "src/data/index.js",
  "src/data/phrases.js",
  // core：存档 / 算法 / 统计
  "src/core/store.js",
  "src/core/srs.js",
  "src/core/stats.js",
  // ui：渲染 / 音频 / 外壳 / 特效
  "src/ui/render.js",
  "src/ui/audio.js",
  "src/ui/shell.js",
  "src/ui/fx.js",
  // screens：成就 / 主页 / 模式设置
  "src/screens/achievements.js",
  "src/screens/home.js",
  "src/screens/mode-select.js",
  // screens：关于
  "src/screens/about.js",
  // net：P2P 联机
  "src/net/p2p.js",
  // game：对局核心 + 模式
  "src/game/core.js",
  "src/game/mode-run.js",
  "src/game/mode-mem.js",
  "src/game/mode-fall.js",
  "src/game/mode-battle.js",
  // screens：结算 / 单词本 / 单词表 / 学习数据 / 商店
  "src/screens/result.js",
  "src/screens/book.js",
  "src/screens/table.js",
  "src/screens/stats.js",
  "src/screens/shop.js",
  // boot：启动序列
  "src/boot.js",
];
const EXPECTED_CSS = ["src/style.css"];

const SCRIPT_RE = /<script src="(\/?src\/[^"]+\.js)"><\/script>/g;
const LINK_RE = /<link[^>]*href="(\/?src\/[^"]+\.css)"[^>]*>/g;

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

// 校验引用清单 == 预期清单，且与磁盘文件互为镜像
function validate(name, refs, expected, ext) {
  if (refs.length !== expected.length || refs.some((r, i) => r !== expected[i])) {
    fail(
      `${name} 引用顺序/内容与预期清单不符（新增/重命名/移动模块时必须同步更新 index.html 与 EXPECTED_${name}）：\n` +
        `    index.html 实际: ${JSON.stringify(refs)}\n` +
        `    预期清单      : ${JSON.stringify(expected)}`
    );
  }
  for (const f of refs) {
    if (!existsSync(join(root, f))) fail(`${name} 引用了不存在的文件：${f}`);
    else if (statSync(join(root, f)).size === 0) fail(`${name} 引用了空文件：${f}`);
  }
  const disk = walkSrc(join(root, "src"))
    .filter((f) => f.endsWith(ext))
    .sort();
  const orphans = disk.filter((f) => !refs.includes(f)).sort();
  if (orphans.length) {
    fail(
      `src/ 存在未被 index.html 引用的${name}文件（孤儿文件不会进入构建产物）：\n` +
        orphans.map((f) => `    ${f}`).join("\n") +
        `\n    请将其加入 index.html 与 EXPECTED_${name}，或移出 src/。`
    );
  }
}

// 将一组连续标签整体替换为一个内联块（保留首个标签出现位置，执行顺序不变）
function inlineRun(html, re, block) {
  const ms = [...html.matchAll(re)];
  if (!ms.length) fail("index.html 中未找到可内联的标签（检查标签格式是否被改动）");
  const start = ms[0].index;
  const end = ms[ms.length - 1].index + ms[ms.length - 1][0].length;
  return html.slice(0, start) + block + html.slice(end);
}

// ── 1. 收集 index.html 引用并三重校验 ──
let html = readFileSync(join(root, "index.html"), "utf8");
const jsRefs = [...html.matchAll(SCRIPT_RE)].map((m) => m[1].replace(/^\//, ""));
const cssRefs = [...html.matchAll(LINK_RE)].map((m) => m[1].replace(/^\//, ""));
validate("JS", jsRefs, EXPECTED_JS, ".js");
validate("CSS", cssRefs, EXPECTED_CSS, ".css");

// ── 2. 按序拼接各模块原文（每文件自带结尾换行，拼接结果即原单文件字节序） ──
const rawJs = jsRefs.map((f) => readFileSync(join(root, f), "utf8")).join("");
const rawCss = cssRefs.map((f) => readFileSync(join(root, f), "utf8")).join("");

// ── 2.5 版本一致性校验 + 构建模式标记 ──
// APP_VERSION（src/core/version.js）必须与 package.json version 一致，防文档/代码版本漂移
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const verMatch = rawJs.match(/const APP_VERSION = "([^"]+)"/);
if (!verMatch) fail("未找到 APP_VERSION 定义（应在 src/core/version.js）");
if (verMatch[1] !== pkg.version) {
  fail(
    `版本不一致：package.json 为 v${pkg.version}，src/core/version.js 的 APP_VERSION 为 v${verMatch[1]}——请同步后重新构建`
  );
}
// 发布构建把 APP_BUILD 标记为 release（开发模式保持 dev，关于弹窗据此展示构建模式）
const buildJs = dev
  ? rawJs
  : rawJs.replace(/const APP_BUILD = "dev";/, 'const APP_BUILD = "release";');
if (!dev && buildJs === rawJs) fail('未找到 APP_BUILD = "dev" 标记（src/core/version.js）');

let jsCode = buildJs;
let cssCode = rawCss;

if (!dev) {
  // 3. CSS 压缩（level 1 保守优化：去空白/注释，避免激进合并影响主题变量）
  const css = new CleanCSS({ level: 1 }).minify(rawCss);
  if (css.errors.length) {
    console.error("❌ CSS 压缩失败:", css.errors);
    process.exit(1);
  }
  cssCode = css.styles;

  // 4. JS 压缩 + 混淆（mangle 局部变量/函数名；toplevel:false 保留顶层函数名，
  //    index.html 内联 onclick 依赖 go/openMode 等全局函数，混淆会使其失效）
  const js = await minify(buildJs, {
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

// ── 5. 内联进 index.html（CSS 在 head，JS 在 body 末端，两处标签区间各自连续） ──
html = inlineRun(html, LINK_RE, `<style>\n${cssCode}\n</style>`);
html = inlineRun(html, SCRIPT_RE, `<script>\n${jsCode}\n</script>`);

// 6. 终检：不应再残留任何本地资源引用
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
      `   模块 ${jsRefs.length} 个 JS + ${cssRefs.length} 个 CSS，总输出 ${kb(out)}`
  );
} else {
  console.log(
    `✅ 发布模式构建完成 → dist/word_rush.html（已压缩+混淆）\n` +
      `   ${jsRefs.length} 个 JS 模块  ${kb(Buffer.byteLength(rawJs))} → ${kb(Buffer.byteLength(jsCode))}\n` +
      `   ${cssRefs.length} 个 CSS 模块 ${kb(Buffer.byteLength(rawCss))} → ${kb(Buffer.byteLength(cssCode))}\n` +
      `   总输出 ${kb(out)}`
  );
}
