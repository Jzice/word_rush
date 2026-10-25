// 唯一入口：按原 index.html 脚本顺序 import（保序，等价原拼接执行序，含各文件顶层 IIFE）。
// 各已迁移模块经 bridge 把公共名挂 window，供依赖方运行期引用（最终态将改为 ESM 互导）。
// 启动序列（原 boot.js）必须最后执行——ESM 天然最后求值，boot.ts 置于 import 末尾。
import "./ui/events";
import "./types";
// core / data
import "./core/version";
import "./core/utils";
import "./data/books";
import "./data/dynamic";
import "./data/index";
import "./data/phrases";
import "./core/store";
import "./core/srs";
import "./core/stats";
// ui 层
import "./ui/render";
import "./ui/audio";
import "./ui/shell";
import "./ui/fx";
// screens 层
import "./screens/achievements";
import "./screens/home";
import "./screens/mode-select";
import "./screens/about";
import "./screens/result";
import "./screens/book";
import "./screens/table";
import "./screens/stats";
import "./screens/shop";
// net：P2P 联机（已迁移）
import "./net/p2p";
// game 层（已迁移）
import "./game/core";
import "./game/mode-run";
import "./game/mode-mem";
import "./game/mode-fall";
import "./game/mode-battle";
// boot 启动序列（必须最后）
import "./boot";
