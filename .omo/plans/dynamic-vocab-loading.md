# dynamic-vocab-loading - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** 单词快打可以配一个"动态词库源"列表（放在代码顶部的配置数组里）：每个源可以是一个网页链接（比如你的 Gitee 上的中考/四级 CSV 词表）或服务器上 `dict/` 目录里的本地 CSV 文件。启动游戏时自动拉取这些词表，解析后作为新的"词书"出现在主页、词书下拉和词表里，可以正常逐单元闯关、记掌握度。网络失败时先用 24 小时内的本地缓存，缓存也没有就只提示一声并跳过该源，其它词书不受影响。

**Why this approach:** 你的两个候选词表（中考、四级）都是扁平 CSV，而游戏现有的关卡进度、星级、掌握度机制全部建立在"词书→单元"结构上，所以最稳的做法是把词表按 50 词切开放进现有结构，而不是为它们新造一套玩法。所有界面本来就是遍历词书数组动态渲染的，所以只要在加载完成后重建一次全局词表并刷新主页，新词书就会自动出现在全部 5 种玩法、单词本、词表和 P2P 里——不用逐个改界面。

**What it will NOT do:** 不会删除任何内置词书；不会新增游戏内设置界面；不会支持 JSON 等其它格式；不会把 `dict/` 文件打包进构建产物（它们运行时从旁边加载）；不会迁移或修复旧的掌握度数据。

**Effort:** Medium
**Risk:** Medium - 远程词表是外部网络依赖（你的四级词表地址在部分地区可能被墙/拦，实测返回 451），只能靠缓存+降级兜底，不能保证"每次都能拉到最新"
**Decisions to sanity-check:** ① 缓存策略：24h 内直接用缓存、不访问网络（你选的，意味着词库更新最多延迟 24 小时）；② 一个 CSV 文件 = 一本书，按 50 词切单元（你选的）；③ 动态书排序在所有内置书之后；④ 配置只支持"代码数组"，不做设置界面（你选的）。

Your next move: approve, or run a high-accuracy review. Full execution detail follows below.

---

> TL;DR (machine): Medium effort, Medium risk (remote CSV is an external network dep with a 451-observed source); deliverables = DYN_SOURCES config + CSV pipeline + 24h TTL localStorage cache + buildAll extraction + dynamic render refresh + docs, all inside src/main.js (single-file constraint), verified by build + Playwright.

## Scope
### Must have
- `DYN_SOURCES` declarative array in `src/main.js` (one entry per source: `{ id, name, color, url }`), where `url` is either an absolute `http(s)` URL (Gitee CSV) or a server-relative path (`dict/x.csv`).
- Robust CSV parser: UTF-8 BOM strip, CRLF/LF normalisation, quoted fields (`"a, b"`), escaped quotes (`""`), header sniffing (drop a `word|headword|词汇|单词` header row; otherwise positional columns), 5-column schema `word,phonetic,pos,definition,source`.
- Row transform: `cleanHeadword()` strips trailing irregular-form parentheticals (`begin(began,begun)` → `begin`); `mapPos()` maps CSV pos strings to the existing POS codes (`n/a/v/d/p/c/r/t/i/e`, `src/main.js:29-41`); default `n` when pos empty; rows missing en or cn are skipped; any cell containing the structural delimiters `@`/`|` is skipped.
- Chunking: flat list → units of **50** words per unit, `s: "U1"…`, `n: "1-50"…` (auto-serial + 1-based word range), `w:` built in the existing `en@中文@pos|…` format so the existing item builder consumes it unchanged.
- `buildAll()` extraction: the ALL-building loop (`src/main.js:576-601`) becomes a reusable function; `ALL` becomes `let`; called once at load and again after each dynamic load batch.
- `loadDynamicBooks()` orchestration: per-source try/catch isolation (one failing 451/404 source never blocks or crashes the others), replace-if-exists by stable id (reloads don't duplicate books), `toast()` on failure, startup wiring after first `renderHome()` at end of file.
- Cache: per-source localStorage keys `wordrush_dyn_<id>` storing `{ ts, text }`, TTL 24h (`DYN_TTL`), quota-safe writes, stale-cache fallback + toast on fetch failure.
- UI refresh: after a load batch, `buildAll()` + `renderHome()` so tabs/units/start-button reflect new books; fix stale literal `全部词书（9册）` (`src/main.js:3947`) to a dynamic count.
- Docs: AGENTS.md + README section documenting DYN_SOURCES format, CSV schema, `dict/` deployment, `file://` limitation, and the stable-id/rename-orphans-progress warning.
- Verification: `npm run build` + `npm run build:dev` smoke, Playwright QA (happy path + failure path + cache fallback + TTL), browser-console parser assertions.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO removal/replacement/editing of any of the 14 built-in books' word data (`src/main.js:45-574`).
- NO new `<section>`/settings screen/UI for editing sources — config is code-only.
- NO support for JSON/XLSX/other formats — CSV only.
- NO directory-listing auto-discovery of `dict/` — only URLs listed in `DYN_SOURCES`.
- NO bundling of `dict/` into `dist/` — built file loads them at runtime from next to itself.
- NO new `window.*` globals or inline onclick changes — dynamic books reuse existing `pickBook`/`clickLv`/`startLevel`/`openMode`/`go`.
- NO top-level `await` (file is a classic script, not a module — top-level await would throw in older browsers and confuses the modern parser); async work starts from an async function call at the tail.
- NO changing `index.html` tags or `build.mjs` regex targets (build breaks silently otherwise).
- NO mastery/progress migration; NO new test framework or bundler.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: **tests-after** — the repo has no test runner (AGENTS.md: "No lint / typecheck / test scripts exist. Verify changes with npm run build + browser testing"). Do NOT add a test framework. Parser correctness is asserted via the browser console: top-level `function` declarations become globals, so `parseCsv`/`cleanHeadword`/`mapPos`/`csvToUnits` are reachable from `page.evaluate`.
- Tooling: Playwright (agent browser) against `npx serve .` (npm run dev, source mode) and against `dist/word_rush.html` (built mode); `npm run build` + `npm run build:dev` for build smoke; grep checks on `dist/word_rush.html`.
- Evidence: `.omo/evidence/dynamic-vocab-loading/task-<N>-dynamic-vocab-loading.<ext>` (no ulw-loop in this repo — use the plain `.omo/evidence/` dir). Screenshots + console logs + page.evaluate output committed to that dir.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

- **Wave 1** — T1 (buildAll extraction + stale-literal fix). Pure refactor, zero behavior change; commit immediately so the diff stays reviewable.
- **Wave 2** — T2 (CSV pipeline: parser + transform + chunking) and T3 (cache layer). Same file, disjoint regions; the executor does them in one session sequentially (no parallel subagents editing `main.js` — single-file constraint forbids concurrent edits).
- **Wave 3** — T4 (loadDynamicBooks + startup wiring + per-source isolation + UI refresh). Depends on T2+T3 (and T1 for buildAll availability).
- **Wave 4** — T5 (end-to-end Playwright QA of happy/failure/cache/TTL flows + build smoke + dist greps). Depends on T4.
- **Wave 5** — T6 (AGENTS.md + README docs). Can run in parallel with T5 in principle; keep sequential for a single-editor repo.

All source changes are edits to ONE file (`src/main.js`) — never dispatch parallel agents to edit it concurrently. Parallelisation applies only to read-only tasks (QA prep, dist inspection).

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1 buildAll extraction | — | T4 | — (single-file repo) |
| T2 CSV pipeline + DYN_SOURCES | — | T4 | — (same file as T1, sequential session) |
| T3 cache layer | T2 | T4 | — |
| T4 loadDynamicBooks + startup + refresh | T1+T2+T3 | T5 | — |
| T5 QA + build smoke + dist greps | T4 | — | T6 (read-only QA vs docs, keep sequential) |
| T6 docs | T4 | — | T5 |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 1. Extract `buildAll()` from the inline ALL builder; fix stale book-count literal
  What to do: Replace the block at `src/main.js:576-601` (`const ALL = [];` + `BOOKS.forEach(...)`) with:
  ```js
  const bookOf = (id) => BOOKS.find(b => b.id === id);
  let ALL = [];
  function buildAll() {
    ALL = [];
    BOOKS.forEach((b) => {
      b.items = [];
      b.units.forEach((u, ui) => {
        u.s = u.s || "U" + (ui + 1);
        const add = (arr, phrase) => {
          arr.forEach(([en, cn, pos]) => {
            const it = { en, cn, book: b.id, phrase, pos: phrase ? "e" : pos || "n", ui, un: u.n, us: u.s };
            b.items.push(it);
            ALL.push(it);
          });
        };
        add(P(u.w), false);
        if (u.p) add(P(u.p), true);
      });
    });
  }
  buildAll();
  ```
  Move `bookOf` above `buildAll` (or leave it where it is at line 602 — the three lines 602 + new defs must all be top-level; simplest is keep the `bookOf` line where it is and place `let ALL`/`buildAll`/`buildAll()` between line 601 and 602). MUST NOT change item shape, dedup semantics, or `u.s` auto-assignment. Also change `src/main.js:3947` from `<option value="all">全部词书（9册）</option>` to `<option value="all">全部词书（${BOOKS.length}册）</option>` — this literal becomes wrong the moment dynamic books exist.
  Parallelization: Wave 1 | Blocked by: — | Blocks: T4
  References (executor has NO interview context - be exhaustive): `src/main.js:576-602` (ALL builder + bookOf), `src/main.js:3945-3948` (renderBook dropdown literal), `src/main.js:29-42` (POS/posCls stay untouched)
  Acceptance criteria (agent-executable): `npm run build:dev` succeeds; `node -e` check or browser console: `window.ALL.length > 0` after load; `ALL.length` in-built === same value as before the change (run once against git stash or just eyeball: 中考-style deep compare not required — assert `ALL.length` is non-zero and `BOOKS.every(b=>b.items.length>0)`).
  QA scenarios: Playwright page.evaluate: `(() => ({all: ALL.length, books: BOOKS.map(b=>[b.id,b.items.length])}))()` — all 14 built-in books present with items; `#bkBook` options include `全部词书（14册）` (built-ins only, pre-dynamic). Evidence `.omo/evidence/dynamic-vocab-loading/task-1-dynamic-vocab-loading.json`
  Commit: Y | `refactor(main): extract buildAll() and fix stale book-count literal`

- [x] 2. Add `DYN_SOURCES` config + CSV pipeline (`parseCsv`, `cleanHeadword`, `mapPos`, `csvToUnits`)
  What to do: Insert directly after `src/main.js:574` (end of BOOKS, before the `/* ===== 构建全局词库 ===== */` comment):
  ```js
  /* ================= 动态词库配置（URL 或服务器相对路径，如 dict/x.csv） ================= */
  const DYN_TTL = 864e5; // 缓存 24 小时
  const DYN_SOURCES = [
    { id: "kzc", name: "中考词汇", color: "#5b9bd5", url: "https://raw.giteeusercontent.com/justice/english-wordlists/raw/master/中考英语词汇表.csv" },
    { id: "cet4", name: "四级词汇", color: "#ed7d31", url: "https://gitee.com/justice/english-wordlists/raw/master/CET4_edited.csv" },
  ];
  ```
  Add top-level functions (classic script — top-level `function` declarations become globals, which is what makes console assertions work; do NOT use arrow-const for these, use `function` declarations):
  - `parseCsv(text)` → `Array<string[]>`: strip leading `\uFEFF`; normalize `\r\n|\r` → `\n`; drop trailing empty line. State-machine scan: field start — if next char is `"`, read quoted field until closing `"` (a `""` inside means a literal quote); else read until `,` or `\n`. Empty input → `[]` (never null).
  - `cleanHeadword(w)` → string: `let s = w.trim(); s = s.replace(/\s*\([^()]*\)\s*$/, ""); return s.trim() || w.trim();` (strips ONE trailing parenthetical; `begin(began,begun)` → `begin`; if result empty, return original).
  - `mapPos(p)` → one of `n|v|a|d|p|c|r|t|i|e`: lowercase/trim; take first token split on `/` or `&`; map aliases: `n|n.`→n, `a|a.|adj|adj.`→a, `ad|ad.|adv|adv.`→d, `v|v.|vt|vt.|vi|vi.|aux|aux.|modal|modal.`→v, `prep|prep.`→p, `conj|conj.`→c, `pron|pron.`→r, `num|num.`→t, `int|int.|interj|interj.`→i, `phr|phr.|phrase`→e; anything else (incl. empty) → `n`.
  - `csvToUnits(text, { chunk = 50 } = {})` → `Array<{s,n,w}>`: rows = parseCsv(text); header sniff — if `rows[0]?.[0]` matches `/^(word|headword|词汇|单词)(\s|$)/i` then shift the header row and map column indexes from it (word/headword → en index, pos → pos index, definition|meaning|释义|中文 → cn index, phonetic → phonetic index; missing names → positional fallback), else positional `[0,1,2,3,4]` (en, phonetic, pos, cn, source). Per row: `en = cleanHeadword(row[wi])`, `cn = (row[di]||"").trim()`, skip when `!en || !cn`; skip (with a single batched `console.warn`) any row where en or cn contains `@` or `|` (structural delimiters, AGENTS.md invariant). Build `[en, cn, pos]` triples with `pos = mapPos(row[pi])`; chunk into units of 50: for chunk k, `s: "U"+(k+1)`, `n: ((k*50)+1) + "-" + Math.min((k+1)*50, triples.length)`, `w: chunk.map(t => t.join("@")).join("|")`. Return `[]` if no valid rows.
  MUST NOT: mutate BOOKS/ALL here (pure functions only); no `await` anywhere in these.
  Parallelization: Wave 2 | Blocked by: — | Blocks: T3, T4
  References (executor has NO interview context - be exhaustive): `src/main.js:26` (`P()` split format the `w` string must match), `src/main.js:580-599` (item builder consumes `u.w` via `P(u.w)` + `[en,cn,pos]` triples — the CSV `w` string MUST produce identical triple shape), `src/main.js:29-41` (POS codes + labels), CSV samples: `https://raw.giteeusercontent.com/justice/english-wordlists/raw/master/中考英语词汇表.csv` (HTTP 200 verified; header `word,phonetic,pos,definition,source`; quoted commas; `begin(began,begun)`; empty pos rows; duplicated headwords like `be` — all must survive)
  Acceptance criteria (agent-executable): browser console `page.evaluate` on the dev server:
  - `parseCsv('a,b,"c,d","e""f"\n1,2,3,4')` → 2 rows, first row `["a","b","c,d","e\"f"]`
  - `parseCsv('\uFEFFw,ph,pos,def,src\nx,y,z,q,s')` → rows length 2 (BOM stripped)
  - `cleanHeadword("begin(began,begun)")` === `"begin"`; `cleanHeadword("cat")` === `"cat"`
  - `mapPos("vt.")` === `"v"`; `mapPos("prep./ad.")` === `"p"`; `mapPos("adj")` === `"a"`; `mapPos("")` === `"n"`
  - `csvToUnits('word,phonetic,pos,definition,source\nbegin(began,begun),bɪˈɡɪn,v.,开始,着手\ncat,,n.,猫,\ncustom,,a.,"custom, made",\n')` → 1 unit, `u.s==="U1"`, `u.n==="1-50"` (fewer than 50… NOTE: chunk label uses min with length — assert `u.n` is `"1-3"` here), `u.w.split("|")[0]==="begin@开始@v"`
  - `csvToUnits('a,b,c\nx,y,z')` (no header) → 1 unit, first triple en=`a`, cn=`c` (positional: index0 en, index2 cn, index1 phonetic dropped) → `u.w==="a@c@n"`
  Run with Playwright `npx playwright` — the `webapp-testing` skill (Playwright MCP) is the sanctioned driver. Evidence `.omo/evidence/dynamic-vocab-loading/task-2-dynamic-vocab-loading.json`
  Commit: Y | `feat(main): add dynamic CSV word-source pipeline (DYN_SOURCES, parseCsv, csvToUnits)`

- [x] 3. Add per-source localStorage cache with 24h TTL
  What to do: Add two top-level `function` declarations (near the DYN_SOURCES block, after the pipeline functions):
  ```js
  const dynKey = (id) => "wordrush_dyn_" + id;
  function dynCacheGet(id) {
    try { return JSON.parse(localStorage.getItem(dynKey(id)) || "null"); } catch (e) { return null; }
  }
  function dynCacheSet(id, text) {
    try { localStorage.setItem(dynKey(id), JSON.stringify({ ts: Date.now(), text })); } catch (e) { console.warn("缓存写入失败(空间不足?)", e); }
  }
  ```
  Semantics (used by T4): a cache entry counts as FRESH when `entry && Date.now() - entry.ts < DYN_TTL` → use it instead of fetching (user decision: TTL 缓存优先). A STALE entry (`ts` older than TTL) is not trusted for the "use cache first" branch but IS the error fallback. MUST NOT: store cache inside `S`/`wordrush_v1` (keep the save blob schema untouched — no def() change, no save() change); no TTL check inside these helpers (do it in T4's load path).
  Parallelization: Wave 2 | Blocked by: T2 (uses dynKey naming convention) | Blocks: T4
  References (executor has NO interview context - be exhaustive): `src/main.js:27` (`K` — the existing save key pattern `wordrush_v1`); `src/main.js:1110-1114` (existing quota-safe save() try/catch to mirror); `src/main.js:1058` (`const DUE = [0, 20*6e4, ...]` — precedent for ms constants; place DYN_TTL next to DYN_SOURCES)
  Acceptance criteria (agent-executable): browser console: `dynCacheSet("test", "abc"); JSON.parse(localStorage.getItem("wordrush_dyn_test")).text === "abc"`; `dynCacheGet("test").text === "abc"`; `localStorage.setItem("wordrush_dyn_test", "garbage"); dynCacheGet("test") === null` (parse-failure safe). Clean up the test key afterwards. Evidence `.omo/evidence/dynamic-vocab-loading/task-3-dynamic-vocab-loading.json`
  Commit: Y (fold into the feat commit of T4's parent — no, commit separately: `feat(main): add per-source TTL cache for dynamic word lists`)

- [x] 4. Implement `loadDynamicBooks()` orchestration + startup wiring + UI refresh
  What to do: Add these top-level functions after the cache layer:
  ```js
  async function applyDynamicBook(src) {
    let text = null, fromCache = false;
    const c = dynCacheGet(src.id);
    if (c && Date.now() - c.ts < DYN_TTL) { text = c.text; fromCache = true; }
    else {
      try {
        const res = await fetch(src.url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        text = await res.text();
        dynCacheSet(src.id, text);
      } catch (e) {
        if (c && c.text) { text = c.text; fromCache = true; toast("⚠️ 词库加载失败：" + src.name + "，已使用缓存"); }
        else { toast("⚠️ 词库加载失败：" + src.name + "（可稍后刷新重试）"); return; }
      }
    }
    const units = csvToUnits(text);
    if (!units.length) { toast("⚠️ 词库解析为空：" + src.name); return; }
    const i = BOOKS.findIndex((b) => b.id === src.id);
    if (i >= 0) BOOKS.splice(i, 1);
    BOOKS.push({ id: src.id, stage: "动态词库", name: src.name, color: src.color, units });
    if (fromCache) toast("📖 " + src.name + "（缓存）");
  }
  async function loadDynamicBooks() {
    if (!DYN_SOURCES.length) return;
    await Promise.all(DYN_SOURCES.map((src) => applyDynamicBook(src).catch((e) => {
      console.error("动态词库加载异常", src.id, e);
      toast("⚠️ 词库加载失败：" + src.name);
    })));
    buildAll();
    if (!bookOf(S.curBook)) { S.curBook = "j1"; save(); }  // curBook 指向了失败的动态书 → 兜底回第 1 册
    renderHome();
  }
  ```
  Startup wiring: at file tail `src/main.js:4247-4249` change `buildOsk(); refreshHead(); renderHome();` to add `loadDynamicBooks();` after `renderHome()`. MUST NOT `await` it at top level (classic script); MUST NOT call `save()` for cache/BOOKS changes (S untouched except the curBook-fallback line); MUST NOT block first paint (fetch happens after first render).
  MUST NOT: `loadDynamicBooks` runs once at startup only — no interval, no manual retry button, no settings UI; stale `S.curBook` fallback ONLY reassigns when the current book id no longer exists.
  Parallelization: Wave 3 | Blocked by: T1, T2, T3 | Blocks: T5, T6
  References (executor has NO interview context - be exhaustive): `src/main.js:1360-1369` (`go()` — re-renders scr-book/scr-table lazily on navigation; home re-rendered explicitly here), `src/main.js:1590-1662` (renderHome maps BOOKS for tabs + `lvMap` + `btnStart` — no change needed), `src/main.js:1862` (mode pool `sel.book === "mix" ? ALL : bookOf(sel.book).items` — works automatically after buildAll), `src/main.js:2908-2921` (startLevel filters `b.items` by `it.ui` — works for chunked dynamic units), `src/main.js:4067-4077` (renderTable tabs map BOOKS), `src/main.js:3945-3956` (renderBook dropdown maps BOOKS + achGrid), `src/main.js:1370-1380` (toast signature `toast(html, sub?)`)
  Acceptance criteria (agent-executable): dev server + Playwright: within ~10s of load, `#bkTabs` contains `中考词汇` AND `四级词汇` tab buttons (kzc succeeds via HTTP 200; cet4 may fail with 451 in some networks — if it fails, assert the toast appears and the app still shows 中考词汇 + all 14 built-ins; this is an ACCEPT state either way because the whole point is per-source isolation). `S.curBook` fallback check: with `S.curBook` manually set to `"cet4"` and cet4 failing, after load `S.curBook === "j1"`. Console has no uncaught errors. Evidence `.omo/evidence/dynamic-vocab-loading/task-4-dynamic-vocab-loading.json` (include screenshot of home with the new book tab + a book dropdown showing the dynamic book)
  Commit: Y | `feat(main): load dynamic CSV word books at startup with per-source isolation`

- [x] 5. End-to-end QA: build smoke, dist greps, Playwright happy/failure/cache/TTL flows
  What to do: Run the verification suite and attach evidence under `.omo/evidence/dynamic-vocab-loading/`. Flows (via Playwright on `npm run dev`; ALSO smoke `dist/word_rush.html` once):
  - Build smoke: `npm run build` and `npm run build:dev` exit 0; grep `DYN_SOURCES` present in `dist/word_rush.html`; grep `全部词书（9册）` ABSENT in dist and in `src/main.js`.
  - Happy: new book tab appears; click 中考词汇 tab; hero shows `~1764+ 词条`; `#btnStart` shows `▶ 开始 U1 · 1-50`; click → level run starts (word shown); type the word's letters → combo/next-word appears; finish/abort cleanly (Esc).
  - Failure: temporarily point one DYN_SOURCES url at `https://example.com/404.csv`, reload → toast `词库加载失败`, the other (kzc) book still loads, built-ins intact, no crash.
  - Cache fallback: seed `wordrush_dyn_kzc` with fresh `{ts: Date.now(), text}` of a SMALL fixture CSV (3 words), temporarily set kzc url to a failing URL, reload → book appears from cache + `#lvMap` shows 1 unit of 3 words + toast `已使用缓存`.
  - TTL: after cache fallback above, set `wordrush_dyn_kzc.ts = Date.now() - 864e5 - 1000` (stale), reload with WORKING url → fetch happens (network request seen in console), book updates.
  - Console: zero uncaught errors across all flows; downloaded CSV evidence rows 1764+1 for kzc.
  MUST NOT: leave the temporary broken URLs or seeded cache in the repo (restore `DYN_SOURCES` to the two real urls; clear test localStorage keys after QA); do not commit evidence into `dist/` or repo root — it lives under `.omo/evidence/`.
  Parallelization: Wave 4 | Blocked by: T4 | Blocks: —
  References (executor has NO interview context - be exhaustive): this plan's Verification strategy section; `webapp-testing`/Playwright MCP for the driver; `build.mjs:32-36` (terser mangle toplevel:false — new top-level function names survive obfuscation, no inline onclick depends on them)
  Acceptance criteria (agent-executable): all five flows pass with screenshots + console logs as evidence; `npm run build`/`build:dev` exit 0; greps pass.
  Commit: N (evidence only, no source change)
  Evidence: `.omo/evidence/dynamic-vocab-loading/task-5-dynamic-vocab-loading/` (screenshots + logs + greps + build output)

- [x] 6. Document DYN_SOURCES in AGENTS.md and README
  What to do: In `AGENTS.md` under "Word data format" add a subsection **动态词库（DYN_SOURCES）**: config shape `{ id, name, color, url }` in `src/main.js` top area; `url` = absolute http(s) URL or server-relative `dict/x.csv`; CSV schema `word,phonetic,pos,definition,source` (header optional); chunk = 50 words/unit; cache key `wordrush_dyn_<id>` TTL 24h (cache-first, stale fallback on failure); **id 必须稳定**——改名会像内置词书改名一样孤儿化 `S.prog`/`S.mastery` 进度; `file://` 双击打开时 fetch 被浏览器禁止，须用 `npm run dev`/`npx serve`; built `dist/word_rush.html` 需要把 `dict/` 放在其同目录部署。In `README.md`: add 2-3 lines under 运行/构建 about adding a custom词库 (DYN_SOURCES + dict/ example). MUST NOT: create new files; match existing Simplified-Chinese comment style.
  Parallelization: Wave 5 | Blocked by: T4 | Blocks: —
  References (executor has NO interview context - be exhaustive): `AGENTS.md` "Word data format" + "Critical quirks" sections; `README.md` 运行/构建/技术说明 sections
  Acceptance criteria (agent-executable): both files contain the new subsection; spot-check the file:// warning and cache semantics wording match T2/T3/T4 behavior.
  Commit: Y | `docs: document dynamic CSV word sources (DYN_SOURCES, dict/ deployment, cache)`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit — every todo's acceptance criteria met; evidence files exist under `.omo/evidence/dynamic-vocab-loading/`; no todo left uncommitted except T5.
- [ ] F2. Code quality review — new functions follow existing style (Simplified-Chinese comments, top-level `function` declarations, no arrow-const globals, no new window.* needed); no duplicated logic (P() triple shape reused); no dead code; `let ALL` is the ONLY ALL-related change.
- [ ] F3. Real manual QA — browser session doing: home tabs → 中考词汇 book → U1 level start → 3 correct words → back to home → 单词本 shows dynamic book rows → 词表 tabs include dynamic book → failure source toast. Screenshots saved.
- [ ] F4. Scope fidelity — diff contains ONLY: buildAll extraction, DYN_SOURCES + pipeline + cache + loader, renderBook literal fix, renderHome call, docs. NOTHING from Must NOT have list.

## Commit strategy
- One atomic commit per todo (T1…T6), ordered as the waves; T5 = evidence only, no commit.
- Message style `type(scope): summary` in English, body may note Chinese-facing rationale.
- Do NOT amend/squash history within this plan; keep 6 commits max (refactor, pipeline, cache, loader, docs).
- Dist artifacts (`dist/`) are gitignored — never commit them.

## Success criteria
- All 14 built-in books render byte-identical word data and progression as before (regression-free refactor).
- With `DYN_SOURCES` as shipped: 中考词汇 (and 四级词汇 when its URL serves) appear as books on home/book/table; per-source failure shows a toast and never breaks other books or crashes the app.
- Flat CSVs become playable books: units "1-50"…, level-start works, mastery/save flows unchanged; `wordrush_v1` blob schema untouched.
- 24h TTL cache: fresh cache → no network fetch; stale/missing → fetch; fetch failure → stale cache fallback with toast.
- `npm run build` + `npm run build:dev` succeed; dist bundle contains the pipeline and runs standalone over http with `dict/` next to it; `file://` limitation documented.
- AGENTS.md/README document adding a new source in under 5 minutes by copy-paste.