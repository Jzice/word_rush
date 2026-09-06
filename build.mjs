import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, "index.html"), "utf8")
  .replace(/<link[^>]*href="\/?src\/style\.css"[^>]*>/,
    () => `<style>\n${readFileSync(join(root, "src/style.css"), "utf8")}\n</style>`)
  .replace(/<script src="\/?src\/data\.js"><\/script>/,
    () => `<script>\n${readFileSync(join(root, "src/data.js"), "utf8")}\n</script>`)
  .replace(/<script src="\/?src\/core\.js"><\/script>/,
    () => `<script>\n${readFileSync(join(root, "src/core.js"), "utf8")}\n</script>`)
  .replace(/<script src="\/?src\/games\.js"><\/script>/,
    () => `<script>\n${readFileSync(join(root, "src/games.js"), "utf8")}\n</script>`)
  .replace(/<script src="\/?src\/main\.js"><\/script>/,
    () => `<script>\n${readFileSync(join(root, "src/main.js"), "utf8")}\n</script>`);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/word_rush.html"), html, "utf8");
console.log("✅ 发布完成 → dist/word_rush.html （单一 HTML，双击即玩）");