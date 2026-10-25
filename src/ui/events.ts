import { $ } from "../core/utils";
// 事件委托层：把存量 JS 生成 HTML / 静态 HTML 的内联 onclick 统一迁移到 data-act 中央分发。
// 用法：模板串里把 `onclick="fn(a,b)"` 换成 `${dataAct("fn", a, b)}`（见 core/utils 的 dataAct）。
// 点击时：① 优先调用 registerAct 注册的处理函数（可拿到元素/事件/解析后的参数）；
//        ② 否则若在 window 上存在同名全局函数（经 bridge 暴露），用解析出的参数直接调用，
//           行为与原始 `onclick="fn(args)"` 完全一致；③ 否则开发期告警。
// 与 index.html 既有 data-t（朗读）全局委托共存，互不干扰。
// TODO(refactor): 末层迁移后保留为统一事件入口，可逐步把 window 反射调用改为显式注册的 acts。
type ActHandler = (el: HTMLElement, ev: Event, args: any[]) => void;

const acts = new Map<string, ActHandler>();

export function registerAct(name: string, fn: ActHandler): void {
  acts.set(name, fn);
}

export function unregisterAct(name: string): void {
  acts.delete(name);
}

// 复合 / 特殊动作：不便用通用 window 反射表达，在此显式注册。
registerAct("openExt", (_el, _ev, args) => {
  const url = args[0];
  const target = typeof args[1] === "string" ? args[1] : "_blank";
  try {
    window.open(url, target);
  } catch (e) {}
});
registerAct("share", (_el, _ev, args) => {
  const obj = args[0];
  if (navigator.share) {
    navigator.share(obj).catch(() => {});
  }
});
// 「关闭弹窗并回主页」「关闭弹窗并重试错词」两个复合动作需要 closeModal()/go()，
// 它们已注册在 screens/home.ts（该模块同时拥有 closeModal 且已导入 go），
// 避免 events.ts 反向依赖 screens 造成循环导入（home 需从 events 拿 registerAct）。

const parseArgs = (raw: string | null): any[] => {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [v];
  } catch (e) {
    return [];
  }
};

export function handleDataActClick(e: Event): void {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const hit = target.closest<HTMLElement>("[data-act]");
  if (!hit) return;
  const name = hit.dataset.act;
  if (!name) return;
  const args = parseArgs(hit.dataset.args ?? null);
  const fn = acts.get(name);
  if (fn) {
    e.preventDefault();
    fn(hit, e, args);
    return;
  }
  const g = (window as any)[name];
  if (typeof g === "function") {
    e.preventDefault();
    g.apply(null, args);
    return;
  }
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[data-act] 未注册且无全局函数：", name);
  }
}

document.addEventListener("click", handleDataActClick);
