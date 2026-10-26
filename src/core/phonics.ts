/* ================= 模块：core/phonics 单词视觉解析 =================
 * 职责：把单词切成音节并标注自然拼读(phonics)类别，供各模式逐字母上色
 * 依赖：无（纯函数 + 模块内缓存）
 * 共享状态：_cache（按小写词缓存 tagWord 结果，避免逐键重算）
 * 说明：纯启发式算法，常见词准确；少数不规则词可能切分偏差，不影响游戏逻辑
 * ==================================================================== */
const VOW = new Set(["a", "e", "i", "o", "u", "y"]);
const isV = (c: string) => VOW.has(c);

// 元音组合（按长度降序，优先匹配长的）
const V_TEAMS = ["ough", "igh", "ee", "ea", "ai", "ay", "oa", "ow", "oo", "ou", "oi", "oy", "ie", "ei", "ey", "au", "aw", "ue", "ui"];
// r 控制元音
const R_CTL = ["ar", "er", "ir", "or", "ur"];
// 辅音连缀（digraphs，长度降序）
const DIGRAPHS = ["qu", "ck", "ng", "dg", "sh", "ch", "th", "ph", "wh"];
// 辅音混合（blends，长度降序）
const BLENDS = ["spl", "spr", "str", "scr", "bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw", "tw"];

export interface PhTag {
  syl: number; // 所属音节序号（从 0 起）
  cls: string; // "ph-<类>[ syl-b]"，syl-b 标记音节起始（非首音节）
}

function hasVowelBefore(low: string, idx: number): boolean {
  for (let k = 0; k < idx; k++) if (isV(low[k])) return true;
  return false;
}

// 启发式音节切分：返回每个字符所属音节序号（从 0 起递增）
function splitSyllables(low: string): number[] {
  const n = low.length;
  const syl = new Array(n).fill(0);
  if (n <= 1) return syl;
  const isVowelPos = (i: number) => {
    const c = low[i];
    if (c === "y") return i === n - 1 || !isV(low[i + 1]);
    return isV(c);
  };
  const cuts: number[] = [];
  let i = 0;
  while (i < n) {
    if (i > 0 && isVowelPos(i - 1) && isVowelPos(i)) {
      cuts.push(i);
      i++;
      continue;
    }
    if (i > 0 && isVowelPos(i - 1) && !isVowelPos(i)) {
      let j = i;
      while (j < n && !isVowelPos(j)) j++;
      const consLen = j - i;
      // 仅当辅音簇后仍有元音（即处于词中）才切分；词尾辅音簇是末音节韵尾，不切
      if (j < n) {
        if (consLen === 1) cuts.push(i); // V C V → 开口音节，辅音归右
        else if (consLen === 2) cuts.push(i + 1); // V CC V → 两辅音间断
        else cuts.push(i + consLen - 1); // ≥3 辅音：保留末辅音归右
      }
      i = j;
      continue;
    }
    i++;
  }
  for (const c of cuts) for (let k = c; k < n; k++) syl[k]++;
  return syl;
}

function tryGroups(low: string, i: number, groups: string[], name: string, cls: string[]): number {
  for (const g of groups) {
    if (low.substr(i, g.length) === g) {
      for (let k = 0; k < g.length; k++) cls[i + k] = name;
      return g.length; // 返回消耗长度，调用方据此推进 i，避免原地死循环
    }
  }
  return 0;
}

// 真实计算（无缓存）
function computeTags(word: string): PhTag[] {
  const low = (word || "").toLowerCase();
  const n = low.length;
  const cls = new Array(n).fill("");
  let i = 0;
  while (i < n) {
    const c = low[i];
    if (!/[a-z]/.test(c)) {
      cls[i] = "";
      i++;
      continue;
    }
    let m: number;
    if ((m = tryGroups(low, i, BLENDS, "ph-blend", cls))) { i += m; continue; }
    if ((m = tryGroups(low, i, DIGRAPHS, "ph-digraph", cls))) { i += m; continue; }
    if ((m = tryGroups(low, i, R_CTL, "ph-rctl", cls))) { i += m; continue; }
    if ((m = tryGroups(low, i, V_TEAMS, "ph-vteam", cls))) { i += m; continue; }
    // 不发音词尾 e（前为 辅+元 结构）
    if (c === "e" && i === n - 1) {
      const prev = low[n - 2];
      if (!isV(prev) && /[a-z]/.test(prev) && hasVowelBefore(low, n - 2)) {
        cls[i] = "ph-silent";
        i++;
        continue;
      }
      cls[i] = "ph-vowel";
      i++;
      continue;
    }
    // 单 y（词尾或后接辅音视作元音）
    if (c === "y" && (i === n - 1 || !isV(low[i + 1]))) {
      cls[i] = "ph-vowel";
      i++;
      continue;
    }
    if (isV(c)) {
      cls[i] = "ph-vowel";
      i++;
      continue;
    }
    cls[i] = "ph-cons";
    i++;
  }
  const syl = splitSyllables(low);
  const out: PhTag[] = [];
  let prevSyl = -1;
  for (let k = 0; k < n; k++) {
    let s = cls[k];
    if (syl[k] !== prevSyl && k > 0) s = (s ? s + " " : "") + "syl-b";
    prevSyl = syl[k];
    out.push({ syl: syl[k], cls: s });
  }
  return out;
}

// 主入口（带缓存）
const _cache = new Map<string, PhTag[]>();
export function tagWord(word: string): PhTag[] {
  const key = (word || "").toLowerCase();
  let r = _cache.get(key);
  if (!r) {
    r = computeTags(word);
    _cache.set(key, r);
  }
  return r;
}
