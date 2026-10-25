# AGENTS.md

WORD RUSH 单词快打 — TypeScript + vanilla DOM 的单页词汇打字游戏（多教材词库）。无前端框架，构建/开发用 Vite。源码是 `src/` 下的 **ES 模块（`.ts`）**，唯一入口 `src/main.ts` 按依赖序 import 全部模块；产物经内联后是**单个经典脚本**，因此 `file://` 双击即玩仍然成立。import 顺序是承载语义的（等价于原拼接执行序），不要随意调整。

## Commands

- `npm run dev` — Vite dev server（TS 即时转换 + HMR，端口 5173），无需构建即可开发调试
- `npm run build` — `vite build`：以 `index.html` 为入口打包（Rollup → 单 IIFE），terser 压缩+混淆（`mangle.toplevel:false`），CSS 压缩，再由内联插件产出单文件 `dist/word_rush.html`（gitignored）
- `npm run build:dev` — 同上但 `--minify false`（不压缩不混淆，便于调试产物）
- `npm run typecheck` — `tsc --noEmit`（strict）
- `npm test` — Vitest 单元测试（node 环境）
- `npm run smoke` — `vite build` + Playwright 冒烟（以 `file://` 加载产物，真实点击/键盘断言）
- `npm run bump <版本>` — 一条命令同步 `package.json` 版本号、`src/core/version.ts` 的 `APP_VERSION`、CHANGELOG 的 `[未发布]` 标题

## Architecture

- `index.html` — 页面骨架；交互**不再用内联 `onclick`**，统一为 `data-act="动作" data-args='[...]'`（由 `src/ui/events.ts` 委托分发到 `registerAct` 注册的处理函数）；脚本只有两个：`<script type="module" src="/src/main.ts">` 与 PeerJS 的 CDN 外链
- `vite.config.ts` — Vite 配置：dev server、生产构建（IIFE/单块/terser）、Vitest 配置
- `scripts/vite-plugin-singlefile.mjs` — 构建收尾插件（`enforce: 'post'`）：内联 JS/CSS → 脚本回迁 `</body>` 前 → 改名 `word_rush.html`，并做三项 fail 校验
- `src/main.ts` — 唯一入口，按依赖序 import（`boot.ts` 必须最后）
- 模块图（每个文件头部注释标注 职责/依赖/共享状态）：

| 文件 | 职责 |
|---|---|
| `src/core/version.ts` | 版本号与构建模式（`APP_VERSION`/`APP_BUILD`，单一数据源） |
| `src/core/utils.ts` | 工具 + 全局常量（`$`/`$$`/`rnd`/`pick`/`shuffle`/`escHtml`/`dataAct`/`P()`/`POS`/`LVN`/`K`） |
| `src/data/books.ts` | `BOOKS` 内置词库数据（人教版/外研版/新概念/KET/四六级） |
| `src/data/dynamic.ts` | 动态词库：`DYN_SOURCES`/CSV 解析/缓存/惰性加载/每日精练 |
| `src/data/index.ts` | `ALL`/`buildAll()`/`bookOf()` |
| `src/data/phrases.ts` | `PHRASES` 短语库 |
| `src/core/store.ts` | 存档：`def()`/`S`/`save()`/`mOf()` |
| `src/core/srs.ts` | SM-2 改进 SRS 算法/队列/权重池/迁移 IIFE |
| `src/core/stats.ts` | 等级/头衔/每日统计/掌握度分布 |
| `src/ui/render.ts` | `phLine`/`wordCard` 词卡渲染 |
| `src/ui/audio.ts` | WebAudio 音效（`beep`/`sTick`/`sOk`…）+ TTS `speak()` |
| `src/ui/shell.ts` | `go()` 切屏/`refreshHead()`/屏幕键盘 |
| `src/ui/fx.ts` | `toast`/`burst`/`floaty`/`coinBump` |
| `src/ui/events.ts` | `data-act` 中央事件委托（`registerAct`/`handleDataActClick`） |
| `src/screens/achievements.ts` | 成就/分享/`?challenge=` 自动开局 IIFE |
| `src/screens/home.ts` | 主页/动态词库面板/模态框/个人资料/错词本 |
| `src/screens/mode-select.ts` | `openMode` 模式设置弹窗 + `#goBtn` 分发 |
| `src/screens/about.ts` | 关于弹窗（版本号/构建模式/更新日志入口，`showAbout`） |
| `src/net/p2p.ts` | PeerJS 1v1 单挑 + 多人房间 + `?room=` IIFE（最大文件，~1200 行） |
| `src/game/core.ts` | 对局运行态 `G`（`setG()` 改写）/全局 keydown 路由/生命周期/HUD/道具 |
| `src/game/mode-run.ts` | 闯关/限时/复习/每日 |
| `src/game/mode-mem.ts` | 花瓣记忆 |
| `src/game/mode-fall.ts` | 陨石单词 |
| `src/game/mode-battle.ts` | 人机/同屏 2P |
| `src/screens/result.ts` | 五模式共用结算 `showResult` |
| `src/screens/book.ts` | 单词本 |
| `src/screens/table.ts` | 单词表 |
| `src/screens/stats.ts` | 学习数据 + Canvas 图表 |
| `src/screens/shop.ts` | 主题/道具商店 |
| `src/boot.ts` | 环境漂浮粒子 + 启动序列（`buildOsk`→`refreshHead`→curBook 兜底→填页脚版本→`renderHome`） |

- `src/style.css` (~2000 lines) — all styling; themes via `body[data-theme]` + CSS vars (`--c-y`, `--c-p`, ...). 尚未拆分（级联顺序敏感，收益低于 JS）
- Word data is **inline code** in the `BOOKS` array (`src/data/books.ts`), not external data files

## Critical quirks

- **真正的 ESM，不是经典脚本。** 跨模块引用一律走 `import`（`global.d.ts` 里没有 ambient `any` 兜底，`tsc` 会强制暴露遗漏的 import）。`G` 这类会被整体重新赋值的状态用 `export let` + `setG()` setter 改写；UI 动作靠 `registerAct(name, fn)` 注册，不要再往 `window` 上挂东西。
- **求值序仍是承载语义的。** `src/main.ts` 的 import 顺序等价于原来的脚本加载顺序，模块间存在循环依赖（`ui/shell ↔ game/core`、`screens/home ↔ game/core`、`game/mode-run ↔ screens/achievements`、`net/p2p ↔ game/core` 等），Rollup 的模块排序与 esbuild 拼接序不完全等价；顶层 IIFE（`srs.migrateMastery`、`achievements.checkChallenge`、`p2p.checkP2PInvite`、`boot` 粒子）对顺序敏感。改动入口顺序或新增顶层副作用后，**必须跑 `npm run smoke`** 回归。
- **构建校验是"响亮失败"的**（`scripts/vite-plugin-singlefile.mjs`）：① `APP_VERSION` 必须等于 `package.json` 的 `version`；② 孤儿文件检查——磁盘 `src/**/*.{ts,css}`（排除 `.d.ts`/`.test.ts`/`test-setup.ts`）必须都能从模块图或 `index.html` 引用到达；③ 产物终检——不得残留本地 `src/`、`/assets/`、`type="module"` 引用。任一不满足直接 `process.exit(1)`。
- **单文件产物的两个硬约束**：入口必须打成 IIFE（`rollupOptions.output.format: 'iife'` + `inlineDynamicImports`），内联后写成经典 `<script>`；且必须由插件回迁到 `</body>` 前——Vite 会把 `<script type="module">` 提到 `<head>`，若照抄成经典脚本会在 DOM 就绪前执行而崩溃。外链 CDN（PeerJS、Google Fonts）以 `https?:` 开头，插件会原样保留、不内联。
- **`APP_BUILD` 由构建模式决定**：`import.meta.env.PROD ? "release" : "dev"`（生产构建为 `release`，dev/`build:dev`/vitest 为 `dev`），不要再试图用正则替换产物字面量（压缩后顶层名会被改名）。
- **版本号同步用 `npm run bump <版本>`。** CI 分工：`release.yml`（标签触发，或 Actions 手动输入版本号）只建 Release 与单文件附件，`deploy.yml`（master push 触发）负责 Pages 部署——标签不触发部署，故同一提交只部署一次。
- **Obfuscation keeps property names.** terser runs with `mangle.toplevel: false` — `window.x` 属性名与 `registerAct` 的字符串键不受影响，只有函数内局部名被改名。
- **Built file is not fully offline.** Google Fonts and PeerJS (from `unpkg`) stay as external CDN refs in `dist/word_rush.html` — custom fonts and P2P 联机对战 need network at runtime.
- **Single global `keydown` listener** (`src/game/core.ts`). During gameplay every printable char routes through `routeChar(ch)` → per-mode handler by `G.type`. A new game mode must branch in `routeChar` and manage the `G` object. On the home screen, keys 1-9 select units. Input is ignored when focus is in `INPUT|SELECT|TEXTAREA` or when `modalOpen`/`!G.active`.
- **Persistence is manual.** State lives in localStorage under key `wordrush_v1` (`const K`, `src/core/utils.ts`), schema in `def()` (`src/core/store.ts`). Any mutation must call `save()` explicitly. Word mastery is keyed by `word.toLowerCase()` in `S.mastery` — renaming a word in `BOOKS` orphans its progress (there is no migration path).

## Word data format

- Unit words `w`: `en@中文@pos|en@中文@pos|...` (3 fields per entry)
- Unit phrases `p`: `en@中文|en@中文|...` (2 fields; rendered pos is forced to `"e"`)
- `@` and `|` are structural delimiters — never appear inside word/phrase text. `P()` (`src/core/utils.ts`) parses.
- Parsed into `it` objects `{en, cn, book, phrase, pos, ui, un, us}` appended to `BOOKS[].items` and `ALL` (parse loop in `src/data/index.ts`); `ALL` is the flat lookup list used by gameplay.

### 动态词库（DYN_SOURCES）

- Config is a code-only array `DYN_SOURCES` in `src/data/dynamic.ts`: one entry per source `{ id, name, color, url, ... }`. `url` is either an absolute `http(s)` URL or a root-relative path like `/vocab/x.csv`.
- CSV schema `word,phonetic,pos,definition,source` (header optional; positional fallback `en,phonetic,pos,cn,source`). Rows missing en/cn are skipped; cells containing `@`/`|` are skipped (structural delimiters). Words are chunked into units of **50** (`s: "U1"…`, `n: "1-50"…`).
- Loading is **lazy**, not a startup batch: `ensureDynLoaded(src)` (dedup via `dynLoadPromises`) fires from home tab render / 每日精练 / `#goBtn` (mode-select) / P2P 房主开局; per-source try/catch isolation — one failing source toasts `词库加载失败` and never blocks the others. `buildAll()` + `renderHome()` re-run after load so new books appear in tabs/dropdown/table automatically.
- Cache: per-source localStorage key `wordrush_dyn_<id>` storing `{ ts, text }`, TTL 24h (`DYN_TTL`). Fresh cache → no network fetch; stale/missing → fetch; fetch failure → stale-cache fallback with toast.
- **`id` 必须稳定** — renaming a source id orphans its `S.prog`/`S.mastery` progress (same rule as renaming a word in `BOOKS`; no migration path).
- `vocab/` 目录里的 CSV **不进打包**（运行时 `fetch`），部署时需与产物同目录（`deploy.yml` 在构建后 `cp -r vocab dist/vocab`）。`file://` 下 `fetch` 被浏览器禁止——动态词库须用 `npm run dev` 或部署到 http 服务。

## Conventions

- UI and code comments are Simplified Chinese — match the existing style.
- Screens are `<section id="scr-X" class="scr">` toggled via `go(id)`.
- Elements with a `data-t` attribute are clickable to read the word aloud (global click handler → `speak()`) — reuse for word pronunciation.
- 新增交互：模板里用 `dataAct("动作名", ...args)`，并在定义该函数的模块里 `registerAct("动作名", (el, ev, args) => fn(...args))`；不要写内联 `onclick`。
- 新模块 = 在对应域目录下新建 `.ts` + 中文头部注释（职责/依赖/共享状态）+ 在 `src/main.ts` 正确位置 import（漏了会被孤儿文件检查拦下）。注释用中文。
