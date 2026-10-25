# WORD RUSH 单词快打

多教材 · 多词库的词汇特训打字游戏。纯原生 JS 实现，无框架、无构建工具链，单文件即可发布运行。

## 🌐 在线试玩

### 👉 https://jzice.github.io/word_rush/

由 GitHub Actions 自动构建部署（推送 `master` 或打 `v*` 版本标签即自动更新），无需安装，打开即玩。

## ✨ 功能

- **多教材词库**：人教版（9 册）· 外研版（新标准）· 新概念第一册 · KET · 四级 · 六级
- **五种玩法**：
  - 花瓣记忆（PETAL MEMORY）— 逐字母拼读 → 隐藏 → 回忆拼写
  - 限时冲刺（TIME RUSH）— 60 秒极限手速，连击翻倍得分
  - 陨石单词（WORD FALL）— 单词坠落，拼完击碎，护住底线
  - 对战竞技场（PVP ARENA）— 人机竞速 / 双人同屏轮流 PK
  - 联机对战（P2P ARENA）— 基于 PeerJS 创建/加入房间实时对战
- **记忆系统**：按艾宾浩斯遗忘曲线自动排定复习任务；间隔重复六阶段（陌生→初识→熟悉→掌握→牢固→永久）；错题本集中歼灭拼错的词
- **养成与收集**：等级 / 金币 / 成就墙；奖励商店提供主题皮肤与战斗道具（提示粉笔、时间沙漏、拼写护盾）
- **分享挑战**：生成挑战链接分享给好友

## 📸 截图

| 主页 | 限时冲刺 |
|---|---|
| ![主页](docs/screenshots/home.png) | ![限时冲刺](docs/screenshots/gameplay.png) |

## 🚀 运行（开发模式）

```
npm run dev
```

Vite 开发服务器（TS 即时转换 + HMR），浏览器访问 http://localhost:5173 即可游玩。

## 📦 构建发布

```
npm run build        # 发布模式：压缩+混淆，产出单文件
npm run build:dev    # 同产物但不压缩，便于调试
```

Vite 以 `index.html` 为入口打包（唯一入口 `src/main.ts`），再由 `scripts/vite-plugin-singlefile.mjs` 把 JS/CSS 全部内联，输出单一 HTML 文件 `dist/word_rush.html`（双击即玩）。

> 注意：构建产物中的自定义字体（Google Fonts）与联机对战（PeerJS）仍引用外部 CDN，离线环境下这两项不可用。

### ⚙️ 自动发布（GitHub Actions）

仓库内置两个工作流（`.github/workflows/`），推送即触发，无需手动操作：

- `deploy.yml` — 推送 `master` / `main` 分支时，自动构建并部署到 [GitHub Pages](https://jzice.github.io/word_rush/)（Actions 页面也可手动触发）
- `release.yml` — 推送 `v*` 标签时，创建 GitHub Release 并附带单文件离线版：

  ```bash
  npm run bump 1.3.0 # 一条命令同步 package.json + src/core/version.js + CHANGELOG 标题
  git tag -a v1.3.0 -m "版本说明"
  git push origin v1.3.0
  ```

  自动执行：构建单文件 → 创建 GitHub Release（自动生成 Release Notes，附带 `word_rush_v1.3.0.html` 单文件附件）。

  也可在 Actions 页面手动运行 `Release` 工作流（输入版本号，如 `1.3.1`）补建/重跑某个版本的 Release——无需删除重推标签，且会检出对应标签的提交，保证附件是该版本的真实产物。

> 说明：部署只由 `deploy.yml` 负责（推分支即部署），标签不再触发部署——同一提交不会重复部署，也无需为 `github-pages` 环境额外放行 `v*` 标签。
> 前提：仓库 Settings → Pages 的 Source 选 `GitHub Actions`。

### 📚 添加自定义词库

在 `src/data/dynamic.js` 顶部的 `DYN_SOURCES` 数组里加一行即可（代码配置，无设置界面）：

```js
{ id: "mybook", name: "我的词库", color: "#5b9bd5", url: "dict/mybook.csv" },
```

`url` 可以是服务器相对路径（如 `dict/mybook.csv`，构建后需与 `dist/word_rush.html` 同目录部署）或任意 http(s) CSV 链接。CSV 格式：`word,phonetic,pos,definition,source`（表头可选），每 50 词自动切一个单元。打开对应词库标签/开局时按需加载并缓存 24 小时；网络失败时先用缓存，缓存也没有就提示一声并跳过该源，其它词书不受影响。

## 🗂 项目结构

- `index.html` — 页面结构；交互统一走 `data-act` 事件委托，`<script type="module" src="/src/main.ts">` 为唯一入口
- `src/` — 全部游戏逻辑（TypeScript ES 模块），按功能域拆分：
  - `core/` — 工具与常量、存档、SRS 记忆算法、等级统计、版本号
  - `data/` — 词库数据：`books`（内置）、`dynamic`（动态词库/CSV/缓存）、`index`（全局词表）、`phrases`（短语库）
  - `ui/` — 事件委托、词卡渲染、音效与朗读、屏幕外壳（切屏/HUD/屏幕键盘）、反馈特效
  - `screens/` — 成就、主页、模式设置、关于、结算、单词本、单词表、学习数据、商店
  - `game/` — 对局核心（`G`/输入路由/生命周期）+ 四种本地模式（闯关/记忆/陨石/对战）
  - `net/` — P2P 联机（单挑 + 多人房间）
  - `main.ts` — 唯一入口，按依赖序 import 全部模块；`boot.ts` — 启动序列（必须最后执行）
  - 新增模块需在 `src/main.ts` 中 import（勿遗漏：构建会做孤儿文件检查）
- `src/style.css` — 全部样式，主题通过 `body[data-theme]` + CSS 变量切换
- `vite.config.ts` — Vite 配置（dev server + 生产构建 + Vitest）
- `scripts/vite-plugin-singlefile.mjs` — 单文件内联插件（含版本一致性、孤儿文件、产物终检）
- `e2e/smoke.mjs` — Playwright 冒烟测试（以 `file://` 加载产物，真实点击/键盘验证）
- `dist/` — 构建产物（已 gitignore）

## ⌨️ 操作提示

- 主页：数字键 1-9 快速选择单元；`r` 复习 / `w` 错题 / `m` 花瓣 / `t` 限时 / `f` 陨石 / `b` 对战 / `l` 单词表 / `p` 单词本 / `s` 商店
- 游戏内：直接键入字母即可拼写单词，`Esc` 暂停
- 存档自动保存在浏览器 localStorage（键 `wordrush_v1`）
- 页脚版本号：点击弹出「关于」（版本、构建模式、更新日志入口）；版本号与 `package.json` 一致，由构建脚本校验

## 🛠 技术说明

TypeScript（严格模式）+ 原生 CSS，无前端框架；开发/构建用 Vite（生产构建走 terser 压缩混淆，产物内联为单文件）。
音效用 WebAudio 合成，单词朗读用浏览器 SpeechSynthesis，联机对战用 PeerJS。代码内注释为简体中文。

```bash
npm run typecheck   # tsc --noEmit
npm test            # Vitest 单元测试
npm run smoke       # 构建 + Playwright 浏览器冒烟测试（file:// 加载产物）
```