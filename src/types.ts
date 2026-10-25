// 核心类型集中定义（过渡期：嵌套结构以 any 放宽，末态收紧 strict 时补全）。
// 迁移期全局增强在 src/global.d.ts；本文件仅放可复用的纯类型。

/** 词条解析后的对象 */
export interface Item {
  en: string;
  cn: string;
  book: string;
  phrase?: boolean;
  pos?: string;
  ui?: string;
  un?: number;
  us?: number;
}

/** 单元 */
export interface Unit {
  s: string;
  n: string;
  w: string;
  p?: string;
}

/** 词书 */
export interface Book {
  id: string;
  name: string;
  stage?: string;
  color?: string;
  units: Unit[];
  items?: Item[];
  dyn?: boolean;
}

/** 动态词库源 */
export interface DynSource {
  id: string;
  name: string;
  color?: string;
  url: string;
  stage?: string;
}

/** 掌握度条目 */
export interface Mastery {
  lv: number;
  r: number;
  w: number;
  due: number;
  reps: number;
  lapses: number;
  iv: number;
  ef: number;
  first: number;
  last: number;
  rt: number;
}

/** 存档（过渡期嵌套以 any 放宽） */
export interface SaveState {
  mastery: Record<string, Mastery>;
  daily: Record<string, any>;
  stats: any;
  items: any;
  set: any;
  profile: any;
  curBook: string;
  [k: string]: any;
}

/** 对局运行态（过渡期 any 放宽） */
export interface GameState {
  [k: string]: any;
}
