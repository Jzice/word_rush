/* ================= 模块：core/stats 等级与统计 =================
 * 职责：等级/头衔（lvl/titleOf）、每日统计记录与修剪、学习连续天数、
 *       区间汇总、掌握度与 SRS 分布
 * 依赖：core/store（S/save）
 * 共享状态：写 S.xp / S.coins / S.stats / S.daily
 * ==================================================================== */
function lvl(xp) {
  let lv = 1,
    need = 100,
    r = xp;
  while (r >= need) {
    r -= need;
    lv++;
    need = 100 + (lv - 1) * 50;
  }
  return { lv, into: r, need };
}
const TITLES = [
  [1, "单词新手"],
  [3, "词汇学徒"],
  [5, "记忆新秀"],
  [8, "单词猎人"],
  [12, "词汇学者"],
  [16, "记忆大师"],
  [20, "单词宗师"],
  [26, "词典守望者"],
  [32, "九册通神"],
];
const titleOf = (l) => {
  let t = TITLES[0][1];
  for (const [a, b] of TITLES) if (l >= a) t = b;
  return t;
};

/* ================= 每日统计（按日期聚合，含学习/挑战/对战维度） ================= */
const DAILY_FIELDS = [
  "words", "correct", "errors", "score", "games",
  "ch", // 挑战局数（限时/陨石/记忆/竞技场）
  "mTime", "mFall", "mMem", "mBattle", // 各挑战模式局数
  "duel", "duelW", "duelL", // 单挑：场次/胜/负
  "room", "roomWin", // 乱斗：轮次/第一名次数
];
const dayKey = (d) => d.toISOString().slice(0, 10);
/* 取某日记录（自动补齐旧记录缺失字段 = 结构迁移） */
function dailyRec(key) {
  if (!S.daily || typeof S.daily !== "object") S.daily = {};
  if (!S.daily[key]) S.daily[key] = {};
  const d = S.daily[key];
  for (const k of DAILY_FIELDS) if (typeof d[k] !== "number") d[k] = 0;
  return d;
}
/* 裁剪过久的历史（保留最近 400 天），避免 localStorage 膨胀 */
function pruneDaily() {
  const keys = Object.keys(S.daily).sort();
  if (keys.length <= 400) return;
  for (const k of keys.slice(0, keys.length - 400)) delete S.daily[k];
}
/* kind: run(闯关/复习/每日精练) | time | fall | memory | battle | duel | room */
function updateDailyStats(correct, errors, score, kind, win) {
  const d = dailyRec(dayKey(new Date()));
  d.words += correct;
  d.correct += correct;
  d.errors += errors;
  d.score += score || 0;
  d.games += 1;
  if (kind === "time") d.mTime++;
  else if (kind === "fall") d.mFall++;
  else if (kind === "memory") d.mMem++;
  else if (kind === "battle") d.mBattle++;
  if (kind === "time" || kind === "fall" || kind === "memory" || kind === "battle") d.ch++;
  if (kind === "duel") {
    d.duel++;
    if (win) d.duelW++;
    else d.duelL++;
  }
  if (kind === "room") {
    d.room++;
    if (win) d.roomWin++;
  }
  pruneDaily();
  save();
}
/* 连续学习天数（今天还没学则从昨天往前数，不中断连胜） */
function learnStreak() {
  let streak = 0;
  const d = new Date();
  if (!(S.daily[dayKey(d)] && S.daily[dayKey(d)].words > 0)) d.setDate(d.getDate() - 1);
  while (S.daily[dayKey(d)] && S.daily[dayKey(d)].words > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
/* 取最近 n 天的每日记录（n=0 表示全部），按日期升序，缺省补零 */
function dailyRange(n) {
  const out = [];
  const today = new Date();
  if (n > 0) {
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      out.push({ date: k, rec: S.daily[k] || null });
    }
    return out;
  }
  const keys = Object.keys(S.daily).sort();
  return keys.slice(-150).map((k) => ({ date: k, rec: S.daily[k] }));
}
/* 区间汇总 */
function sumRange(rows) {
  const s = {};
  for (const k of DAILY_FIELDS) s[k] = 0;
  let active = 0;
  for (const { rec } of rows) {
    if (!rec) continue;
    for (const k of DAILY_FIELDS) s[k] += typeof rec[k] === "number" ? rec[k] : 0;
    if (rec.words > 0) active++;
  }
  s.active = active;
  s.acc = s.correct + s.errors ? Math.round((s.correct / (s.correct + s.errors)) * 100) : 0;
  return s;
}
/* 单词掌握分布：按熟练度 0~5 统计（含未学习词） */
function masteryDist() {
  const lv = [0, 0, 0, 0, 0, 0];
  let learned = 0,
    touched = 0;
  for (const m of Object.values(S.mastery)) {
    const l = Math.max(0, Math.min(5, m.lv | 0));
    lv[l]++;
    touched++;
    if (m.r > 0) learned++;
  }
  const mastered = lv[5];
  return { lv, learned, mastered, touched };
}
/* SRS 强度分布：间隔分布、EF 分布、未来到期预测 */
function srsDist() {
  const ivBuckets = [0, 0, 0, 0, 0, 0, 0, 0]; // 0天/1-3/4-7/8-14/15-30/31-60/61-180/180+
  const ivLabels = ["0d", "1-3", "4-7", "8-14", "15-30", "31-60", "61-180", "180+"];
  const efBuckets = [0, 0, 0, 0, 0, 0]; // 1.3-1.5/1.5-1.8/1.8-2.1/2.1-2.4/2.4-2.6/2.6-2.8
  const efLabels = ["1.3-", "1.5-", "1.8-", "2.1-", "2.4-", "2.6-2.8"];
  const now = Date.now();
  let learned = 0;
  for (const m of Object.values(S.mastery)) {
    if (!m.r) continue;
    learned++;
    const iv = m.iv || 0;
    if (iv <= 0) ivBuckets[0]++;
    else if (iv <= 3) ivBuckets[1]++;
    else if (iv <= 7) ivBuckets[2]++;
    else if (iv <= 14) ivBuckets[3]++;
    else if (iv <= 30) ivBuckets[4]++;
    else if (iv <= 60) ivBuckets[5]++;
    else if (iv <= 180) ivBuckets[6]++;
    else ivBuckets[7]++;
    const ef = m.ef || 2.5;
    if (ef < 1.5) efBuckets[0]++;
    else if (ef < 1.8) efBuckets[1]++;
    else if (ef < 2.1) efBuckets[2]++;
    else if (ef < 2.4) efBuckets[3]++;
    else if (ef < 2.6) efBuckets[4]++;
    else efBuckets[5]++;
  }
  // 未来到期预测（累计）：1/3/7/14/30 天后到期的词数
  const forecastDays = [1, 3, 7, 14, 30];
  const forecast = forecastDays.map((d) => 0);
  for (const m of Object.values(S.mastery)) {
    if (!m.r) continue;
    const daysToDue = Math.max(0, Math.ceil((m.due - now) / SRS_DAY));
    for (let i = 0; i < forecastDays.length; i++) {
      if (daysToDue <= forecastDays[i]) forecast[i]++;
    }
  }
  return { ivBuckets, ivLabels, efBuckets, efLabels, forecast, forecastDays, learned };
}

