/* ================= 模块：ui/fx 反馈特效 =================
 * 职责：toast 提示、粒子爆发 burst、飘字 floaty、金币跳动 coinBump
 * 依赖：core/utils
 * 共享状态：无
 * ==================================================================== */
function toast(t, sub) {
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = t + (sub ? `<small>${sub}</small>` : "");
  $("#toasts").appendChild(d);
  setTimeout(() => {
    d.style.transition = ".4s";
    d.style.opacity = 0;
    setTimeout(() => d.remove(), 400);
  }, 3200);
}
function burst(x, y, c) {
  for (let i = 0; i < 13; i++) {
    const s = document.createElement("span");
    s.className = "shard";
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.background = c;
    s.style.setProperty("--dx", rnd(-90, 90) + "px");
    s.style.setProperty("--dy", rnd(-110, 40) + "px");
    $("#fx").appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}
function floaty(x, y, txt, c) {
  const s = document.createElement("span");
  s.className = "floaty";
  s.textContent = txt;
  s.style.left = x + "px";
  s.style.top = y + "px";
  s.style.color = c;
  $("#fx").appendChild(s);
  setTimeout(() => s.remove(), 1000);
}
function coinBump() {
  const e = $("#hCoin");
  e.classList.remove("bump");
  void e.offsetWidth;
  e.classList.add("bump");
}

