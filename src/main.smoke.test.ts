// 冒烟测试：桥接拆除后，ui/screens 各模块仍真实导出这些公共函数（不再挂 window），
// 且首页渲染 / 切屏 / 弹窗等运行期调用在最小垫片下不抛错。
// 与旧的「window.X 已暴露」测试等价，但校验的是 ESM 真实导出（桥接终态）。
import { describe, it, expect } from "vitest";

// 导入入口即触发全部 ESM 模块求值（顶层 DOM 绑定 / registerAct 注册）
import "./main";

import * as home from "./screens/home";
import * as shell from "./ui/shell";
import * as modeSelect from "./screens/mode-select";
import * as book from "./screens/book";
import * as table from "./screens/table";
import * as stats from "./screens/stats";
import * as shop from "./screens/shop";
import * as achievements from "./screens/achievements";
import * as about from "./screens/about";
import * as result from "./screens/result";
import * as audio from "./ui/audio";
import * as fx from "./ui/fx";
import * as render from "./ui/render";
import { S } from "./core/store";
import { APP_VERSION } from "./core/version";
import pkg from "../package.json";

const mods: any[] = [home, shell, modeSelect, book, table, stats, shop, achievements, about, result, audio, fx, render];
const exported = new Map<string, any>();
for (const m of mods) {
  for (const k of Object.keys(m)) {
    if (typeof (m as any)[k] === "function") exported.set(k, (m as any)[k]);
  }
}

describe("模块导出（桥接已拆除，改为真实 ESM 导出）", () => {
  const expected = [
    "renderHome", "go", "refreshHead", "buildOsk", "refreshOsk",
    "openModal", "closeModal", "openProfileModal", "showWrongList",
    "openMode", "showAbout", "showResult", "renderBook", "renderWb",
    "renderTable", "pickTableBook", "renderStats", "setStatsRange",
    "renderShop", "useTheme", "buyTheme", "buyItem", "speak", "toast",
    "coinBump", "phLine", "wordCard", "checkAch", "copyShareLink",
    "toggleWordOrder", "pickBook", "clickLv", "showAchievementModal",
    "showShareModal", "fmtDue", "drawLearnChart", "drawSrsCharts",
    "bookOpts", "countUp", "pfPick", "saveProfile", "openProfileFromP2P",
    "renderDynPanel",
  ];
  for (const name of expected) {
    it(`${name} 已由所属模块导出`, () => {
      expect(typeof exported.get(name)).toBe("function");
    });
  }

  it("S 可经真实导入拿到，且 APP_VERSION 与 package.json 保持一致", () => {
    expect(S).toBeTruthy();
    // 版本一致性是本项目的硬约束（build.mjs 也会校验），此处用 package.json 比对而非硬编码，
    // 这样 npm run bump 之后测试不会因为版本号变化而误报失败。
    expect(APP_VERSION).toBe(pkg.version);
  });
});

describe("运行期调用", () => {
  it("renderHome() 不抛错", () => {
    expect(() => home.renderHome()).not.toThrow();
  });
  it("go('scr-book'/'scr-stats'/'scr-shop') 不抛错", () => {
    expect(() => shell.go("scr-book")).not.toThrow();
    expect(() => shell.go("scr-stats")).not.toThrow();
    expect(() => shell.go("scr-shop")).not.toThrow();
    expect(() => shell.go("scr-home")).not.toThrow();
  });
  it("openModal/closeModal 不抛错", () => {
    expect(() => home.openModal("<h3>hi</h3>")).not.toThrow();
    expect(() => home.closeModal()).not.toThrow();
  });
});
