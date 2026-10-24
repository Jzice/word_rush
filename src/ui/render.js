/* ================= 模块：ui/render 词卡渲染 =================
 * 职责：词条行 phLine 与学习信息卡片 wordCard 的 HTML 生成
 * 依赖：core/utils（转义/比较）、core/store（掌握度展示，运行时）
 * 共享状态：无（纯函数式渲染）
 * ==================================================================== */
/* ================= 学习信息卡片 ================= */
function phLine(it) {
  if (it.phrase)
    return '<div class="wc-ph">💬 短语要放进句子里记，更牢固哦</div>';
  const c = PHRASES[it.en.toLowerCase()];
  if (c) {
    const [a, b] = c.split(" // ");
    return `<div class="wc-ph">🔗 <b>${escHtml(a)}</b><em>${escHtml(
      b
    )}</em><button class="phspk" data-t="${escA(a)}">🔊</button></div>`;
  }
  const bk = bookOf(it.book); // 联机分发的词对象可能不带本地词库信息
  const up = bk ? bk.items.filter((x) => x.phrase && x.ui === it.ui) : [];
  if (up.length) {
    const u = up[0];
    return `<div class="wc-ph">📌 本单元短语：<b>${escHtml(
      u.en
    )}</b><em>${escHtml(u.cn)}</em><button class="phspk" data-t="${escA(
      u.en
    )}">🔊</button></div>`;
  }
  return "";
}
function wordCard(it, compact) {
  const posTxt = POS[it.pos] || "词";
  const bk = bookOf(it.book);
  const src = bk
    ? bk.name.split(" · ")[0] + (it.un ? ` · ${it.us} ${it.un}` : "")
    : "⚔️ 联机对战";
  return `<div class="wordcard ${compact ? "compact" : ""}">
  <div class="wc-cn">${escHtml(it.cn)}<span class="pos pos-${posCls(
    it.pos
  )}">${posTxt}</span></div>
  ${phLine(it)}
  <div class="wc-src">${src}</div></div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-t]");
  if (t) speak(t.dataset.t);
});

