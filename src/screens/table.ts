import { dataAct, $ } from "../core/utils";
import { registerAct } from "../ui/events";
import { S, save } from "../core/store";
import { LVN, escHtml, posCls } from "../core/utils";
import { BOOKS } from "../data/books";
import { ALL, bookOf } from "../data/index";
import { PHRASES } from "../data/phrases";
import { startLevel } from "../game/mode-run";
import { fmtDue } from "./book";
import { speak } from "../ui/audio";

/* ================= 模块：screens/table 单词表 =================
 * 职责：单词表屏幕：单元学习情况与统计、搜索/筛选、短语关联展示
 * 依赖：core/store（S）、data/index（BOOKS/bookOf/ALL）、data/phrases（PHRASES）
 *       ui/render（posCls）、screens/book（fmtDue）
 * 共享状态：读 S.mastery
 * ==================================================================== */
/* ---------- 📋 单词表（单元学习情况与统计） ---------- */
$("#tSearch").oninput = renderTable;
$("#tFilter").onchange = renderTable;
export function tPass(it: any, f: any, q: any) {
  const m = S.mastery[it.en.toLowerCase()];
  if (q && !it.en.toLowerCase().includes(q) && !it.cn.includes(q)) return false;
  if (f === "due") return m && m.r > 0 && m.lv < 5 && m.due <= Date.now();
  if (f === "wrong") return m && m.w > 0;
  if (f === "max") return m && m.lv >= 5;
  if (f === "new") return !m || m.r === 0;
  return true;
}
export function tPhrase(it: any) {
  if (it.phrase) return `<b>${escHtml(it.en)}</b> ${escHtml(it.cn)}`;
  const c = PHRASES[it.en.toLowerCase()];
  if (c) {
    const [a, b] = c.split(" // ");
    return `<b>${escHtml(a)}</b> ${escHtml(b)}`;
  }
  const up = bookOf(it.book).items.filter((x: any) => x.phrase && x.ui === it.ui);
  if (up.length) return `📌 <b>${escHtml(up[0].en)}</b> ${escHtml(up[0].cn)}`;
  return '<span style="opacity:.4">—</span>';
}
export function tRow(it: any) {
  const m = S.mastery[it.en.toLowerCase()],
    lvv = m ? m.lv : 0,
    pc = posCls(it.pos);
  const dueHot = m && m.r > 0 && m.lv < 5 && m.due <= Date.now();
  return `<tr ${dataAct('speak', it.en.replace(/'/g, ""))}>
  <td class="we2"><i class="wp wp-${pc}">${it.pos}</i>${escHtml(it.en)}</td>
  <td>${escHtml(it.cn)}</td>
  <td class="ph2">${tPhrase(it)}</td>
  <td><div class="mcell"><span class="mbar">${[1, 2, 3, 4, 5]
    .map((i: any) => `<i class="${i <= lvv ? "on" : ""}"></i>`)
    .join("")}</span><span class="lvn">${LVN[lvv]}</span></div></td>
  <td class="rw2"><i style="color:var(--ok)">${
    m ? m.r : 0
  }✓</i> <i style="color:var(--bad)">${m ? m.w : 0}✗</i></td>
  <td class="due ${
    dueHot ? "hot" : ""
  }" style="text-align:left;min-width:0">${fmtDue(m)}</td>
  <td><button class="spk2" ${dataAct('speak', it.en.replace(/'/g, ""))}>🔊</button></td></tr>`;
}
export function renderTable() {
  const b = bookOf(S.curBook);
  $("#tTabs").innerHTML = BOOKS.map(
    (x: any) =>
      `<button class="bktab ${x.id === S.curBook ? "on" : ""}" style="--bc:${
        x.color
      }" ${dataAct('pickTableBook', x.id)}>${x.name.replace(
        " · ",
        ""
      )}</button>`
  ).join("");
  let totR = 0,
    totA = 0,
    learned = 0,
    mastered = 0,
    due = 0,
    wrong = 0;
  for (const it of ALL) {
    const m = S.mastery[it.en.toLowerCase()];
    if (m) {
      totR += m.r;
      totA += m.r + m.w;
      if (m.r > 0) learned++;
      if (m.lv >= 5) mastered++;
      if (m.r > 0 && m.lv < 5 && m.due <= Date.now()) due++;
      if (m.w > 0) wrong++;
    }
  }
  const acc = totR + totA ? Math.round((totR / totA) * 100) : 0;
  $(
    "#tStats"
  ).innerHTML = `<div class="tstat" style="--tc:var(--c-b)"><b>${ALL.length}</b><span>总词条</span></div>
   <div class="tstat" style="--tc:var(--c-c)"><b>${learned}</b><span>已学习</span></div>
   <div class="tstat" style="--tc:var(--ok)"><b>${mastered}</b><span>已掌握(永久)</span></div>
   <div class="tstat" style="--tc:var(--bad)"><b>${due}</b><span>待复习</span></div>
   <div class="tstat" style="--tc:var(--c-p)"><b>${wrong}</b><span>需巩固</span></div>
   <div class="tstat" style="--tc:var(--c-y)"><b>${acc}%</b><span>拼写正确率</span></div>`;
  const q = ($("#tSearch").value || "").trim().toLowerCase(),
    f = $("#tFilter").value;
  let html = "",
    shown = 0;
  b.units.forEach((u: any, ui: any) => {
    const items = b.items
      .filter((it: any) => it.ui === ui)
      .filter((it: any) => tPass(it, f, q));
    if (!items.length) return;
    let ur = 0,
      ua = 0,
      ul = 0,
      um = 0;
    b.items
      .filter((it: any) => it.ui === ui)
      .forEach((it: any) => {
        const m = S.mastery[it.en.toLowerCase()];
        if (m) {
          ur += m.r;
          ua += m.r + m.w;
          if (m.r > 0) ul++;
          if (m.lv >= 5) um++;
        }
      });
    const uacc = ua ? Math.round((ur / ua) * 100) : null;
    const pr = (S.prog[b.id] || {}).stars || {};
    html += `<div class="ublock" style="--uc:${b.color}">
   <div class="uhd"><span class="udot"></span>
    <span class="un">${u.s} · ${u.n}</span>
    <span class="us2">${items.length}/${
      b.items.filter((it: any) => it.ui === ui).length
    } 词 · 已学 ${ul} · 已会 ${um}${uacc != null ? ` · 正确率 ${uacc}%` : ""}${
      pr[ui] ? ` · ${"★".repeat(pr[ui])}` : ""
    }</span>
    <button class="btn c sm" ${dataAct('startLevel', b.id, ui)}>练本单元 ▶</button></div>
   <div class="tblwrap"><table class="wt"><thead><tr>
    <th>单词 / 词性</th><th>中文释义</th><th>关联短语 / 搭配</th><th>掌握度</th><th>对 / 错</th><th>复习安排</th><th></th>
   </tr></thead><tbody>${items.map(tRow).join("")}</tbody></table></div></div>`;
    shown += items.length;
  });
  $("#tBody").innerHTML =
    html ||
    `<div class="panel" style="text-align:center;color:var(--sub);padding:34px">当前筛选没有匹配的单词，换个筛选条件试试～</div>`;
}
export function pickTableBook(id: any) {
  S.curBook = id;
  save();
  renderTable();
}






registerAct("pickTableBook", (_el: any, _ev: any, args: any[]) => (pickTableBook as any)(...(args || [])));
