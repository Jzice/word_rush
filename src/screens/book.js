/* ================= 模块：screens/book 单词本 =================
 * 职责：单词本屏幕：按书册/等级筛选、掌握度与到期展示、renderWb
 * 依赖：core/store、core/srs（fmtDue）、data/index、ui/render
 * 共享状态：读 S.mastery
 * ==================================================================== */
/* ---------- 单词本 ---------- */
$("#bkSearch").oninput = renderWb;
$("#bkBook").onchange = renderWb;
$("#bkLv").onchange = renderWb;
function fmtDue(m) {
  if (!m || m.r === 0) return "未学习";
  if (m.lv >= 5) return "已牢记 🏆";
  if (m.due <= Date.now()) return "待复习 🔥";
  const d = m.due - Date.now();
  return d < 36e5
    ? Math.ceil(d / 6e4) + "分钟后"
    : d < 864e5
    ? Math.ceil(d / 36e5) + "小时后"
    : Math.ceil(d / 864e5) + "天后";
}
function renderBook() {
  $("#bkBook").innerHTML =
    `<option value="all">全部词书（${BOOKS.length}册）</option>` +
    BOOKS.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
  renderWb();
  $("#achGrid").innerHTML = ACH.map(
    ([id, n, d]) =>
      `<div class="ach ${S.ach[id] ? "done" : ""}"><b>${
        S.ach[id] ? "🏅" : "🔒"
      } ${n}</b>${d}</div>`
  ).join("");
}
function rowHtml(w) {
  const m = S.mastery[w.en.toLowerCase()],
    lvv = m ? m.lv : 0;
  const pc = posCls(w.pos);
  return `<div class="wrow" onclick="speak('${w.en.replace(
    /'/g,
    ""
  )}')"><span class="we"><i class="wp wp-${pc}">${w.pos}</i>${
    w.en
  }</span><span class="wc">${w.cn} · ${w.us}</span>
  <span class="mbar">${[1, 2, 3, 4, 5]
    .map((i) => `<i class="${i <= lvv ? "on" : ""}"></i>`)
    .join("")}</span>
  <span class="due ${
    m && m.lv < 5 && m.due <= Date.now() && m.r > 0 ? "hot" : ""
  }">${fmtDue(m)}</span></div>`;
}
function renderWb() {
  const q = ($("#bkSearch").value || "").trim().toLowerCase(),
    bk = $("#bkBook").value,
    lv = $("#bkLv").value;
  const passF = (w) => {
    const m = S.mastery[w.en.toLowerCase()];
    if (q && !w.en.toLowerCase().includes(q) && !w.cn.includes(q)) return false;
    if (lv === "new" && m && m.r > 0) return false;
    if (lv === "ing" && (!m || m.r === 0 || m.lv >= 5)) return false;
    if (lv === "max" && (!m || m.lv < 5)) return false;
    return true;
  };
  if (q) {
    const rows = ALL.filter((w) => bk === "all" || w.book === bk)
      .filter(passF)
      .slice(0, 400);
    $("#wbList").innerHTML =
      rows.map(rowHtml).join("") ||
      '<div style="padding:26px;text-align:center;color:var(--sub)">没有匹配的单词</div>';
    return;
  }
  const books = bk === "all" ? BOOKS : [bookOf(bk)];
  let html = "",
    count = 0,
    stop = false;
  for (const b of books) {
    if (stop) break;
    if (bk === "all")
      html += `<div class="uhead bkh" style="--uc:${b.color}">📗 ${b.name}<span>${b.items.length} 词条 · ${b.units.length} 单元</span></div>`;
    for (const [ui, u] of b.units.entries()) {
      const items = b.items.filter((it) => it.ui === ui).filter(passF);
      if (!items.length) continue;
      html += `<div class="uhead" style="--uc:${b.color}">${u.s} · ${u.n}<span>${items.length} 词</span></div>`;
      html += items.map(rowHtml).join("");
      count += items.length;
      if (count >= 600) {
        html += '<div class="uhead">… 内容较多，请选择具体词书或使用搜索</div>';
        stop = true;
        break;
      }
    }
  }
  $("#wbList").innerHTML =
    html ||
    '<div style="padding:26px;text-align:center;color:var(--sub)">暂无内容</div>';
}

