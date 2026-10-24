/* ================= 模块：screens/mode-select 模式设置 =================
 * 职责：模式设置弹窗 sel/openMode、书册/难度选项、#goBtn 分发到各模式
 *       （动态词库在此惰性加载）
 * 依赖：data/dynamic（applyDynamicBook）、game 各模式、ui/fx
 * 共享状态：sel（本模块持有）
 * ==================================================================== */
/* ================= 模式设置弹窗 ================= */
let sel = { book: "mix", btype: "bot", diff: "mid" };
const bookOpts = () =>
  `<button class="opt on" data-b="mix" data-kind="builtin">🎲 混合词库</button>` +
  BOOKS.map(
    (b) => `<button class="opt" data-b="${b.id}" data-kind="${dynSource(b.id) ? "dyn" : "builtin"}">${b.name}</button>`
  ).join("") +
  DYN_SOURCES.filter((s) => !dynLoaded(s.id)).map(
    (s) => `<button class="opt" data-b="${s.id}" data-kind="unloaded">${s.name} <small>${s.size}</small></button>`
  ).join("");
window.openMode = (m) => {
  if (m === "time" || m === "fall" || m === "memory") {
    sel.book = "mix";
    const info = {
      time: [
        "TIME RUSH",
        "60 秒内拼出尽可能多的单词，连击越高分越高",
        "开始 ⏱ 60s",
      ],
      fall: ["WORD FALL", "单词不断坠落，在触底前把它拼完击碎", "开始 ☄️"],
      memory: [
        "PETAL MEMORY",
        "florr 花瓣记忆：先展示单词并逐字母聚焦拼读，然后隐藏，凭记忆拼写；拼错的字母最后集中提示。",
        "🌸 进入草地",
      ],
    };
    openModal(`<h3>${info[m][0]}</h3><div class="sub">${info[m][1]}</div>
  <div class="sub" style="margin-bottom:8px">选择词库：</div><div class="optrow" id="bkOpts">${bookOpts()}</div>
  <div class="mbtns"><button class="btn y" id="goBtn">${
    info[m][2]
  }</button><button class="btn sm" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`);
  }
  if (m === "battle") {
    sel.btype = "bot";
    sel.diff = "mid";
    sel.book = "mix";
    openModal(`<h3>PVP ARENA</h3><div class="sub">同一组词，谁先拼完谁赢！人机竞速或双人同屏轮流比拼。</div>
  <div class="sub" style="margin-bottom:8px">对手：</div><div class="optrow" id="btOpts">
   <button class="opt on" data-t="bot-easy">🐢 机器人·轻松</button><button class="opt" data-t="bot-mid">🐇 机器人·进阶</button><button class="opt" data-t="bot-hard">🦅 机器人·精英</button><button class="opt" data-t="2p">🎮 双人同屏</button></div>
  <div class="sub" style="margin-bottom:8px">词库：</div><div class="optrow" id="bkOpts">${bookOpts()}</div>
  <div class="mbtns"><button class="btn y" id="goBtn">⚔️ 进入竞技场</button><button class="btn sm" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`);
  }
  const tk = modalToken;
  $$("#bkOpts .opt").forEach(
    (o) =>
      (o.onclick = () => {
        if (tk !== modalToken) return;
        $$("#bkOpts .opt").forEach((x) => x.classList.remove("on"));
        o.classList.add("on");
        sel.book = o.dataset.b;
      })
  );
  if (m === "battle")
    $$("#btOpts .opt").forEach(
      (o) =>
        (o.onclick = () => {
          if (tk !== modalToken) return;
          $$("#btOpts .opt").forEach((x) => x.classList.remove("on"));
          o.classList.add("on");
          const t = o.dataset.t;
          if (t === "2p") {
            sel.btype = "2p";
          } else {
            sel.btype = "bot";
            sel.diff = t.split("-")[1];
          }
        })
    );
  $("#goBtn").onclick = async () => {
    // 若选中了尚未加载的扩展词库 → 惰性加载（静默），成功后才开局
    if (sel.book !== "mix" && !bookOf(sel.book)) {
      const src = dynSource(sel.book);
      if (src) {
        const ok = await applyDynamicBook(src, { silent: true });
        if (!ok) { toast("⚠️ 词库加载失败：" + src.name + "，请稍后重试"); return; }
      }
    }
    closeModal();
    const pool = sel.book === "mix" ? ALL : bookOf(sel.book).items;
    if (m === "time") startTime(weightedPool(pool, 40));
    else if (m === "fall")
      startFalling(weightedPool(pool.filter((w) => !w.phrase && w.en.length <= 10), 60));
    else if (m === "memory")
      startMemory(pool.filter((w) => !w.phrase && w.en.length <= 12));
    else startBattle(sel.btype, sel.diff, weightedPool(pool.filter((w) => w.en.length <= 12), 8));
  };
};

