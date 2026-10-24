/* ================= 模块：ui/shell 框架外壳 =================
 * 职责：头部 HUD refreshHead、屏幕切换 go()、屏幕键盘（构建/显隐）、触摸判定
 * 依赖：core/store、core/stats、ui/audio、core/utils
 * 共享状态：读 S（金币/等级/主题），写 DOM（#scr-* / 头部 / OSK）
 * ==================================================================== */
/* ================= 头部 / 屏幕 / 屏幕键盘 ================= */
function refreshHead() {
  const l = lvl(S.xp);
  $("#coinN").textContent = S.coins;
  $("#lvBadge").textContent = "LV " + l.lv;
  $("#lvName").textContent = titleOf(l.lv);
  $("#xpBar").style.width = (l.into / l.need) * 100 + "%";
  $("#btnSound").classList.toggle("off", !S.set.sound);
  $("#btnTts").classList.toggle("off", !S.set.tts);
  $("#btnOsk").classList.toggle("off", (S.set.osk || "auto") === "off");
  $("#btnSound").textContent = S.set.sound ? "🔔" : "🔕";
  $("#btnTts").textContent = S.set.tts ? "🔊" : "🔇";
  // 顶部用户卡片：头像 + 用户名
  const pf = S.profile || {};
  const ua = $("#userAvatar");
  const un = $("#userName");
  if (ua) ua.textContent = pf.avatar || "🧑";
  if (un) {
    const nm = (pf.name || "").trim();
    un.textContent = nm ? (nm.length > 6 ? nm.slice(0, 6) + "…" : nm) : "未命名";
  }
  // 主页心情栏（仅主页存在该节点）
  const moodEl = $("#userMood");
  if (moodEl) {
    const emoji = pf.moodEmoji || "😀";
    const txt = (pf.mood || "").trim();
    moodEl.innerHTML = txt
      ? `<span class="mood-emoji">${emoji}</span><span class="mood-text">${escHtml(txt)}</span>`
      : `<span class="mood-emoji">${emoji}</span><span class="mood-text" style="opacity:.5">点击设置一句话心情…</span>`;
  }
}
$("#btnSound").onclick = () => {
  S.set.sound = !S.set.sound;
  save();
  refreshHead();
};
$("#btnTts").onclick = () => {
  S.set.tts = !S.set.tts;
  save();
  refreshHead();
};
const isTouch = () =>
  matchMedia("(pointer:coarse)").matches || "ontouchstart" in window;
function oskShouldShow() {
  const m = S.set.osk || "auto";
  if (m === "on") return true;
  if (m === "off") return false;
  return isTouch() || innerWidth < 820;
}
function refreshOsk() {
  const el = $("#osk");
  const on =
    $("#scr-game").classList.contains("on") && G && G.active && oskShouldShow();
  el.classList.toggle("show", on);
}
$("#btnOsk").onclick = () => {
  const order = ["auto", "on", "off"],
    cur = S.set.osk || "auto",
    next = order[(order.indexOf(cur) + 1) % 3];
  S.set.osk = next;
  save();
  refreshOsk();
  refreshHead();
  toast(
    "🎹 屏幕键盘：" +
      { auto: "自动（触屏设备显示）", on: "强制开启", off: "关闭" }[next]
  );
};

function buildOsk() {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const pad = [0, 4, 10];
  let html = rows
    .map(
      (r, i) =>
        `<div class="osk-row" style="padding-left:${pad[i]}%;padding-right:${
          pad[i]
        }%">${[...r]
          .map((c) => `<button data-k="${c}">${c.toUpperCase()}</button>`)
          .join("")}</div>`
    )
    .join("");
  html += `<div class="osk-row" style="justify-content:center;padding:0 10%;">
    <button data-k=" " class="space" style="flex:1;max-width:60%;">␣ 空格</button>
  </div>`;
  $("#osk").innerHTML = html;
  $$("#osk button").forEach((b) => {
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      routeChar(b.dataset.k);
      b.classList.add("press");
      setTimeout(() => b.classList.remove("press"), 120);
    });
    b.addEventListener("contextmenu", (ev) => ev.preventDefault());
  });
}
addEventListener("resize", refreshOsk);
function go(id) {
  $$(".scr").forEach((s) => s.classList.remove("on"));
  $("#" + id).classList.add("on");
  window.scrollTo({ top: 0 });
  if (id === "scr-home") renderHome();
  if (id === "scr-book") renderBook();
  if (id === "scr-shop") renderShop();
  if (id === "scr-table") renderTable();
  if (id === "scr-stats") renderStats();
  refreshOsk();
}
