/* ================= 模块：screens/stats 学习数据 =================
 * 职责：学习数据屏幕：区间切换、统计卡片、Canvas 学习曲线与 SRS 图表
 * 依赖：core/stats（区间汇总/分布）、core/store
 * 共享状态：读 S.stats/S.daily，statsRange（本模块持有）
 * ==================================================================== */
/* ---------- 学习数据屏幕 ---------- */
let statsRange = 7;
const STATS_RANGES = [
  [7, "近 7 天"],
  [30, "近 30 天"],
  [90, "近 90 天"],
  [0, "全部"],
];
function setStatsRange(n) {
  statsRange = n;
  renderStats();
}
function renderStats() {
  const today = dailyRec(dayKey(new Date()));
  const todayAcc =
    today.correct + today.errors
      ? Math.round((today.correct / (today.correct + today.errors)) * 100)
      : 0;
  const streak = learnStreak();
  const rows = dailyRange(statsRange);
  const s = sumRange(rows);
  const avgWords = s.active ? Math.round(s.words / s.active) : 0;
  const all = sumRange(dailyRange(0)); // 累计（自有记录以来）
  const duelTotal = (S.stats.p2pWins || 0) + (S.stats.p2pLosses || 0);
  const dist = masteryDist();
  const srs = srsDist();
  const due = dueWords().length,
    wrong = wrongWords().length;
  const totalWords = ALL.filter((w) => !w.phrase).length;
  const stages = ["陌生", "初识", "熟悉", "掌握", "牢固", "永久"];
  const stageColors = ["#9aa7b4", "#4fc3f7", "#7c4dff", "#ffb300", "#ff7043", "#2e9b57"];
  const distTotal = dist.touched || 1;
  const segHtml = stages
    .map(
      (nm, i) =>
        `<div class="mseg" style="width:${(dist.lv[i] / distTotal) * 100}%;background:${
          stageColors[i]
        }" title="${nm} ${dist.lv[i]}"></div>`
    )
    .join("");
  const segLegend = stages
    .map(
      (nm, i) =>
        `<span><i style="background:${stageColors[i]}"></i>${nm} <b>${dist.lv[i]}</b></span>`
    )
    .join("");
  const rangeBtns = STATS_RANGES.map(
    ([n, label]) =>
      `<button class="seg${statsRange === n ? " on" : ""}" onclick="setStatsRange(${n})">${label}</button>`
  ).join("");
  // 每日明细（取区间内最近 30 条有记录的日子）
  const detailRows = rows
    .filter((r) => r.rec && (r.rec.words > 0 || r.rec.games > 0))
    .slice(-30)
    .reverse()
    .map((r) => {
      const d = r.rec;
      const acc = d.correct + d.errors ? Math.round((d.correct / (d.correct + d.errors)) * 100) : 0;
      const md = r.date.slice(5).replace("-", "/");
      const tags = [];
      if (d.ch) tags.push(`挑战×${d.ch}`);
      if (d.duel) tags.push(`单挑${d.duelW}胜${d.duelL}负`);
      if (d.room) tags.push(`乱斗×${d.room}${d.roomWin ? `🏆${d.roomWin}` : ""}`);
      return `<div class="drow"><span class="ddate">${md}</span><span class="dwords">📝 ${d.words} 词</span><span class="dacc">🎯 ${acc}%</span><span class="dtags">${
        tags.join(" · ") || "学习"
      }</span></div>`;
    })
    .join("");
  $("#statsBody").innerHTML = `
  <div class="stat-cards">
    <div class="stat-card"><b style="color:var(--c-y)">${today.words}</b><span>📅 今日单词</span></div>
    <div class="stat-card"><b style="color:var(--ok)">${todayAcc}%</b><span>🎯 今日正确率</span></div>
    <div class="stat-card"><b>${today.games}</b><span>🏅 今日局数</span></div>
    <div class="stat-card"><b style="color:var(--c-p)">${streak}</b><span>🔥 连续学习天数</span></div>
  </div>
  <div class="panel chart-card">
    <div class="chart-head">
      <h3 class="chart-title">📈 学习曲线</h3>
      <div class="pf-seg">${rangeBtns}</div>
    </div>
    <canvas id="learnChart" height="220"></canvas>
    <div class="chart-legend"><span><i style="background:var(--ok)"></i>每日单词数（柱）</span><span><i style="background:var(--c-y)"></i>正确率（线）</span></div>
  </div>
  <div class="stat-cards">
    <div class="stat-card"><b>${s.words}</b><span>📝 区间单词总数</span></div>
    <div class="stat-card"><b>${avgWords}</b><span>📊 活跃日均单词</span></div>
    <div class="stat-card"><b>${s.active}</b><span>🗓 活跃天数</span></div>
    <div class="stat-card"><b style="color:var(--c-c)">${s.acc}%</b><span>🎯 区间平均正确率</span></div>
    <div class="stat-card"><b>${s.ch}</b><span>⚔️ 挑战局数</span></div>
    <div class="stat-card"><b>${s.duel + s.room}</b><span>🌐 对战场次</span></div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🧠 单词掌握情况</h3>
    <div class="mbar">${segHtml || '<div class="mseg" style="width:100%;background:#9aa7b4"></div>'}</div>
    <div class="mlegend">${segLegend}</div>
    <div class="stat-cards" style="margin-top:12px">
      <div class="stat-card sm"><b>${dist.learned}</b><span>已学单词</span></div>
      <div class="stat-card sm"><b style="color:#2e9b57">${dist.mastered}</b><span>已永久掌握</span></div>
      <div class="stat-card sm"><b style="color:var(--c-p)">${due}</b><span>⏰ 待复习</span></div>
      <div class="stat-card sm"><b style="color:var(--bad)">${wrong}</b><span>✏️ 错题本</span></div>
      <div class="stat-card sm"><b>${totalWords}</b><span>📚 词库总词数</span></div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">📊 SRS 记忆强度分析</h3>
    <div class="srs-grid">
      <div class="srs-chart-box">
        <div class="srs-chart-title">间隔分布（天）</div>
        <canvas id="ivChart" height="180"></canvas>
      </div>
      <div class="srs-chart-box">
        <div class="srs-chart-title">难度系数 EF 分布</div>
        <canvas id="efChart" height="180"></canvas>
      </div>
    </div>
    <div class="srs-forecast">
      <div class="srs-chart-title">📅 未来到期复习预测（累计）</div>
      <div class="srs-fc-cards">
        ${srs.forecastDays
          .map(
            (d, i) =>
              `<div class="srs-fc-card"><b style="color:var(--c-p)">${srs.forecast[i]}</b><span>${d} 天内</span></div>`
          )
          .join("")}
      </div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🎮 挑战模式数据</h3>
    <div class="mode-tiles">
      <div class="mtile"><span class="mic">⏱</span><b>${s.mTime}</b><span>限时冲刺 · 累计 ${all.mTime}</span></div>
      <div class="mtile"><span class="mic">☄️</span><b>${s.mFall}</b><span>陨石单词 · 累计 ${all.mFall}</span></div>
      <div class="mtile"><span class="mic">🌸</span><b>${s.mMem}</b><span>花瓣记忆 · 累计 ${all.mMem}</span></div>
      <div class="mtile"><span class="mic">⚔️</span><b>${s.mBattle}</b><span>竞技场 · 累计 ${all.mBattle}</span></div>
    </div>
    <div class="stat-cards" style="margin-top:12px">
      <div class="stat-card sm"><b>${S.stats.games || 0}</b><span>累计总局数</span></div>
      <div class="stat-card sm"><b>×${S.stats.bestCombo || 0}</b><span>最高连击</span></div>
      <div class="stat-card sm"><b>${S.stats.perfect || 0}</b><span>满星通关</span></div>
      <div class="stat-card sm"><b>${S.stats.unitsCleared || 0}</b><span>已通关单元</span></div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🌐 联机对战数据</h3>
    <div class="mode-tiles">
      <div class="mtile wide"><span class="mic">⚔️</span><b>${s.duel}</b><span>单挑场次 · ${s.duelW} 胜 ${s.duelL} 负</span><em>累计 ${duelTotal} 场 · ${S.stats.p2pWins || 0} 胜 ${S.stats.p2pLosses || 0} 负 · 胜率 ${
    duelTotal ? Math.round(((S.stats.p2pWins || 0) / duelTotal) * 100) : 0
  }%</em></div>
      <div class="mtile wide"><span class="mic">👥</span><b>${s.room}</b><span>乱斗轮次 · 🥇 ${s.roomWin} 次第一</span><em>累计 ${S.stats.roomRounds || 0} 轮 · ${S.stats.roomWins || 0} 次第一</em></div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🗓 每日明细（最近 30 条）</h3>
    <div class="dlist">${
      detailRows ||
      '<div class="sub" style="padding:10px;text-align:center">暂无学习记录，快去练几个词吧～</div>'
    }</div>
  </div>`;
  requestAnimationFrame(() => drawLearnChart(rows));
  requestAnimationFrame(() => drawSrsCharts(srs));
}
/* Canvas 学习曲线：柱状=每日单词数，折线=正确率 */
function drawLearnChart(rows) {
  const cv = $("#learnChart");
  if (!cv) return;
  const cssW = cv.clientWidth || cv.parentElement.clientWidth || 640;
  const dpr = window.devicePixelRatio || 1;
  const H = 220;
  cv.width = cssW * dpr;
  cv.height = H * dpr;
  cv.style.height = H + "px";
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();
  const cOk = css("--ok") || "#2e9b57",
    cY = css("--c-y") || "#f5b301",
    cSub = css("--sub") || "#8a93a3",
    cLine = css("--line") || "rgba(255,255,255,.15)";
  const W = cssW,
    padL = 38,
    padR = 38,
    padT = 16,
    padB = 26;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  ctx.clearRect(0, 0, W, H);
  const data = rows.map((r) => {
    const d = r.rec;
    const words = d ? d.words || 0 : 0;
    const tot = d ? (d.correct || 0) + (d.errors || 0) : 0;
    return { date: r.date, words, acc: tot ? (d.correct / tot) * 100 : null };
  });
  const totalWords = data.reduce((a, b) => a + b.words, 0);
  // 空状态
  if (!totalWords) {
    ctx.fillStyle = cSub;
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("暂无学习记录，快去练几个词吧～", W / 2, H / 2);
    return;
  }
  const maxW = Math.max(10, ...data.map((d) => d.words));
  const n = data.length;
  const step = plotW / n;
  const barW = Math.max(3, step * 0.55);
  const yWords = (v) => padT + plotH - (v / maxW) * plotH;
  const yAcc = (v) => padT + plotH - (v / 100) * plotH;
  // 网格 + 左轴（单词数）
  ctx.font = "10px sans-serif";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH / 4) * i;
    ctx.strokeStyle = cLine;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillStyle = cSub;
    ctx.textAlign = "right";
    ctx.fillText(Math.round(maxW - (maxW / 4) * i), padL - 6, y + 3);
    ctx.textAlign = "left";
    ctx.fillText([100, 75, 50, 25, 0][i] + "%", W - padR + 6, y + 3);
  }
  // 柱子
  data.forEach((d, i) => {
    const x = padL + step * i + (step - barW) / 2;
    const y = yWords(d.words);
    if (d.words > 0) {
      const g = ctx.createLinearGradient(0, y, 0, padT + plotH);
      g.addColorStop(0, cOk);
      g.addColorStop(1, cOk + "55");
      ctx.fillStyle = g;
      ctx.beginPath();
      const r = Math.min(3, barW / 2);
      ctx.roundRect(x, y, barW, padT + plotH - y, [r, r, 0, 0]);
      ctx.fill();
    }
  });
  // 正确率折线（跳过无数据日）
  ctx.strokeStyle = cY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let pen = false;
  data.forEach((d, i) => {
    if (d.acc === null) {
      pen = false;
      return;
    }
    const x = padL + step * i + step / 2,
      y = yAcc(d.acc);
    if (!pen) {
      ctx.moveTo(x, y);
      pen = true;
    } else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = cY;
  data.forEach((d, i) => {
    if (d.acc === null) return;
    const x = padL + step * i + step / 2,
      y = yAcc(d.acc);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // X 轴日期标签（最多 ~7 个）
  ctx.fillStyle = cSub;
  ctx.textAlign = "center";
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  data.forEach((d, i) => {
    if (i % labelEvery !== 0 && i !== n - 1) return;
    ctx.fillText(d.date.slice(5).replace("-", "/"), padL + step * i + step / 2, H - 8);
  });
}

/* Canvas SRS 分布图：间隔分布 + EF 分布（柱状图） */
function drawSrsCharts(srs) {
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();
  const cP = css("--c-p") || "#7c4dff",
    cC = css("--c-c") || "#29b6f6",
    cSub = css("--sub") || "#8a93a3",
    cLine = css("--line") || "rgba(255,255,255,.15)",
    cPanel = css("--panel") || "rgba(255,255,255,.06)";
  const drawBar = (cvId, labels, buckets, color) => {
    const cv = $("#" + cvId);
    if (!cv) return;
    const cssW = cv.clientWidth || cv.parentElement.clientWidth || 300;
    const dpr = window.devicePixelRatio || 1;
    const H = 180;
    cv.width = cssW * dpr;
    cv.height = H * dpr;
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = cssW,
      padL = 28,
      padR = 10,
      padT = 12,
      padB = 24;
    const plotW = W - padL - padR,
      plotH = H - padT - padB;
    ctx.clearRect(0, 0, W, H);
    const maxV = Math.max(1, ...buckets);
    const n = buckets.length;
    const barW = Math.max(6, (plotW / n) * 0.7);
    const step = plotW / n;
    // 网格
    ctx.font = "10px sans-serif";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padT + (plotH / 3) * i;
      ctx.strokeStyle = cLine;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillStyle = cSub;
      ctx.textAlign = "right";
      ctx.fillText(Math.round(maxV - (maxV / 3) * i), padL - 4, y + 3);
    }
    // 柱子
    buckets.forEach((v, i) => {
      const x = padL + step * i + (step - barW) / 2;
      const y = padT + plotH - (v / maxV) * plotH;
      if (v > 0) {
        const g = ctx.createLinearGradient(0, y, 0, padT + plotH);
        g.addColorStop(0, color);
        g.addColorStop(1, color + "44");
        ctx.fillStyle = g;
        ctx.beginPath();
        const r = Math.min(3, barW / 2);
        ctx.roundRect(x, y, barW, padT + plotH - y, [r, r, 0, 0]);
        ctx.fill();
      }
      ctx.fillStyle = cSub;
      ctx.textAlign = "center";
      ctx.fillText(labels[i], padL + step * i + step / 2, H - 8);
    });
  };
  drawBar("ivChart", srs.ivLabels, srs.ivBuckets, cC);
  drawBar("efChart", srs.efLabels, srs.efBuckets, cP);
}

