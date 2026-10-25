import { describe, it, expect } from "vitest";
import { srsGrade, srsPriority, markWord, srsLv, srsQ } from "./srs";
import { S } from "./store";

describe("srsQ 质量评定", () => {
  it("未拼出 = 1", () => expect(srsQ(false, 0, 0, 5)).toBe(1));
  it("零错且快速 = 5", () => expect(srsQ(true, 0, 500, 5)).toBe(5));
  it("错 1 键 = 3", () => expect(srsQ(true, 1, 500, 5)).toBe(3));
});

describe("srsLv 派生等级", () => {
  it("未学 = 0", () => expect(srsLv({ r: 0 })).toBe(0));
  it("重学步 reps=0 = 1", () => expect(srsLv({ r: 1, reps: 0 })).toBe(1));
  it("间隔 >= 60 天 = 5", () => expect(srsLv({ r: 1, reps: 3, iv: 60 })).toBe(5));
});

describe("srsGrade 核心调度", () => {
  it("答对提升 r 并写回 S.mastery", () => {
    const en = "__grade_a__";
    delete S.mastery[en];
    const m = srsGrade({ en }, true, 0, 500);
    expect(m.r).toBeGreaterThan(0);
    expect(S.mastery[en].r).toBe(m.r);
  });
  it("答错重置 reps 且 w+1", () => {
    const en = "__grade_b__";
    S.mastery[en] = {
      lv: 5, r: 3, w: 0, due: 0, reps: 3, lapses: 0,
      iv: 10, ef: 2.5, first: 0, last: 0, rt: 0,
    };
    const m = srsGrade({ en }, false, 0, 0);
    expect(m.w).toBe(1);
    expect(m.reps).toBe(0);
  });
});

describe("markWord 转发", () => {
  it("转发 srsGrade 写回 mastery", () => {
    const en = "__mw__";
    delete S.mastery[en];
    markWord({ en, cn: "x" }, true);
    expect(S.mastery[en].r).toBeGreaterThan(0);
  });
});

describe("srsPriority 调度优先级", () => {
  it("逾期越久优先级越高", () => {
    const now = Date.now();
    expect(srsPriority({ due: now - 100000 }, now)).toBeGreaterThan(
      srsPriority({ due: now - 1000 }, now)
    );
  });
});
