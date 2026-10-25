import { dataAct, $ } from "../core/utils";
import { lvl, titleOf } from "../core/stats";
import { S, save } from "../core/store";
import { clamp, pick } from "../core/utils";
import { checkAch } from "./achievements";
import { closeModal, openModal } from "./home";
import { speak } from "../ui/audio";
import { coinBump, toast } from "../ui/fx";
import { go, refreshHead } from "../ui/shell";

/* ================= 模块：screens/result 通用结算 =================
 * 职责：五模式共用结算 showResult（发奖/升级/成就/错词 chips）、
 *       数字滚动 countUp、TIPS 鼓励语
 * 依赖：core/stats（lvl/titleOf）、screens/achievements（checkAch）、
 *       ui/shell（refreshHead/go）、ui/fx（coinBump/toast）、ui/audio（speak）
 * 共享状态：写 S（金币/经验/统计）
 * ==================================================================== */
/* ---------- 结算 ---------- */
export const TIPS = [
  "间隔重复：今天拼对的词，明天系统会自动安排再见一面。",
  "睡前回忆一遍本局的错词，记忆巩固效果最佳。",
  "记单词先看词性和短语，语境联想比孤立拼写更牢。",
  "花瓣记忆法：先看、再读、后藏、终写，四步闭环。",
  "连击时大脑处于“心流”状态，是背词的黄金时段。",
];
export function showResult(o: any) {
  const lvB = lvl(S.xp);
  const coins = o.coins || 0,
    xp = o.xp || 0;
  S.coins += coins;
  S.xp += xp;
  checkAch();
  save();
  refreshHead();
  coinBump();
  const lvA = lvl(S.xp),
    up = lvA.lv > lvB.lv;
  openModal(`<div style="text-align:center">
  <div class="stamp">${o.stamp}</div>
  ${
    o.stars != null
      ? `<div class="stars">${"★".repeat(o.stars)}${"☆".repeat(
          3 - o.stars
        )}</div>`
      : ""
  }
  ${
    up
      ? `<div class="lvlup">🎉 升级！LV ${lvA.lv} · ${titleOf(lvA.lv)}</div>`
      : ""
  }
  <div class="rgrid">${o.stats
    .map((p: any) => `<div class="rcell"><b>${p[1]}</b><span>${p[0]}</span></div>`)
    .join("")}</div>
  <div class="rw"><div><b id="rCoin">0</b><small>金币入账</small></div><div><b id="rXp" style="color:#1d9e57">0</b><small>经验值</small></div>
   <div style="margin-left:auto;font-size:.75rem;color:#67788e">当前 🪙 ${
     S.coins
   } · XP ${S.xp}</div></div>
  ${
    o.wrong && o.wrong.length
      ? `<div style="font-size:.78rem;color:#67788e;text-align:left">本局错词（点击发音，已自动加入复习）：</div>
   <div class="wchips">${o.wrong
     .slice(0, 14)
     .map(
       (w: any) =>
         `<span class="wchip" ${dataAct('speak', w.en.replace(/'/g, ""))}>${
           w.en
         }</span>`
     )
     .join("")}</div>`
      : ""
  }
  <div class="tip">💡 ${pick(TIPS)}</div>
  <div class="mbtns"><button class="btn y" id="btnAgain">🔁 再来一局</button><button class="btn b" ${dataAct('closeModalGoHome')}>返回主页</button></div></div>`);
  countUp($("#rCoin"), coins);
  countUp($("#rXp"), xp);
  $("#btnAgain").onclick = () => {
    closeModal();
    o.restart && o.restart();
  };
}
export function countUp(el: any, t: any) {
  const s = performance.now();
  (function f(n: any) {
    const p = clamp((n - s) / 800, 0, 1);
    el.textContent = Math.round(t * p);
    if (p < 1) requestAnimationFrame(f);
  })(s);
}





