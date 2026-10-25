import { markWord } from "../core/srs";
import { updateDailyStats } from "../core/stats";
import { S, save } from "../core/store";
import { escHtml, pick, rnd, same, shuffle, sleep, vib, wFont, $ } from "../core/utils";
import { ALL } from "../data/index";
import { G, setG, countdown, endGameCleanup, hudHTML, routeChar } from "./core";
import { openMode } from "../screens/mode-select";
import { showResult } from "../screens/result";
import { beep, sBad, sOk, sTick, sWin, speak } from "../ui/audio";
import { burst, toast } from "../ui/fx";
import { wordCard } from "../ui/render";
import { go, refreshOsk } from "../ui/shell";

/* ================= 模块：game/mode-mem 花瓣记忆 =================
 * 职责：花瓣记忆模式：startMemory 构造 G、花朵 SVG、闪现/隐藏动画、
 *       onMemChar、orb 特效、结算
 * 依赖：game/core（G，经 routeChar 分派）、core/store、ui/fx、screens/result
 * 共享状态：写 G
 * ==================================================================== */
/* ---------- 🌸 花瓣记忆 ---------- */
export const PETAL_COLORS = [
  "#ffffff",
  "#ffb3c9",
  "#ff6b6b",
  "#7cc7ff",
  "#ffd84d",
  "#c6a9ff",
];
export const TIER_XP = [0, 60, 150, 280, 450, 700];
export function flowerSVG(petals: any, color: any, size: any) {
  let s = "";
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    s += `<ellipse cx="0" cy="-27" rx="13" ry="23" fill="${color}" stroke="rgba(0,0,0,.25)" stroke-width="2.5" transform="rotate(${a})"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="-55 -55 110 110">${s}<circle r="15" fill="#ffd93b" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/></svg>`;
}
export function startMemory(pool: any) {
  endGameCleanup();
  if (!pool || !pool.length)
    pool = ALL.filter((w: any) => !w.phrase && w.en.length <= 12);
  let queue = [...pool];
  if (S.set.wordOrder === "random") queue = shuffle(queue);
  queue = queue.slice(0, 10);
  setG({
    type: "mem",
    pool,
    queue: queue,
    idx: 0,
    phase: "show",
    focus: -1,
    typed: 0,
    errsPos: {},
    correct: 0,
    perfectN: 0,
    errors: 0,
    streak: 0,
    best: 0,
    score: 0,
    sxp: 0,
    tier: 0,
    seq: 0,
    active: true,
    started: false,
    wrong: [],
  });
  S.stats.games++;
  save();
  go("scr-game");
  $("#arenaWrap").innerHTML =
    hudHTML(
      "#ff8fb3",
      "花瓣记忆 · PETAL MEMORY",
      `<span class="pill">单词 <b id="mIdx">1/${queue.length}</b></span>`,
      `<span class="pill">🌸 连对 <b id="mStreak">0</b></span><span class="pill">得分 <b id="mScore">0</b></span>`
    ) +
    `<div class="stage florr" id="memStage">
    <div class="flower-wrap" id="flowerWrap">${flowerSVG(
      5,
      "#ffffff",
      104
    )}<div class="flower-lv" id="flowerLv">LV 1 · 白花</div></div>
    <div id="memCn"></div>
    <div class="fword" id="memWord"></div>
    <div class="mem-msg" id="memMsg"></div></div>`;
  G.iv = setInterval(() => {
    if (G && G.active && G.type === "mem") {
      const p = document.createElement("span");
      p.className = "pfloat";
      p.textContent = pick(["🌸", "🌼", ""]);
      p.style.left = rnd(2, 94) + "%";
      p.style.fontSize = rnd(12, 22) + "px";
      p.style.animationDuration = rnd(4, 7) + "s";
      $("#memStage").appendChild(p);
      setTimeout(() => p.remove(), 7200);
    }
  }, 900);
  countdown().then(() => {
    if (G && G.active) memShow();
  });
  refreshOsk();
}
export const cur = () => G.queue[G.idx];
export const setMsg = (t: any) => {
  const m = $("#memMsg");
  if (m) m.textContent = t;
};
export function memPaint() {
  const it = cur();
  $("#memWord").innerHTML = [...it.en]
    .map((ch: any, i: any) => {
      const c = ch === " " ? "&nbsp;" : escHtml(ch);
      if (G.phase === "show")
        return `<span class="fl ${i === G.focus ? "focus" : ""}">${c}</span>`;
      if (G.phase === "hide")
        return i < G.typed
          ? `<span class="fl mok">${c}</span>`
          : `<span class="fl hid" id="ms${i}">?</span>`;
      return `<span class="fl ${G.errsPos[i] ? "warn" : "mok"}">${c}</span>`;
    })
    .join("");
}
export async function memShow() {
  if (!G || !G.active) return;
  G.phase = "show";
  G.focus = -1;
  const it = cur(),
    my = ++G.seq;
  $("#memCn").innerHTML = wordCard(it, true);
  $("#memWord").style.fontSize = wFont(it.en.length);
  memPaint();
  setMsg("👀 记住拼写 · 逐字母拼读中…");
  for (let i = 0; i < it.en.length; i++) {
    if (!G || !G.active || G.seq !== my) return;
    await sleep(560);
    G.focus = i;
    memPaint();
    if (it.en[i] !== " ") {
      speak(it.en[i]);
      beep(480 + i * 36, 0.06, "sine", 0.03);
    }
  }
  await sleep(650);
  if (!G || !G.active || G.seq !== my) return;
  speak(it.en);
  setMsg("🧠 整词再听一遍，默记拼写…");
  await sleep(1300);
  if (!G || !G.active || G.seq !== my) return;
  memHide();
}
export function memHide() {
  G.phase = "hide";
  G.typed = 0;
  G.errsPos = {};
  G.wordT0 = Date.now();
  memPaint();
  setMsg("✍️ 凭记忆拼出它！正确字母会逐个点亮");
}
export function onMemChar(ch: any) {
  if (!G.started || G.phase !== "hide") return;
  const it = cur();
  if (same(ch, it.en[G.typed])) {
    G.typed++;
    sTick();
    memPaint();
    const slot = $("#memWord").children[G.typed - 1];
    if (slot) {
      const r = slot.getBoundingClientRect();
      spawnOrb(r.left + r.width / 2, r.top + r.height / 2);
    }
    G.score += 2;
    $("#mScore").textContent = G.score;
    if (G.typed >= it.en.length) memDone();
  } else {
    G.errors++;
    G.errsPos[G.typed] = (G.errsPos[G.typed] || 0) + 1;
    sBad();
    vib(50);
    const slot = $("#ms" + G.typed);
    if (slot) {
      slot.classList.add("err");
      setTimeout(() => slot.classList.remove("err"), 220);
    }
    const bee = document.createElement("span");
    bee.className = "bee";
    bee.textContent = "🐝";
    $("#memStage").appendChild(bee);
    setTimeout(() => bee.remove(), 1200);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
  }
}
export function spawnOrb(x: any, y: any) {
  const o = document.createElement("span");
  o.className = "orb";
  o.style.left = x + "px";
  o.style.top = y + "px";
  document.body.appendChild(o);
  const f = $("#flowerWrap").getBoundingClientRect();
  requestAnimationFrame(() => {
    o.style.transform = `translate(${f.left + f.width / 2 - x}px,${
      f.top + f.height / 2 - y
    }px) scale(.4)`;
    o.style.opacity = ".25";
  });
  setTimeout(() => {
    o.remove();
    const w = $("#flowerWrap");
    if (w) {
      w.classList.remove("pulse");
      void w.offsetWidth;
      w.classList.add("pulse");
    }
  }, 620);
}
export async function memDone() {
  const it = cur(),
    my = ++G.seq;
  G.phase = "done";
  const errCount = Object.values(G.errsPos).reduce((a: any, b: any) => a + b, 0) as number,
    perfect = errCount === 0;
  markWord(it, true, errCount, Date.now() - (G.wordT0 || Date.now()));
  S.stats.words++;
  S.stats.memPerfect = (S.stats.memPerfect || 0) + (perfect ? 1 : 0);
  G.correct++;
  if (perfect) {
    G.perfectN++;
    G.streak++;
    G.best = Math.max(G.best, G.streak);
  } else {
    G.streak = 0;
    G.wrong.push(it);
  }
  S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
  G.score += it.en.length * 5 + (perfect ? 15 : 0) + G.streak * 3;
  G.sxp += it.en.length * 4 + (perfect ? 20 : 5);
  memPaint();
  $("#mStreak").textContent = G.streak;
  $("#mScore").textContent = G.score;
  const badPos = Object.keys(G.errsPos)
    .map(Number)
    .map((i: any) => i + 1);
  setMsg(
    perfect
      ? "🌼 完美拼写！花瓣更盛了"
      : `💡 提示：第 ${badPos.join("、")} 个字母拼错了，重点记它！`
  );
  speak(it.en);
  if (perfect) sOk();
  const r = $("#memWord").getBoundingClientRect();
  burst(
    r.left + r.width / 2,
    r.top + r.height / 2,
    perfect ? "#ffb3c9" : "#ffe14d"
  );
  updateFlower();
  await sleep(perfect ? 1700 : 2300);
  if (!G || !G.active || G.seq !== my) return;
  G.idx++;
  if (G.idx >= G.queue.length) return finishMemory();
  $("#mIdx").textContent = `${G.idx + 1}/${G.queue.length}`;
  memShow();
}
export function updateFlower() {
  let t = 0;
  for (let i = 0; i < TIER_XP.length; i++) if (G.sxp >= TIER_XP[i]) t = i;
  const petals = 5 + Math.min(6, G.streak);
  if (t !== G.tier) {
    G.tier = t;
    toast(
      "🌸 花朵升级！",
      "花瓣变为 " + ["白色", "粉色", "红色", "蓝色", "金色", "紫色"][t]
    );
    sWin();
  }
  $("#flowerWrap").innerHTML =
    flowerSVG(petals, PETAL_COLORS[G.tier], 104) +
    `<div class="flower-lv">LV ${G.tier + 1} · ${
      ["白花", "粉花", "红花", "蓝花", "金花", "紫花"][G.tier]
    } · ${petals}瓣</div>`;
}
export function finishMemory() {
  endGameCleanup();
  updateDailyStats(G.correct, G.errors, G.score);
  save();
  showResult({
    stamp: "BLOOM!",
    stats: [
      ["完美拼写", G.perfectN + "/" + G.queue.length],
      ["最佳连对", "×" + G.best],
      ["失误按键", G.errors],
      ["本局得分", G.score],
    ],
    coins: G.correct * 4 + G.perfectN * 5 + G.best * 2,
    xp: G.correct * 12 + G.perfectN * 6,
    wrong: G.wrong,
    restart: () => openMode("memory"),
  });
}















