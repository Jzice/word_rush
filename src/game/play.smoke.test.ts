// 冒烟测试：桥接拆除后，game/net 各模块仍真实导出这些对局函数（不再挂 window），
// 且「开局→逐字母拼词→结算」运行期调用在最小垫片下不抛错。
// G 由 core 以 `export let` 提供实时绑定，各模式通过 setG() 整体写入。
import { describe, it, expect, beforeEach } from "vitest";

import "../main";

import * as core from "./core";
import * as modeRun from "./mode-run";
import * as modeMem from "./mode-mem";
import * as modeFall from "./mode-fall";
import * as modeBattle from "./mode-battle";
import * as p2p from "../net/p2p";

const mods: any[] = [core, modeRun, modeMem, modeFall, modeBattle, p2p];
const exported = new Map<string, any>();
for (const m of mods) {
  for (const k of Object.keys(m)) {
    if (typeof (m as any)[k] === "function") exported.set(k, (m as any)[k]);
  }
}

describe("模块导出（桥接已拆除，改为真实 ESM 导出）", () => {
  const expected = [
    "routeChar", "handleEsc", "quitGame", "endGameCleanup", "countdown",
    "hudHTML", "itemBtns", "refreshItems", "useHint", "useTime", "useShield",
    "paintWord", "startLevel", "startTime", "startRun", "showWord", "tickTime",
    "goodChar", "onRunChar", "runFailWord", "runComplete", "finishRun",
    "startMemory", "cur", "memPaint", "memHide", "onMemChar", "spawnOrb",
    "memDone", "updateFlower", "finishMemory", "startFalling", "fallLoop",
    "spawnFall", "paintFall", "onFallChar", "paintFallInput", "fallMiss",
    "destroyFall", "bottomHit", "endFall", "startBattle", "renderBattle",
    "showBattleWord", "battleLoop", "updateLanes", "onBattleChar", "battleEnd",
    "battlePhase2", "openP2PMode", "p2pHostStartDuel", "p2pCreateRoom",
    "p2pJoinRoom", "roomCreate", "roomJoin", "startP2PBattle", "onP2PChar",
    "p2pLeave", "p2pHostDisband",
  ];
  for (const name of expected) {
    it(`${name} 已由所属模块导出`, () => {
      expect(typeof exported.get(name)).toBe("function");
    });
  }
  it("G 为 null（未开局）且 isHost 为布尔", () => {
    expect(core.G).toBe(null);
    expect(typeof p2p.isHost).toBe("boolean");
  });
});

describe("对局运行期（G 经 setG 写入，实时绑定可见）", () => {
  beforeEach(() => {
    // 清掉上一局（若有）
    if (core.G && core.G.active) core.endGameCleanup();
  });
  it("startRun 写入 G，逐字母拼词推进并结算不抛错", () => {
    const queue = [
      { en: "cat", cn: "猫", pos: "n" },
      { en: "dog", cn: "狗", pos: "n" },
    ];
    expect(() =>
      modeRun.startRun({
        mode: "level",
        bookId: "j1",
        li: 0,
        title: "T",
        queue,
        lives: 3,
      })
    ).not.toThrow();
    // 开局后 G 已被 setG 写入（导入的实时绑定可见，无需 window getter）
    expect(core.G).toBeTruthy();
    expect(core.G.mode).toBe("level");
    // 跳过倒计时等待，直接标记已开始
    core.G.started = true;
    // 按当前词实际拼写逐词拼完（词序可能因 wordOrder 被打乱）
    let guard = 0;
    while (core.G && core.G.active && guard++ < 10) {
      const w = core.G.queue[core.G.idx];
      if (!w) break;
      for (const ch of w.en) core.routeChar(ch);
    }
    // 两词拼完触发 finishRun → active 置 false
    expect(core.G.active).toBe(false);
    expect(core.G.correct).toBe(2);
  });
  it("限时模式 startRun 不抛错", () => {
    expect(() =>
      modeRun.startRun({
        mode: "time",
        title: "T",
        queue: [
          { en: "sun", cn: "太阳", pos: "n" },
          { en: "moon", cn: "月亮", pos: "n" },
        ],
        time: 60,
      })
    ).not.toThrow();
    expect(core.G.mode).toBe("time");
  });
});
