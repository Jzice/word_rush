import { S, DUE, mOf, save } from "../core/store";
import { clamp, shuffle } from "../core/utils";
import { ALL } from "../data/index";
import { LVN } from "./utils";

/* ================= 模块：core/srs 记忆算法（SM-2 改进） =================
 * 职责：评分 srsGrade/markWord、调度优先级与穿插、每日队列、权重池、
 *       到期词 / 错词本查询、旧存档字段迁移（migrateMastery IIFE）
 * 依赖：core/store（S/DUE）、data/index（ALL，运行时）
 * 共享状态：写 S.mastery
 * ==================================================================== */
/* ================= SRS 间隔重复调度（SM-2 改进版，贴合遗忘曲线） =================
 * 间隔阶梯：新词当天 10 分钟学习步 → 次日 → 2 天 → iv×ef（约 5/13/33/83 天）→ 最长 180 天；
 * 答错进入 10 分钟重学步且难度系数下调；永久词（iv≥60 天）到期仍低频维护复习。 */
export const SRS_DAY = 86400000,
  SRS_STUDY_STEP = 10 * 60000, // 新词/重学词的当天学习步
  SRS_MAX_IV = 180; // 最长间隔（天）
// 答题质量 q(1-5)：未拼出=1（遗忘）；拼对则按错键数与反应速度评定
export function srsQ(ok: any, errs: any, rtMs: any, len: any) {
  if (!ok) return 1;
  let q = errs === 0 ? 5 : errs === 1 ? 3 : 2;
  if (rtMs > 0 && len) {
    const budget = 1200 + len * 500; // 速度阈值：1.2s + 0.5s/字母
    if (q === 5 && rtMs > budget * 1.6) q = 4; // 零错但过慢不给满分
  }
  return q;
}
// 由调度状态派生界面等级（0-5 六档，与 LVN 对齐）
export function srsLv(m: any) {
  if (!m.r) return 0;
  if (!m.reps) return 1; // 重学中
  if (m.iv < 4) return 2;
  if (m.iv < 15) return 3;
  if (m.iv < 60) return 4;
  return 5;
}
// 核心调度：ok 是否拼对、errs 错键数、rtMs 反应时长（毫秒，0=未知）
export function srsGrade(it: any, ok: any, errs: any, rtMs: any) {
  const m = mOf(it.en),
    now = Date.now(),
    q = srsQ(ok, errs, rtMs, it.en.length);
  if (!m.first) m.first = now;
  m.last = now;
  if (ok) {
    m.r++;
    if (rtMs > 0)
      m.rt = m.rt ? Math.round(m.rt * 0.7 + rtMs * 0.3) : rtMs;
    if (q >= 3) {
      m.reps++;
      if (m.reps === 1) {
        m.iv = 1;
        m.due = now + SRS_STUDY_STEP; // 新词当天 10 分钟再现
      } else if (m.reps === 2) {
        m.iv = 1;
        m.due = now + SRS_DAY; // 学习步通过 → 次日复习
      } else {
        m.iv = m.reps === 3 ? 2 : Math.max(2, Math.round(m.iv * m.ef));
        m.iv = Math.min(m.iv, SRS_MAX_IV);
        m.due = now + m.iv * SRS_DAY;
      }
      m.ef = clamp(
        m.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
        1.3,
        2.8
      );
    } else {
      m.w++; // 拼对但错键多：不进阶，当天再现
      m.due = now + SRS_STUDY_STEP;
    }
  } else {
    m.w++;
    m.lapses++;
    m.reps = 0;
    m.iv = 0;
    m.ef = Math.max(1.3, m.ef - 0.2);
    m.due = now + SRS_STUDY_STEP; // 重学步
  }
  m.lv = srsLv(m);
  if (m.lv === 5) S.stats.maxed = 1;
  save();
  return m;
}
export function markWord(it: any, ok: boolean, errs = 0, rtMs = 0) {
  return srsGrade(it, ok, errs || 0, rtMs || 0);
}
// 选词优先级：逾期越久、遗忘次数越多、处于重学步的词越优先
export function srsPriority(m: any, now = Date.now()) {
  now = now || Date.now();
  const overdue = Math.max(0, (now - m.due) / SRS_DAY);
  return overdue * 2 + (m.lapses || 0) * 1.5 + (m.reps === 0 ? 3 : 0);
}
// 交错排列：两组词交替穿插（组内保持原顺序）
export function srsInterleave(a: any, b: any) {
  const out: any[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length) out.push(a[i++]);
    if (j < b.length) out.push(b[j++]);
  }
  return out;
}
// 每日练习队列：复习词优先（逾期排序，上限约 70%）+ 新学词补足剩余名额，交错排列；
// freshPick(need) 由调用方按词书顺序/随机提供新学词；复习词不足时新词自动填满，
// 新词不足（词书临近学完）时复习词自动补满，保证批次总量尽量达到 daily
export function srsDailyQueue(items: any, daily: any, freshPick: any) {
  const now = Date.now(),
    n = Math.min(daily, items.length);
  const due = items
    .map((it: any) => ({ it, m: S.mastery[it.en.toLowerCase()] }))
    .filter((x: any) => x.m && x.m.r > 0 && x.m.due <= now)
    .sort((a: any, b: any) => srsPriority(b.m, now) - srsPriority(a.m, now))
    .map((x: any) => x.it);
  const reviewCap = Math.round(n * 0.7),
    reviewCount = Math.min(due.length, reviewCap);
  const fresh = freshPick(n - reviewCount);
  const review = due.slice(0, n - fresh.length);
  return srsInterleave(review, fresh);
}
// 游戏挑战加权抽词：50% 逾期/重学词 · 30% 近期新词 · 20% 已掌握维护词；配额不足逐级回填
export function weightedPool(items: any, limit: any) {
  const now = Date.now(),
    due: any[] = [],
    recent: any[] = [],
    mast: any[] = [],
    never: any[] = [];
  for (const it of items) {
    const m = S.mastery[it.en.toLowerCase()];
    if (!m || !m.r) never.push(it);
    else if (m.due <= now) due.push(it);
    else if ((m.reps || 0) <= 2 || (m.iv || 0) < 4) recent.push(it);
    else mast.push(it);
  }
  const n = Math.min(limit || 40, items.length),
    nDue = Math.round(n * 0.5),
    nRecent = Math.round(n * 0.3);
  const take = (arr: any, k: any) => shuffle(arr).slice(0, k);
  let out = [
    ...take(due, nDue),
    ...take(recent, nRecent),
    ...take(mast, n - nDue - nRecent),
  ];
  if (out.length < n) {
    const used = new Set(out.map((x) => x.en.toLowerCase()));
    const fill = shuffle(
      [...recent, ...never, ...due, ...mast].filter(
        (it) => !used.has(it.en.toLowerCase())
      )
    );
    out = out.concat(fill.slice(0, n - out.length));
  }
  return shuffle(out);
}
export const dueWords = () =>
  ALL.filter((w) => {
    const m = S.mastery[w.en.toLowerCase()];
    return m && m.r > 0 && m.due <= Date.now(); // 含永久词的长期间隔维护复习
  }).sort(
    (a, b) =>
      srsPriority(S.mastery[b.en.toLowerCase()]) -
      srsPriority(S.mastery[a.en.toLowerCase()])
  );
export const wrongWords = () =>
  ALL.filter((w) => {
    const m = S.mastery[w.en.toLowerCase()];
    return m && m.w > 0 && m.lv < 4 && m.due <= Date.now(); // 升入「掌握」即毕业出错词本
  }).sort(
    (a, b) =>
      srsPriority(S.mastery[b.en.toLowerCase()]) -
      srsPriority(S.mastery[a.en.toLowerCase()])
  );

// SRS 字段迁移：旧存档 mastery 仅有 lv/r/w/due，补全 reps/lapses/iv/ef/first/last/rt（零进度丢失）
(function migrateMastery() {
  for (const k in S.mastery) {
    const m = S.mastery[k];
    if (typeof m.reps === "number") continue;
    m.ef = 2.5;
    m.lapses = 0;
    m.rt = 0;
    m.iv = (DUE[m.lv] || 0) / SRS_DAY; // 旧 lv 映射为间隔天数
    m.reps = m.lv; // 旧 lv ≈ 连续答对次数
    m.first = m.due ? m.due - (DUE[m.lv] || 0) : 0;
    m.last = m.first;
  }
})();












