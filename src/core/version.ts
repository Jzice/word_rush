
/* ================= 模块：core/version 版本信息 =================
 * 职责：应用版本号与构建模式标记（单一数据源，纯数据无依赖）
 * 依赖：无（必须最先于其余模块加载）
 * 共享状态：无
 * 备注：APP_VERSION 必须与 package.json 的 version 一致——build.mjs
 *       构建时校验，不一致直接失败；发布新版本需同步修改两处。
 *       APP_BUILD 在发布构建时由 build.mjs 自动替换为 "release"，勿手改。
 * ==================================================================== */
export const APP_VERSION = "1.4.0";
export const APP_BUILD = "dev";



