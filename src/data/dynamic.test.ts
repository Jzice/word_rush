import { describe, it, expect } from "vitest";
import { parseCsv, cleanHeadword, mapPos } from "./dynamic";

describe("parseCsv", () => {
  it("返回所有行（含表头，不做跳头/过滤）", () => {
    const csv =
      "word,phonetic,pos,definition,source\na,/a/,n,甲,a\nb,/b/,v,乙,b";
    const rows = parseCsv(csv);
    expect(rows.length).toBe(3);
    expect(rows[1]).toEqual(["a", "/a/", "n", "甲", "a"]);
    expect(rows[2]).toEqual(["b", "/b/", "v", "乙", "b"]);
  });
  it("空文本返回空；引号字段与括号被保留", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv('a,"x,y",n,def,src')[0]).toEqual(["a", "x,y", "n", "def", "src"]);
  });
});

describe("cleanHeadword", () => {
  it("去除尾部括号，其余不变", () => {
    expect(cleanHeadword("apple (the)")).toBe("apple");
    expect(cleanHeadword("come-up")).toBe("come-up");
  });
});

describe("mapPos 归一化词性代码", () => {
  it("映射常见缩写", () => {
    expect(mapPos("n")).toBe("n");
    expect(mapPos("v")).toBe("v");
    expect(mapPos("adj")).toBe("a");
    expect(mapPos("phr")).toBe("e");
    expect(mapPos("?")).toBe("n");
  });
});
