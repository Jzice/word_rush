# AGENTS.md

WORD RUSH 单词快打 — vanilla JS single-page vocabulary typing game (multiple school textbook 词库). No framework, no bundler, no tests. Source is split into domain modules under `src/` — **classic scripts sharing one global scope, not ES modules** (so `file://` 双击即玩 keeps working). Load order is load-bearing; never reorder.

## Commands

- `npm run dev` — `npx serve .` serves the repo root; `index.html` loads the 29 module scripts + `src/style.css` directly in order (no build needed to develop)
- `npm run build` — `node build.mjs` concatenates all `src/` JS/CSS modules (order from `index.html` tags) and inlines them into single `dist/word_rush.html` (gitignored), **minified + obfuscated** via terser (`mangle` local names) + clean-css
- `npm run build:dev` — same inlining **without** minification/obfuscation (debug-friendly; readable source in the bundle)
- No lint / typecheck / test scripts exist. Verify changes with `npm run build` + browser testing (e.g. Playwright) — nothing else validates the code.

## Architecture

- `index.html` — markup with inline `onclick` handlers (e.g. `go('scr-book')`, `openMode('time')`) that call **global** functions; script tags at the end of `<body>` load modules **in dependency order** (= original single-file line order)
- Module map (load order; each file header comment registers 职责/依赖/共享状态):

| 文件 | 职责 |
|---|---|
| `src/core/version.js` | 版本号与构建模式（`APP_VERSION`/`APP_BUILD`，单一数据源，须最先加载） |
| `src/core/utils.js` | 工具 + 全局常量（`$`/`$$`/`rnd`/`pick`/`shuffle`/`escHtml`/`P()`/`POS`/`LVN`/`K`） |
| `src/data/books.js` | `BOOKS` 内置词库数据（人教版/外研版/新概念/KET/四六级） |
| `src/data/dynamic.js` | 动态词库：`DYN_SOURCES`/CSV 解析/缓存/惰性加载/每日精练 |
| `src/data/index.js` | `ALL`/`buildAll()`/`bookOf()` |
| `src/data/phrases.js` | `PHRASES` 短语库 |
| `src/core/store.js` | 存档：`def()`/`S`/`save()`/`mOf()` |
| `src/core/srs.js` | SM-2 改进 SRS 算法/队列/权重池/迁移 IIFE |
| `src/core/stats.js` | 等级/头衔/每日统计/掌握度分布 |
| `src/ui/render.js` | `phLine`/`wordCard` 词卡渲染 |
| `src/ui/audio.js` | WebAudio 音效（`beep`/`sTick`/`sOk`…）+ TTS `speak()` |
| `src/ui/shell.js` | `go()` 切屏/`refreshHead()`/屏幕键盘 |
| `src/ui/fx.js` | `toast`/`burst`/`floaty`/`coinBump` |
| `src/screens/achievements.js` | 成就/分享/`?challenge=` 自动开局 IIFE |
| `src/screens/home.js` | 主页/动态词库面板/模态框/个人资料/错词本 |
| `src/screens/mode-select.js` | `openMode` 模式设置弹窗 + `#goBtn` 分发 |
| `src/screens/about.js` | 关于弹窗（版本号/构建模式/更新日志入口，`showAbout`） |
| `src/net/p2p.js` | PeerJS 1v1 单挑 + 多人房间 + `?room=` IIFE（最大文件，~1100 行） |
| `src/game/core.js` | 对局运行态 `G`/全局 keydown 路由/生命周期/HUD/道具 |
| `src/game/mode-run.js` | 闯关/限时/复习/每日 |
| `src/game/mode-mem.js` | 花瓣记忆 |
| `src/game/mode-fall.js` | 陨石单词 |
| `src/game/mode-battle.js` | 人机/同屏 2P |
| `src/screens/result.js` | 五模式共用结算 `showResult` |
| `src/screens/book.js` | 单词本 |
| `src/screens/table.js` | 单词表 |
| `src/screens/stats.js` | 学习数据 + Canvas 图表 |
| `src/screens/shop.js` | 主题/道具商店 |
| `src/boot.js` | 环境漂浮粒子 + 启动序列（`buildOsk`→`refreshHead`→curBook 兜底→填页脚版本→`renderHome`） |

- `src/style.css` (~2000 lines) — all styling; themes via `body[data-theme]` + CSS vars (`--c-y`, `--c-p`, ...). 尚未拆分（级联顺序敏感，收益低于 JS）
- Word data is **inline code** in the `BOOKS` array (`src/data/books.js`), not external data files

## Critical quirks

- **Classic scripts, not modules.** All modules share one global scope: top-level `function` declarations become globals usable from inline `onclick`; top-level `const`/`let` enter the global lexical environment and resolve **across files by load order**. Arrow functions referenced from `index.html` inline handlers MUST be explicitly attached: `window.foo = () => {...}` (see `window.useTheme`/`window.buyItem` in `src/screens/shop.js`). Do NOT convert to `type="module"` — it breaks `file://` double-click play.
- **Load order is load-bearing.** The 29-tag order in `index.html` equals the original single-file line order and `EXPECTED_JS` in `build.mjs` — all three must stay in sync. Top-level immediate code (IIFEs: `checkChallenge`, `checkP2PInvite`, ambient particles; DOM bindings; the boot sequence in `src/boot.js`) executes at its file's position in that order. Moving/renaming a file without updating both `index.html` and `build.mjs` fails the build loudly (see below) — never reorder declarations.
- **Build is manifest-validated, not silent.** `build.mjs` collects every `<script src="src/*.js">` / `<link href="src/*.css">` from `index.html` in order, concatenates them, then inlines into `dist/word_rush.html`. Before writing it runs three checks and **exits non-zero on any mismatch**: ① collected list === `EXPECTED_JS`/`EXPECTED_CSS` (order + content), ② every referenced file exists and is non-empty, ③ no orphan `.js`/`.css` left in `src/` unreferenced. Tag format must stay `<script src="src/....js"></script>` / `<link ... href="src/....css" ...>` (leading `/` tolerated).
- **版本号同步用 `npm run bump <版本>`。** 该脚本一条命令更新 `package.json` 的 `version`、`src/core/version.js` 的 `APP_VERSION`，并把 CHANGELOG 的 `[未发布]` 正名为新版本；`build.mjs` 仍校验两处一致（不一致直接失败）作为兜底。发版流程：`npm run bump x.y.z` → commit → `git tag -a vx.y.z` → push。CI 分工：`release.yml`（标签触发）只建 Release 与单文件附件，`deploy.yml`（master push 触发）负责 Pages 部署——标签不触发部署，故同一提交只部署一次。`APP_BUILD` 由发布构建自动置为 `"release"`（关于弹窗据此区分正式/开发构建），勿手改。
- **Obfuscation keeps top-level names.** terser runs with `mangle.toplevel: false` (default) — top-level `function` declarations and `window.x` property names are preserved so inline `onclick` keeps working. Only local names inside functions get mangled. If you ever add a script-level rename/obfuscation step, verify inline `onclick` handlers still resolve.
- **Built file is not fully offline.** Google Fonts and PeerJS (from `unpkg`) stay as external CDN refs in `dist/word_rush.html` — custom fonts and P2P 联机对战 need network at runtime.
- **Single global `keydown` listener** (`src/game/core.js:10`). During gameplay every printable char routes through `routeChar(ch)` → per-mode handler by `G.type`. A new game mode must branch in `routeChar` and manage the `G` object. On the home screen, keys 1-9 select units and r/w/m/t/f/b/l/p/s shortcut screens. Input is ignored when focus is in `INPUT|SELECT|TEXTAREA` or when `modalOpen`/`!G.active`.
- **Persistence is manual.** State lives in localStorage under key `wordrush_v1` (`const K`, `src/core/utils.js`), schema in `def()` (`src/core/store.js`). Any mutation must call `save()` explicitly. Word mastery is keyed by `word.toLowerCase()` in `S.mastery` — renaming a word in `BOOKS` orphans its progress (there is no migration path).

## Word data format

- Unit words `w`: `en@中文@pos|en@中文@pos|...` (3 fields per entry)
- Unit phrases `p`: `en@中文|en@中文|...` (2 fields; rendered pos is forced to `"e"`)
- `@` and `|` are structural delimiters — never appear inside word/phrase text. `P()` (`src/core/utils.js`) parses.
- Parsed into `it` objects `{en, cn, book, phrase, pos, ui, un, us}` appended to `BOOKS[].items` and `ALL` (parse loop in `src/data/index.js`); `ALL` is the flat lookup list used by gameplay.

### 动态词库（DYN_SOURCES）

- Config is a code-only array `DYN_SOURCES` in `src/data/dynamic.js` (after `BOOKS`): one entry per source `{ id, name, color, url }`. `url` is either an absolute `http(s)` URL (e.g. a Gitee-hosted CSV) or a server-relative path like `dict/x.csv`.
- CSV schema `word,phonetic,pos,definition,source` (header optional; positional fallback `en,phonetic,pos,cn,source`). Rows missing en/cn are skipped; cells containing `@`/`|` are skipped (structural delimiters). Words are chunked into units of **50** (`s: "U1"…`, `n: "1-50"…`).
- Loading is **lazy**, not a startup batch: `ensureDynLoaded(src)` (dedup via `dynLoadPromises`) fires from home tab render / 每日精练 / `#goBtn` (mode-select) / P2P 房主开局; per-source try/catch isolation — one failing source toasts `词库加载失败` and never blocks the others. `buildAll()` + `renderHome()` re-run after load so new books appear in tabs/dropdown/table automatically.
- Cache: per-source localStorage key `wordrush_dyn_<id>` storing `{ ts, text }`, TTL 24h (`DYN_TTL`). Fresh cache → no network fetch; stale/missing → fetch; fetch failure → stale-cache fallback with toast.
- **`id` 必须稳定** — renaming a source id orphans its `S.prog`/`S.mastery` progress (same rule as renaming a word in `BOOKS`; no migration path).
- `file://` 双击打开时 `fetch` 被浏览器禁止 — 动态词库须用 `npm run dev`/`npx serve` 或部署到 http 服务。Built `dist/word_rush.html` 需要把 `dict/` 放在其同目录部署（构建产物不打包 `dict/`）。

## Conventions

- UI and code comments are Simplified Chinese — match the existing style.
- Screens are `<section id="scr-X" class="scr">` toggled via `go(id)`; add new screens this way and reference them through globals.
- Elements with a `data-t` attribute are clickable to read the word aloud (global click handler → `speak()`) — reuse for word pronunciation.
- New module = new file in the right domain folder + Chinese header comment (职责/依赖/共享状态) + tag in `index.html` (correct position!) + entry in `EXPECTED_JS` (`build.mjs`). Keep files CRLF; comments in Chinese.
