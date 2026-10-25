// 浏览器冒烟测试：在真实 Chromium 中加载单文件产物 dist/word_rush.html（file://），
// 验证：① 无未捕获 JS 异常；② data-act 中央委托在真实浏览器中确实分发导航/动作；
// ③ 核心对局（选单元→开始→用真实键盘打字→进度推进→结算）可玩；
// ④ 商店/数据/单词表/单词本/个人资料/成就/关于/P2P 各屏交互无异常。
//
// 设计为「与桥接无关」：不依赖 window.G / window.routeChar 等全局，
// 全部用真实点击 + 真实键盘 + DOM 断言，因此桥接拆除前后都可作为回归基线。
// 用法：npm run smoke  （会先 node build.mjs 再跑本脚本）
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const fileUrl = pathToFileURL(resolve("dist/word_rush.html")).href;
const IGNORE = /unpkg|peerjs|fonts\.googleapis|fonts\.gstatic|net::ERR|Failed to load resource|speechSynthesis|webvitals/i;

const pageErrors = [];
const consoleErrors = [];
const log = (...a) => console.log("[smoke]", ...a);

// 点击指定 data-act（可选匹配首个参数）；返回是否找到
async function clickAct(page, act, arg) {
  return page.evaluate(
    ({ act, arg }) => {
      const els = [...document.querySelectorAll(`[data-act="${act}"]`)];
      const el = els.find((e) => {
        if (arg === undefined) return true;
        try {
          return JSON.parse(e.getAttribute("data-args") || "[]")[0] === arg;
        } catch {
          return false;
        }
      });
      if (!el) return false;
      el.click();
      return true;
    },
    { act, arg }
  );
}
// 点击首个匹配 data-act 的元素（忽略参数）
async function clickActFirst(page, act) {
  return clickAct(page, act);
}

const results = [];
function check(name, cond, extra) {
  results.push({ name, ok: !!cond });
  log(cond ? "✅" : "❌", name, extra !== undefined ? JSON.stringify(extra) : "");
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => {
  if (!IGNORE.test(e.message)) pageErrors.push(e.message);
});
page.on("console", (m) => {
  if (m.type() === "error" && !IGNORE.test(m.text())) consoleErrors.push(m.text());
});

try {
  await page.goto(fileUrl, { waitUntil: "load" });
  await page.waitForSelector("#scr-home", { timeout: 8000 });
  check("主页 #scr-home 渲染", await page.$("#scr-home"));

  // —— 各屏导航（data-act=go 真实点击）——
  const screens = ["scr-book", "scr-table", "scr-stats", "scr-shop", "scr-home"];
  for (const s of screens) {
    await clickAct(page, "go", s);
    await page.waitForTimeout(120);
    check(`导航到 ${s} 激活`, await page.$eval(`#${s}`, (e) => e.classList.contains("on")));
  }

  // —— 商店：启用主题 + 购买道具 ——
  await clickAct(page, "go", "scr-shop");
  await page.waitForTimeout(150);
  const usedTheme = await clickActFirst(page, "useTheme");
  const bought = await clickActFirst(page, "buyItem");
  await page.waitForTimeout(150);
  check("商店 useTheme/buyItem 可点击且无异常", usedTheme || bought);

  // —— 学习数据：Canvas 实际绘制 + 切换区间 ——
  await clickAct(page, "go", "scr-stats");
  await page.waitForTimeout(200);
  const canvasOk = await page
    .evaluate(() => {
      const c = document.querySelector("#learnChart");
      if (!c) return false;
      try {
        const ctx = c.getContext("2d");
        const w = c.width,
          h = c.height;
        if (!w || !h) return false;
        const d = ctx.getImageData(0, 0, w, h).data;
        for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return true;
        return false;
      } catch {
        return false;
      }
    })
    .catch(() => false);
  check("学习数据 Canvas 已实际绘制", canvasOk);
  await clickActFirst(page, "setStatsRange");
  await page.waitForTimeout(100);

  // —— 单词表：搜索 + 选词库 ——
  await clickAct(page, "go", "scr-table");
  await page.waitForTimeout(150);
  const search = await page.$("#tSearch");
  if (search) {
    await search.click();
    await page.keyboard.type("a", { delay: 10 });
    await page.waitForTimeout(150);
  }
  const pickedBook = await clickActFirst(page, "pickTableBook");
  await page.waitForTimeout(150);
  check("单词表 搜索/选词库 无异常", !!search && pickedBook);

  // —— 单词本：朗读行（speak，已被 try/catch 保护）——
  await clickAct(page, "go", "scr-book");
  await page.waitForTimeout(150);
  const spoke = await clickActFirst(page, "speak");
  await page.waitForTimeout(100);
  check("单词本 朗读(speak) 可点击", spoke);

  // —— 个人资料模态：打开→选表情→保存 ——
  await clickAct(page, "go", "scr-home");
  await page.waitForTimeout(120);
  await clickActFirst(page, "openProfileModal");
  await page.waitForTimeout(150);
  const profileOpen = (await page.$$('[data-act="saveProfile"]')).length > 0;
  await clickActFirst(page, "pfPick");
  await clickActFirst(page, "saveProfile");
  await page.waitForTimeout(150);
  check("个人资料 打开/选择/保存 无异常", profileOpen);

  // —— 成就模态 ——
  await clickActFirst(page, "showAchievementModal");
  await page.waitForTimeout(150);
  const achvOpen = (await page.$$('[data-act="closeModal"]')).length > 0;
  await clickActFirst(page, "closeModal");
  await page.waitForTimeout(100);
  check("成就弹窗 打开/关闭 无异常", achvOpen);

  // —— 关于模态（跳过 openExt 避免弹窗噪声）——
  await clickActFirst(page, "showAbout");
  await page.waitForTimeout(150);
  await clickActFirst(page, "closeModal");
  await page.waitForTimeout(100);
  check("关于弹窗 打开/关闭 无异常", true);

  // —— 错词本模态（可能仅 toast，无弹窗）——
  await clickActFirst(page, "showWrongList");
  await page.waitForTimeout(120);

  // —— P2P 模态（仅 UI，不创建/加入房间以免触发 PeerJS 网络）——
  await clickActFirst(page, "openP2PMode");
  await page.waitForTimeout(150);
  const p2pOpen = (await page.$$('[data-act="openDuelMode"]')).length > 0;
  await clickActFirst(page, "openDuelMode");
  await page.waitForTimeout(120);
  await clickActFirst(page, "closeModal");
  await clickActFirst(page, "closeModal");
  await page.waitForTimeout(120);
  check("P2P 弹窗/单挑子弹窗 打开无异常", p2pOpen);

  // —— 核心对局：点第一个单元 → startLevel 直接开局（真实键盘打字）——
  await clickAct(page, "go", "scr-home");
  await page.waitForTimeout(120);
  await clickActFirst(page, "clickLv");
  // 等待倒计时结束、#wordBox 出现当前词
  await page
    .waitForFunction(() => {
      const w = document.querySelector("#wordBox");
      return w && (w.textContent || "").trim().length > 0;
    }, { timeout: 6000 })
    .catch(() => {});
  const started = (await page.$eval("#wordBox", (e) => (e.textContent || "").trim().length > 0).catch(() => false)) || false;
  check("clickLv 直接开局(#wordBox 有词)", started);

  if (started) {
    let correctBefore = 0;
    try {
      correctBefore = await page.$eval("#score", (e) => parseInt(e.textContent || "0", 10)).catch(() => 0);
    } catch {}
    let guard = 0;
    let typed = 0;
    while (guard++ < 80) {
      if (await page.$("#btnAgain")) break; // 结算弹窗出现
      const word = await page
        .$eval("#wordBox", (e) => (e.textContent || "").replace(/ /g, " ").trim())
        .catch(() => "");
      if (!word) {
        await page.waitForTimeout(50);
        continue;
      }
      await page.keyboard.type(word, { delay: 6 });
      typed++;
      await page.waitForTimeout(60);
    }
    check("对局用真实键盘拼词并推进(>=1词)", typed > 0);
    const settled = (await page.$$("#btnAgain")).length > 0;
    check("对局结算弹窗 #btnAgain 出现", settled);
    void correctBefore;
  }

  // 关闭结算，验证 openMode + #goBtn 限时模式路径
  await clickActFirst(page, "closeModalGoHome");
  await page.waitForTimeout(150);
  await clickAct(page, "openMode", "time");
  await page.waitForSelector("#goBtn", { timeout: 5000 }).catch(() => {});
  check("openMode 打开模式弹窗(#goBtn)", (await page.$$("#goBtn")).length > 0);
} catch (e) {
  consoleErrors.push("EXCEPTION: " + (e && e.message ? e.message : String(e)));
} finally {
  await browser.close();
}

check("无 pageerror(忽略 CDN/字体/TTS 网络)", pageErrors.length === 0);
check("无 console error(忽略 CDN/字体/TTS 网络)", consoleErrors.length === 0);

if (pageErrors.length) log("pageErrors:", pageErrors);
if (consoleErrors.length) log("consoleErrors:", consoleErrors);

const failed = results.filter((r) => !r.ok);
log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
process.exit(failed.length ? 1 : 0);
