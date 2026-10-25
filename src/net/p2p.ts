import { dataAct, $, $$ } from "../core/utils";
import { registerAct } from "../ui/events";
import { markWord } from "../core/srs";
import { lvl, updateDailyStats } from "../core/stats";
import { S, save } from "../core/store";
import { clamp, escHtml, same, shuffle, vib, wFont } from "../core/utils";
import { BOOKS } from "../data/books";
import { DYN_SOURCES, dynLoaded, dynSource, ensureDynLoaded } from "../data/dynamic";
import { ALL, bookOf } from "../data/index";
import { G, setG, countdown, endGameCleanup, hudHTML, paintWord, refreshItems, routeChar } from "../game/core";
import { checkAch, copyShareLink } from "../screens/achievements";
import { closeModal, modalOpen, openModal, openProfileFromP2P } from "../screens/home";
import { bookOpts, sel } from "../screens/mode-select";
import { sBad, sOk, sTick } from "../ui/audio";
import { burst, coinBump, toast } from "../ui/fx";
import { wordCard } from "../ui/render";
import { go, refreshHead, refreshOsk } from "../ui/shell";

/* ================= 模块：net/p2p 联机对战 =================
 * 职责：PeerJS 1v1 单挑 + 多人房间（连接/信令/对局循环/结算/再来一局）、
 *       ?room= 邀请自动加入（加载时 IIFE）
 * 依赖：PeerJS（index.html 外链）、game/core（G/routeChar）、screens/result、
 *       core/store、ui/shell
 * 共享状态：peer/conn/p2pRoom/members/roomScores 等连接态（本模块持有），写 S
 * 备注：复用 battle 的 lane DOM 结构；本文件最大，后续可再拆 duel/room
 * ==================================================================== */
/* ================= P2P 联机（1v1 / 多人房间） ================= */
export let peer: any = null,
  conn: any = null,
  p2pRoom: any = null,
  p2pReady: any = false,
  p2pMode: any = null, // "duel" | "room"
  oppProfile: any = null,
  isHost: any = false,
  p2pRematchMe: any = false,
  p2pRematchFoe: any = false,
  p2pLastRoomCode: any = "", // 记忆上次加入的房间码
  // ---- 多人房间 ----
  hostConns: any = {}, // 房主侧：peerId -> { conn }
  members: any = {}, // 双方：peerId -> { id, profile, prog, errors, done }
  myPeerId: any = null,
  roomMax: any = 16,
  p2pState: any = "lobby", // lobby | playing
  roomScores: any = {}, // 乱斗累计积分：peerId -> 得分（房主权威，随消息同步）
  roomResults: any = {}, // 本轮完成记录：peerId -> { time(秒), errors }（房主收集）
  roomEnded: any = false; // 本轮是否已结束（防重复结算）
let p2pSelBook: any = "mix", // 房主选定的对战词库（"mix" 或词库 id）
  p2pRoundWords: any = null, // 本局统一词表（房主生成，随 start 消息分发给所有人）
  p2pStarting: any = false; // 房主开局去重（异步加载词库期间防重复点击）
const ROOM_SEC = 60; // 乱斗每轮限时（秒）
const P2P_WORD_COUNT = 8; // 每局对战单词数

/* 房主选词库选项（复用 bookOpts 列表，但选中态绑定 p2pSelBook） */
const p2pBookOpts = () =>
  `<button class="opt${p2pSelBook === "mix" ? " on" : ""}" data-b="mix" data-kind="builtin">🎲 混合词库</button>` +
  BOOKS.map(
    (b: any) => `<button class="opt${p2pSelBook === b.id ? " on" : ""}" data-b="${b.id}" data-kind="${
      dynSource(b.id) ? "dyn" : "builtin"
    }">${b.name}</button>`
  ).join("") +
  DYN_SOURCES.filter((s: any) => !dynLoaded(s.id))
    .map(
      (s: any) =>
        `<button class="opt${p2pSelBook === s.id ? " on" : ""}" data-b="${s.id}" data-kind="unloaded">${s.name} <small>${s.size}</small></button>`
    )
    .join("");
/* 绑定大厅词库选项点击（乱斗/单挑大厅共用） */
function p2pBindBookOpts(sel: any) {
  $$(sel + " .opt").forEach((o: any) => {
    o.onclick = () => {
      $$(sel + " .opt").forEach((x: any) => x.classList.remove("on"));
      o.classList.add("on");
      p2pSelBook = o.dataset.b;
    };
  });
}
/* 生成邀请链接：?room=<房间码>&mode=duel|room，对方打开即自动加入 */
export function p2pInviteUrl(mode: any) {
  const u = new URL(location.href);
  u.searchParams.delete("challenge"); // 邀请链接只做邀请，避免对方同时触发闯关
  u.searchParams.set("room", p2pRoom);
  u.searchParams.set("mode", mode || p2pMode || "duel");
  return u.toString();
}
/* 分享按钮组（复制链接 + 可选系统分享），房主大厅/等待卡片共用 */
export function p2pShareBtns(mode: any) {
  const url = p2pInviteUrl(mode);
  return (
    `<div class="p2p-share"><button class="btn y sm" ${dataAct('copyShareLink', url)}>📋 复制邀请链接</button>` +
    (typeof navigator.share === "function"
      ? `<button class="btn c sm" ${dataAct('share', { title: 'WORD RUSH 联机对战', text: '快来和我一起单词对战！', url })}>📱 分享</button>`
      : "") +
    `</div>`
  );
}
/* 房主按所选词库生成本局统一词表（未加载的扩展词库先惰性加载；失败回退混合词库） */
export async function p2pBuildWords() {
  let pool = ALL;
  if (p2pSelBook !== "mix") {
    let b = bookOf(p2pSelBook);
    if (!b) {
      const src = dynSource(p2pSelBook);
      if (src) {
        const ok = await ensureDynLoaded(src);
        if (!ok) toast("⚠️ 词库加载失败：" + src.name + "，本局改用混合词库");
        b = bookOf(p2pSelBook);
      }
    }
    if (b) pool = b.items;
    else p2pSelBook = "mix";
  }
  const words = shuffle(pool.filter((w: any) => !w.phrase && w.en.length <= 10)).slice(0, P2P_WORD_COUNT);
  if (!words.length) {
    p2pSelBook = "mix";
    return shuffle(ALL.filter((w: any) => !w.phrase && w.en.length <= 10)).slice(0, P2P_WORD_COUNT).map((w: any) => ({
      en: w.en,
      cn: w.cn,
      pos: w.pos,
    }));
  }
  return words.map((w: any) => ({ en: w.en, cn: w.cn, pos: w.pos }));
}
/* 房主：开始单挑（首次开局/再来一局共用）——生成统一词表并随 start 分发 */
export function p2pHostStartDuel() {
  if (p2pStarting) return;
  if (!conn || !conn.open) {
    toast("⚠️ 对手尚未连接");
    return;
  }
  p2pStarting = true;
  (async () => {
    try {
      const words = await p2pBuildWords();
      // 等待词库（可能含扩展词库联网加载）期间对手可能已断开
      if (!conn || !conn.open) {
        p2pStarting = false;
        toast("⚠️ 对手已断开，无法开局");
        return;
      }
      p2pRoundWords = words;
      p2pRematchMe = true;
      p2pRematchFoe = true;
      p2pStarting = false;
      sendP2P({ type: "start", words });
      startP2PBattle();
    } catch (e) {
      p2pStarting = false;
      toast("⚠️ 开局失败，请重试");
    }
  })();
}
export function openP2PMode() {
  const pf = S.profile || {};
  openModal(
    `<h3>🌐 联机对战</h3><div class="sub">选择对战模式</div><div class="pf-summary"><span>${
      pf.avatar || "🧑"
    } ${
      pf.name ? escHtml(pf.name) : "<i style='opacity:.65'>未设置昵称</i>"
    }</span><button class="btn b sm" ${dataAct('openProfileFromP2P')}>✏️ 设置资料</button></div><div class="p2p-mode-grid"><button class="btn y" ${dataAct('openDuelMode')}>⚔️ 单挑</button><button class="btn c" ${dataAct('openRoomMode')}>👥 乱斗</button></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>取消</button></div>`
  );
}
export function openDuelMode() {
  p2pMode = "duel";
  openModal(
    `<h3>⚔️ 单挑</h3><div class="sub">实时双人对战 · 先完成者获胜</div><div style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;justify-content:center"><button class="btn y" ${dataAct('p2pCreateRoom')}>🏠 创建房间</button><button class="btn c" ${dataAct('p2pShowJoin')}>🔗 加入房间</button></div><div id="p2pStatus" style="text-align:center;font-size:.85rem;color:var(--sub);padding:8px;border:1px dashed var(--line);border-radius:10px;display:none;">加载中...</div><div id="p2pRoomDisplay" style="text-align:center;display:none;margin:8px 0;"></div><div id="p2pJoinArea" style="display:none;text-align:center;"><input class="p2p-input" id="p2pJoinInput" placeholder="输入房间码" style="width:100%;max-width:280px;"><div style="margin-top:8px;"><button class="btn solid sm" ${dataAct('p2pJoinRoom')}>加入</button></div></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" ${dataAct('openP2PMode')}>← 返回</button><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>取消</button></div>`
  );
}
export function openRoomMode() {
  p2pMode = "room";
  openModal(
    `<h3>👥 乱斗</h3><div class="sub">一个房间最多 ${roomMax} 人 · 中途可加入 · 房主随时开局</div><div class="p2p-create"><span>人数上限</span><select id="p2pMax"><option value="2">2 人</option><option value="4">4 人</option><option value="8">8 人</option><option value="16" selected>16 人</option></select><button class="btn y" ${dataAct('roomCreate')}>🏠 创建房间</button></div><div style="margin:6px 0 10px;text-align:center"><button class="btn c" ${dataAct('roomShowJoin')}>🔗 加入房间</button></div><div id="p2pStatus" style="text-align:center;font-size:.85rem;color:var(--sub);padding:8px;border:1px dashed var(--line);border-radius:10px;display:none;">加载中...</div><div id="p2pJoinArea" style="display:none;text-align:center;"><input class="p2p-input" id="p2pJoinInput" placeholder="输入房间码" style="width:100%;max-width:280px;"><div style="margin-top:8px;"><button class="btn solid sm" ${dataAct('roomJoin')}>加入</button></div></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" ${dataAct('openP2PMode')}>← 返回</button><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>取消</button></div>`
  );
}
export function p2pShowJoin() {
  $("#p2pJoinArea").style.display = "block";
}
export function roomShowJoin() {
  $("#p2pJoinInput").value = p2pLastRoomCode;
  $("#p2pJoinArea").style.display = "block";
}
export function p2pCreateRoom() {
  if (peer) peer.destroy();
  const id = "wordrush-" + Math.random().toString(36).slice(2, 8);
  peer = new Peer(id, { debug: 2 });
  p2pRoom = id;
  isHost = true;
  $("#p2pStatus").style.display = "block";
  $("#p2pStatus").innerHTML = "⏳ 创建房间中...";
  peer.on("open", () => {
    $("#p2pRoomDisplay").style.display = "block";
    $(
      "#p2pRoomDisplay"
    ).innerHTML = `<div>📋 房间码</div><div class="room-code">${id}</div><div style="font-size:.7rem;color:var(--sub);margin:4px 0">等待对手加入... 也可直接发链接邀请</div>${p2pShareBtns(
      "duel"
    )}`;
    $("#p2pStatus").innerHTML =
      '<span class="p2p-status connecting"><span class="dot"></span>等待连接...</span>';
    toast("🏠 房间已创建", "房间码: " + id);
  });
  peer.on("connection", (c: any) => {
    conn = c;
    setupP2PConnection();
  });
  peer.on("error", (e: any) => {
    $("#p2pStatus").innerHTML = "❌ 错误: " + e.message;
    toast("❌ 创建房间失败", e.message);
  });
}
export function p2pJoinRoom(code: any) {
  code = (code !== undefined ? code : $("#p2pJoinInput").value).trim();
  if (!code) {
    toast("请输入房间码");
    return;
  }
  p2pLastRoomCode = code;
  if (peer) peer.destroy();
  peer = new Peer({ debug: 2 });
  isHost = false;
  peer.on("open", () => {
    $("#p2pStatus").style.display = "block";
    $("#p2pStatus").innerHTML = "⏳ 连接中...";
    conn = peer.connect(code);
    setupP2PConnection();
  });
  peer.on("error", (e: any) => {
    $("#p2pStatus").innerHTML = "❌ 连接失败: " + e.message;
    toast("❌ 连接失败", e.message);
  });
}
export function setupP2PConnection() {
  if (!conn) return;
  conn.on("open", () => {
    const st = $("#p2pStatus");
    if (st)
      st.innerHTML =
        '<span class="p2p-status connected"><span class="dot"></span>已连接！</span>';
    toast("✅ 已连接！", "准备开始对战");
    p2pReady = true;
    p2pSelBook = "mix";
    p2pRoundWords = null;
    sendP2P({ type: "profile", profile: S.profile || {} });
    // 房主进入大厅选词后开局，客人等待房主开始（词表由房主随 start 统一分发）
    if (isHost) p2pDuelLobby();
    else p2pDuelWaiting();
  });
  conn.on("data", (data: any) => {
    handleP2PData(data);
  });
  conn.on("close", () => {
    conn = null;
    p2pReady = false;
    p2pRematchMe = false;
    p2pRematchFoe = false;
    // 对局进行中对手断开：本局不结算
    if (G && G.type === "p2p" && G.active) {
      endGameCleanup();
      setG(null);
      openModal(
        `<h3>🔌 连接断开</h3><div class="sub">对方已退出，本局不结算</div><div class="mbtns"><button class="btn b" ${dataAct('closeModalGoHome')}>返回主页</button></div>`
      );
      return;
    }
    // 对局已结束（大厅内）：房主保留房间等待新对手，加入者直接退回主页
    if (isHost && peer) {
      toast("👋 对手已退出，房间等待中");
      oppProfile = null;
    } else {
      toast("🚪 房间已关闭");
      if (peer) {
        try {
          peer.destroy();
        } catch (e) {}
        peer = null;
      }
      p2pCleanup();
      closeModal();
      go("scr-home");
    }
  });
}
export function sendP2P(data: any) {
  if (p2pMode === "room") {
    if (isHost) roomBroadcast(data);
    else if (conn && conn.open) conn.send(data);
    return;
  }
  if (conn && conn.open) conn.send(data);
}
/* 单挑大厅（房主）：选词库 + 开始 */
export function p2pDuelLobby() {
  const me = S.profile || {};
  openModal(
    `<h3>⚔️ 单挑房间</h3><div class="sub">房间码 <span class="room-code" style="font-size:1.05rem;letter-spacing:2px;padding:2px 10px">${p2pRoom}</span></div>
     ${p2pShareBtns("duel")}
     <div class="room-list" style="text-align:left;margin:10px 0">
       <div class="room-mem"><span>${me.avatar || "🧑"} ${escHtml(me.name || "你")}（我 · 房主）</span><b style="color:var(--c-y)">房主</b></div>
       <div class="room-mem"><span id="duelOppNm">⏳ 等待对手加入...</span><b id="duelOppSt"></b></div>
     </div>
     <div class="sub" style="margin-bottom:8px">选择词库（双方使用同一组词）：</div><div class="optrow" id="duelBkOpts" style="justify-content:center">${p2pBookOpts()}</div>
     <div class="mbtns"><button class="btn y" ${dataAct('p2pHostStartDuel')}>⚔️ 开始对战</button><button class="btn p" ${dataAct('p2pHostDisband')}>🚪 解散房间</button></div>`
  );
  p2pBindBookOpts("#duelBkOpts");
  if (oppProfile) {
    const el = $("#duelOppNm");
    if (el) el.textContent = (oppProfile.avatar || "👤") + " " + (oppProfile.name || "玩家");
    const st = $("#duelOppSt");
    if (st) st.textContent = "已就绪";
  }
}
/* 单挑大厅（客人）：等待房主选词开局 */
export function p2pDuelWaiting() {
  const me = S.profile || {};
  openModal(
    `<h3>⚔️ 单挑</h3><div class="sub">✅ 已连接，等待房主选择词库并开始对战...</div>
     <div class="room-list" style="text-align:left;margin:10px 0">
       <div class="room-mem"><span id="duelOppNm">🏠 房主</span><b>选词中...</b></div>
       <div class="room-mem"><span>${me.avatar || "🧑"} ${escHtml(me.name || "你")}（我）</span><b style="color:var(--ok)">已就绪</b></div>
     </div>
     <div class="mbtns"><button class="btn b" ${dataAct('p2pLeave')}>🏠 退出房间</button></div>`
  );
}
let p2pData: any = {
  myProgress: 0,
  oppProgress: 0,
  myErrors: 0,
  oppErrors: 0,
  myDone: false,
  oppDone: false,
  words: [],
};
export function startP2PBattle() {
  endGameCleanup();
  closeModal();
  // 词表由房主统一生成并随 start 消息分发；兜底：未收到时本地随机生成
  let q = p2pRoundWords;
  if (!q || !q.length) {
    q = shuffle(ALL.filter((w: any) => !w.phrase && w.en.length <= 10)).slice(0, P2P_WORD_COUNT);
    p2pRoundWords = q;
  }
  p2pData = {
    myProgress: 0,
    oppProgress: 0,
    myErrors: 0,
    oppErrors: 0,
    myDone: false,
    oppDone: false,
    words: q,
  };
  setG({
    type: "p2p",
    queue: q,
    idx: 0,
    typed: 0,
    errors: 0,
    correct: 0,
    combo: 0,
    best: 0,
    score: 0,
    active: true,
    started: false,
    t0: 0,
    done: false,
    finishTime: 0,
    timeLeft: ROOM_SEC,
  });
  S.stats.games++;
  save();
  go("scr-game");
  const isRoom = p2pMode === "room";
  const right = isRoom
    ? `<span class="pill">⏱ <b id="timeLeft">${ROOM_SEC}</b>s</span><span class="pill">⭐ 积分 <b id="myScore">${roomScores[myPeerId] || 0}</b></span>`
    : `<span class="pill">🔥 <b id="combo">0</b></span><span class="pill">得分 <b id="score">0</b></span><span class="pill">对手进度 <b id="oppProg">0%</b></span>`;
  const lanesHtml = isRoom
    ? `<div class="lanes" id="p2pLanes"></div>`
    : `<div class="lanes"><div class="lane"><div class="nm"><span id="meNm">🧑 你</span><span id="meP">0%</span></div><div class="moodline" id="meMood"></div><div class="track"><div class="fill me" id="meFill"></div><span class="racer" id="meR">🚀</span></div></div><div class="lane"><div class="nm"><span id="foeNm">👤 对手</span><span id="foeP">0%</span></div><div class="moodline" id="foeMood"></div><div class="track"><div class="fill foe" id="foeFill"></div><span class="racer" id="foeR">🤖</span></div></div></div>`;
  $("#arenaWrap").innerHTML =
    hudHTML(
      "#7c4dff",
      isRoom ? "👥 乱斗" : "⚔️ 单挑",
      `<span class="pill">单词 <b id="bIdx">1/${q.length}</b></span>`,
      right
    ) +
    `<div class="stage">${lanesHtml}<div id="cardBox"></div><div class="wordbox" id="wordBox"></div><div class="run-hint">${
      isRoom
        ? `限时 ${ROOM_SEC} 秒拼完 ${q.length} 个单词 · 按完成用时排名得分`
        : `拼完全部 ${q.length} 个单词 · 先完成者获胜！`
    }</div></div>`;
  refreshItems();
  if (isRoom) {
    roomEnded = false;
    roomResults = {};
    for (const m of Object.values(members) as any[]) {
      m.done = false;
      m.time = 0;
      m.prog = 0;
      m.errors = 0;
      m.correct = 0;
    }
    if (G.iv) clearInterval(G.iv);
    G.iv = setInterval(roomTick, 1000);
    roomRenderLanes();
  } else p2pRenderNames();
  showP2PWord();
  countdown().then(() => {
    if (G && G.active) {
      G.started = true;
      G.t0 = performance.now();
    }
  });
  refreshOsk();
}
export function showP2PWord() {
  const it = G.queue[G.idx];
  if (!it) return;
  G.typed = 0;
  G.wordT0 = Date.now();
  $("#cardBox").innerHTML = wordCard(it, true);
  $("#wordBox").style.fontSize = wFont(it.en.length);
  paintWord($("#wordBox"), it.en, 0);
  $("#bIdx").textContent = `${G.idx + 1}/${G.queue.length}`;
}

/* 实时上报我的进度/正确数/失误数（乱斗房主广播时补 from，并同步自己的 members 记录） */
export function p2pSendProgress() {
  if (!G) return;
  p2pData.myProgress = (G.idx / G.queue.length) * 100;
  p2pData.myErrors = G.errors;
  if (p2pMode === "room" && members[myPeerId]) {
    members[myPeerId].prog = p2pData.myProgress;
    members[myPeerId].errors = G.errors;
    members[myPeerId].correct = G.correct;
  }
  const msg: any = {
    type: "progress",
    prog: p2pData.myProgress,
    errors: G.errors,
    correct: G.correct,
  };
  if (p2pMode === "room" && isHost) msg.from = myPeerId;
  sendP2P(msg);
}
export function onP2PChar(ch: any) {
  if (!G || !G.started || G.done) return;
  const it = G.queue[G.idx];
  if (same(ch, it.en[G.typed])) {
    G.typed++;
    sTick();
    paintWord($("#wordBox"), it.en, G.typed);
    if (G.typed >= it.en.length) {
      markWord(it, true, 0, Date.now() - (G.wordT0 || Date.now()));
      S.stats.words++;
      G.correct++;
      G.combo++;
      G.best = Math.max(G.best, G.combo);
      S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
      // ★ 新增分数累计
      G.score += 10 + Math.min(G.combo, 20) * 2;
      const scEl = $("#score");
      if (scEl) scEl.textContent = G.score;
      const cbEl = $("#combo");
      if (cbEl) cbEl.textContent = G.combo;
      sOk();
      const r = $("#wordBox").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, "var(--c-y)");
      G.idx++;
      p2pSendProgress();
      if (p2pMode === "room") roomRenderLanes();
      else updateP2PLanes();
      if (G.idx >= G.queue.length) {
        p2pData.myDone = true;
        G.done = true;
        G.finishTime = ROOM_SEC - Math.max(0, G.timeLeft); // 本轮已用秒数
        if (p2pMode === "room") {
          if (members[myPeerId]) {
            members[myPeerId].done = true;
            members[myPeerId].time = G.finishTime;
            members[myPeerId].errors = G.errors;
            members[myPeerId].correct = G.correct;
          }
          if (isHost) {
            // 房主完成：记录完成时间并广播，全员完成时提前结束本轮
            roomResults[myPeerId] = { time: G.finishTime, errors: G.errors };
            roomBroadcast({ type: "done", from: myPeerId, time: G.finishTime, errors: G.errors });
            roomRenderLanes();
            roomCheckAllDone();
          } else {
            sendP2P({ type: "done", errors: G.errors, time: G.finishTime });
            toast("🏁 你已完成！用时 " + G.finishTime + "s，等待本轮结束...");
          }
          return;
        }
        sendP2P({ type: "done", errors: G.errors, time: G.finishTime });
        checkP2PWin();
        return;
      }
      showP2PWord();
    }
  } else {
    G.errors++;
    G.combo = 0;
    const cbEl = $("#combo");
    if (cbEl) cbEl.textContent = 0;
    sBad();
    vib(50);
    paintWord($("#wordBox"), it.en, G.typed, true);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
    // 失误也实时上报，乱斗车道立即刷新各人 ✅/❌
    p2pSendProgress();
    if (p2pMode === "room") roomRenderLanes();
  }
}

export function updateP2PLanes() {
  const meFill = $("#meFill");
  if (!meFill) return;
  const mp = clamp(p2pData.myProgress / 100, 0, 1),
    fp = clamp(p2pData.oppProgress / 100, 0, 1);
  meFill.style.width = mp * 100 + "%";
  $("#meR").style.left = mp * 100 + "%";
  $("#meP").textContent = Math.round(mp * 100) + "%";
  $("#foeFill").style.width = fp * 100 + "%";
  $("#foeR").style.left = fp * 100 + "%";
  $("#foeP").textContent = Math.round(fp * 100) + "%";
  $("#oppProg").textContent = Math.round(fp * 100) + "%";
}
export function p2pRenderNames() {
  const me = S.profile || {},
    foe = oppProfile || {};
  const meEl = $("#meNm"),
    foeEl = $("#foeNm"),
    meMoodEl = $("#meMood"),
    foeMoodEl = $("#foeMood");
  if (meEl)
    meEl.innerHTML = (me.avatar || "🧑") + " " + escHtml(me.name || "你");
  if (foeEl)
    foeEl.innerHTML = (foe.avatar || "👤") + " " + escHtml(foe.name || "对手");
  if (meMoodEl)
    meMoodEl.textContent = ((me.moodEmoji || "") + (me.mood ? " " + me.mood : "")).trim();
  if (foeMoodEl)
    foeMoodEl.textContent = ((foe.moodEmoji || "") + (foe.mood ? " " + foe.mood : "")).trim();
}
export function handleP2PData(data: any) {
  if (p2pMode === "room") return roomHandleData(data);
  // ---- 1v1 ----
  if (data.type === "profile") {
    oppProfile = data.profile || null;
    if ($("#foeNm")) p2pRenderNames();
    // 大厅等待界面实时显示对手昵称
    const el = $("#duelOppNm");
    if (el && oppProfile)
      el.textContent = (oppProfile.avatar || "👤") + " " + (oppProfile.name || "玩家");
    const st = $("#duelOppSt");
    if (st) st.textContent = "已就绪";
  }
  if (data.type === "progress") {
    p2pData.oppProgress = data.prog;
    p2pData.oppErrors = data.errors || 0;
    updateP2PLanes();
  }
  if (data.type === "done") {
    p2pData.oppDone = true;
    p2pData.oppErrors = data.errors || 0;
    checkP2PWin();
  }
  if (data.type === "disband") {
    toast("🚪 房主已解散房间");
    p2pLeave();
  }
  if (data.type === "rematch") {
    p2pRematchFoe = true;
    if (isHost) {
      // 房主权威：双方都点了再来一局 → 房主生成统一词表开局
      if (p2pRematchMe) p2pHostStartDuel();
    } else {
      const b = $("#btnRematch");
      if (b)
        b.innerHTML = p2pRematchMe ? "⏳ 已准备，等待房主开局..." : "✅ 接受再来一局";
    }
  }
  if (data.type === "start") {
    // 客人收到房主开局：使用房主分发的统一词表
    if (data.words) p2pRoundWords = data.words;
    p2pStarting = false;
    p2pRematchMe = true;
    p2pRematchFoe = true;
    startP2PBattle();
  }
}
export function checkP2PWin() {
  if (!G || !G.active) return;
  if (p2pData.myDone && p2pData.oppDone) {
    const win = p2pData.myErrors <= p2pData.oppErrors;
    endP2PBattle(win ? 1 : 0);
    return;
  }
  if (p2pData.myDone && !p2pData.oppDone) {
    endP2PBattle(1);
    return;
  }
  if (!p2pData.myDone && p2pData.oppDone) {
    endP2PBattle(0);
    return;
  }
}
export function endP2PBattle(win: any) {
  if (!G || G.type !== "p2p" || !G.active) return;
  endGameCleanup();
  const lvB = lvl(S.xp);
  const coins = win ? 40 : 15,
    xp = win ? 80 : 25;
  S.coins += coins;
  S.xp += xp;
  if (win) {
    S.stats.p2pWins = (S.stats.p2pWins || 0) + 1;
    S.stats.wins++;
  } else {
    S.stats.p2pLosses = (S.stats.p2pLosses || 0) + 1;
  }
  updateDailyStats(G.correct, G.errors, G.score, "duel", win);
  checkAch();
  save();
  refreshHead();
  coinBump();
  const lvA = lvl(S.xp),
    up = lvA.lv > lvB.lv;
  const foeN = oppProfile && oppProfile.name ? oppProfile.name : "对手";
  const roomBtns = isHost
    ? `<button class="btn y" id="btnRematch" ${dataAct('p2pRequestRematch')}>🔁 再来一局</button><button class="btn p" ${dataAct('p2pHostDisband')}>🚪 解散房间</button>`
    : `<button class="btn y" id="btnRematch" ${dataAct('p2pRequestRematch')}>🔁 再来一局</button><button class="btn b" ${dataAct('p2pLeave')}>🏠 返回主页</button>`;
  openModal(
    `<div style="text-align:center"><div class="stamp">${
      win ? "🏆 胜利！" : "💔 惜败"
    }</div><div class="sub">${
      win ? `击败了 ${foeN}` : `负于 ${foeN}`
    }</div>${
      up ? `<div class="lvlup">🎉 升级！LV ${lvA.lv}</div>` : ""
    }<div class="rgrid"><div class="rcell"><b>${
      G.correct
    }</b><span>拼对单词</span></div><div class="rcell"><b>${
      G.errors
    }</b><span>失误次数</span></div><div class="rcell"><b>${coins}</b><span>金币入账</span></div><div class="rcell"><b>${xp}</b><span>经验值</span></div></div><div class="mbtns">${roomBtns}</div></div>`
  );
  p2pRematchMe = false;
  p2pRematchFoe = false;
  p2pData = {
    myProgress: 0,
    oppProgress: 0,
    myErrors: 0,
    oppErrors: 0,
    myDone: false,
    oppDone: false,
    words: [],
  };
}
/* ---------- 单挑：再来一局 / 解散 / 退出 ---------- */
export function p2pRequestRematch() {
  if (p2pRematchMe || !conn) return;
  p2pRematchMe = true;
  const b = $("#btnRematch");
  if (b) b.innerHTML = "⏳ 等待对方确认...";
  sendP2P({ type: "rematch" });
  // 房主：若对方也已准备，立即生成统一词表开局
  if (isHost && p2pRematchFoe) p2pHostStartDuel();
}
export function p2pCleanup() {
  isHost = false;
  p2pReady = false;
  p2pRoom = null;
  p2pMode = null;
  oppProfile = null;
  p2pRematchMe = false;
  p2pRematchFoe = false;
  hostConns = {};
  members = {};
  myPeerId = null;
  p2pState = "lobby";
  roomScores = {};
  roomResults = {};
  roomEnded = false;
  roomSettled = false;
  p2pSelBook = "mix";
  p2pRoundWords = null;
  p2pStarting = false;
}
export function p2pLeave() {
  if (G && G.type === "p2p") {
    endGameCleanup();
    setG(null);
  }
  roomSettleFinal();
  if (conn) {
    try {
      conn.close();
    } catch (e) {}
    conn = null;
  }
  if (peer) {
    try {
      peer.destroy();
    } catch (e) {}
    peer = null;
  }
  p2pCleanup();
  closeModal();
  go("scr-home");
}
export function p2pHostDisband() {
  if (p2pMode === "room") roomBroadcast({ type: "disband" });
  else sendP2P({ type: "disband" });
  setTimeout(() => {
    for (const m of Object.values(hostConns) as any[]) {
      try {
        m.conn && m.conn.close();
      } catch (e) {}
    }
    hostConns = {};
    if (peer) {
      try {
        peer.destroy();
      } catch (e) {}
      peer = null;
    }
    roomSettleFinal();
    p2pCleanup();
    closeModal();
    go("scr-home");
    toast("🚪 房间已解散");
  }, 200);
}
export function endP2PBattleCleanup() {
  if (G && G.type === "p2p") {
    endGameCleanup();
    setG(null);
  }
}

/* ---------- 多人房间（星型：房主为中心转发） ---------- */
export function roomCreate() {
  if (peer) peer.destroy();
  roomMax = parseInt($("#p2pMax")?.value || "16", 10) || 16;
  const id = "wordrush-" + Math.random().toString(36).slice(2, 6);
  peer = new Peer(id, { debug: 2 });
  p2pRoom = id;
  isHost = true;
  p2pState = "lobby";
  hostConns = {};
  members = {};
  myPeerId = null;
  p2pSelBook = "mix";
  p2pRoundWords = null;
  p2pStarting = false;
  $("#p2pStatus").style.display = "block";
  $("#p2pStatus").innerHTML = "⏳ 创建房间中...";
  peer.on("open", () => {
    myPeerId = peer.id;
    members[myPeerId] = {
      id: myPeerId,
      profile: S.profile || {},
      prog: 0,
      errors: 0,
      correct: 0,
      done: false,
    };
    roomRenderLobby();
    toast("🏠 房间已创建", "房间码: " + id);
  });
  peer.on("connection", (c: any) => roomBindConn(c));
  peer.on("error", (e: any) => {
    $("#p2pStatus").innerHTML = "❌ 错误: " + e.message;
    toast("❌ 创建房间失败", e.message);
  });
}
export function roomJoin(code: any) {
  code = (code !== undefined ? code : $("#p2pJoinInput").value).trim();
  if (!code) {
    toast("请输入房间码");
    return;
  }
  p2pLastRoomCode = code;
  if (peer) peer.destroy();
  peer = new Peer({ debug: 2 });
  isHost = false;
  p2pState = "lobby";
  members = {};
  p2pRoom = code;
  $("#p2pStatus").style.display = "block";
  $("#p2pStatus").innerHTML = "⏳ 连接中...";
  peer.on("open", () => {
    myPeerId = peer.id;
    conn = peer.connect(code);
    roomSetupConnection();
  });
  peer.on("error", (e: any) => {
    $("#p2pStatus").innerHTML = "❌ 连接失败: " + e.message;
    toast("❌ 连接失败", e.message);
  });
}
export function roomSetupConnection() {
  if (!conn) return;
  conn.on("open", () => {
    p2pReady = true;
    $("#p2pStatus").innerHTML =
      '<span class="p2p-status connected"><span class="dot"></span>已连接！</span>';
    sendP2P({ type: "join", profile: S.profile || {} });
    toast("✅ 已连接房间");
  });
  conn.on("data", (d: any) => roomHandleData(d));
  conn.on("close", () => {
    conn = null;
    p2pReady = false;
    if (G && G.type === "p2p" && G.active) {
      endGameCleanup();
      setG(null);
      openModal(
        `<h3>🔌 连接断开</h3><div class="sub">与房主的连接已断开，本局不结算</div><div class="mbtns"><button class="btn b" ${dataAct('closeModalGoHome')}>返回主页</button></div>`
      );
      return;
    }
    toast("🚪 已退出房间");
    p2pCleanup();
    closeModal();
    go("scr-home");
  });
}
export function roomBindConn(c: any) {
  hostConns[c.peer] = { conn: c };
  c.on("data", (d: any) => {
    if (!d) return;
    if (d.type === "join") {
      const pid = c.peer;
      if (Object.keys(members).length >= roomMax) {
        try {
          c.send({ type: "full" });
        } catch (e) {}
        return;
      }
      members[pid] = {
        id: pid,
        profile: d.profile || {},
        prog: 0,
        errors: 0,
        correct: 0,
        done: false,
      };
      roomBroadcastMembers();
      roomRenderLanes();
      if (modalOpen && $("#roomLobby")) roomRenderLobby();
    } else if (d.type === "progress") {
      const pid = c.peer;
      if (members[pid]) {
        members[pid].prog = d.prog || 0;
        members[pid].errors = d.errors || 0;
        members[pid].correct = d.correct || 0;
      }
      roomBroadcast({
        type: "progress",
        from: pid,
        prog: d.prog || 0,
        errors: d.errors || 0,
        correct: d.correct || 0,
      });
      roomRenderLanes();
    } else if (d.type === "done") {
      const pid = c.peer;
      if (members[pid]) {
        members[pid].done = true;
        members[pid].errors = d.errors || 0;
        members[pid].time = d.time || 0;
      }
      if (!roomResults[pid]) roomResults[pid] = { time: d.time || 999, errors: d.errors || 0 };
      roomBroadcast({ type: "done", from: pid, time: d.time || 0, errors: d.errors || 0 });
      roomRenderLanes();
      if (p2pState === "playing" && !roomEnded) roomCheckAllDone();
    }
  });
  c.on("close", () => {
    const pid = c.peer;
    delete hostConns[pid];
    delete members[pid];
    roomBroadcastMembers();
    roomRenderLanes();
    if (modalOpen && $("#roomLobby")) roomRenderLobby();
  });
}
export function roomHandleData(d: any) {
  if (!d) return;
  if (d.type === "members") {
    const wasPlaying = p2pState === "playing";
    members = {};
    (d.members || []).forEach((m: any) => (members[m.id] = m));
    roomScores = d.scores || roomScores;
    p2pState = d.playing ? "playing" : "lobby";
    if (isHost && (wasPlaying || p2pState === "playing")) roomRenderLanes();
    else roomRenderLobby();
  } else if (d.type === "full") {
    toast("❌ 房间已满");
    p2pLeave();
  } else if (d.type === "start") {
    // 使用房主分发的统一词表
    if (d.words) p2pRoundWords = d.words;
    p2pStarting = false;
    p2pState = "playing";
    startP2PBattle();
  } else if (d.type === "disband") {
    toast("🚪 房主已解散房间");
    p2pLeave();
  } else if (d.type === "round_end") {
    roomScores = d.scores || roomScores;
    roomEndRound(d.results || {});
  } else if (d.type === "progress") {
    if (members[d.from]) {
      members[d.from].prog = d.prog || 0;
      members[d.from].errors = d.errors || 0;
      members[d.from].correct = d.correct || 0;
    }
    roomRenderLanes();
  } else if (d.type === "done") {
    if (members[d.from]) {
      members[d.from].done = true;
      members[d.from].errors = d.errors || 0;
      members[d.from].time = d.time || 0;
    }
    roomRenderLanes();
  }
}
export function roomBroadcast(msg: any) {
  for (const m of Object.values(hostConns) as any[]) {
    if (m.conn && m.conn.open) {
      try {
        m.conn.send(msg);
      } catch (e) {}
    }
  }
}
export function roomBroadcastMembers() {
  roomBroadcast({
    type: "members",
    members: Object.values(members),
    playing: p2pState === "playing",
    scores: Object.assign({}, roomScores),
  });
}
export async function roomStartGame() {
  if (!isHost || p2pStarting) return;
  p2pStarting = true;
  // 房主生成统一词表（未加载的扩展词库先惰性加载），随 start 分发给全体成员
  const words = await p2pBuildWords();
  p2pRoundWords = words;
  p2pStarting = false;
  p2pState = "playing";
  roomBroadcast({ type: "start", words });
  startP2PBattle();
}
/* 每轮倒计时（房主与成员各自计时；到 0 由房主广播本轮结束） */
export function roomTick() {
  if (!G || !G.active || G.type !== "p2p") return;
  G.timeLeft = Math.max(0, G.timeLeft - 1);
  const tl = $("#timeLeft");
  if (tl) tl.textContent = G.timeLeft;
  if (G.timeLeft <= 0 && isHost && !roomEnded) roomFinishRound();
}
/* 房主：全员完成 → 提前结束本轮 */
export function roomCheckAllDone() {
  if (roomEnded) return;
  if (Object.values(members).every((m: any) => m.done)) roomFinishRound();
}
/* 房主：结束本轮 → 按完成时间排名计分并广播 */
export function roomFinishRound() {
  if (roomEnded) return;
  roomEnded = true;
  if (G && G.iv) clearInterval(G.iv);
  const scores = roomRankScores();
  for (const [pid, sc] of Object.entries(scores)) {
    roomScores[pid] = (roomScores[pid] || 0) + sc;
  }
  roomBroadcast({
    type: "round_end",
    results: Object.assign({}, roomResults),
    scores: Object.assign({}, roomScores),
  });
  roomEndRound(Object.assign({}, roomResults));
}
/* 按完成时间快慢排名计分：第 1 名 = 房间人数分，依次 -1，最后一名完成者 1 分；未完成 0 分 */
export function roomRankScores() {
  const N = Object.keys(members).length;
  const finishers = (Object.entries(roomResults) as [string, any][]).filter(([, r]) => r && typeof r.time === "number").sort((a: any, b: any) => a[1].time - b[1].time);
  const out: any = {};
  finishers.forEach(([pid]: any, i: any) => {
    out[pid] = Math.max(1, N - i);
  });
  return out;
}
/* 本轮结束（限时排名制）：按完成用时排序结算积分 */
export function roomEndRound(results: any) {
  if (!G || G.type !== "p2p" || !G.active) return;
  endGameCleanup();
  if (G && G.iv) clearInterval(G.iv);
  // 排名：完成者按用时升序，未完成者排最后
  const N = Object.keys(members).length;
  const rows: any[] = [];
  const finishers = (Object.entries(results) as [string, any][]).filter(([, r]) => r && typeof r.time === "number").sort((a: any, b: any) => a[1].time - b[1].time);
  finishers.forEach(([pid, r]: any, i: any) => {
    const m = members[pid] || {};
    const nm = (m.profile && m.profile.name) || (pid === myPeerId ? "你" : "玩家");
    const av = (m.profile && m.profile.avatar) || "🧑";
    rows.push({ pid, nm, av, time: r.time, errors: r.errors || 0, rank: i + 1, sc: Math.max(1, N - i), done: true });
  });
  const unDone = Object.values(members).filter((m: any) => !finishers.some(([pid]: any) => pid === m.id));
  unDone.forEach((m: any) => {
    rows.push({ pid: m.id, nm: (m.profile && m.profile.name) || "玩家", av: (m.profile && m.profile.avatar) || "👤", time: null, errors: 0, rank: rows.length + 1, sc: 0, done: false });
  });
  rows.sort((a: any, b: any) => a.rank - b.rank);
  const myRank = rows.find((r: any) => r.pid === myPeerId);
  const mySc = myRank ? myRank.sc : 0;
  // 记录乱斗一轮到每日统计（第一名计入 roomWin）
  const roomWin = !!(myRank && myRank.rank === 1);
  S.stats.roomRounds = (S.stats.roomRounds || 0) + 1;
  if (roomWin) S.stats.roomWins = (S.stats.roomWins || 0) + 1;
  updateDailyStats(G.correct || 0, G.errors || 0, 0, "room", roomWin);
  const rankRows = rows
    .map(
      (r: any) =>
        `<div class="room-mem"><span>${["🥇", "🥈", "🥉"][r.rank - 1] || r.rank + "."} ${r.av} ${escHtml(r.nm)}${
          r.pid === myPeerId ? "（我）" : ""
        }</span><b style="color:${r.sc > 0 ? "var(--c-y)" : "var(--sub)"}">${
          r.done ? r.time.toFixed(1) + "s" : "未完成"
        } · ${r.sc > 0 ? "+" + r.sc + " 分" : "0 分"}</b></div>`
    )
    .join("");
  const stamp =
    myRank && myRank.rank === 1
      ? "🏆 本轮第一！"
      : myRank && myRank.sc > 0
      ? `🥈 第 ${myRank.rank} 名`
      : "💔 本轮未完成";
  const btns = isHost
    ? `<button class="btn y" ${dataAct('roomStartGame')}>🎮 再来一局</button><button class="btn p" ${dataAct('p2pHostDisband')}>🚪 解散房间</button>`
    : `<div class="sub">等待房主开始下一局...</div><button class="btn b" ${dataAct('p2pLeave')}>🏠 退出房间</button>`;
  openModal(
    `<div style="text-align:center"><div class="stamp">${stamp}</div><div class="sub">本轮用时排名 · +${mySc} 分</div><div class="room-list" style="text-align:left">${rankRows}</div><div class="mbtns">${btns}</div></div>`
  );
}
/* 最终结算：按本场积分一次兑换金币/经验（每 1 分 = 40 金币 + 80 经验） */
let roomSettled = false;
export function roomSettleFinal() {
  if (p2pMode !== "room" || roomSettled) return;
  roomSettled = true;
  const sc = roomScores[myPeerId] || 0;
  if (sc > 0) {
    const coins = sc * 40,
      xp = sc * 80;
    S.coins += coins;
    S.xp += xp;
    checkAch();
    save();
    refreshHead();
    toast(`🏁 乱斗结算：⭐${sc} 分 → 🪙${coins} + XP${xp}`);
  }
}
export function roomRenderLobby() {
  const list = Object.values(members);
  const rows = list
    .map((m: any) => {
      const isMe = m.id === myPeerId;
      const nm = (m.profile && m.profile.name) || (isMe ? "你" : "玩家");
      const av = (m.profile && m.profile.avatar) || (isMe ? "🧑" : "👤");
      return `<div class="room-mem"><span>${av} ${escHtml(nm)}${
        isMe ? "（我）" : ""
      }</span><b style="color:var(--c-y)">⭐ ${roomScores[m.id] || 0}</b></div>`;
    })
    .join("");
  const head = isHost
    ? `<div class="sub" style="margin:12px 0 6px">选择词库（全体成员使用同一组词）：</div><div class="optrow" id="roomBkOpts" style="justify-content:center;margin-bottom:8px">${p2pBookOpts()}</div><div class="mbtns" style="margin-top:8px"><button class="btn y" ${dataAct('roomStartGame')}>🎮 开始对战（${list.length}/${roomMax}）</button><button class="btn p" ${dataAct('p2pHostDisband')}>🚪 解散房间</button></div>`
    : `<div class="sub">${
        p2pState === "playing"
          ? "🎮 对局进行中，等待下一局开始..."
          : "⏳ 等待房主选词并开始对战..."
      }</div><div class="mbtns" style="margin-top:14px"><button class="btn b" ${dataAct('p2pLeave')}>🏠 退出房间</button></div>`;
  openModal(
    `<h3>🏠 房间 <span class="room-code" style="font-size:1.15rem;letter-spacing:2px;padding:2px 12px">${p2pRoom}</span></h3><div class="sub">${
      isHost ? "你是房主" : "已加入房间"
    } · 上限 ${roomMax} 人 · 房主可随时开始</div>${p2pShareBtns("room")}<div class="room-list" id="roomLobby">${
      rows || '<div class="sub" style="padding:8px">等待成员加入...</div>'
    }</div>${head}`
  );
  if (isHost) p2pBindBookOpts("#roomBkOpts");
}
export function roomRenderLanes() {
  const wrap = $("#p2pLanes");
  if (!wrap) return;
  const list = Object.values(members);
  wrap.innerHTML = list
    .map((m: any) => {
      const isMe = m.id === myPeerId;
      const pct = isMe ? p2pData.myProgress : m.prog || 0;
      const done = isMe ? p2pData.myDone : !!m.done;
      const nm = (m.profile && m.profile.name) || (isMe ? "你" : "玩家");
      const av = (m.profile && m.profile.avatar) || (isMe ? "🧑" : "👤");
      const mood = m.profile
        ? ((m.profile.moodEmoji || "") + (m.profile.mood ? " " + m.profile.mood : "")).trim()
        : "";
      // 实时正确/错误数：我取本局 G，他人取 members 同步值
      const correct = isMe ? (G ? G.correct : 0) : m.correct || 0;
      const errors = isMe ? (G ? G.errors : 0) : m.errors || 0;
      return `<div class="lane"><div class="nm"><span>${av} ${escHtml(nm)}${
        isMe ? "（我）" : ""
      }${done ? " ✅" : ""} <b style="color:var(--c-y)">⭐${roomScores[m.id] || 0}</b></span><span class="lane-st"><b style="color:var(--ok)">✅${correct}</b> <b style="color:var(--bad)">❌${errors}</b> · ${Math.round(
        pct
      )}%</span></div><div class="moodline">${escHtml(mood)}</div><div class="track"><div class="fill ${
        isMe ? "me" : "foe"
      }" style="width:${clamp(pct / 100, 0, 1) * 100}%"></div></div></div>`;
    })
    .join("");
}

/* ---------- 邀请链接：自动加入 ---------- */
/* 通过邀请链接进入：打开对应模式弹窗、填入房间码并立即连接房主 */
export function p2pAutoJoin(code: any, mode: any) {
  p2pLastRoomCode = code;
  if (mode === "room") {
    openRoomMode();
    roomShowJoin();
    $("#p2pJoinInput").value = code;
    toast("🔗 正在通过邀请链接加入乱斗房间...");
    roomJoin(code);
  } else {
    openDuelMode();
    p2pShowJoin();
    $("#p2pJoinInput").value = code;
    toast("🔗 正在通过邀请链接加入单挑房间...");
    p2pJoinRoom(code);
  }
}
/* 启动时检测邀请链接 ?room=<房间码>&mode=duel|room → 等 PeerJS（defer 加载）就绪后自动加入 */
(function checkP2PInvite() {
  const params = new URLSearchParams(location.search);
  const code = params.get("room");
  if (!code) return;
  const mode = params.get("mode") === "room" ? "room" : "duel";
  // 清掉邀请参数，避免刷新/收藏导致重复自动加入
  try {
    const u = new URL(location.href);
    u.searchParams.delete("room");
    u.searchParams.delete("mode");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  } catch (e) {}
  let tries = 0;
  const timer = setInterval(() => {
    if (typeof Peer !== "undefined") {
      clearInterval(timer);
      setTimeout(() => p2pAutoJoin(code, mode), 300);
    } else if (++tries > 60) {
      clearInterval(timer);
      toast("⚠️ 联机组件加载失败，请检查网络后手动输入房间码：" + code);
    }
  }, 200);
})();




registerAct("p2pHostStartDuel", (_el: any, _ev: any, args: any[]) => (p2pHostStartDuel as any)(...(args || [])));
registerAct("openP2PMode", (_el: any, _ev: any, args: any[]) => (openP2PMode as any)(...(args || [])));
registerAct("openDuelMode", (_el: any, _ev: any, args: any[]) => (openDuelMode as any)(...(args || [])));
registerAct("openRoomMode", (_el: any, _ev: any, args: any[]) => (openRoomMode as any)(...(args || [])));
registerAct("p2pShowJoin", (_el: any, _ev: any, args: any[]) => (p2pShowJoin as any)(...(args || [])));
registerAct("roomShowJoin", (_el: any, _ev: any, args: any[]) => (roomShowJoin as any)(...(args || [])));
registerAct("p2pCreateRoom", (_el: any, _ev: any, args: any[]) => (p2pCreateRoom as any)(...(args || [])));
registerAct("p2pJoinRoom", (_el: any, _ev: any, args: any[]) => (p2pJoinRoom as any)(...(args || [])));













registerAct("p2pRequestRematch", (_el: any, _ev: any, args: any[]) => (p2pRequestRematch as any)(...(args || [])));

registerAct("p2pLeave", (_el: any, _ev: any, args: any[]) => (p2pLeave as any)(...(args || [])));
registerAct("p2pHostDisband", (_el: any, _ev: any, args: any[]) => (p2pHostDisband as any)(...(args || [])));

registerAct("roomCreate", (_el: any, _ev: any, args: any[]) => (roomCreate as any)(...(args || [])));
registerAct("roomJoin", (_el: any, _ev: any, args: any[]) => (roomJoin as any)(...(args || [])));





registerAct("roomStartGame", (_el: any, _ev: any, args: any[]) => (roomStartGame as any)(...(args || [])));










