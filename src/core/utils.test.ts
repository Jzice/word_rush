import { describe, it, expect } from "vitest";
import { P, escHtml, escA, same, rnd, pick, shuffle, clamp } from "./utils";

describe("P 词条解析", () => {
  it("按 | 分词、按 @ 拆分三字段", () => {
    expect(P("apple@苹果@n|book@书@n")).toEqual([
      ["apple", "苹果", "n"],
      ["book", "书", "n"],
    ]);
  });
  it("单条与空段容错", () => {
    expect(P("run@跑@v")).toEqual([["run", "跑", "v"]]);
    expect(P("")).toEqual([]);
  });
});

describe("转义与工具", () => {
  it("escHtml 转义 < 与 &（不转 >）", () => {
    expect(escHtml("<a>&")).toBe("&lt;a>&amp;");
  });
  it("escA 仅转义双引号", () => {
    expect(escA(`a"b'c`)).toBe(`a&quot;b'c`);
  });
  it("same 忽略大小写与空白", () => {
    expect(same("Abc", "abc")).toBe(true);
    expect(same("a b", "ab")).toBe(false);
  });
  it("clamp 区间收敛", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it("rnd/pick/shuffle 基本可用", () => {
    const a = [1, 2, 3, 4, 5];
    expect(a).toContain(pick(a));
    const s = shuffle(a);
    expect(s.length).toBe(a.length);
    expect(rnd(1, 3)).toBeGreaterThanOrEqual(1);
  });
});
