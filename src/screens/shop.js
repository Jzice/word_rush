/* ================= 模块：screens/shop 商店 =================
 * 职责：主题 THEMES 与道具 ITEMS 展售、购买/启用（金币校验）
 * 依赖：core/store（save）、ui/shell（refreshHead）、ui/fx（toast）
 * 共享状态：写 S.coins / S.items / S.theme
 * ==================================================================== */
/* ---------- 商店 ---------- */
const THEMES = [
  { id: "board", n: "黑板绿", p: 0, c: "#0f2420" },
  { id: "midnight", n: "午夜蓝", p: 200, c: "#0d1526" },
  { id: "sakura", n: "樱花粉", p: 300, c: "#241421" },
  { id: "amber", n: "琥珀教室", p: 300, c: "#221609" },
  { id: "paper", n: "作业本（浅色）", p: 450, c: "#f4efdd" },
];
const ITEMS = {
  hint: { n: "✏️ 提示粉笔", d: "自动补全 2 个字母", p: 30 },
  time: { n: "⏳ 时间沙漏", d: "限时模式 +15 秒", p: 40 },
  shield: { n: "🛡️ 拼写护盾", d: "抵挡一次失误", p: 50 },
};
function renderShop() {
  $("#thGrid").innerHTML = THEMES.map((t) => {
    const owned = S.themes.includes(t.id),
      cur = S.theme === t.id;
    return `<div class="th"><div class="sw" style="background:${
      t.c
    }"></div><b>${t.n}</b>
  <div style="margin-top:10px">${
    cur
      ? `<span class="tag" style="background:var(--c-c)">使用中</span>`
      : owned
      ? `<button class="btn c sm" onclick="useTheme('${t.id}')">启用</button>`
      : `<button class="btn y sm" onclick="buyTheme('${t.id}',${t.p})">🪙 ${t.p}</button>`
  }</div></div>`;
  }).join("");
  $("#itList").innerHTML = Object.entries(ITEMS)
    .map(
      ([
        k,
        it,
      ]) => `<div class="shoprow"><div><b>${it.n}</b> <span style="color:var(--sub);font-size:.8rem">— ${it.d} · 持有 ${S.items[k]}</span></div>
  <button class="btn y sm" onclick="buyItem('${k}',${it.p})">🪙 ${it.p} 购买</button></div>`
    )
    .join("");
}
window.useTheme = (id) => {
  S.theme = id;
  document.body.dataset.theme = id;
  save();
  renderShop();
  toast("🎨 主题已切换");
};
window.buyTheme = (id, p) => {
  if (S.coins < p) return toast("🪙 金币不足", "去打几局赚一点吧");
  S.coins -= p;
  S.themes.push(id);
  S.theme = id;
  document.body.dataset.theme = id;
  save();
  refreshHead();
  renderShop();
  toast("🎉 购买成功并已启用");
};
window.buyItem = (k, p) => {
  if (S.coins < p) return toast("🪙 金币不足", "去打几局赚一点吧");
  S.coins -= p;
  S.items[k]++;
  save();
  refreshHead();
  renderShop();
  toast("🎒 道具 +1", ITEMS[k].n);
};

