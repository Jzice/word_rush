// 全局增强与共享类型（纯声明，无运行时代码）。
// 桥接已拆除：跨模块引用一律走真实 import；原先「裸标识符的 ambient any 声明」已全部删除，
// 这样 tsc 才能强制暴露任何遗漏的 import（若某处仍按裸标识符访问，会直接报 Cannot find name）。
// 仅保留真实需要的窗口属性声明（P2P 的 window.Peer 等）。
declare global {
  interface Window {
    G: any;
    S: any;
    Peer: any;
  }
}

export {};
