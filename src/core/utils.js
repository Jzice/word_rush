/* ================= 模块：core/utils 工具与全局常量 =================
 * 职责：DOM 选择器（$/$$）、随机与数学工具、HTML 转义、震动、词条解析 P()、
 *       全局常量（词性 POS / 掌握度等级名 LVN / 存档键 K）
 * 依赖：无（基础层，必须先于其余所有模块加载）
 * 共享状态：无
 * ==================================================================== */
/* ================= 工具 ================= */
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a),
  pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const escA = (s) => escHtml(s).replace(/"/g, "&quot;");
const vib = (ms) => {
  try {
    navigator.vibrate && navigator.vibrate(ms);
  } catch (e) {}
}
const wFont = (n) =>
  n > 9 ? "clamp(1.2rem,4.6vw,2.2rem)" : "clamp(1.8rem,6vw,3.3rem)";
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const P = (s) => (s ? s.split("|").map((p) => p.split("@")) : []);
const K = "wordrush_v1";

const POS = {
  n: "名词",
  v: "动词",
  a: "形容词",
  d: "副词",
  p: "介词",
  c: "连词",
  r: "代词",
  t: "数词",
  i: "感叹词",
  e: "短语",
};
const posCls = (p) => (["n", "v", "a", "d", "e"].includes(p) ? p : "x");
const LVN = ["陌生", "初识", "熟悉", "掌握", "牢固", "永久"];

