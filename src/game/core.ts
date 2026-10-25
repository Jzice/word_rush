import { dataAct, $ } from "../core/utils";
import { registerAct } from "../ui/events";
import { S, save } from "../core/store";
import { escHtml, sleep } from "../core/utils";
import { bookOf } from "../data/index";
import { onBattleChar } from "./mode-battle";
import { onFallChar } from "./mode-fall";
import { cur, onMemChar } from "./mode-mem";
import { goodChar, onRunChar } from "./mode-run";
import { isHost, onP2PChar, p2pHostDisband, p2pLeave } from "../net/p2p";
import { clickLv, closeModal, modalOpen, openModal } from "../screens/home";
import { beep, sShield, speak } from "../ui/audio";
import { burst, floaty, toast } from "../ui/fx";
import { go, refreshOsk } from "../ui/shell";

/* ================= 模块：game/core 对局核心 =================
 * 职责：对局运行态 G、全局 keydown 输入路由 routeChar/curTargetChar、
 *       Esc 中断 / quitGame / endGameCleanup、开局倒计时、HUD 与道具
 *       （hint/time/shield）、单词上色 paintWord
 * 依赖：core/store、core/srs、core/stats、ui/*（toast/burst/speak）
 * 共享状态：G（本模块创建，5 种模式共写）、modalOpen（读）
 * ==================================================================== */
/* ================= 游戏核心 ================= */
export let G: any = null;
/* G 会被 5 种模式整体重新赋值（G = {...} / G = null）。
   ESM 导入绑定不可被赋值，故统一用 setG() 改写，桥接拆除后保留此 setter。 */
export function setG(v: any) {
  G = v;
}

document.addEventListener("keydown", (e: any) => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if ($("#scr-home").classList.contains("on")) {
    const key = e.key.toLowerCase();
    if (key >= "1" && key <= "9") {
      const idx = parseInt(key) - 1;
      const b = bookOf(S.curBook);
      if (idx < b.units.length && idx <= (S.prog[b.id]?.cleared || 0)) {
        clickLv(idx);
      } else {
        toast("单元未解锁或不存在");
      }
      e.preventDefault();
      return;
    }
  }
  if (e.key === "Escape") {
    handleEsc();
    return;
  }
  if (modalOpen || !G || !G.active) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length === 1) {
    e.preventDefault();
    routeChar(e.key.toLowerCase());
  }
});
/* 获取当前待输入的目标字符（用于空格替代非字母字符） */
export function curTargetChar() {
  if (!G || !G.active) return null;
  if (G.type === "run" || G.type === "battle" || G.type === "p2p") {
    const it = G.queue[G.idx];
    return it ? it.en[G.typed] : null;
  }
  if (G.type === "mem") {
    const it = cur();
    return it ? it.en[G.typed] : null;
  }
  if (G.type === "fall") {
    if (G.target) return G.target.it.en[G.target.matched];
    // 无锁定目标时，选位置最低（最紧急）的首字母非字母单词
    const cands = G.words.filter((w: any) => !/[a-z]/i.test(w.it.en[0]));
    if (cands.length) {
      const w = cands.reduce((a: any, b: any) => (a.y > b.y ? a : b));
      return w.it.en[0];
    }
    return null;
  }
  return null;
}
export function routeChar(ch: any) {
  if (!G || !G.active) return;
  ch = String(ch).toLowerCase();
  // 屏幕键盘只有字母+空格；单词中的连字符、撇号等非字母字符统一用空格代替输入
  if (ch === " ") {
    const tc = curTargetChar();
    if (tc && !/[a-z]/.test(tc)) ch = tc.toLowerCase();
  }
  if (G.type === "run") onRunChar(ch);
  else if (G.type === "fall") onFallChar(ch);
  else if (G.type === "battle") onBattleChar(ch);
  else if (G.type === "mem") onMemChar(ch);
  else if (G.type === "p2p") onP2PChar(ch);
}

export function handleEsc() {
  if (modalOpen) {
    closeModal();
    return;
  }
  if (G && G.active) {
    openModal(
      `<h3>PAUSE</h3><div class="sub">确定退出本局吗？当前进度不会保存。</div><div class="mbtns"><button class="btn c" ${dataAct('closeModal')}>继续战斗</button><button class="btn p" ${dataAct('quitGame')}>退出</button></div>`
    );
  } else if ($("#scr-game").classList.contains("on")) go("scr-home");
}
export function quitGame() {
  closeModal();
  if (G && G.type === "p2p") {
    if (isHost) p2pHostDisband();
    else p2pLeave();
    return;
  }
  endGameCleanup();
  go("scr-home");
}
export function endGameCleanup() {
  if (!G) return;
  G.active = false;
  G.seq = (G.seq || 0) + 1;
  if (G.raf) cancelAnimationFrame(G.raf);
  if (G.iv) clearInterval(G.iv);
  refreshOsk();
}
export async function countdown() {
  if (!G) return;
  G.started = false;
  const c = document.createElement("div");
  c.id = "count";
  const st = $("#arenaWrap .stage");
  if (!st) return;
  st.appendChild(c);
  for (const t of ["3", "2", "1", "GO!"]) {
    if (!G || !G.active) return;
    c.innerHTML = `<span>${t}</span>`;
    beep(t === "GO!" ? 880 : 520, 0.1, "triangle", 0.05);
    await sleep(620);
  }
  c.remove();
  if (G) G.started = true;
}
export function hudHTML(mc: any, title: any, mid: any, right: any) {
  return `<div class="hud"><div class="hl"><span class="badge" style="--mc:${mc}">${title}</span>${mid}</div><div class="hl">${right}<button class="iconbtn" ${dataAct('handleEsc')} title="退出/暂停">✕</button></div></div>`;
}
export function itemBtns(show: any) {
  return `<button class="ibtn" id="ibHint" ${
    show.hint ? "" : 'style="display:none"'
  } ${dataAct('useHint')}>✏️<small id="nHint">${S.items.hint}</small></button>
<button class="ibtn" id="ibTime" ${
    show.time ? "" : 'style="display:none"'
  } ${dataAct('useTime')}>⏳<small id="nTime">${S.items.time}</small></button>
<button class="ibtn" id="ibShield" ${
    show.shield ? "" : 'style="display:none"'
  } ${dataAct('useShield')}>🛡️<small id="nShield">${
    S.items.shield
  }</small></button>`;
}
export function refreshItems() {
  ["Hint", "Time", "Shield"].forEach((k: any) => {
    const el = $("#n" + k);
    if (el) el.textContent = S.items[k.toLowerCase()];
    const b = $("#ib" + k);
    if (b) b.disabled = S.items[k.toLowerCase()] <= 0;
  });
}
export function useHint() {
  if (!G || !G.active || !G.started || G.type !== "run" || S.items.hint <= 0)
    return;
  const it = G.queue[G.idx];
  if (!it) return;
  S.items.hint--;
  save();
  refreshItems();
  let n = 2;
  while (n-- > 0 && G.typed < it.en.length) goodChar();
}
export function useTime() {
  if (!G || !G.active || G.mode !== "time" || S.items.time <= 0) return;
  S.items.time--;
  save();
  refreshItems();
  G.timeLeft += 15;
  floaty(innerWidth / 2, 140, "+15s", "var(--c-c)");
  sShield();
}
export function useShield() {
  if (!G || !G.active || G.shield || S.items.shield <= 0) return;
  if (G.type !== "run" && G.type !== "fall") return;
  S.items.shield--;
  save();
  refreshItems();
  G.shield = true;
  toast("🛡️ 护盾已激活", "抵挡下一次失误");
  sShield();
}
export function paintWord(el: any, word: any, typed: any, err?: any) {
  el.innerHTML = [...word]
    .map((ch: any, i: any) => {
      const c = ch === " " ? "&nbsp;" : escHtml(ch);
      let cls =
        i < typed ? "l ok" : i === typed ? "l cur" + (err ? " err" : "") : "l";
      return `<span class="${cls}">${c}</span>`;
    })
    .join("");
}



registerAct("handleEsc", (_el: any, _ev: any, args: any[]) => (handleEsc as any)(...(args || [])));
registerAct("quitGame", (_el: any, _ev: any, args: any[]) => (quitGame as any)(...(args || [])));





registerAct("useHint", (_el: any, _ev: any, args: any[]) => (useHint as any)(...(args || [])));
registerAct("useTime", (_el: any, _ev: any, args: any[]) => (useTime as any)(...(args || [])));
registerAct("useShield", (_el: any, _ev: any, args: any[]) => (useShield as any)(...(args || [])));

