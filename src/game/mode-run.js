/* ================= 模块：game/mode-run 闯关/限时/复习/每日 =================
 * 职责：startLevel/startTime/startRun 构造 G，showWord/tickTime/HUD、
 *       onRunChar 输入处理、错词 shake、完成与失败结算
 * 依赖：game/core（G，经 routeChar 分派）、core/srs、screens/result
 * 共享状态：写 G
 * ==================================================================== */
/* ---------- 单元闯关 / 限时 / 复习 ---------- */
window.startLevel = (bookId, ui) => {
  const b = bookOf(bookId),
    u = b.units[ui];
  let queue = b.items.filter((it) => it.ui === ui);
  if (S.set.wordOrder === "random") queue = shuffle(queue);
  startRun({
    mode: "level",
    bookId,
    li: ui,
    title: `${u.s} ${u.n}`,
    queue: queue,
    lives: 3,
  });
};
window.startTime = (pool) => {
  let queue = [...pool];
  if (S.set.wordOrder === "random") queue = shuffle(queue);
  startRun({ mode: "time", title: "限时冲刺", queue: queue, time: 60 });
};
function startRun(cfg) {
  let queue = [...cfg.queue];
  // keepOrder：扩展词库每日精练已按 顺序/逆序/随机 排好，不再受全局随机开关影响
  if (!cfg.keepOrder && S.set.wordOrder === "random") queue = shuffle(queue);
  endGameCleanup();
  G = {
    type: "run",
    mode: cfg.mode,
    cfg,
    queue: queue,
    idx: 0,
    typed: 0,
    curErrs: 0,
    errors: 0,
    correct: 0,
    score: 0,
    combo: 0,
    best: 0,
    lives: cfg.lives || 0,
    timeLeft: cfg.time || 0,
    wrong: [],
    retried: new Set(),
    shield: false,
    active: true,
    started: false,
  };
  S.stats.games++;
  save();
  go("scr-game");
  const mc =
    cfg.mode === "level"
      ? "var(--c-y)"
      : cfg.mode === "time"
      ? "var(--c-c)"
      : "var(--c-b)";
  const mid =
    cfg.mode === "time"
      ? `<span class="pill">⏱ <b id="tLeft">${cfg.time}</b>s</span>`
      : `<span class="pill">进度 <b id="prog">1/${queue.length}</b></span>`;
  const right = `${
    cfg.mode === "level" ? `<span class="hearts" id="hearts">♥♥♥</span>` : ""
  }
   <span class="pill">🔥 <b id="combo">0</b></span><span class="pill">得分 <b id="score">0</b></span>
   ${itemBtns({
     hint: true,
     time: cfg.mode === "time",
     shield: cfg.mode === "level",
   })}`;
  const hd =
    cfg.mode === "level"
      ? `${cfg.title} · ${bookOf(cfg.bookId).name.split(" · ")[0]}`
      : `${cfg.title} · ${
          cfg.mode === "time"
            ? "60 秒"
            : cfg.mode === "daily"
            ? "每日精练"
            : "记忆计划"
        }`;
  const extraHint =
    cfg.mode === "time"
      ? `<div style="font-size:0.7rem;color:var(--sub);text-align:center;margin-top:4px;">拼写正确自动朗读（🔊控制）</div>`
      : "";
  $("#arenaWrap").innerHTML =
    hudHTML(mc, hd, mid, right) +
    `<div class="stage"><div id="cardBox"></div><div class="wordbox" id="wordBox"></div>
     <button class="speakbtn" onclick="speak(queue[G.idx]&&queue[G.idx].en)">🔊 听发音</button>
     <div class="run-hint">${
       cfg.mode === "level"
         ? "键入拼写（大小写均可）· 单词内错 3 次扣一颗心"
         : "键入拼写 · 连击越高分越高"
     }</div>${extraHint}</div>`;
  refreshItems();
  showWord();
  if (cfg.mode === "time") G.iv = setInterval(tickTime, 1000);
  countdown();
  refreshOsk();
}
function showWord() {
  const it = G.queue[G.idx];
  if (!it) return;
  G.typed = 0;
  G.curErrs = 0;
  G.wordT0 = Date.now();
  $("#cardBox").innerHTML = wordCard(it, false);
  $("#wordBox").style.fontSize = wFont(it.en.length);
  paintWord($("#wordBox"), it.en, 0);
  if (G.mode !== "time" && $("#prog"))
    $("#prog").textContent = `${G.idx + 1}/${G.queue.length}`;
  if (S.set.tts && G.mode !== "time") speak(it.en);
}
function tickTime() {
  if (!G || !G.active || !G.started) return;
  G.timeLeft--;
  const t = $("#tLeft");
  if (t) t.textContent = Math.max(0, Math.ceil(G.timeLeft));
  if (G.timeLeft <= 0) finishRun(true);
}
function updateRunHud() {
  $("#combo").textContent = G.combo;
  $("#score").textContent = G.score;
  const h = $("#hearts");
  if (h)
    h.textContent =
      "♥".repeat(Math.max(0, G.lives)) + "♡".repeat(Math.max(0, 3 - G.lives));
}
function goodChar() {
  const it = G.queue[G.idx];
  G.typed++;
  sTick();
  paintWord($("#wordBox"), it.en, G.typed);
  if (G.typed >= it.en.length) runComplete();
}
function onRunChar(ch) {
  if (!G.started) return;
  const it = G.queue[G.idx];
  if (!it) return;
  if (same(ch, it.en[G.typed])) {
    goodChar();
  } else {
    if (G.shield) {
      G.shield = false;
      sShield();
      floaty(innerWidth / 2, 180, "🛡️ 抵挡!", "var(--c-c)");
      return;
    }
    G.errors++;
    G.curErrs++;
    G.combo = 0;
    sBad();
    vib(50);
    paintWord($("#wordBox"), it.en, G.typed, true);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
    updateRunHud();
    if (G.curErrs >= 3) runFailWord();
  }
}
function runFailWord() {
  const it = G.queue[G.idx];
  markWord(it, false, G.curErrs, Date.now() - (G.wordT0 || Date.now()));
  G.wrong.push(it);
  if (G.mode === "level") {
    G.lives--;
    updateRunHud();
    if (G.lives <= 0) return finishRun(false);
  }
  if (!G.retried.has(it.en.toLowerCase())) {
    G.retried.add(it.en.toLowerCase());
    G.queue.push({ ...it });
  }
  G.idx++;
  if (G.idx >= G.queue.length) finishRun(true);
  else showWord();
}
function runComplete() {
  const it = G.queue[G.idx];
  const rt = Date.now() - (G.wordT0 || Date.now());
  markWord(it, true, G.curErrs, rt);
  S.stats.words++;
  G.correct++;
  G.combo++;
  G.best = Math.max(G.best, G.combo);
  S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
  const gain = 10 + Math.min(G.combo, 20) * 2;
  G.score += gain;
  const r = $("#wordBox").getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, "var(--ok)");
  if (G.combo % 5 === 0)
    floaty(innerWidth / 2, r.top - 20, "COMBO x" + G.combo + "!", "var(--c-y)");
  floaty(r.right, r.top, "+" + gain, "var(--ok)");
  sOk();
  if (G.curErrs > 0) G.wrong.push(it);
  // 会话内滞后再现：拼对但错键多(≥2)或反应过慢的词，本局结束前再出现一次
  const slowBudget = (1200 + it.en.length * 500) * 1.6;
  const needReplay =
    G.curErrs >= 2 || (rt > 0 && rt > slowBudget);
  if (
    needReplay &&
    !G.retried.has(it.en.toLowerCase()) &&
    G.mode !== "time"
  ) {
    G.retried.add(it.en.toLowerCase());
    G.queue.push({ ...it });
    floaty(innerWidth / 2, r.top - 40, "🔁 稍后再见", "var(--c-p)");
  }
  if (G.mode === "time" && S.set.tts) speak(it.en);
  updateRunHud();
  G.idx++;
  if (G.idx >= G.queue.length) finishRun(true);
  else showWord();
}
function finishRun(victory) {
  endGameCleanup();
  updateDailyStats(G.correct, G.errors, G.score);
  save();
  let stars = 0;
  if (G.mode === "level" && victory) {
    stars = G.errors === 0 ? 3 : G.errors <= 4 ? 2 : 1;
    const pr =
      S.prog[G.cfg.bookId] ||
      (S.prog[G.cfg.bookId] = { cleared: 0, stars: {} });
    const first = !pr.stars[G.cfg.li];
    pr.stars[G.cfg.li] = Math.max(pr.stars[G.cfg.li] || 0, stars);
    pr.cleared = Math.max(pr.cleared, G.cfg.li + 1);
    if (first) {
      S.stats.unitsCleared = (S.stats.unitsCleared || 0) + 1;
    }
    if (stars === 3) S.stats.perfect++;
  }
  const coins =
      G.correct * 4 + G.best * 2 + (victory && G.mode === "level" ? 20 : 0),
    xp = G.correct * 10 + G.best * 3;
  showResult({
    stamp: victory ? (G.mode === "time" ? "TIME UP!" : "CLEAR!") : "FAILED...",
    stars: G.mode === "level" ? stars : null,
    stats: [
      ["拼对单词", G.correct],
      ["最佳连击", "×" + G.best],
      ["失误按键", G.errors],
      ["本局得分", G.score],
    ],
    coins,
    xp,
    wrong: [...new Map(G.wrong.map((w) => [w.en.toLowerCase(), w])).values()],
    restart: () => {
      if (G.mode === "level") startLevel(G.cfg.bookId, G.cfg.li);
      else startRun(G.cfg);
    },
  });
  checkAch();
}

