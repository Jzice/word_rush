import { dataAct, $ } from "../core/utils";
import { registerAct } from "../ui/events";
import { S, save } from "../core/store";
import { escHtml } from "../core/utils";
import { bookOf } from "../data/index";
import { startLevel } from "../game/mode-run";
import { closeModal, openModal, renderHome } from "./home";
import { coinBump, toast } from "../ui/fx";
import { go } from "../ui/shell";

/* ================= 模块：screens/achievements 成就与分享 =================
 * 职责：成就表 ACH 与进度检查、成就弹窗、分享弹窗 / 复制链接、
 *       ?challenge= 挑战链接自动开局（加载时 IIFE）
 * 依赖：core/store（S）、core/stats（S 字段）、ui/fx（toast/coinBump）、ui/shell（go/openModal）
 *       game 各模式 start*（运行时）
 * 共享状态：写 S.ach
 * ==================================================================== */
/* ================= 成就 ================= */
export const ACH: any = [
  ["first", "初来乍到", "完成第一局游戏", (s: any) => s.stats.games >= 1],
  ["c10", "连击新星", "达成 10 连击", (s: any) => s.stats.bestCombo >= 10],
  ["c25", "心流状态", "达成 25 连击", (s: any) => s.stats.bestCombo >= 25],
  ["w100", "百词斩", "累计拼对 100 词", (s: any) => s.stats.words >= 100],
  ["w500", "词汇大亨", "累计拼对 500 词", (s: any) => s.stats.words >= 500],
  ["p3", "完美主义", "任意单元三星通关", (s: any) => s.stats.perfect >= 1],
  ["beat", "精英杀手", "对战击败精英机器人", (s: any) => s.stats.hardWin >= 1],
  ["rich", "小有积蓄", "持有 1000 金币", (s: any) => s.coins >= 1000],
  ["max", "永久记忆", "首个单词达到永久记忆", (s: any) => s.stats.maxed >= 1],
  ["win5", "常胜将军", "累计获胜 5 次", (s: any) => s.stats.wins >= 5],
  [
    "bloom",
    "花语者",
    "花瓣记忆累计完美拼写 10 词",
    (s: any) => s.stats.memPerfect >= 10,
  ],
  [
    "unit20",
    "单元猎人",
    "累计通关 20 个单元",
    (s: any) => s.stats.unitsCleared >= 20,
  ],
  ["p2p_win", "🌐 联机首胜", "赢得一场联机对战", (s: any) => s.stats.p2pWins >= 1],
  [
    "p2p_warrior",
    "🌐 联机勇士",
    "赢得 5 场联机对战",
    (s: any) => s.stats.p2pWins >= 5,
  ],
];

export function checkAch() {
  for (const [id, n, d, f] of ACH) {
    if (!S.ach[id] && f(S)) {
      S.ach[id] = 1;
      S.coins += 30;
      save();
      toast("🏅 成就解锁：" + n, "奖励 30 金币 · " + d);
      coinBump();
    }
  }
}
export function getAchProgress(id: any) {
  const map: any = {
    first: S.stats.games,
    c10: S.stats.bestCombo,
    c25: S.stats.bestCombo,
    w100: S.stats.words,
    w500: S.stats.words,
    p3: S.stats.perfect,
    beat: S.stats.hardWin,
    rich: S.coins,
    max: S.stats.maxed,
    win5: S.stats.wins,
    bloom: S.stats.memPerfect,
    unit20: S.stats.unitsCleared,
    p2p_win: S.stats.p2pWins,
    p2p_warrior: S.stats.p2pWins,
  };
  return map[id] || 0;
}
export function getAchTarget(id: any) {
  const map: any = {
    first: 1,
    c10: 10,
    c25: 25,
    w100: 100,
    w500: 500,
    p3: 1,
    beat: 1,
    rich: 1000,
    max: 1,
    win5: 5,
    bloom: 10,
    unit20: 20,
    p2p_win: 1,
    p2p_warrior: 5,
  };
  return map[id] || 1;
}
export function showAchievementModal() {
  const html = `<h3>🏆 成就榜</h3><div class="sub">每解锁一个成就奖励 30 金币</div><div style="display:grid;grid-template-columns:1fr;gap:8px;text-align:left;max-height:50vh;overflow-y:auto;padding:4px 0">${ACH.map(
    ([id, n, d]: any) => {
      const done = !!S.ach[id];
      const prog = getAchProgress(id),
        target = getAchTarget(id);
      const pct = Math.min(100, Math.round((prog / target) * 100));
      return `<div style="display:flex;align-items:center;gap:10px;border-bottom:1px dashed var(--line);padding:6px 0;flex-wrap:wrap;"><span style="font-size:1.4rem">${
        done ? "✅" : "⬜"
      }</span><div style="flex:1;min-width:120px"><b>${n}</b><div style="font-size:.7rem;color:var(--sub)">${d}</div></div><div style="width:100px;height:6px;background:var(--panel);border-radius:99px;overflow:hidden;flex-shrink:0"><div style="height:100%;width:${pct}%;background:${
        done ? "var(--ok)" : "var(--c-y)"
      };border-radius:99px;transition:width .4s"></div></div><span style="font-size:.7rem;min-width:40px;text-align:right;color:var(--sub)">${
        done ? "✔️" : prog + "/" + target
      }</span></div>`;
    }
  ).join(
    ""
  )}</div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>关闭</button></div>`;
  openModal(html);
}
export function showShareModal() {
  const b = bookOf(S.curBook),
    pr = S.prog[b.id] || { cleared: 0 };
  const url = new URL(location.href);
  const data = {
    book: S.curBook,
    mode: "level",
    unit: Math.min(pr.cleared, b.units.length - 1),
  };
  url.searchParams.set("challenge", btoa(JSON.stringify(data)));
  const shareUrl = url.toString();
  const html = `<h3>📤 分享挑战</h3><div class="sub">将以下链接发给好友，对方打开后自动进入同一单元挑战</div><div style="background:var(--panel);border-radius:10px;padding:12px;word-break:break-all;font-size:.8rem;border:1px solid var(--line);margin:12px 0;font-family:monospace">${escHtml(
    shareUrl
  )}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;"><button class="btn y sm" ${dataAct('copyShareLink', shareUrl)}>📋 复制链接</button>${
    typeof navigator.share === "function"
      ? `<button class="btn c sm" ${dataAct('share', {
          title: 'WORD RUSH 单词挑战',
          text: '来和我一起挑战单词吧！',
          url: shareUrl,
        })}>📱 分享</button>`
      : ""
  }</div><div class="sub" style="font-size:.7rem">💡 对方打开链接后会自动进入对应词库和单元，支持所有游戏模式</div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>关闭</button></div>`;
  openModal(html);
}
export function copyShareLink(url: any) {
  navigator.clipboard
    .writeText(url)
    .then(() => toast("✅ 链接已复制"))
    .catch(() => {
      const i = document.createElement("input");
      i.value = url;
      document.body.appendChild(i);
      i.select();
      document.execCommand("copy");
      i.remove();
      toast("✅ 链接已复制");
    });
}
(function checkChallenge() {
  const params = new URLSearchParams(location.search);
  const enc = params.get("challenge");
  if (enc) {
    try {
      const data = JSON.parse(atob(enc));
      if (data.book && data.mode === "level" && data.unit !== undefined) {
        S.curBook = data.book;
        save();
        setTimeout(() => {
          renderHome();
          const b = bookOf(data.book),
            pr = S.prog[b.id] || {};
          if (data.unit <= pr.cleared) {
            toast(
              "📤 已加载分享的挑战",
              `${b.name} · ${b.units[data.unit]?.n || "单元"}`
            );
            startLevel(data.book, data.unit);
          } else {
            toast("🔒 请先完成前面的单元");
          }
        }, 500);
      }
    } catch (e) {}
  }
})();






registerAct("showAchievementModal", (_el: any, _ev: any, args: any[]) => (showAchievementModal as any)(...(args || [])));
registerAct("showShareModal", (_el: any, _ev: any, args: any[]) => (showShareModal as any)(...(args || [])));
registerAct("copyShareLink", (_el: any, _ev: any, args: any[]) => (copyShareLink as any)(...(args || [])));
