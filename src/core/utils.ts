/* ================= 模块：core/utils 工具与全局常量 =================
 * 职责：DOM 选择器（$/$$）、随机与数学工具、HTML 转义、震动、词条解析 P()、
 *       全局常量（词性 POS / 掌握度等级名 LVN / 存档键 K）
 * 依赖：无（基础层，必须先于其余所有模块加载）
 * 共享状态：无
 * ==================================================================== */
/* ================= 工具 ================= */
export const $ = (s: any) => document.querySelector(s),
  $$ = (s: any) => [...document.querySelectorAll(s)];
export const rnd = (a: any, b: any) => a + Math.random() * (b - a),
  pick = (a: any) => a[(Math.random() * a.length) | 0];
export const clamp = (v: any, a: any, b: any) => Math.max(a, Math.min(b, v));
export const shuffle = (a: any) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const sleep = (ms: any) => new Promise((r) => setTimeout(r, ms));
export const escHtml = (s: any) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const escA = (s: any) => escHtml(s).replace(/"/g, "&quot;");
// 生成 HTML 时替代内联 onclick：data-act="动作名" + data-args='[...]'（单引号包裹，JSON 内置双引号无需转义）。
// 点击委托（ui/events）会解析 data-args 并调用同名全局函数（或注册的 act），行为与 onclick="fn(args)" 一致。
// 参数经 JSON 序列化后仅转义 & < > '，浏览器读取属性时自动还原实体，JSON.parse 得到原值。
export const dataAct = (name: string, ...args: any[]): string => {
  if (!args.length) return `data-act="${name}"`;
  const json = JSON.stringify(args)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;");
  return `data-act="${name}" data-args='${json}'`;
};
export const vib = (ms: any) => {
  try {
    navigator.vibrate && navigator.vibrate(ms);
  } catch (e) {}
}
export const wFont = (n: any) =>
  n > 9 ? "clamp(1.2rem,4.6vw,2.2rem)" : "clamp(1.8rem,6vw,3.3rem)";
export const same = (a: any, b: any) => String(a).toLowerCase() === String(b).toLowerCase();
export const P = (s: any) => (s ? s.split("|").map((p: any) => p.split("@")) : []);
export const K = "wordrush_v1";

export const POS: any = {
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
export const posCls = (p: any) => (["n", "v", "a", "d", "e"].includes(p) ? p : "x");
export const LVN = ["陌生", "初识", "熟悉", "掌握", "牢固", "永久"];



















