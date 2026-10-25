// 冒烟测试：验证 data-act 中央事件委托逻辑（ui/events 的 handleDataActClick）——
// 解析 data-act / data-args 后分发给同名全局函数或注册的 act，等价于原内联 onclick="fn(args)"。
// 测试环境 document.addEventListener 为 noop，故直接调用导出函数驱动分发逻辑。
import { describe, it, expect, vi } from "vitest";

import { registerAct, handleDataActClick } from "./events";
import { dataAct } from "../core/utils";

describe("data-act 中央事件委托", () => {
  it("dataAct 生成 data-act(+ data-args) 属性", () => {
    expect(dataAct("foo")).toBe('data-act="foo"');
    expect(dataAct("bar", "x", 1)).toBe('data-act="bar" data-args=\'["x",1]\'');
  });

  it("点击命中 data-act 时调用同名全局函数并传入解析后的参数", () => {
    (globalThis as any).myTestFn = vi.fn();
    const hit = { dataset: { act: "myTestFn", args: JSON.stringify(["hello", 42]) } };
    const target = { closest: () => hit };
    handleDataActClick({ target, preventDefault: vi.fn() } as any);
    expect((globalThis as any).myTestFn).toHaveBeenCalledWith("hello", 42);
  });

  it("注册的 act 收到 (el, event, args)", () => {
    const spy = vi.fn();
    registerAct("myAct", spy);
    const hit = { dataset: { act: "myAct", args: JSON.stringify([7, "z"]) } };
    handleDataActClick({ target: { closest: () => hit }, preventDefault: vi.fn() } as any);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][2]).toEqual([7, "z"]);
  });

  it("closest 返回 null 时不分发", () => {
    const fn = vi.fn();
    (globalThis as any).noopFn = fn;
    handleDataActClick({ target: { closest: () => null }, preventDefault: vi.fn() } as any);
    expect(fn).not.toHaveBeenCalled();
  });

  it("data-args 缺省时以空数组调用", () => {
    (globalThis as any).noArgFn = vi.fn();
    const hit = { dataset: { act: "noArgFn" } };
    handleDataActClick({ target: { closest: () => hit }, preventDefault: vi.fn() } as any);
    expect((globalThis as any).noArgFn).toHaveBeenCalledWith();
  });
});
