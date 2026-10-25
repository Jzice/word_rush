import { describe, it, expect, beforeEach } from "vitest";
import { def, save, S } from "./store";

describe("def 默认存档", () => {
  it("包含关键字段且 mastery/daily 为对象", () => {
    const d = def();
    expect(typeof d.mastery).toBe("object");
    expect(typeof d.daily).toBe("object");
    expect(d).toHaveProperty("stats");
    expect(d).toHaveProperty("items");
    expect(d).toHaveProperty("set");
    expect(d).toHaveProperty("profile");
    expect(typeof d.curBook).toBe("string");
  });
});

describe("save 序列化", () => {
  beforeEach(() => {
    S.mastery["__t__"] = {
      lv: 1,
      r: 1,
      w: 0,
      due: 0,
      reps: 1,
      lapses: 0,
      iv: 1,
      ef: 2.5,
      first: 0,
      last: 0,
      rt: 0,
    };
  });
  it("写入 localStorage 且可解析回相同 mastery", () => {
    save();
    const raw = (globalThis as any).localStorage.getItem("wordrush_v1");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.mastery["__t__"].lv).toBe(1);
  });
});
