# AGENTS.md

WORD RUSH 单词快打 — vanilla JS single-page vocabulary typing game (multiple school textbook 词库). No framework, no bundler, no tests. All logic lives in one file by design — keep it that way (no imports, no code splitting).

## Commands

- `npm run dev` — `npx serve .` serves the repo root; `index.html` loads `src/main.js` + `src/style.css` directly (no build needed to develop)
- `npm run build` — `node build.mjs` inlines CSS/JS into single `dist/word_rush.html` (gitignored)
- No lint / typecheck / test scripts exist. Verify changes with `npm run build` + browser testing (e.g. Playwright) — nothing else validates the code.

## Architecture

- `index.html` — markup with inline `onclick` handlers (e.g. `go('scr-book')`, `openMode('time')`) that call **global** functions
- `src/main.js` (~3600 lines) — all game logic: `BOOKS` word data, 5 game modes (`run`/`fall`/`battle`/`mem`/`p2p`), shop, achievements, leveling, P2P
- `src/style.css` (~2000 lines) — all styling; themes via `body[data-theme]` + CSS vars (`--c-y`, `--c-p`, ...)
- Word data is **inline code** in the `BOOKS` array (`src/main.js:45`), not external data files

## Critical quirks

- **Classic script, not a module.** Top-level `function` declarations become globals usable from inline `onclick`, but top-level `const`/`let` do NOT. Arrow functions referenced from `index.html` inline handlers MUST be explicitly attached: `window.foo = () => {...}` (see `window.useTheme`/`window.buyItem` near the end of `main.js`).
- **Build inlining is regex-based.** `build.mjs` only substitutes the exact tag patterns `<link ... href="src/style.css">` and `<script src="src/main.js"></script>` (a leading `/` is tolerated). Rename a file, add attributes, or change the path → build silently outputs a broken `dist/word_rush.html`. Keep those two tags byte-for-byte as-is.
- **Built file is not fully offline.** Google Fonts and PeerJS (from `unpkg`) stay as external CDN refs in `dist/word_rush.html` — custom fonts and P2P 联机对战 need network at runtime.
- **Single global `keydown` listener** (`src/main.js:2082`). During gameplay every printable char routes through `routeChar(ch)` → per-mode handler by `G.type`. A new game mode must branch in `routeChar` and manage the `G` object. On the home screen, keys 1-9 select units and r/w/m/t/f/b/l/p/s shortcut screens. Input is ignored when focus is in `INPUT|SELECT|TEXTAREA`.
- **Persistence is manual.** State lives in localStorage under key `wordrush_v1` (`const K`), schema in `def()` (`src/main.js:1061`). Any mutation must call `save()` explicitly. Word mastery is keyed by `word.toLowerCase()` in `S.mastery` — renaming a word in `BOOKS` orphans its progress (there is no migration path).

## Word data format

- Unit words `w`: `en@中文@pos|en@中文@pos|...` (3 fields per entry)
- Unit phrases `p`: `en@中文|en@中文|...` (2 fields; rendered pos is forced to `"e"`)
- `@` and `|` are structural delimiters — never appear inside word/phrase text. `P()` (`src/main.js:26`) parses.
- Parsed into `it` objects `{en, cn, book, phrase, pos, ui, un, us}` appended to `BOOKS[].items` and `ALL` (`src/main.js:577-601`); `ALL` is the flat lookup list used by gameplay.

## Conventions

- UI and code comments are Simplified Chinese — match the existing style.
- Screens are `<section id="scr-X" class="scr">` toggled via `go(id)`; add new screens this way and reference them through globals.
- Elements with a `data-t` attribute are clickable to read the word aloud (global click handler → `speak()`) — reuse for word pronunciation.