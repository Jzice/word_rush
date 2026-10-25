import { rnd, $ } from "../core/utils";

/* ================= 模块：ui/fx 反馈特效 =================
 * 职责：toast 提示、粒子爆发 burst、飘字 floaty、金币跳动 coinBump
 * 依赖：core/utils（$/rnd）
 * 共享状态：无
 * ==================================================================== */
export function toast(t: any, sub?: any) {
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = t + (sub ? `<small>${sub}</small>` : "");
  $("#toasts").appendChild(d);
  setTimeout(() => {
    d.style.transition = ".4s";
    d.style.opacity = "0";
    setTimeout(() => d.remove(), 400);
  }, 3200);
}
export function burst(x: any, y: any, c: any) {
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
export function floaty(x: any, y: any, txt: any, c: any) {
  const s = document.createElement("span");
  s.className = "floaty";
  s.textContent = txt;
  s.style.left = x + "px";
  s.style.top = y + "px";
  s.style.color = c;
  $("#fx").appendChild(s);
  setTimeout(() => s.remove(), 1000);
}
export function coinBump() {
  const e = $("#hCoin");
  e.classList.remove("bump");
  void e.offsetWidth;
  e.classList.add("bump");
}






