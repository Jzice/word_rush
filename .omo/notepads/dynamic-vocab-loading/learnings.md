# Learnings — dynamic-vocab-loading

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## T1 — buildAll() extraction (2026-09-08)

- **Baseline `ALL.length` = 1054** across 14 built-in books (j1-j5, g1-g4, w1, n1, ket, c4, c6). This is the pinned value that must not change.
- `#bkBook` dropdown is NOT populated until `go('scr-book')` calls `renderBook()`. Baseline capture must call `go('scr-book')` first, otherwise `#bkBook.innerHTML` is empty.
- The stale literal was `全部词书（9册）` — 9 was the old 人教版-only count; actual built-in book count is 14. Replaced with `${BOOKS.length}`.
- Gotcha: Playwright chromium headless shell was not installed; needed `python -m playwright install chromium` first.
- Gotcha: `npx serve .` installs serve on first run (npm warn) but works fine on port 3000.
- `buildAll()` is a top-level `function` declaration → becomes a global, reachable from `page.evaluate`. `ALL` is top-level `let` → accessible in page.evaluate scope (not a window prop, but in scope).
- Post-change `ALL.length` === 1054 (identical to baseline), `BOOKS.every(b=>b.items.length>0)` true, dropdown shows `全部词书（14册）` with 15 total options (1 all + 14 books).

---

## T2 — DYN_SOURCES + CSV pipeline (2026-09-08)

- **Plan spec contradiction (positional mapping)**: plan line 125 lists positional `[0,1,2,3,4]` as `(en, phonetic, pos, cn, source)`, but the acceptance test `csvToUnits('a,b,c\nx,y,z')` → `u.w==="a@c@n"` requires **cn at index 2, pos at index 3**. Acceptance test wins — implemented en=0, phonetic=1, cn=2, pos=3, source=4. Note this in any future doc sync.
- **Plan test input is malformed CSV**: `begin(began,begun),bɪˈɡɪn,v.,开始,着手` has an UNQUOTED comma inside the parenthetical. The real kzc CSV quotes it: `"begin(began,begun)",bɪˈɡɪn,," v. 开始,着手",中考英语词汇表`. A standard CSV parser splits the unquoted version into 6 fields → `begin@开始@v` fails.
- **Fix: paren-depth tracking in parseCsv** — in unquoted fields, `(` increments depth, `)` decrements, and `,`/`\n` are only delimiters at depth 0. Verified byte-identical output vs the standard parser on the real 1765-row kzc CSV (0 diffs), so real data is unaffected. This is a deliberate lenient extension beyond the plan's "read until `,` or `\n`" spec.
- **Positional test input has 2 rows** (`a,b,c` + `x,y,z`) → `u.w` contains 2 triples. Plan's `u.w==="a@c@n"` is shorthand for the FIRST triple (plan text: "first triple en=a, cn=c"). Assert `u.w.split("|")[0]`.
- **Real-CSV sanity check is cheap and valuable**: fetch `/dict/中考英语词汇表.csv` (local copy in repo root, gitignored) → 1765 rows → 36 units (50-word chunks), first word `ability@能力;才能@n`, `begin@` survives. Do this for every pipeline change.
- **kzc/cet4 URLs in DYN_SOURCES are currently 404** (both raw.giteeusercontent.com and gitee.com/justice/english-wordlists). The local `dict/` CSVs are the working copies. T4+ fetch logic must handle fetch failure gracefully (fall back to cache, then to nothing).
- Real kzc CSV quirks: header `word,phonetic,pos,definition,source`; pos column often empty (`""`) → mapPos("")→"n"; definitions contain `;` and quoted commas (`" v. 开始,着手"`); duplicated headwords like `be` exist (allowed — buildAll no longer dedupes).

---

## T3 — per-source TTL cache (2026-09-08)

- Cache entry shape `{ ts: Date.now(), text }` under key `wordrush_dyn_<id>`; `DYN_TTL = 864e5` (24h) defined in T2. Expiry check is deliberately left to the consumer (T4+) — the cache functions are dumb storage.
- `dynCacheGet` returns `null` on missing key, corrupt JSON, or localStorage unavailability (try/catch) — never throws. Verified: `"garbage"` in storage → `null`.
- `dynCacheSet` swallows quota errors with `console.warn("缓存写入失败(空间不足?)", e)` — matches the existing quota-safe `save()` pattern at src/main.js:1110-1114.
- Evidence files are force-added (`git add -f`) because `.omo/` is gitignored — task-1 commit 856c53c set this precedent.

---

## T4 — loadDynamicBooks() orchestration + startup wiring (2026-09-08)

- **kzc URL switched to local**: `dict/中考英语词汇表.csv` (server-relative, HTTP 200 via `npx serve`). cet4 Gitee URL left unchanged — it fails with CORS (no `Access-Control-Allow-Origin` header) which is the DESIGNED failure path proving per-source isolation. The CORS error appears in console as a network message but is NOT an uncaught JS error — `page.on("pageerror")` stays empty; only `page.on("console")` type=error sees it. Assert on pageerrors, not console errors.
- **Startup crash bug (critical)**: with `S.curBook` pointing at a dynamic book (e.g. "cet4" that failed to load), the INITIAL `renderHome()` at the init tail crashes with `Cannot read properties of undefined (reading 'id')` — because the dynamic book isn't in BOOKS yet (async load). This crashes BEFORE `loadDynamicBooks()` runs, so the plan's in-function fallback never executes. Fix: startup guard `if (!bookOf(S.curBook)) { S.curBook = "j1"; save(); }` between `refreshHead()` and the initial `renderHome()`. This is the ONLY `save()` call allowed outside loadDynamicBooks, and it's required for the plan's own acceptance test (step 5: reload with curBook="cet4" → must fall back to "j1").
- **Countdown gating**: `countdown()` (src/main.js:2957) sets `G.started = false`, shows 3-2-1-GO! (4 × 620ms ≈ 2.5s), then `G.started = true`. `onRunChar` returns early `if (!G.started)`. Playwright typing tests MUST wait for `G.started === true` (poll via `page.evaluate("G ? !!G.started : false")`) before typing — typing during countdown is silently ignored.
- **Toast expiry**: toasts auto-remove after ~3.2s. Capture `#toasts .toast` text immediately after load (step 1), not later — by step 4 the cet4 failure toast is already gone.
- **Verification script pattern**: `rtk python <script>` writes JSON to file + prints `RESULT_WRITTEN`/`ALL_PASS`/`SOME_FAILED` (GBK console can't print emoji — keep stdout ASCII). Screenshots land in the same temp dir, then copied to `.omo/evidence/dynamic-vocab-loading/`.
- **Final verified state**: 15 books (14 built-in + kzc), `ALL.length`=2818 (baseline 1054 + 1764 kzc items), hero `36 个单元 · 1764 词条`, `#btnStart` = `▶ 开始 U1 · 1-50`, typing advances `#prog` 1/50→2/50, Esc pause + quit clean, dropdown `全部词书（15册）` includes 中考词汇, zero pageerrors. Commit 9fd45ff.

---

## T5 — End-to-end QA: happy / failure / cache / TTL flows (2026-09-08)

- **Modal visibility check**: `#modal` uses a `hide` class (openModal removes it, closeModal adds it) — NOT an `on` class. Assert `!classList.contains('hide')`, not `contains('on')`. (T4's script used `style.display !== 'none'` which also works.)
- **Dynamic source id ≠ built-in id**: the dynamic cet4 source has id `cet4`, but the built-in 四级高频词 book has id `c4`. When asserting "dynamic cet4 absent after failure", check `"cet4" not in ids` — checking `"c4"` will always fail because the built-in exists.
- **Route interception beats source mutation for failure tests**: instead of temporarily editing DYN_SOURCES URLs (plan's literal wording), use `ctx.route("**/*", handler)` to abort/404 the kzc or cet4 request. Zero source changes, repo stays clean, same code path exercised (fetch throws → catch → toast/cache fallback).
- **Cache-first proof**: with a FRESH seeded cache (`{ts: Date.now(), text}`) + broken fetch, `kzc_requests` count stays 0 — the fresh-cache branch never fetches. Assert `no_fetch` to prove cache-first semantics.
- **TTL proof**: seed STALE cache (`ts = Date.now() - 864e5 - 1000`) + working URL → fetch happens (request count > 0) → book updates to 1764 words (not the 3-word fixture). Assert both the fetch AND the updated hero meta.
- **Seeding localStorage before page load**: `context.add_init_script("localStorage.setItem('wordrush_dyn_kzc', " + json.dumps(json.dumps(seed)) + ")")` — double-encode so the init script string contains a JSON string literal. Runs before page scripts, so `loadDynamicBooks()` sees the seeded cache.
- **URL matching in routes**: the kzc URL is `dict/中考英语词汇表.csv` but the browser percent-encodes it (`dict/%E4%B8%AD...`). Match on `"dict/"` in the request URL, not the Chinese filename.
- **CSV evidence**: fetch `/dict/%E4%B8%AD%E8%80%83%E8%8B%B1%E8%AF%AD%E8%AF%8D%E6%B1%87%E8%A1%A8.csv` (percent-encoded) → 1765 rows (1764 words + header). Assert `len(rows) == 1765`.
- **Build smoke**: `npm run build` exit 0 → dist 161.5KB; `DYN_SOURCES` present in dist (survives terser since it's a top-level const); `全部词书（9册）` absent in both dist and src.
- **T5 = evidence only, no source change** — commit is `test(evidence): T5 end-to-end QA — happy/failure/cache/TTL flows all pass` (d136cd3), 5 files (1 JSON + 4 screenshots).

---

## T6 — Document DYN_SOURCES in AGENTS.md and README (2026-09-08)

- AGENTS.md gets a **动态词库（DYN_SOURCES）** subsection under "Word data format" — config shape, CSV schema, 50-word chunking, cache semantics (fresh→no fetch, stale/missing→fetch, failure→stale fallback), stable-id warning, `file://` limitation, `dict/` deployment note for the built file.
- README.md gets a **📚 添加自定义词库** block under 构建发布 — copy-paste one-line `DYN_SOURCES` entry + CSV format + cache/fallback behavior in Simplified Chinese, matching the existing README voice.
- Docs-only commit: `docs: document dynamic CSV word sources (DYN_SOURCES, dict/ deployment, cache)`.

---
