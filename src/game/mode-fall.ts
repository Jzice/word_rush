import { markWord } from "../core/srs";
import { updateDailyStats } from "../core/stats";
import { S, save } from "../core/store";
import { clamp, escHtml, pick, rnd, same, shuffle, vib, $ } from "../core/utils";
import { tagWord } from "../core/phonics";
import { ALL } from "../data/index";
import { G, setG, countdown, endGameCleanup, hudHTML, itemBtns, refreshItems, routeChar } from "./core";
import { showResult } from "../screens/result";
import { sBad, sOk, sShield, sTick, speak } from "../ui/audio";
import { burst, floaty } from "../ui/fx";
import { go, refreshOsk } from "../ui/shell";

/* ================= 模块：game/mode-fall 陨石单词 =================
 * 职责：陨石单词模式：startFalling 构造 G、rAF 下落循环、生成/命中/销毁、
 *       onFallChar、结束判定
 * 依赖：game/core（G，经 routeChar 分派）、core/store、ui/fx、screens/result
 * 共享状态：写 G、fallLast（rAF 时间戳）
 * ==================================================================== */
/* ---------- 陨石单词 ---------- */
export function startFalling(pool: any) {
  endGameCleanup();
  if (!pool.length) pool = ALL.filter((w: any) => !w.phrase && w.en.length <= 10);
  let wordPool = [...pool];
  if (S.set.wordOrder === "random") wordPool = shuffle(wordPool);
  setG({
    type: "fall",
    pool: wordPool,
    words: [],
    target: null,
    lives: 3,
    score: 0,
    combo: 0,
    best: 0,
    correct: 0,
    errors: 0,
    spawnAcc: 1e9,
    active: true,
    started: false,
    wrong: [],
    shield: false,
    t0: 0,
  });
  S.stats.games++;
  save();
  go("scr-game");
  $("#arenaWrap").innerHTML =
    hudHTML(
      "var(--c-p)",
      "陨石单词 · WORD FALL",
      `<span class="hearts" id="hearts">♥♥♥</span>`,
      `<span class="pill">🔥 <b id="combo">0</b></span><span class="pill">得分 <b id="score">0</b></span>${itemBtns(
        { hint: false, time: false, shield: true }
      )}`
    ) +
    `<div class="stage" style="padding:18px;justify-content:flex-start"><div class="fall-area" id="fallArea"></div>
     <div class="fall-input" id="fallInput">— 输入首字母锁定单词 —</div>
     <div class="run-hint">单词坠到底线将损失一颗心 · 拼错会丢失锁定</div>
     <div style="font-size:0.7rem;color:var(--sub);text-align:center;margin-top:4px;">拼写正确自动朗读（🔊控制）</div></div>`;
  refreshItems();
  G.raf = requestAnimationFrame(fallLoop);
  countdown();
  refreshOsk();
}
let fallLast = 0;
export function fallLoop(ts: any) {
  if (!G || !G.active || G.type !== "fall") return;
  G.raf = requestAnimationFrame(fallLoop);
  const area = $("#fallArea");
  if (!area) return;
  if (!G.started) {
    fallLast = ts;
    return;
  }
  const dt = clamp(ts - fallLast, 0, 50) / 1000;
  fallLast = ts;
  if (!G.t0) G.t0 = ts;
  const el = (ts - G.t0) / 1000;
  G.spawnAcc += dt * 1000;
  const gap = Math.max(1000, 2500 - el * 14);
  if (G.spawnAcc > gap && G.words.length < 7) {
    G.spawnAcc = 0;
    spawnFall();
  }
  const H = area.clientHeight,
    spd = 30 + el * 0.9;
  for (const w of [...G.words]) {
    w.y += spd * dt;
    w.el.style.top = w.y + "px";
    if (w.y > H - 56) bottomHit(w);
  }
}
export function spawnFall() {
  const cand = G.pool.filter((p: any) => !G.words.some((w: any) => w.it.en === p.en));
  if (!cand.length) return;
  const it = pick(cand),
    el = document.createElement("div");
  el.className = "fword-f";
  el.innerHTML = escHtml(it.en);
  el.style.left = rnd(4, innerWidth < 640 ? 45 : 66) + "%";
  el.style.top = "-44px";
  $("#fallArea").appendChild(el);
  G.words.push({ it, el, y: -44, matched: 0, errs: 0, t: Date.now() });
}
export function paintFall(w: any) {
  const tg = S.set.phonics ? tagWord(w.it.en) : null;
  const ph = (i: any) => (tg && w.it.en[i] !== " " ? " " + tg[i].cls : "");
  w.el.innerHTML = [...w.it.en]
    .map((c: any, i: any) =>
      i < w.matched
        ? `<span class="ok${ph(i)}">${c}</span>`
        : `<span class="${ph(i).trim()}">${c}</span>`
    )
    .join("");
}
export function onFallChar(ch: any) {
  if (!G.started) return;
  if (!G.target) {
    const cands = G.words.filter((w: any) => same(w.it.en[0], ch));
    if (!cands.length) return fallMiss();
    G.target = cands.reduce((a: any, b: any) => (a.y > b.y ? a : b));
    G.target.matched = 1;
    G.target.el.classList.add("target");
    paintFall(G.target);
    sTick();
    paintFallInput();
  } else {
    const w = G.target;
    if (same(ch, w.it.en[w.matched])) {
      w.matched++;
      sTick();
      paintFall(w);
      paintFallInput();
      if (w.matched >= w.it.en.length) destroyFall(w);
    } else fallMiss();
  }
}
export function paintFallInput() {
  const i = $("#fallInput");
  if (!G.target) {
    i.textContent = "— 输入首字母锁定单词 —";
    return;
  }
  const w = G.target;
  const tg = S.set.phonics ? tagWord(w.it.en) : null;
  const ph = (k: any) => (tg && w.it.en[k] !== " " ? " " + tg[k].cls : "");
  i.innerHTML = [...w.it.en]
    .map((c: any, k: any) => {
      if (k < w.matched) {
        const st = S.set.phonics ? "" : ' style="color:var(--ok)"';
        return `<span class="ok${ph(k)}"${st}>${c}</span>`;
      }
      return `<span class="${ph(k).trim()}">${c}</span>`;
    })
    .join("");
}
export function fallMiss() {
  if (G.shield) {
    G.shield = false;
    sShield();
    floaty(innerWidth / 2, 200, "🛡️ 抵挡!", "var(--c-c)");
    return;
  }
  G.errors++;
  G.combo = 0;
  sBad();
  vib(50);
  if (G.target) {
    G.target.errs++;
    G.target.el.classList.remove("target");
    G.target = null;
  }
  paintFallInput();
  $("#combo").textContent = 0;
  const st = $("#arenaWrap .stage");
  if (st) {
    st.classList.add("shake");
    setTimeout(() => st.classList.remove("shake"), 320);
  }
}
export function destroyFall(w: any) {
  const r = w.el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top, "var(--c-y)");
  markWord(w.it, true, w.errs, Date.now() - (w.t || Date.now()));
  S.stats.words++;
  G.correct++;
  G.combo++;
  G.best = Math.max(G.best, G.combo);
  S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
  const gain = w.it.en.length * 5 + Math.min(G.combo, 15) * 2;
  G.score += gain;
  floaty(r.left, r.top, "+" + gain, "var(--c-y)");
  sOk();
  if (S.set.tts) speak(w.it.en);
  if (G.combo % 5 === 0)
    floaty(innerWidth / 2, r.top - 14, "COMBO x" + G.combo + "!", "var(--c-p)");
  w.el.remove();
  G.words = G.words.filter((x: any) => x !== w);
  G.target = null;
  paintFallInput();
  $("#combo").textContent = G.combo;
  $("#score").textContent = G.score;
}
export function bottomHit(w: any) {
  markWord(w.it, false, 1, Date.now() - (w.t || Date.now()));
  if (!G.wrong.some((x: any) => same(x.en, w.it.en))) G.wrong.push(w.it);
  if (G.target === w) {
    G.target = null;
    paintFallInput();
  }
  w.el.remove();
  G.words = G.words.filter((x: any) => x !== w);
  G.lives--;
  G.combo = 0;
  sBad();
  vib(60);
  $("#hearts").textContent =
    "♥".repeat(Math.max(0, G.lives)) + "♡".repeat(Math.max(0, 3 - G.lives));
  $("#combo").textContent = 0;
  const st = $("#arenaWrap .stage");
  if (st) {
    st.classList.add("shake");
    setTimeout(() => st.classList.remove("shake"), 320);
  }
  if (G.lives <= 0) endFall();
}
export function endFall() {
  endGameCleanup();
  updateDailyStats(G.correct, G.errors, G.score);
  save();
  showResult({
    stamp: "GAME OVER",
    stats: [
      ["击碎单词", G.correct],
      ["最佳连击", "×" + G.best],
      ["漏掉/失误", G.errors],
      ["本局得分", G.score],
    ],
    coins: G.correct * 4 + G.best * 2,
    xp: G.correct * 10 + G.best * 3,
    wrong: G.wrong,
    restart: () => startFalling(G.pool),
  });
}











