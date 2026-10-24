// 版本号一键同步：更新 package.json 的 version、src/core/version.js 的 APP_VERSION，
// 并把 CHANGELOG.md 的 [未发布] 段落正名为新版本号。
// 用法：
//   npm run bump 1.3.0            写入
//   npm run bump 1.3.0 -- --dry-run  仅预览不写入
// 之后：git add -A && git commit → git tag -a v1.3.0 → git push origin master && git push origin v1.3.0
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dry = process.argv.includes("--dry-run");
const next = process.argv.find((a) => /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(a));

if (!next) {
  console.error("用法：npm run bump <新版本号>   （如 npm run bump 1.3.0；加 --dry-run 仅预览）");
  process.exit(1);
}

const FILES = { pkg: "package.json", ver: "src/core/version.js", log: "CHANGELOG.md" };
const read = (f) => readFileSync(join(root, f), "utf8");

// 1. package.json：替换 version 字段（保留原格式）
const pkgRaw = read(FILES.pkg);
const pkg = JSON.parse(pkgRaw);
if (next === pkg.version) {
  console.error(`❌ 版本未变化（当前已是 v${next}）`);
  process.exit(1);
}
const cmp = (a, b) => {
  const pa = a.split("-")[0].split(".").map(Number);
  const pb = b.split("-")[0].split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};
if (cmp(next, pkg.version) < 0) console.warn(`⚠️ 新版本 v${next} 低于当前 v${pkg.version}，请确认无误`);
const pkgNew = pkgRaw.replace(/("version"\s*:\s*")[^"]+(")/, `$1${next}$2`);
if (pkgNew === pkgRaw) {
  console.error(`❌ ${FILES.pkg} 中未找到 version 字段`);
  process.exit(1);
}

// 2. src/core/version.js：替换 APP_VERSION
const verRaw = read(FILES.ver);
const verNew = verRaw.replace(/const APP_VERSION = "[^"]+"/, `const APP_VERSION = "${next}"`);
if (verNew === verRaw) {
  console.error(`❌ ${FILES.ver} 中未找到 APP_VERSION`);
  process.exit(1);
}

// 3. CHANGELOG.md：[未发布] → [新版本]（无该段落则跳过并提示）
const logRaw = read(FILES.log);
let logNew = logRaw;
if (/^## \[未发布\]/m.test(logRaw)) {
  logNew = logRaw.replace(/^## \[未发布\]/m, `## [${next}]`);
} else {
  console.warn(`⚠️ ${FILES.log} 无 [未发布] 段落，未改标题（请手动确认发布说明）`);
}

for (const [f, content] of [
  [FILES.pkg, pkgNew],
  [FILES.ver, verNew],
  [FILES.log, logNew],
]) {
  if (dry) {
    console.log(`[dry-run] 将更新 ${f}`);
  } else {
    writeFileSync(join(root, f), content, "utf8");
    console.log(`✅ ${f}`);
  }
}

if (dry) {
  console.log(`\n预览完成（未写入任何文件）：v${pkg.version} → v${next}`);
} else {
  console.log(
    `\n✅ 版本已同步：v${pkg.version} → v${next}\n\n下一步：\n` +
      `  git add -A && git commit -m "chore: release v${next}"\n` +
      `  git tag -a v${next} -m "版本说明"\n` +
      `  git push origin master && git push origin v${next}`
  );
}
