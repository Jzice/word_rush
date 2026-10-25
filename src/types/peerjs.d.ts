// PeerJS 全局类型（最小化声明：仅覆盖运行时实际用到的面，避免与 CDN 版本漂移；
// 不引入 npm 依赖）。Peer 由 index.html 的 unpkg CDN 外链在运行时挂载到 window。
// 联机对战仅在用户主动发起连接时才读取 window.Peer，故类型放宽到 any 即可。
declare var Peer: any;
