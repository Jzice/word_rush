/* ================= 模块：core/store 存档 =================
 * 职责：存档 schema def()、全局存档单例 S、save() 持久化、
 *       掌握度查询 mOf()、SRS 到期间隔表 DUE
 * 依赖：core/utils（K）、localStorage
 * 共享状态：S（本模块创建并持有，其余模块读写其字段）、localStorage wordrush_v1
 * ==================================================================== */
const DUE = [0, 20 * 6e4, 12 * 36e5, 864e5, 2 * 864e5, 4 * 864e5];

/* ================= 存档 ================= */
function def() {
  return {
    coins: 60,
    xp: 0,
    theme: "board",
    themes: ["board"],
    items: { hint: 1, time: 0, shield: 0 },
    curBook: "j1",
    prog: {},
    mastery: {},
    ach: {},
    stats: {
      games: 0,
      words: 0,
      bestCombo: 0,
      perfect: 0,
      hardWin: 0,
      wins: 0,
      memPerfect: 0,
      unitsCleared: 0,
      p2pWins: 0,
      p2pLosses: 0,
      roomRounds: 0,
      roomWins: 0,
    },
    set: { sound: true, tts: true, osk: "auto", wordOrder: "random" },
    profile: {
      name: "",
      gender: "保密",
      avatar: "🧑",
      mood: "",
      moodEmoji: "😀",
    },
    daily: {},
    dyn: {}, // 扩展词库每日精练设置：{ [id]: { daily, order, pos } }
  };
}
let S;
try {
  S = Object.assign(def(), JSON.parse(localStorage.getItem(K) || "{}"));
  S.items = Object.assign({ hint: 1, time: 0, shield: 0 }, S.items);
  S.stats = Object.assign(def().stats, S.stats);
  S.set = Object.assign(
    { sound: true, tts: true, osk: "auto", wordOrder: "random" },
    S.set
  );
  S.profile = Object.assign(
    { name: "", gender: "保密", avatar: "🧑", mood: "", moodEmoji: "😀" },
    S.profile
  );
  if (!S.daily) S.daily = {};
  if (!S.dyn || typeof S.dyn !== "object") S.dyn = {};
} catch (e) {
  S = def();
}
const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {}
};
const mOf = (en) =>
  S.mastery[en.toLowerCase()] ||
  (S.mastery[en.toLowerCase()] = {
    lv: 0,
    r: 0,
    w: 0,
    due: 0,
    reps: 0, // 连续答对次数（答错归零）
    lapses: 0, // 遗忘重学次数
    iv: 0, // 当前复习间隔（天）
    ef: 2.5, // SM-2 难度系数（1.3-2.8，越低越难）
    first: 0, // 首次学习时间
    last: 0, // 最近答题时间
    rt: 0, // 平均反应时长（毫秒）
  });

