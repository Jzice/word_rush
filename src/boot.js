/* ================= 模块：boot 启动 =================
 * 职责：环境漂浮粒子（加载时 IIFE）与启动序列：
 *       buildOsk → refreshHead → curBook 兜底 → renderHome
 * 依赖：全部模块（必须最后加载）
 * 共享状态：写 S.curBook（兜底校正）
 * ==================================================================== */
/* ---------- 环境漂浮 ---------- */
(function () {
  const chars = "ABDEGKMPRSTWY★?单词梦想坚持",
    words = ["DREAM", "FUTURE", "COMBO", "高考", "加油", "WORD"];
  const box = $("#amb");
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");
    const useWord = Math.random() < 0.25;
    s.textContent = useWord
      ? pick(words)
      : chars[(Math.random() * chars.length) | 0];
    s.style.left = rnd(0, 96) + "%";
    s.style.fontSize = rnd(14, 44) + "px";
    s.style.color = pick([
      "var(--c-y)",
      "var(--c-p)",
      "var(--c-c)",
      "var(--c-b)",
    ]);
    s.style.animationDuration = rnd(22, 46) + "s";
    s.style.animationDelay = -rnd(0, 40) + "s";
    box.appendChild(s);
  }
})();

buildOsk();
refreshHead();
if (!bookOf(S.curBook)) { S.curBook = "j1"; save(); }  // curBook 指向不存在的书（如未加载的动态书）→ 兜底回第 1 册
renderHome();
