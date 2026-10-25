// vitest 测试垫片：为导入含 window 桥接 / localStorage / DOM 的模块提供最小全局环境。
import { vi } from "vitest";
import { speak } from "./ui/audio";

const noop = () => {};

class MemStorage {
  private _m = new Map<string, string>();
  getItem(k: string) {
    return this._m.has(k) ? this._m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this._m.set(k, String(v));
  }
  removeItem(k: string) {
    this._m.delete(k);
  }
}

const el = () => ({
  style: { setProperty: noop },
  dataset: {},
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  value: "all",
  appendChild: noop,
  setAttribute: noop,
  addEventListener: noop,
  removeEventListener: noop,
  querySelector: el,
  querySelectorAll: () => [],
  getContext: () => ({}),
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,
  }),
  clientWidth: 600,
  width: 600,
  height: 200,
  closest: () => null,
});

vi.stubGlobal("window", globalThis);
vi.stubGlobal("document", {
  querySelector: el,
  querySelectorAll: () => [],
  createElement: el,
  getElementById: el,
  addEventListener: noop,
  removeEventListener: noop,
  body: el(),
});
vi.stubGlobal("addEventListener", noop);
vi.stubGlobal("removeEventListener", noop);
vi.stubGlobal("scrollTo", noop);
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: noop,
  removeEventListener: noop,
  addListener: noop,
}));
vi.stubGlobal("innerWidth", 1200);
vi.stubGlobal("devicePixelRatio", 1);
vi.stubGlobal("requestAnimationFrame", noop);
vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: () => "" }));
vi.stubGlobal("performance", { now: () => 0 });
vi.stubGlobal("localStorage", new MemStorage());
vi.stubGlobal("navigator", { language: "zh" });
vi.stubGlobal("location", { search: "", href: "", hash: "" });
vi.stubGlobal("speechSynthesis", { getVoices: () => [], speak: noop, cancel: noop });
vi.stubGlobal("fetch", () => Promise.reject(new Error("no-net-in-tests")));
