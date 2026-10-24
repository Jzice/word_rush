/* ================= 模块：data/dynamic 动态词库 =================
 * 职责：DYN_SOURCES 配置、CSV 解析（csvToUnits）、localStorage 缓存（TTL 24h）、
 *       惰性加载（applyDynamicBook / ensureDynLoaded）、每日精练队列
 * 依赖：core/utils、data/index（bookOf/buildAll/ALL，运行时）、ui/fx（toast，运行时）
 * 共享状态：写 BOOKS（push/splice）、localStorage wordrush_dyn_<id>
 * 备注：file:// 下 fetch 被禁，需 http 服务（npm run dev）或部署
 * ==================================================================== */
/* ================= 动态词库配置（URL 或服务器相对路径，如 dict/x.csv） ================= */
const DYN_TTL = 864e5; // 缓存 24 小时
// stage：学段标签（小学/初中/高中/大学/考研/留学），显示在主页徽标与词库标签提示中
const DYN_SOURCES = [
  // ── 初中 ──
  { id: "rj7", name: "人教七年级", size: "约880词", color: "#4dd0e1", stage: "初中", url: "/vocab/人教初中七年级.csv" },
  { id: "rj8", name: "人教八年级", size: "约880词", color: "#26c6da", stage: "初中", url: "/vocab/人教初中八年级.csv" },
  { id: "rj9", name: "人教九年级", size: "约550词", color: "#00acc1", stage: "初中", url: "/vocab/人教初中九年级.csv" },
  { id: "kzc", name: "中考", size: "约1800词", color: "#5b9bd5", stage: "初中", url: "/vocab/中考英语词汇表.csv" },
  // ── 高中 ──
  { id: "rjg", name: "人教高中", size: "约3900词", color: "#7c4dff", stage: "高中", url: "/vocab/人教高中.csv" },
  // ── 大学 ──
  { id: "cet4", name: "四级", size: "约4500词", color: "#ed7d31", stage: "大学", url: "/vocab/CET4_edited.csv" },
  { id: "cet6", name: "六级", size: "约5500词", color: "#b8c4bd", stage: "大学", url: "/vocab/CET6_edited.csv" },
  { id: "tem4", name: "专四", size: "约4600词", color: "#26a69a", stage: "大学", url: "/vocab/专四.csv" },
  { id: "tem8", name: "专八", size: "约1.3万词", color: "#00897b", stage: "大学", url: "/vocab/专八.csv" },
  // ── 考研 ──
  { id: "ky", name: "考研", size: "约9600词", color: "#d81b60", stage: "考研", url: "/vocab/考研.csv" },
  // ── 留学 ──
  { id: "ielts", name: "雅思", size: "约7000词", color: "#1e88e5", stage: "留学", url: "/vocab/雅思.csv" },
  { id: "toefl", name: "TOEFL", size: "约4500词", color: "#6a1b9a", stage: "留学", url: "/vocab/TOEFL_abridged.csv" },
  { id: "gre", name: "GRE", size: "约8000词", color: "#c2185b", stage: "留学", url: "/vocab/GRE_abridged.csv" },
];

/* 学段配色：未选中词库按钮的虚线/文字按学段着色（选中后仍用词库各自主题色） */
const STAGE_COLORS = {
  小学: "#66bb6a",
  初中: "#29b6f6",
  高中: "#7c4dff",
  大学: "#ff9800",
  考研: "#ec407a",
  留学: "#5c6bc0",
};
const stageColor = (st) => STAGE_COLORS[st] || "";

/* ================= 动态词库 CSV 解析管线 ================= */
function parseCsv(text) {
  if (!text) return [];
  let s = text.replace(/^\uFEFF/, "").replace(/\r\n|\r/g, "\n").replace(/\n+$/, "");
  const rows = [];
  let row = [], field = "", i = 0, inQ = false, depth = 0;
  while (i < s.length) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; }
        else { inQ = false; i++; }
      } else { field += ch; i++; }
    } else if (ch === '"' && field === "") { inQ = true; i++; }
    else if (ch === "(") { depth++; field += ch; i++; }
    else if (ch === ")") { if (depth > 0) depth--; field += ch; i++; }
    else if (ch === "," && depth === 0) { row.push(field); field = ""; i++; }
    else if (ch === "\n" && depth === 0) { row.push(field); rows.push(row); row = []; field = ""; i++; }
    else { field += ch; i++; }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function cleanHeadword(w) {
  let s = w.trim();
  s = s.replace(/\s*\([^()]*\)\s*$/, "");
  return s.trim() || w.trim();
}
function mapPos(p) {
  const t = String(p || "").trim().toLowerCase().split(/[/&]/)[0].trim();
  const M = {
    n: "n", "n.": "n",
    a: "a", "a.": "a", adj: "a", "adj.": "a",
    ad: "d", "ad.": "d", adv: "d", "adv.": "d",
    v: "v", "v.": "v", vt: "v", "vt.": "v", vi: "v", "vi.": "v", aux: "v", "aux.": "v", modal: "v", "modal.": "v",
    prep: "p", "prep.": "p",
    conj: "c", "conj.": "c",
    pron: "r", "pron.": "r",
    num: "t", "num.": "t",
    int: "i", "int.": "i", interj: "i", "interj.": "i",
    phr: "e", "phr.": "e", phrase: "e",
  };
  return M[t] || "n";
}
function csvToUnits(text, { chunk = 50 } = {}) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  let wi = 0, pi = 3, di = 2;
  if (/^(word|headword|词汇|单词)(\s|$)/i.test(rows[0][0] || "")) {
    const h = rows.shift();
    const find = (names) => {
      for (let i = 0; i < h.length; i++) {
        const c = (h[i] || "").trim().toLowerCase();
        if (names.includes(c)) return i;
      }
      return -1;
    };
    const enI = find(["word", "headword", "词汇", "单词"]);
    const posI = find(["pos", "词性"]);
    const cnI = find(["definition", "meaning", "释义", "中文"]);
    wi = enI >= 0 ? enI : 0;
    pi = posI >= 0 ? posI : 3;
    di = cnI >= 0 ? cnI : 2;
  }
  const triples = [];
  let bad = 0;
  rows.forEach((row) => {
    const en = cleanHeadword(row[wi] || "");
    const cn = (row[di] || "").trim();
    if (!en || !cn) return;
    if (en.includes("@") || en.includes("|") || cn.includes("@") || cn.includes("|")) { bad++; return; }
    triples.push([en, cn, mapPos(row[pi])]);
  });
  if (bad) console.warn("动态词库：跳过含 @ 或 | 的行", bad, "行");
  if (!triples.length) return [];
  const units = [];
  for (let k = 0; k < triples.length; k += chunk) {
    const part = triples.slice(k, k + chunk);
    units.push({
      s: "U" + (k / chunk + 1),
      n: (k + 1) + "-" + Math.min(k + chunk, triples.length),
      w: part.map((t) => t.join("@")).join("|"),
    });
  }
  return units;
}

/* ================= 动态词库缓存（按来源 24h TTL） ================= */
const dynKey = (id) => "wordrush_dyn_" + id;
function dynCacheGet(id) {
  try { return JSON.parse(localStorage.getItem(dynKey(id)) || "null"); } catch (e) { return null; }
}
function dynCacheSet(id, text) {
  try { localStorage.setItem(dynKey(id), JSON.stringify({ ts: Date.now(), text })); } catch (e) { console.warn("缓存写入失败(空间不足?)", e); }
}

/* ================= 动态词库加载（按源隔离，失败不阻塞其它源） ================= */
// 词库 URL 适配任意部署路径：DYN_SOURCES 里写 "/vocab/x.csv" 绝对路径，
// 直接 fetch 在 GitHub Pages 子目录（https://user.github.io/repo/）会 404，
// 这里统一相对当前页面解析（localStorage 缓存键仍用 id，不受影响）。
const dynUrl = (u) => new URL(u.replace(/^\/+/, ""), document.baseURI).href;
// 返回 Promise<boolean>：true = 成功加载（BOOKS 已含该词库），false = 失败。
// opts.silent = true 时静默加载（后台缓存/惰性加载，不弹 toast，仅失败且无缓存时才提示）。
async function applyDynamicBook(src, opts = {}) {
  const silent = !!opts.silent;
  let text = null, fromCache = false;
  const c = dynCacheGet(src.id);
  if (c && Date.now() - c.ts < DYN_TTL) { text = c.text; fromCache = true; }
  else {
    try {
      const res = await fetch(dynUrl(src.url));
      if (!res.ok) throw new Error("HTTP " + res.status);
      text = await res.text();
      dynCacheSet(src.id, text);
    } catch (e) {
      if (c && c.text) { text = c.text; fromCache = true; if (!silent) toast("⚠️ 词库加载失败：" + src.name + "，已使用缓存"); }
      else { if (!silent) toast("⚠️ 词库加载失败：" + src.name + "（可稍后刷新重试）"); return false; }
    }
  }
  const units = csvToUnits(text);
  if (!units.length) { if (!silent) toast("⚠️ 词库解析为空：" + src.name); return false; }
  const i = BOOKS.findIndex((b) => b.id === src.id);
  if (i >= 0) BOOKS.splice(i, 1);
  BOOKS.push({ id: src.id, stage: src.stage || "扩展词库", name: src.name, color: src.color, units });
  buildAll();
  if (!silent && fromCache) toast("📖 " + src.name + "（缓存）");
  if (!silent) toast("📖 " + src.name + " 已加载");
  return true;
}

// 找出 BOOKS 中对应 id 是否已加载（供惰性加载时判断）
const dynSource = (id) => DYN_SOURCES.find((s) => s.id === id);
const dynLoaded = (id) => !!bookOf(id);

/* ================= 扩展词库 · 每日精练（每日词量滑块 + 顺序/逆序/随机） ================= */
const DYN_DAILY_MIN = 10,
  DYN_DAILY_MAX = 100,
  DYN_DAILY_STEP = 10;
const DYN_ORDERS = ["seq", "rev", "rand"];
// 滑块值规范化：夹到 10-100 并按 10 取整
function dynNormDaily(n) {
  n = Math.round((+n || 20) / DYN_DAILY_STEP) * DYN_DAILY_STEP;
  return Math.min(DYN_DAILY_MAX, Math.max(DYN_DAILY_MIN, n));
}
// 读取（并补齐）某个扩展词库的每日精练设置
function dynCfg(id) {
  if (!S.dyn || typeof S.dyn !== "object") S.dyn = {};
  const d = S.dyn[id] || (S.dyn[id] = { daily: 20, order: "seq", pos: 0 });
  d.daily = dynNormDaily(d.daily);
  if (!DYN_ORDERS.includes(d.order)) d.order = "seq";
  if (typeof d.pos !== "number" || d.pos < 0) d.pos = 0;
  return d;
}
// 扩展词库学习进度统计（基于掌握度）：total / learned（练过）/ mastered（已牢记）
function dynProgress(id) {
  const b = bookOf(id);
  if (!b) return null;
  let learned = 0,
    mastered = 0;
  for (const it of b.items) {
    const m = S.mastery[it.en.toLowerCase()];
    if (m && m.r > 0) {
      learned++;
      if (m.lv >= 5) mastered++;
    }
  }
  return { total: b.items.length, learned, mastered };
}
// 后台静默懒加载（去重并发；失败后允许重试；加载完若仍选中该词库则刷新动态区）
const dynLoadPromises = {};
function ensureDynLoaded(src) {
  if (bookOf(src.id)) return Promise.resolve(true);
  if (!dynLoadPromises[src.id]) {
    dynLoadPromises[src.id] = applyDynamicBook(src, { silent: true }).then(
      (ok) => {
        if (!ok) delete dynLoadPromises[src.id];
        else if (S.curBook === src.id) renderHome();
        return ok;
      }
    );
  }
  return dynLoadPromises[src.id];
}
// 生成一批每日练习词：逾期复习词优先（SRS 调度）+ 新学词按顺序/逆序指针或随机推进补足，交错排列
function dynDailyQueue(items, id) {
  const cfg = dynCfg(id);
  const n = Math.min(cfg.daily, items.length);
  // 新学词选取：顺序/逆序用持久化指针逐批推进（自动跳过已学词），随机则从未学词中抽样
  const freshPick = (need) => {
    if (need <= 0) return [];
    if (cfg.order === "rand") {
      return shuffle(
        items.filter((it) => {
          const m = S.mastery[it.en.toLowerCase()];
          return !m || !m.r;
        })
      ).slice(0, need);
    }
    const base = cfg.order === "rev" ? items.slice().reverse() : items;
    const picked = [];
    for (let i = 0; i < base.length && picked.length < need; i++) {
      const it = base[(cfg.pos + i) % base.length];
      const m = S.mastery[it.en.toLowerCase()];
      if (!m || !m.r) picked.push(it);
    }
    const wrapped = cfg.pos + n >= base.length; // 指针越过词库末尾 → 本轮新词学完
    cfg.pos = (cfg.pos + n) % base.length;
    save();
    if (wrapped)
      setTimeout(
        () =>
          toast(
            "🏁 " +
              (dynSource(id)?.name || "扩展词库") +
              " 已学完一轮新词，进入复习巩固轮"
          ),
        500
      );
    return picked;
  };
  return srsDailyQueue(items, n, freshPick);
}

