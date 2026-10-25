import { dataAct, $, $$ } from "../core/utils";
import { registerAct } from "../ui/events";
import { dueWords, wrongWords } from "../core/srs";
import { S, save } from "../core/store";
import { escA } from "../core/utils";
import { BOOKS } from "../data/books";
import { DYN_SOURCES, dynCfg, dynDailyQueue, dynNormDaily, dynProgress, dynSource, ensureDynLoaded, stageColor } from "../data/dynamic";
import { bookOf } from "../data/index";
import { cur } from "../game/mode-mem";
import { startLevel, startRun, startTime } from "../game/mode-run";
import { openP2PMode } from "../net/p2p";
import { toast } from "../ui/fx";
import { go, refreshHead } from "../ui/shell";

/* ================= 模块：screens/home 主页 =================
 * 职责：主页渲染（词库标签/关卡地图/今日任务/动态词库面板）、模态框
 *       openModal/closeModal、个人资料、错词本入口、开始/复习/错词按钮
 * 依赖：core/store（S）、core/srs（dueWords/wrongWords）、data/dynamic（dyn*，运行时）
 *       ui/*（运行时）、game 各模式（运行时）
 * 共享状态：读 S / modalOpen，写 DOM（#bkTabs/#lvMap/#dynPanel 等）
 * 备注：渲染层持有部分开局入口（startRun/startTime），属既有设计
 * ==================================================================== */
/* ================= 顺序/随机切换 ================= */
export function toggleWordOrder() {
  S.set.wordOrder = S.set.wordOrder === "random" ? "sequential" : "random";
  save();
  renderHome();
  toast(
    "📋 单词顺序：" + (S.set.wordOrder === "random" ? "🔀 随机" : "➡️ 顺序")
  );
}

/* ================= 主页 ================= */
export function renderHome() {
  if (window.speechSynthesis) speechSynthesis.getVoices();

  // 词库标签：内置词库（闯关）+ 扩展词库（每日精练）同区展示，点击都只切换下方动态区
  let tabsHtml = BOOKS.filter((b: any) => !dynSource(b.id))
    .map(
      (b: any) =>
        `<button class="bktab ${b.id === S.curBook ? "on" : ""}" style="--bc:${
          b.color
        };--stc:${stageColor(b.stage)}" ${dataAct('pickBook', b.id)}>${b.name.replace(" · ", "")}</button>`
    )
    .join("");
  // 扩展词库始终显示名称（未加载也可选中），选中后在下方动态区设置词量/次序并懒加载
  tabsHtml += DYN_SOURCES.map(
    (s: any) =>
      `<button class="bktab dyn ${s.id === S.curBook ? "on" : ""}" style="--bc:${
        s.color
      };--stc:${stageColor(s.stage)}" title="${s.name} · ${s.stage ? s.stage + " · " : ""}扩展词库每日精练" ${dataAct('pickBook', s.id)}>${s.name}</button>`
  ).join("");
  // 顺序/随机切换按钮（仅内置闯关相关）
  tabsHtml += `<button class="bktab order-btn" ${dataAct('toggleWordOrder')} style="--bc:var(--c-c);margin-left:auto;">${
    S.set.wordOrder === "random" ? "🔀 随机" : "➡️ 顺序"
  }</button>`;
  $("#bkTabs").innerHTML = tabsHtml;

  // 当前选中：扩展词库（可能尚未加载）还是内置词库
  const dynSrc = dynSource(S.curBook);
  let b = bookOf(S.curBook);
  if (!dynSrc && !b) {
    // 兜底：选中项异常时回退到第一个内置词库
    S.curBook = BOOKS.find((x: any) => !dynSource(x.id))?.id || BOOKS[0].id;
    b = bookOf(S.curBook);
  }
  if (dynSrc) {
    // ── 扩展词库·每日精练动态区 ──
    const cfg = dynCfg(dynSrc.id);
    $("#heroName").textContent = dynSrc.name;
    $("#heroTag").textContent = dynSrc.stage ? "扩展 · " + dynSrc.stage : "扩展词库";
    $("#heroTag").style.background = dynSrc.color;
    $("#heroMeta").textContent = b
      ? `${b.items.length} 词条 · 每日精练 ${cfg.daily} 词/天`
      : `${dynSrc.size || "扩展词库"} · 点击开始自动加载`;
    $("#lvMap").style.display = "none";
    $("#btnStart").style.display = "none";
    $("#dynPanel").style.display = "";
    $("#btnDynStart").style.display = "";
    $("#btnDynStart").disabled = false;
    renderDynPanel(dynSrc.id, b);
    if (!b) ensureDynLoaded(dynSrc); // 未加载则后台静默拉取，完成后自动刷新
  } else {
    // ── 内置词库·闯关动态区（功能不变） ──
    $("#dynPanel").style.display = "none";
    $("#btnDynStart").style.display = "none";
    $("#lvMap").style.display = "";
    $("#btnStart").style.display = "";
    const pr = S.prog[b.id] || { cleared: 0, stars: {} },
      lvN = b.units.length;
    $("#heroName").textContent = b.name;
    $("#heroTag").textContent = b.stage;
    $("#heroTag").style.background = b.color;
    const got = Object.values(pr.stars || {}).reduce((a: any, c: any) => a + c, 0);
    $("#heroMeta").textContent = `${b.units.length} 个单元 · ${
      b.items.length
    } 词条 · 已通 ${pr.cleared} 单元 · ⭐ ${got}/${lvN * 3}`;
    $("#lvMap").innerHTML = b.units
      .map((u: any, i: any) => {
        const st = pr.stars?.[i],
          unlocked = i <= pr.cleared,
          cur = i === pr.cleared && unlocked;
        return `<div class="lvchip ${cur ? "cur" : ""} ${
          unlocked ? "" : "lock"
        }" title="${u.n}" ${dataAct('clickLv', i)}><b>${u.s}</b><span class="st">${
          st ? "★".repeat(st) + "☆".repeat(3 - st) : unlocked ? "GO" : "🔒"
        }</span></div>`;
      })
      .join("");
    const nxt = Math.min(pr.cleared, lvN - 1);
    $("#btnStart").textContent =
      pr.cleared >= lvN
        ? "🔁 重新挑战全册"
        : `▶ 开始 ${b.units[nxt].s} · ${b.units[nxt].n}`;
  }
  const today = new Date().toISOString().slice(0, 10);
  const dstat = S.daily[today] || {
    words: 0,
    correct: 0,
    errors: 0,
    score: 0,
    games: 0,
  };
  const acc =
    dstat.correct + dstat.errors
      ? Math.round((dstat.correct / (dstat.correct + dstat.errors)) * 100)
      : 0;
  $(
    "#todayStats"
  ).innerHTML = `<span>📅 今日学习：<b style="color:var(--c-y)">${dstat.words}</b> 词</span>
   <span>✅ 正确：<b style="color:var(--ok)">${dstat.correct}</b></span>
   <span>❌ 错误：<b style="color:var(--bad)">${dstat.errors}</b></span>
   <span>🎯 正确率：<b style="color:var(--c-c)">${acc}%</b></span>
   <span>🏅 局数：<b>${dstat.games}</b></span>`;
  const due = dueWords().length,
    wr = wrongWords().length;
  $("#dueN").textContent = due;
  $("#dueTxt").textContent = due
    ? "根据遗忘曲线，这些词该见面了"
    : "太棒了，暂无待复习单词 ✨";
  $("#btnReview").disabled = !due;
  $("#wrongN").textContent = wr;
  $("#btnWrong").disabled = !wr;
  // ── 今日任务卡：纯数据展示（待复习 + 新学目标 + 已完成 + 进度条） ──
  // 复习入口统一走下方「今日复习任务」卡片的「开始复习」按钮，避免重复
  const freshGoal = dynSrc ? dynCfg(dynSrc.id).daily : 20;
  const goal = due + freshGoal;
  const done = dstat.words || 0;
  const pct = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  $("#todayTask").innerHTML = goal
    ? `<div class="task-card">
        <div class="task-head">
          <span class="task-title">🎯 今日任务</span>
          <span class="task-pct"><b style="color:var(--c-y)">${done}</b> / ${goal} 词 · ${pct}%</span>
        </div>
        <div class="task-bar"><i style="width:${pct}%"></i></div>
        <div class="task-body">
          <div class="task-item"><span class="tk-due">⏰ 待复习</span><b>${due}</b></div>
          <div class="task-item"><span class="tk-fresh">🌱 新学目标</span><b>${freshGoal}</b></div>
          <div class="task-item"><span class="tk-done">✅ 已完成</span><b>${done}</b></div>
        </div>
      </div>`
    : "";
  refreshHead();
}
export function pickBook(id: any) {
  S.curBook = id;
  save();
  renderHome();
  // 选中扩展词库：后台静默懒加载，完成后自动刷新进度（不阻塞页面）
  const src = dynSource(id);
  if (src) ensureDynLoaded(src);
}
// 渲染扩展词库·每日精练动态区：进度条/文本 + 滑块值 + 次序分段
export function renderDynPanel(id: any, b: any) {
  const cfg = dynCfg(id);
  $("#dynDaily").value = cfg.daily;
  $("#dynDailyVal").textContent = cfg.daily;
  $("#btnDynStart").textContent = `▶ 开始今日练习（${cfg.daily} 词）`;
  $$("#dynOrderSeg .seg").forEach((x: any) =>
    x.classList.toggle("on", x.dataset.v === cfg.order)
  );
  const fill = $("#dynProgFill"),
    txt = $("#dynProgTxt");
  const p = dynProgress(id);
  if (!p || !b) {
    fill.style.width = "0%";
    txt.textContent =
      "⏳ 词库尚未加载：点「开始今日练习」自动加载（首次需联网，之后走本地缓存）";
    return;
  }
  let pct: any, line: any;
  if (cfg.order === "rand") {
    pct = p.total ? Math.round((p.learned / p.total) * 100) : 0;
    line = `🔀 随机模式 · 已学 ${p.learned}/${p.total} 词（${pct}%）· 已掌握 ${p.mastered} 词 · 每批随机抽 ${cfg.daily} 词`;
  } else {
    const pos = Math.min(cfg.pos, p.total);
    pct = p.total ? Math.round((pos / p.total) * 100) : 0;
    line = `${cfg.order === "rev" ? "⬅️ 逆序" : "➡️ 顺序"}闯关 · 本轮进度 ${pos}/${p.total}（${pct}%）· 已学 ${p.learned} 词 · 已掌握 ${p.mastered} 词`;
  }
  fill.style.width = pct + "%";
  txt.textContent = line;
}
export function clickLv(i: any) {
  const b = bookOf(S.curBook),
    pr = S.prog[b.id] || { cleared: 0, stars: {} };
  if (i > pr.cleared) {
    toast("🔒 先通过前面的单元");
    return;
  }
  startLevel(S.curBook, i);
}
$("#btnStart").onclick = () => {
  const b = bookOf(S.curBook),
    pr = S.prog[b.id] || { cleared: 0 };
  startLevel(S.curBook, Math.min(pr.cleared, b.units.length - 1));
};
$("#btnReview").onclick = () => {
  const q = dueWords().slice(0, 15); // 已按 SRS 逾期优先级排序
  if (q.length) startRun({ mode: "review", title: "复习任务", queue: q });
  else toast("✅ 暂无到期复习词，去学新词或挑战吧");
};
$("#btnWrong").onclick = () => {
  const q = wrongWords().slice(0, 15); // 已按 SRS 逾期优先级排序
  if (q.length) startRun({ mode: "review", title: "错题重练", queue: q });
  else toast("🎉 错词都已掌握，继续加油！");
};
// ── 扩展词库·每日精练控件（元素常驻，绑定一次即可） ──
$("#dynDaily").addEventListener("input", () => {
  const src = dynSource(S.curBook);
  if (!src) return;
  const cfg = dynCfg(src.id);
  cfg.daily = dynNormDaily($("#dynDaily").value);
  $("#dynDaily").value = cfg.daily;
  save();
  $("#dynDailyVal").textContent = cfg.daily;
  $("#btnDynStart").textContent = `▶ 开始今日练习（${cfg.daily} 词）`;
});
$$("#dynOrderSeg .seg").forEach((btn: any) =>
  btn.addEventListener("click", () => {
    const src = dynSource(S.curBook);
    if (!src) return;
    const cfg = dynCfg(src.id);
    cfg.order = btn.dataset.v;
    save();
    $$("#dynOrderSeg .seg").forEach((x: any) =>
      x.classList.toggle("on", x === btn)
    );
    renderDynPanel(src.id, bookOf(src.id));
  })
);
$("#btnDynStart").onclick = async () => {
  const src = dynSource(S.curBook);
  if (!src) return;
  const btn = $("#btnDynStart");
  if (btn.disabled) return;
  let b = bookOf(src.id);
  if (!b) {
    // 懒加载：进入练习前确保词库就绪
    btn.disabled = true;
    btn.textContent = "⏳ 词库加载中…";
    const ok = await ensureDynLoaded(src);
    if (!ok) {
      btn.disabled = false;
      renderDynPanel(src.id, null);
      toast("⚠️ 词库加载失败：" + src.name + "，请稍后重试");
      return;
    }
    b = bookOf(src.id);
  }
  const q = dynDailyQueue(b.items, src.id);
  if (!q.length) {
    toast("⚠️ 词库为空：" + src.name);
    return;
  }
  startRun({ mode: "daily", title: src.name, queue: q, keepOrder: true });
};

/* ================= 弹窗 ================= */
export let modalOpen = false,
  modalToken = 0;
export function openModal(html: any) {
  modalOpen = true;
  $("#mbox").innerHTML = html;
  $("#modal").classList.remove("hide");
}
export function closeModal() {
  modalOpen = false;
  $("#modal").classList.add("hide");
  modalToken++;
}

/* ================= 个人资料 ================= */
let pfBack: any = null, // 从联机对战入口进入资料页，保存后返回
  pfDraft: any = {};
const PF_AVATARS = ["🧑", "👩", "👨", "🧔", "👧", "👦", "🦊", "🐼", "🐯", "🐸", "🤖", "👻"],
  PF_MOODS = ["😀", "😄", "😎", "🥳", "😤", "😴", "🤔", "😢", "😭", "🤯", "💪", "🔥"];
$("#btnProfile").onclick = () => openProfileModal();
export function openProfileModal() {
  pfDraft = Object.assign(
    { name: "", gender: "保密", avatar: "🧑", mood: "", moodEmoji: "😀" },
    S.profile || {}
  );
  const avHtml = PF_AVATARS.map(
    (e: any) =>
      `<button class="emopick ${pfDraft.avatar === e ? "on" : ""}" data-k="avatar" data-v="${e}" ${dataAct('pfPick')}>${e}</button>`
  ).join("");
  const moodHtml = PF_MOODS.map(
    (e: any) =>
      `<button class="emopick ${pfDraft.moodEmoji === e ? "on" : ""}" data-k="moodEmoji" data-v="${e}" ${dataAct('pfPick')}>${e}</button>`
  ).join("");
  openModal(
    `<h3>👤 个人资料</h3><div class="sub">设置后将展示在联机对战中对方面前</div>
  <div class="pf-row"><label>姓名</label><input class="pf-input" id="pfName" placeholder="输入昵称（最多 12 字）" maxlength="12" value="${escA(pfDraft.name)}"></div>
  <div class="pf-row"><label>性别</label><div class="pf-seg">${["男", "女", "保密"]
    .map(
      (g: any) =>
        `<button class="seg ${pfDraft.gender === g ? "on" : ""}" data-k="gender" data-v="${g}" ${dataAct('pfPick')}>${g}</button>`
    )
    .join("")}</div></div>
  <div class="pf-row"><label>头像</label><div class="emogrid">${avHtml}</div></div>
  <div class="pf-row"><label>一句话心情</label><input class="pf-input" id="pfMood" placeholder="例如：今天也要加油！" maxlength="20" value="${escA(pfDraft.mood)}"></div>
  <div class="pf-row"><label>心情表情</label><div class="emogrid">${moodHtml}</div></div>
  <div class="mbtns"><button class="btn y" ${dataAct('saveProfile')}>💾 保存</button><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>取消</button></div>`
  );
}
export function pfPick(el: any) {
  const k = el.dataset.k,
    v = el.dataset.v;
  if (!k) return;
  pfDraft[k] = v;
  el.parentElement
    .querySelectorAll(".emopick,.seg")
    .forEach((b: any) => b.classList.toggle("on", b === el));
}
export function saveProfile() {
  pfDraft.name = ($("#pfName")?.value || "").trim().slice(0, 12);
  pfDraft.mood = ($("#pfMood")?.value || "").trim().slice(0, 20);
  if (!pfDraft.avatar) pfDraft.avatar = "🧑";
  if (!pfDraft.moodEmoji) pfDraft.moodEmoji = "😀";
  S.profile = Object.assign({}, pfDraft);
  save();
  refreshHead();
  const back = pfBack;
  pfBack = null;
  closeModal();
  toast("👤 资料已保存");
  if (back === "p2p") openP2PMode();
}
export function openProfileFromP2P() {
  pfBack = "p2p";
  openProfileModal();
}

/* ================= 错题查看 ================= */
export function showWrongList() {
  const list = wrongWords();
  if (!list.length) {
    toast("🎉 没有错词，继续加油！");
    return;
  }
  const html = `<h3>📖 错题本</h3><div class="sub">共 ${
    list.length
  } 个单词曾被拼错（点击发音）</div>
  <div style="max-height:60vh;overflow-y:auto;text-align:left">
    ${list
      .map((w: any) => {
        const m = S.mastery[w.en.toLowerCase()];
        return `<div style="border-bottom:1px dashed var(--line);padding:6px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <span><b>${w.en}</b> ${w.cn}</span>
        <span style="color:var(--bad);font-size:.8rem">错误 ${
          m ? m.w : 0
        } 次</span>
        <button class="phspk" data-t="${w.en}">🔊</button>
      </div>`;
      })
      .join("")}
  </div>
  <div class="mbtns"><button class="btn c" ${dataAct('closeModalWrongRetry')}>错题重练</button><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>关闭</button></div>`;
  openModal(html);
}


registerAct("toggleWordOrder", (_el: any, _ev: any, args: any[]) => (toggleWordOrder as any)(...(args || [])));

registerAct("pickBook", (_el: any, _ev: any, args: any[]) => (pickBook as any)(...(args || [])));

registerAct("clickLv", (_el: any, _ev: any, args: any[]) => (clickLv as any)(...(args || [])));

registerAct("closeModal", (_el: any, _ev: any, args: any[]) => (closeModal as any)(...(args || [])));


registerAct("openProfileModal", (_el: any, _ev: any, args: any[]) => (openProfileModal as any)(...(args || [])));

// pfPick 需要拿到被点击元素（读取 data-k/data-v），经中央委托表注册，
// 由 ui/events 在点击时把元素传给它（等价原 onclick="pfPick(this)"）。
registerAct("pfPick", (el) => pfPick(el));
registerAct("saveProfile", (_el: any, _ev: any, args: any[]) => (saveProfile as any)(...(args || [])));
registerAct("openProfileFromP2P", (_el: any, _ev: any, args: any[]) => (openProfileFromP2P as any)(...(args || [])));
registerAct("showWrongList", (_el: any, _ev: any, args: any[]) => (showWrongList as any)(...(args || [])));

/* 复合动作（桥接拆除前依赖 window.closeModal/window.go，现改为真实引用并注册于此）：
   关闭弹窗后回主页 / 关闭弹窗后重试错词 */
registerAct("closeModalGoHome", () => {
  closeModal();
  go("scr-home");
});
registerAct("closeModalWrongRetry", () => {
  closeModal();
  const btn = $("#btnWrong");
  if (btn) btn.click();
});
