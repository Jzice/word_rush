import { dataAct, $ } from "../core/utils";
import { registerAct } from "../ui/events";
import { escHtml } from "../core/utils";
import { APP_BUILD, APP_VERSION } from "../core/version";
import { closeModal, openModal } from "./home";

/* ================= 模块：screens/about 关于 =================
 * 职责：关于模态框——版本号、构建模式、更新日志/仓库入口
 *       （页脚版本徽标 onclick="showAbout()" 弹出）
 * 依赖：ui/shell（openModal/closeModal）、core/version（APP_VERSION/APP_BUILD）
 * 共享状态：无
 * ==================================================================== */
export const REPO_URL = "https://github.com/Jzice/word_rush";
export const RELEASE_URL = REPO_URL + "/releases";
export function showAbout() {
  const local = location.protocol === "file:";
  // APP_BUILD 字面量类型是 "dev"（构建时会被替换为 "release"），故断言为 string 以保留运行期判断
  const mode = (APP_BUILD as string) === "release" ? "正式构建" : "开发模式";
  const html = `<h3>ℹ️ 关于 WORD RUSH</h3><div class="sub">单词快打 · 多教材词汇特训</div><div style="text-align:center;margin:14px 0 6px"><div style="font-size:2rem;font-weight:900;font-family:Bungee,cursive;color:var(--c-y);letter-spacing:.05em">v${escHtml(
    APP_VERSION
  )}</div><div style="font-size:.72rem;color:var(--sub);margin-top:4px">${mode}${
    local ? " · 本地文件打开" : ""
  }</div></div><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:14px 0"><button class="btn c sm" ${dataAct('openExt', RELEASE_URL)}>📜 更新日志</button><button class="btn p sm" ${dataAct('openExt', REPO_URL)}>⭐ 源码仓库</button></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" ${dataAct('closeModal')}>关闭</button></div>`;
  openModal(html);
}




registerAct("showAbout", (_el: any, _ev: any, args: any[]) => (showAbout as any)(...(args || [])));
