/* ================= 模块：game/mode-battle 对战竞技场 =================
 * 职责：人机 bots 与同屏 2P：renderBattle/battleLoop/onBattleChar、
 *       battleEnd 结算、battlePhase2 接力
 * 依赖：game/core（G，经 routeChar 分派）、core/store、screens/result
 * 共享状态：写 G、bLast（rAF 时间戳）
 * 备注：lane DOM 结构被 net/p2p 复用
 * ==================================================================== */
/* ---------- 对战竞技场 ---------- */
const BOTS = {
  easy: { n: "🐢 机器人·轻松", s: 1.35 },
  mid: { n: "🐇 机器人·进阶", s: 2.35 },
  hard: { n: "🦅 机器人·精英", s: 3.45 },
};
window.startBattle = (btype, diff, pool) => {
  endGameCleanup();
  let q = shuffle(pool.filter((w) => w.en.length <= 12)).slice(0, 8);
  if (S.set.wordOrder === "sequential")
    q = pool.filter((w) => w.en.length <= 12).slice(0, 8);
  const total = q.reduce((a, w) => a + w.en.length, 0);
  G = {
    type: "battle",
    btype,
    diff,
    queue: q,
    total,
    idx: 0,
    typed: 0,
    errors: 0,
    correct: 0,
    combo: 0,
    best: 0,
    chars: 0,
    botChars: 0,
    bot: btype === "bot" ? BOTS[diff] : null,
    phase: 1,
    p: [],
    t0: 0,
    active: true,
    started: false,
    wrong: [],
  };
  S.stats.games++;
  save();
  go("scr-game");
  renderBattle();
  G.raf = requestAnimationFrame(battleLoop);
  countdown();
  refreshOsk();
};
function renderBattle() {
  const foe = G.bot ? G.bot.n : "🎮 玩家二";
  $("#arenaWrap").innerHTML =
    hudHTML(
      "var(--c-y)",
      `对战竞技场 · ${G.btype === "2p" ? "双人轮流" : "人机竞速"}`,
      `<span class="pill">单词 <b id="bIdx">1/${G.queue.length}</b></span>`,
      `<span class="pill">🔥 <b id="combo">0</b></span>`
    ) +
    `<div class="stage"><div class="lanes">
    <div class="lane"><div class="nm"><span>🧑‍ ${
      G.btype === "2p" ? (G.phase === 1 ? "玩家一" : "玩家二") : "你"
    }</span><span id="meP">0%</span></div><div class="track"><div class="fill me" id="meFill"></div><span class="racer" id="meR">🚀</span></div></div>
    <div class="lane"><div class="nm"><span>${foe}</span><span id="foeP">0%</span></div><div class="track"><div class="fill foe" id="foeFill"></div><span class="racer" id="foeR">${
      G.bot ? "🤖" : "🎮"
    }</span></div></div>
   </div>
   <div id="cardBox"></div><div class="wordbox" id="wordBox"></div>
   <div class="run-hint">抢先拼完全部 ${
     G.queue.length
   } 个单词即获胜！</div></div>`;
  showBattleWord();
  updateLanes();
}
function showBattleWord() {
  const it = G.queue[G.idx];
  G.typed = 0;
  G.wordT0 = Date.now();
  $("#cardBox").innerHTML = wordCard(it, true);
  $("#wordBox").style.fontSize = wFont(it.en.length);
  paintWord($("#wordBox"), it.en, 0);
  $("#bIdx").textContent = `${G.idx + 1}/${G.queue.length}`;
}
let bLast = 0;
function battleLoop(ts) {
  if (!G || !G.active || G.type !== "battle") return;
  G.raf = requestAnimationFrame(battleLoop);
  if (!G.started) {
    bLast = ts;
    return;
  }
  if (!G.t0) G.t0 = performance.now();
  const dt = clamp(ts - bLast, 0, 50) / 1000;
  bLast = ts;
  if (G.bot) {
    G.botChars += G.bot.s * dt * (0.88 + Math.random() * 0.24);
    if (G.botChars >= G.total) return battleEnd(false);
  }
  updateLanes();
}
function updateLanes() {
  const mp = clamp(G.chars / G.total, 0, 1),
    fp = clamp((G.bot ? G.botChars : 0) / G.total, 0, 1);
  $("#meFill").style.width = mp * 100 + "%";
  $("#meR").style.left = mp * 100 + "%";
  $("#meP").textContent = Math.round(mp * 100) + "%";
  $("#foeFill").style.width = fp * 100 + "%";
  $("#foeR").style.left = fp * 100 + "%";
  $("#foeP").textContent = Math.round(fp * 100) + "%";
}
function onBattleChar(ch) {
  if (!G.started) return;
  const it = G.queue[G.idx];
  if (same(ch, it.en[G.typed])) {
    G.typed++;
    G.chars++;
    sTick();
    paintWord($("#wordBox"), it.en, G.typed);
    updateLanes();
    if (G.typed >= it.en.length) {
      markWord(it, true, 0, Date.now() - (G.wordT0 || Date.now()));
      S.stats.words++;
      G.correct++;
      G.combo++;
      G.best = Math.max(G.best, G.combo);
      S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
      $("#combo").textContent = G.combo;
      sOk();
      const r = $("#wordBox").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, "var(--c-y)");
      G.idx++;
      if (G.idx >= G.queue.length) return battleEnd(true);
      showBattleWord();
    }
  } else {
    G.errors++;
    G.combo = 0;
    $("#combo").textContent = 0;
    sBad();
    vib(50);
    paintWord($("#wordBox"), it.en, G.typed, true);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
  }
}
function battleEnd(win) {
  endGameCleanup();
  if (G.btype !== "2p" || G.phase === 1) {
    updateDailyStats(G.correct, G.errors, G.score, "battle");
  }
  if (G.btype === "2p") {
    const rec = {
      time: G.t0 ? (performance.now() - G.t0) / 1000 : 0,
      errors: G.errors,
    };
    G.p.push(rec);
    if (G.phase === 1) {
      openModal(
        `<h3>ROUND 1 完成！</h3><div class="sub">玩家一：用时 ${rec.time.toFixed(
          1
        )}s · 失误 ${
          rec.errors
        } 次。<br>请把键盘交给 <b>玩家二</b>，挑战同样的 8 个单词！</div><div class="mbtns"><button class="btn y" onclick="battlePhase2()">玩家二开始 ▶</button></div>`
      );
      return;
    }
    const [a, b] = G.p,
      sa = a.time + a.errors * 2,
      sb = b.time + b.errors * 2,
      w1 = sa <= sb;
    S.stats.wins++;
    save();
    return showResult({
      stamp: w1 ? "P1 WINS!" : "P2 WINS!",
      stats: [
        ["玩家一用时", a.time.toFixed(1) + "s"],
        ["玩家一失误", a.errors],
        ["玩家二用时", b.time.toFixed(1) + "s"],
        ["玩家二失误", b.errors],
      ],
      coins: 40,
      xp: 60,
      wrong: G.wrong,
      restart: () => openMode("battle"),
    });
  }
  if (win) {
    S.stats.wins++;
    if (G.diff === "hard") S.stats.hardWin = 1;
    sWin();
  }
  save();
  const diffB = { easy: 0, mid: 15, hard: 35 }[G.diff] || 0;
  showResult({
    stamp: win ? "YOU WIN!" : "LOSE...",
    stars: null,
    stats: [
      ["拼对单词", G.correct],
      ["最佳连击", "×" + G.best],
      ["失误按键", G.errors],
      ["对手", G.bot.n],
    ],
    coins: win ? 60 + diffB : 15,
    xp: win ? 80 + diffB : 25,
    wrong: G.wrong,
    restart: () => openMode("battle"),
  });
}
window.battlePhase2 = () => {
  closeModal();
  G.phase = 2;
  G.idx = 0;
  G.chars = 0;
  G.errors = 0;
  G.combo = 0;
  G.t0 = 0;
  G.active = true;
  G.started = false;
  renderBattle();
  G.raf = requestAnimationFrame(battleLoop);
  countdown();
  refreshOsk();
};

