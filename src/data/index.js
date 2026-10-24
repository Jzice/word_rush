/* ================= 模块：data/index 全局词表 =================
 * 职责：扁平全量词表 ALL 及其构建 buildAll()、按 id 查书 bookOf()
 * 依赖：data/books（BOOKS）
 * 共享状态：ALL（写）、BOOKS（读）
 * ==================================================================== */
/* ================= 构建全局词库（取消去重，支持多词库重复） ================= */
let ALL = [];
function buildAll() {
  ALL = [];
  BOOKS.forEach((b) => {
    b.items = [];
    b.units.forEach((u, ui) => {
      u.s = u.s || "U" + (ui + 1);
      const add = (arr, phrase) => {
        arr.forEach(([en, cn, pos]) => {
          const it = { en, cn, book: b.id, phrase, pos: phrase ? "e" : pos || "n", ui, un: u.n, us: u.s };
          b.items.push(it);
          ALL.push(it);
        });
      };
      add(P(u.w), false);
      if (u.p) add(P(u.p), true);
    });
  });
}
buildAll();
const bookOf = (id) => BOOKS.find((b) => b.id === id);

