
/* ================= 模块：core/version 版本信息 =================
 * 职责：应用版本号与构建模式标记（单一数据源，纯数据无依赖）
 * 依赖：无（必须最先于其余模块加载）
 * 共享状态：无
 * 备注：APP_VERSION 必须与 package.json 的 version 一致——构建时校验
 *       （scripts/vite-plugin-singlefile.mjs），不一致直接失败；发新版用 npm run bump 同步两处。
 *       APP_BUILD 由构建模式决定：生产构建（npm run build）为 "release"，
 *       其余（npm run dev / build:dev / vitest）为 "dev"，勿手改。
 * ==================================================================== */
export const APP_VERSION = "1.5.0";
// import.meta.env.PROD 由 Vite 在构建期折叠为常量（vite.config.ts 亦显式 define）
export const APP_BUILD: string = import.meta.env.PROD ? "release" : "dev";



