import { describe, it, expect } from "vitest";
import { tagWord } from "./phonics";

describe("phonics.tagWord", () => {
  it("返回长度与单词一致且不为空", () => {
    for (const w of ["a", "cat", "subject", "favorite", "science", "chocolate", "rhythm", "queen", "stay", "school"]) {
      const t = tagWord(w);
      expect(t.length).toBe(w.length);
      expect(t.every((x) => typeof x.cls === "string" && typeof x.syl === "number")).toBe(true);
    }
  });

  it("常见词音节切分合理", () => {
    // sub-ject
    expect(tagWord("subject").map((x) => x.syl)).toEqual([0, 0, 0, 1, 1, 1, 1]);
    // fa-vor-ite
    expect(tagWord("favorite").map((x) => x.syl)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it("音节边界标记 syl-b 出现在非首音节起始", () => {
    const cls = tagWord("subject").map((x) => x.cls);
    // 第四个字符 'j'（索引3）应为新音节起点，带 syl-b
    expect(cls[3]).toContain("syl-b");
    expect(cls[0]).not.toContain("syl-b");
  });

  it("phonics 类别标注覆盖主要规律", () => {
    const c = (w: string) => tagWord(w).map((x) => x.cls).join(" ");
    expect(c("queen")).toContain("ph-digraph"); // qu
    expect(c("school")).toContain("ph-blend"); // sc
    expect(c("chair")).toContain("ph-digraph"); // ch
    expect(c("car")).toContain("ph-rctl"); // ar
    expect(c("make")).toContain("ph-silent"); // 词尾不发音 e
  });

  it("边界：空串/含非字母不崩溃", () => {
    expect(tagWord("")).toEqual([]);
    expect(() => tagWord("O'Brien")).not.toThrow();
    expect(tagWord("O'Brien").length).toBe("O'Brien".length);
  });
});
