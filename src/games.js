"use strict";
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const norm=s=>s.trim().toLowerCase().replace(/\s+/g,"");
const bankWords=id=>{const out=[];BOOKS.find(b=>b.id===id).units.forEach((u,ui)=>u.words.forEach((_,wi)=>out.push(wordAt(id,ui,wi))));return out;};

/* ═══ 主页闯关面板（教材chips + 单元瓦片 + 星级解锁） ═══ */
const starsOf=(b,u)=>save.unitStars[b+"|"+u]||0;
const unlocked=(b,i)=>i===0||starsOf(b,i-1)>=1;
function renderGate(){
  const bk=book();
  $("#bkChips").innerHTML=BOOKS.map(b=>`<button class="bk ${b.id===bk.id?"on":""}" data-b="${b.id}">${b.name}</button>`).join("")+`<button class="bk rand" id="btnRand">🔀 随机</button>`;
  $$("#bkChips .bk[data-b]").forEach(el=>el.onclick=()=>{save.book=el.dataset.b;save.unit=0;persist();renderGate();});
  $("#btnRand").onclick=()=>{save.book=shuffle(BOOKS)[0].id;save.unit=0;persist();renderGate();sfx("click");};
  $("#bkTitle").textContent=bk.title;$("#bkLevel").textContent=bk.level;
  const totalW=bk.units.reduce((s,u)=>s+u.words.length,0);
  const cleared=bk.units.filter((_,i)=>starsOf(bk.id,i)>=1).length;
  const stars=bk.units.reduce((s,_,i)=>s+starsOf(bk.id,i),0);
  $("#bkMeta").innerHTML=`${bk.units.length} 个单元 · ${totalW} 词条 · 已通 ${cleared} 单元 · ⭐ ${stars}/${bk.units.length*3}`;
  const d=today(),rate=d.ok+d.ng?Math.round(d.ok/(d.ok+d.ng)*100):0;
  $("#bkToday").innerHTML=`<span>📅 今日学习: <b class="y">${d.learned}</b> 词</span><span>✅ 正确: <b class="g">${d.ok}</b></span><span>❌ 错误: <b class="r">${d.ng}</b></span><span>🎯 正确率: <b class="t">${rate}%</b></span><span>🏅 局数: <b>${d.games}</b></span>`;
  $("#bkTiles").innerHTML=bk.units.map((u,i)=>{
    const un=unlocked(bk.id,i),cur=save.unit===i,st=starsOf(bk.id,i);
    return`<button class="tile ${cur?"cur":""} ${un?"":"lock"}" data-u="${i}">${un?`<b>${u.short}</b>${cur?`<span class="go">GO</span>`:st?`<span class="st">${"★".repeat(st)}</span>`:""}:`🔒`}</button>`;}).join("");
  $$("#bkTiles .tile").forEach(el=>el.onclick=()=>{const i=+el.dataset.u;
    if(!unlocked(bk.id,i))return toast("🔒 先通关上一单元！");save.unit=i;persist();renderGate();sfx("click");});
  const u=bk.units[save.unit]||bk.units[0];
  $("#btnStart").textContent=`▶ 开始 ${u.short} · ${u.name}`;
}
$("#btnStart").onclick=()=>{const bk=book(),u=bk.units[save.unit];
  const words=u.words.map((_,wi)=>wordAt(bk.id,save.unit,wi));
  startSession("level","词库闯关",words,save.unit);};

/* ═══ 通用答题 ═══ */
let SS=null;
function startSession(mode,title,words,unitIdx=null){
  if(!words.length)return toast("📭 暂无词条");
  SS={mode,title,words,unitIdx,i:0,ok:0,ng:0,combo:0,locked:false,res:[]};
  show("scr-session");renderSS();$("#ssInput").focus();}
function renderSS(){const it=SS.words[SS.i],p=prog(it);
  $("#ssIdx").textContent=`${SS.i+1}/${SS.words.length}`;$("#ssMode").textContent=SS.title;
  $("#ssStage").className="chip stage st"+p.stage;$("#ssStage").textContent=STAGES[p.stage];
  $("#ssCombo").textContent=SS.combo;$("#ssCn").textContent=it.cn;$("#ssPos").textContent=it.pos;
  $("#ssPh").textContent="❓ 过关后揭示短语";$("#ssInput").value="";$("#ssInput").disabled=false;
  $("#ssFb").textContent="";$("#ssFb").className="feedback";$("#ssHintN").textContent=save.items.hint;speak(it.w);}
function ssSubmit(){if(!SS||SS.locked)return;const it=SS.words[SS.i],v=norm($("#ssInput").value);if(!v)return;
  if(v===norm(it.w)){SS.locked=true;SS.ok++;SS.combo++;save.stats.maxCombo=Math.max(save.stats.maxCombo,SS.combo);
    const first=onWordCorrect(it);$("#ssFb").className="feedback good";
    $("#ssFb").innerHTML=`✅ 正确！ <span class="pos">${it.pos}</span>${it.cn} · 短语：<b>${it.ph}</b> ${first?"🌱 新词入库，20 分钟后首复":"⬆️ 升至「"+STAGES[prog(it).stage]+"」"}`;
    $("#ssPh").textContent="🔗 "+it.ph;$("#ssInput").disabled=true;sfx("good");SS.res.push({it,ok:1});setTimeout(ssNext,1100);}
  else{SS.combo=0;onWordWrong(it);$("#ssFb").className="feedback bad";$("#ssFb").textContent="❌ 再想想…（已计入错题本）";sfx("bad");$("#ssCombo").textContent=0;}}
function ssSkip(){if(!SS)return;const it=SS.words[SS.i];
  if(SS.res.length<=SS.i){SS.ng++;onWordWrong(it);SS.res.push({it,ok:0});}
  $("#ssFb").className="feedback bad";$("#ssFb").innerHTML=`📖 答案：<b>${it.w}</b> <span class="pos">${it.pos}</span>${it.cn} · ${it.ph}`;
  SS.locked=true;speak(it.w);setTimeout(ssNext,1600);}
function ssNext(){if(!SS)return;SS.i++;SS.locked=false;if(SS.i>=SS.words.length)return endSession();renderSS();$("#ssInput").focus();}
function endSession(){const{mode,ok,ng}=SS,total=SS.words.length;let xp=ok*4,coins=ok*2;
  if(mode==="level"){save.stats.games++;today().games++;if(ng===0&&total>=10)coins+=10;
    if(SS.unitIdx!=null){const acc=ok/total,st=ng===0?3:acc>=.8?2:acc>=.6?1:0,k=save.book+"|"+SS.unitIdx;
      save.unitStars[k]=Math.max(starsOf(save.book,SS.unitIdx),st);}}
  if(mode==="review")save.stats.reviews+=ok;
  addReward(xp,coins);checkAch();
  const rows=SS.res.map(r=>`<tr><td>${r.it.w}</td><td>${r.it.pos}</td><td>${r.it.cn}</td><td>${r.it.ph}</td><td>${r.ok?"✅":"❌"} ${STAGES[prog(r.it).stage]}</td></tr>`).join("");
  modal(`${SS.title} · 完成！`,`<p style="margin-bottom:8px">✅ ${ok}/${total}　🪙 +${coins}　⭐ +${xp} XP ${ng===0?"　🌟 全对！":""}</p>
   <table class="res-table"><tr><td>单词</td><td>词性</td><td>释义</td><td>短语</td><td>阶段</td></tr>${rows}</table>
   <div class="row center" style="margin-top:12px"><button class="btn yellow" onclick="closeModal();goHome()">完成</button></div>`);
  SS=null;}
const dueWords=()=>{const o=[];eachWord(it=>{if(isDue(prog(it)))o.push(it);});return shuffle(o).slice(0,20);};
const wrongWords=()=>{const o=[];eachWord(it=>{if(prog(it).wrong>0)o.push(it);});return shuffle(o).slice(0,20);};

/* ═══  花瓣记忆 ═══ */
let PT=null;
function petalNew(){const pool=bankWords(save.book).filter(it=>prog(it).stage<5);const it=shuffle(pool)[0];if(!it)return toast("词库为空");
  PT={it,phase:0,tries:0,timer:null,left:15};const fl=$("#ptFlower");fl.innerHTML="";const n=it.w.length,r=105;
  [...it.w].forEach((ch,i)=>{const a=i/n*2*Math.PI-Math.PI/2,d=document.createElement("div");d.className="petal hidden";d.id="pt-p"+i;
    d.style.left=(140+Math.cos(a)*r)+"px";d.style.top=(140+Math.sin(a)*r)+"px";d.innerHTML=`<span>${ch}</span>`;fl.appendChild(d);});
  $("#ptCn").innerHTML=`${it.cn} <span class="pos">${it.pos}</span> （${it.w.length} 字母）`;
  $("#ptInput").value="";$("#ptInput").disabled=true;$("#ptFb").textContent="";$("#ptTimer").textContent="--";$("#ptHintN").textContent=save.items.hint;}
function petalStart(){if(!PT||PT.phase!==0)return;PT.phase=1;speak(PT.it.w);let i=0;const n=PT.it.w.length;
  const iv=setInterval(()=>{if(i>=n){clearInterval(iv);setTimeout(petalHide,800);return;}$("#pt-p"+i).classList.remove("hidden");sfx("click");i++;},420);}
function petalHide(){PT.phase=2;PT.left=15;[...PT.it.w].forEach((_,i)=>$("#pt-p"+i).classList.add("hidden"));
  $("#ptInput").disabled=false;$("#ptInput").focus();$("#ptFb").textContent="🌸 花瓣已隐藏，凭记忆拼写！";
  PT.timer=setInterval(()=>{PT.left--;$("#ptTimer").textContent=PT.left+"s";if(PT.left<=0)petalResult(false,"⏱️ 时间到");},1000);}
function petalCheck(){if(!PT||PT.phase!==2)return;const v=norm($("#ptInput").value),w=norm(PT.it.w);
  [...PT.it.w].forEach((ch,i)=>{const p=$("#pt-p"+i);p.classList.remove("hidden","right","wrong");
    if(i<v.length)p.classList.add(v[i]===ch.toLowerCase()?"right":"wrong");else p.classList.add("hidden");});
  if(v===w)petalResult(true);
  else if(v.length>=w.length){PT.tries++;sfx("bad");if(PT.tries>=3)petalResult(false,"3 次尝试用尽");else $("#ptFb").textContent=`❌ 有字母不对（剩 ${3-PT.tries} 次）`;}}
function petalResult(ok,why=""){clearInterval(PT.timer);PT.phase=3;
  [...PT.it.w].forEach((_,i)=>{const p=$("#pt-p"+i);p.classList.remove("hidden","wrong");p.classList.add("right");});
  if(ok){onWordCorrect(PT.it);save.stats.petals++;addReward(6,5);$("#ptFb").className="feedback good";$("#ptFb").textContent=`🌸 拼写成功！${PT.it.w} · ${PT.it.ph}`;sfx("good");}
  else{onWordWrong(PT.it);$("#ptFb").className="feedback bad";$("#ptFb").textContent=`${why}，答案：${PT.it.w}（已入错题本）`;sfx("bad");}
  checkAch();persist();updateHUD();speak(PT.it.w);}

/* ═══ ⏱️ 限时冲刺 ═══ */
let RS=null;
function rushStart(){if(RS&&RS.timer)return;RS={words:shuffle(bankWords(save.book)),i:0,score:0,combo:0,time:60,timer:null};
  $("#rsScore").textContent=0;$("#rsTime").textContent=60;$("#rsCombo").textContent=0;$("#rsMult").textContent="×1";
  $("#rsFb").textContent="";$("#rsInput").value="";$("#rsInput").focus();rushWord();
  RS.timer=setInterval(()=>{RS.time--;$("#rsTime").textContent=RS.time;if(RS.time<=0)rushEnd();},1000);}
function rushWord(){if(RS.i>=RS.words.length){RS.words=shuffle(RS.words);RS.i=0;}const it=RS.words[RS.i];
  $("#rsCn").textContent=it.cn;$("#rsPos").textContent=it.pos;RS.cur=it;}
function rushSubmit(){if(!RS||!RS.timer)return;const v=norm($("#rsInput").value);if(!v)return;
  if(v===norm(RS.cur.w)){RS.combo++;save.stats.maxCombo=Math.max(save.stats.maxCombo,RS.combo);
    const m=Math.min(8,Math.pow(2,Math.floor(RS.combo/5)));RS.score+=10*m;onWordCorrect(RS.cur);
    $("#rsScore").textContent=RS.score;$("#rsCombo").textContent=RS.combo;$("#rsMult").textContent="×"+m;
    $("#rsFb").className="feedback good";$("#rsFb").textContent=`🔥 ${RS.combo} 连击 ×${m}`;sfx("good");}
  else{RS.combo=0;onWordWrong(RS.cur);$("#rsCombo").textContent=0;$("#rsMult").textContent="×1";
    $("#rsFb").className="feedback bad";$("#rsFb").textContent=`❌ 正确答案：${RS.cur.w}`;sfx("bad");}
  RS.i++;$("#rsInput").value="";rushWord();}
function rushEnd(){clearInterval(RS.timer);RS.timer=null;save.stats.rushBest=Math.max(save.stats.rushBest,RS.score);
  const c=Math.floor(RS.score/10);addReward(Math.floor(RS.score/5),c);checkAch();
  $("#rsFb").className="feedback good";$("#rsFb").textContent=`🏁 得分 ${RS.score} · 最佳 ${save.stats.rushBest} · 🪙 +${c}`;sfx("level");}

/* ═══ ☄️ 陨石单词 ═══ */
let FL=null;
function fallInit(){const cv=$("#fallCv"),w=$("#fallWrap");cv.width=w.clientWidth||800;cv.height=420;
  FL={run:false,meteors:[],score:0,lives:3,t:0,spawn:1200,acc:0,slowUntil:0};fallDraw(true);}
function fallStart(){fallInit();FL.run=true;FL.last=performance.now();$("#fallOv").style.display="none";$("#flInput").value="";$("#flInput").focus();updateFallHUD();requestAnimationFrame(fallLoop);}
function fallSpawn(){const pool=bankWords(save.book).filter(w=>w.w.length>=3&&w.w.length<=9);const it=shuffle(pool)[0];if(!it)return;
  const cv=$("#fallCv");FL.meteors.push({w:it.w.toLowerCase(),cn:it.cn,it,x:30+Math.random()*(cv.width-160),y:-20,v:22+Math.random()*18+FL.t/1200*6,typed:0,dead:false});}
function fallLoop(now){if(!FL||!FL.run)return;const dt=Math.min(50,now-FL.last);FL.last=now;FL.t+=dt;FL.acc+=dt;
  if(FL.acc>FL.spawn){FL.acc=0;fallSpawn();FL.spawn=Math.max(650,FL.spawn-8);}
  const slow=NOW()<FL.slowUntil,cv=$("#fallCv");
  for(const m of FL.meteors)m.y+=m.v*(slow?.35:1)*dt/1000;
  const hit=FL.meteors.filter(m=>m.y>cv.height-26);
  if(hit.length){hit.forEach(m=>FL.meteors.splice(FL.meteors.indexOf(m),1));
    if(save.items.shield>0){save.items.shield--;persist();updateFallHUD();toast("🛡️ 护盾抵挡了一次触底！");sfx("boom");}
    else{FL.lives-=hit.length;sfx("boom");}if(FL.lives<=0)return fallEnd();}
  FL.meteors=FL.meteors.filter(m=>!m.dead);fallDraw(false);updateFallHUD();requestAnimationFrame(fallLoop);}
function fallDraw(idle){const cv=$("#fallCv"),ctx=cv.getContext("2d");ctx.clearRect(0,0,cv.width,cv.height);
  ctx.strokeStyle="#ff6b6b";ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(0,cv.height-24);ctx.lineTo(cv.width,cv.height-24);ctx.stroke();ctx.setLineDash([]);
  if(idle||!FL)return;const input=norm($("#flInput").value);
  for(const m of FL.meteors){ctx.font="20px monospace";const wp=ctx.measureText(m.w).width;
    const g=ctx.createRadialGradient(m.x+wp/2,m.y,4,m.x+wp/2,m.y,wp/2+26);
    g.addColorStop(0,"rgba(255,180,90,.9)");g.addColorStop(1,"rgba(255,90,40,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(m.x+wp/2,m.y,wp/2+26,0,7);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(m.x-8,m.y-16,wp+16,30);
    for(let i=0;i<m.w.length;i++){ctx.fillStyle=i<m.typed?"#7be3a0":i<input.length?"#f7d154":"#e9f4ea";
      ctx.fillText(m.w[i],m.x+ctx.measureText(m.w.slice(0,i)).width,m.y+6);}
    ctx.fillStyle="#9cb8a8";ctx.font="11px sans-serif";ctx.fillText(m.cn,m.x,m.y+26);ctx.font="20px monospace";}}
function fallInput(){if(!FL||!FL.run)return;const v=norm($("#flInput").value);
  if(v){const ex=FL.meteors.find(m=>m.w===v);
    if(ex){FL.score+=ex.w.length*10;ex.dead=true;FL.meteors=FL.meteors.filter(m=>!m.dead);
      $("#flInput").value="";sfx("boom");onWordCorrect(ex.it);updateFallHUD();fallDraw(false);return;}
    const c=FL.meteors.filter(m=>m.w.startsWith(v)).sort((a,b)=>b.y-a.y)[0];
    if(c)c.typed=v.length;else{$("#flInput").value=v.slice(0,-1);sfx("bad");}}
  fallDraw(false);}
const updateFallHUD=()=>{$("#flScore").textContent=FL?FL.score:0;$("#flLives").textContent=FL?Math.max(0,FL.lives):3;
  $("#flSlowN").textContent=save.items.slow;$("#flShieldN").textContent=save.items.shield;};
function fallEnd(){FL.run=false;save.stats.fallBest=Math.max(save.stats.fallBest,FL.score);
  const c=Math.floor(FL.score/20);addReward(Math.floor(FL.score/10),c);checkAch();
  $("#fallOv").style.display="flex";$("#fallOv").innerHTML=`<p>💥 底线告破！得分 <b>${FL.score}</b> · 最佳 ${save.stats.fallBest} · 🪙 +${c}</p><button class="btn yellow" onclick="fallStart()">再来一局</button>`;}

/* ═══ ⚔️ 竞技场 ═══ */
let PV=null,pvpMode="ai",pvpDiff=1;const BOT_CPS=[.5,.95,1.6];
function pvpStart(){const words=shuffle(bankWords(save.book)).slice(0,5),total=words.reduce((s,w)=>s+w.w.length,0);
  if(pvpMode==="ai"){PV={type:"ai",words,i:0,my:0,total,bot:0,cps:BOT_CPS[pvpDiff],over:false};
    $("#pvpTitle").textContent="⚔️ 人机竞速";$("#pvpOppName").textContent="🤖 AI";$("#pvpTurn").textContent="";}
  else{PV={type:"local",rounds:shuffle(bankWords(save.book)).slice(0,6),r:0,turn:0,sc:[0,0],total:6,over:false};
    $("#pvpTitle").textContent="⚔️ 双人同屏轮流 PK";$("#pvpOppName").textContent="👥 P2";}
  $("#pvpSetup").classList.add("hide");$("#pvpArena").classList.remove("hide");
  $("#pvpP").style.width="0%";$("#pvpO").style.width="0%";$("#pvpFb").textContent="";pvpShow();$("#pvpInput").focus();
  if(pvpMode==="ai")PV.timer=setInterval(pvpBotTick,100);}
function pvpShow(){if(PV.type==="ai"){const it=PV.words[PV.i];$("#pvpCn").textContent=it.cn;$("#pvpPos").textContent=it.pos;PV.cur=it;}
  else{const it=PV.rounds[PV.r];$("#pvpCn").textContent=it.cn;$("#pvpPos").textContent=it.pos;
    $("#pvpTurn").textContent=`　第 ${PV.r+1}/${PV.rounds.length} 轮 · 🎯 P${PV.turn+1} 作答！`;PV.cur=it;}$("#pvpInput").value="";}
function pvpBotTick(){if(!PV||PV.over)return;PV.bot+=PV.cps*.1*(.7+Math.random()*.6);
  $("#pvpO").style.width=Math.min(100,PV.bot/PV.total*100)+"%";if(PV.bot>=PV.total)pvpFinish(false,"AI 先拼完了所有单词！");}
function pvpSubmit(){if(!PV||PV.over||!$("#pvpInput").value.trim())return;
  const ok=norm($("#pvpInput").value)===norm(PV.cur.w);
  if(ok){sfx("good");onWordCorrect(PV.cur);}else{sfx("bad");onWordWrong(PV.cur);}
  if(PV.type==="ai"){if(ok){PV.my+=PV.cur.w.length;$("#pvpP").style.width=Math.min(100,PV.my/PV.total*100)+"%";PV.i++;
      if(PV.my>=PV.total)return pvpFinish(true,"你率先完成！");if(PV.i>=PV.words.length)return pvpFinish(PV.my>PV.bot,"按进度判定");pvpShow();}
    else{$("#pvpFb").className="feedback bad";$("#pvpFb").textContent="❌ 拼写错误，继续！";}}
  else{if(ok)PV.sc[PV.turn]++;$("#pvpFb").className="feedback "+(ok?"good":"bad");
    $("#pvpFb").textContent=ok?"✅ 得 1 分！":"❌ 未得分，答案："+PV.cur.w;
    if(PV.turn===0){PV.turn=1;pvpShow();}else{PV.turn=0;PV.r++;
      $("#pvpP").style.width=PV.sc[0]/PV.total*100+"%";$("#pvpO").style.width=PV.sc[1]/PV.total*100+"%";
      if(PV.r>=PV.rounds.length)return pvpFinish(PV.sc[0]>PV.sc[1],`比分 ${PV.sc[0]} : ${PV.sc[1]}`);pvpShow();}}
  $("#pvpInput").focus();}
function pvpFinish(win,why){PV.over=true;if(PV.timer)clearInterval(PV.timer);
  if(win){save.stats.pvpWins++;addReward(20,25);}else addReward(5,5);checkAch();
  $("#pvpFb").className="feedback "+(win?"good":"bad");$("#pvpFb").textContent=(win?"🏆 胜利！":"💀 惜败…")+why;
  setTimeout(()=>{$("#pvpArena").classList.add("hide");$("#pvpSetup").classList.remove("hide");},2600);}

/* ═══ 🌐 P2P ═══ */
let P2P=null;const p2pLog=m=>$("#p2pFb").textContent=m;
function p2pCreate(){if(!window.Peer)return p2pLog("❌ PeerJS 未加载（首次需联网）");
  const id="WR-"+Math.random().toString(36).slice(2,8).toUpperCase();P2P={peer:new Peer(id),role:"host"};
  P2P.peer.on("open",pid=>{$("#p2pRoomId").textContent=pid;$("#p2pRoomRow").style.display="flex";p2pLog("🏠 房间已创建，等待对手…");});
  P2P.peer.on("connection",c=>{P2P.conn=c;c.on("open",()=>{p2pLog("✅ 对手已加入！3 秒后开始…");setTimeout(p2pHostStart,3000);});c.on("data",p2pOnMsg);});
  P2P.peer.on("error",e=>p2pLog("❌ 连接错误："+e.type));}
function p2pJoin(){if(!window.Peer)return p2pLog("❌ PeerJS 未加载");const id=$("#p2pJoinId").value.trim();if(!id)return;
  P2P={peer:new Peer(),role:"guest"};P2P.peer.on("open",()=>{P2P.conn=P2P.peer.connect(id);
    P2P.conn.on("open",()=>p2pLog("✅ 已加入，等待房主开始…"));P2P.conn.on("data",p2pOnMsg);});
  P2P.peer.on("error",e=>p2pLog("❌ 加入失败："+e.type));}
const p2pSend=o=>{if(P2P&&P2P.conn)P2P.conn.send(o);};
function p2pHostStart(){const w=shuffle(bankWords(save.book)).slice(0,6);p2pSend({t:"start",words:w});p2pBattle(w);}
function p2pOnMsg(d){if(d.t==="start")p2pBattle(d.words);
  else if(d.t==="p")$("#p2pOpBar").style.width=Math.min(100,d.n/P2P.total*100)+"%";
  else if(d.t==="finish")p2pDone(false,"对手率先完成！");}
function p2pBattle(words){P2P={...P2P,words,i:0,done:0,total:words.reduce((s,w)=>s+w.w.length,0),over:false};
  $("#p2pLobby").classList.add("hide");$("#p2pArena").classList.remove("hide");$("#p2pRoomEcho").textContent=P2P.peer.id;
  $("#p2pMyBar").style.width="0%";$("#p2pOpBar").style.width="0%";p2pShow();$("#p2pInput").focus();}
function p2pShow(){const it=P2P.words[P2P.i];$("#p2pCn").textContent=it.cn;$("#p2pPos").textContent=it.pos;$("#p2pInput").value="";}
function p2pSubmit(){if(!P2P||P2P.over)return;const it=P2P.words[P2P.i];
  if(norm($("#p2pInput").value)===norm(it.w)){sfx("good");onWordCorrect(it);P2P.done+=it.w.length;P2P.i++;
    $("#p2pMyBar").style.width=Math.min(100,P2P.done/P2P.total*100)+"%";p2pSend({t:"p",n:P2P.done});
    if(P2P.done>=P2P.total){p2pSend({t:"finish"});return p2pDone(true,"你率先完成！");}p2pShow();}
  else{sfx("bad");$("#p2pFb2").className="feedback bad";$("#p2pFb2").textContent="❌ 拼错了！";}}
function p2pDone(win,why){if(P2P.over)return;P2P.over=true;
  if(win){save.stats.pvpWins++;addReward(20,30);}else addReward(5,5);checkAch();
  $("#p2pFb2").className="feedback "+(win?"good":"bad");$("#p2pFb2").textContent=(win?"🏆 胜利！":"💀 惜败…")+why;
  setTimeout(()=>{$("#p2pArena").classList.add("hide");$("#p2pLobby").classList.remove("hide");},2800);}

/* ═══ 📖 单词本 / 📋 单词表 ═══ */
const wordCard=it=>{const p=prog(it);
  return`<div class="word-card"><b>${it.w}</b><span class="pos">${it.pos}</span>${it.cn}<small>　${it.ph}</small>
  <span class="st">${stageChip(p)}${p.wrong?` <span class="chip" style="color:var(--red)">✏️${p.wrong}</span>`:""}</span></div>`;};
function renderBook(){const bk=book(),f=$("#bookFilter .tab.on").dataset.f;let h="";
  bk.units.forEach((u,ui)=>{const list=u.words.map((_,wi)=>wordAt(bk.id,ui,wi)).filter(it=>{const p=prog(it);
    if(f==="new")return p.seen===0;if(f==="ing")return p.seen>0&&p.stage<3;if(f==="done")return p.stage>=3;return true;});
    if(!list.length)return;h+=`<div class="unit-h">📖 ${u.name}（${list.length}）</div>`+list.map(wordCard).join("");});
  $("#bookGrid").innerHTML=h||`<p class="dim" style="text-align:center;padding:20px">该状态下暂无单词</p>`;}
function renderList(){const bk=book(),f=$("#listTabs .tab.on").dataset.f;const all=[];
  bk.units.forEach((u,ui)=>u.words.forEach((_,wi)=>all.push(wordAt(bk.id,ui,wi))));
  const c={all:all.length,due:0,wrong:0,done:0,new:0};
  all.forEach(it=>{const p=prog(it);if(isDue(p))c.due++;if(p.wrong)c.wrong++;if(p.stage>=3)c.done++;if(!p.seen)c.new++;});
  $("#listStats").innerHTML=`<span class="chip">全部 ${c.all}</span><span class="chip">⏰ 待复习 ${c.due}</span><span class="chip">✏️ 需巩固 ${c.wrong}</span><span class="chip">🏆 已掌握 ${c.done}</span><span class="chip">🌱 未学习 ${c.new}</span>`;
  const list=all.filter(it=>{const p=prog(it);if(f==="due")return isDue(p);if(f==="wrong")return p.wrong>0;
    if(f==="done")return p.stage>=3;if(f==="new")return p.seen===0;return true;});
  let h="";bk.units.forEach((u,ui)=>{const s=list.filter(it=>it.ui===ui);if(!s.length)return;
    h+=`<div class="unit-h">📋 ${u.name}（${s.length}）</div>`+s.map(wordCard).join("");});
  $("#listGrid").innerHTML=h||`<p class="dim" style="text-align:center;padding:20px">该分类下暂无单词</p>`;}

/* ═══ 🛒 商店 / 🏅 成就 ═══ */
function renderShop(){$("#shopCoins").textContent=save.coins;
  $("#shopThemes").innerHTML=THEMES.map(t=>{const own=save.themes.includes(t.id),act=save.theme===t.id;
    return`<div class="shop-item"><div class="sw sw-${t.id}"></div><b>${t.name}</b><small>${t.desc}</small>
    ${act?`<button class="btn sm on" disabled>使用中</button>`:own?`<button class="btn sm" onclick="useTheme('${t.id}')">使用</button>`:`<button class="btn sm yellow" onclick="buyTheme('${t.id}')">🪙 ${t.price}</button>`}</div>`;}).join("");
  $("#shopItems").innerHTML=ITEMS.map(i=>`<div class="shop-item"><b>${i.icon} ${i.name}</b><small>${i.desc}</small><small>持有：${save.items[i.id]}</small><button class="btn sm yellow" onclick="buyItem('${i.id}')">🪙 ${i.price}</button></div>`).join("");}
function buyTheme(id){const t=THEMES.find(x=>x.id===id);if(save.coins<t.price)return toast("🪙 金币不足！");
  save.coins-=t.price;save.themes.push(id);save.theme=id;applyTheme();persist();updateHUD();renderShop();checkAch();toast(`🎨 已启用：${t.name}`);}
function useTheme(id){save.theme=id;applyTheme();persist();renderShop();}
function buyItem(id){const i=ITEMS.find(x=>x.id===id);if(save.coins<i.price)return toast("🪙 金币不足！");
  save.coins-=i.price;save.items[id]++;save.stats.boughtItems++;persist();updateHUD();renderShop();checkAch();toast(`${i.icon} 已购入：${i.name} ×1`);}
const applyTheme=()=>document.body.className="theme-"+save.theme;
const renderAchv=()=>{$("#achvGrid").innerHTML=ACHV.map(a=>{const u=!!save.ach[a.id];
  return`<div class="achv ${u?"":"lock"}"><span class="ico">${a.ico}</span><div><b>${a.name}</b> ${u?"✅":""}<br><small>${a.desc} · ${a.coin}🪙</small></div></div>`;}).join("");};
function goHome(){show("scr-home");renderGate();updateHUD();}

/* ═══ 绑定 ═══ */
function bind(){
  $("#btnShare").onclick=async()=>{const t=`我在 WORD RUSH·单词快打 LV${lvOf(save.xp)}「${TITLES[Math.min(lvOf(save.xp)-1,7)]}」，已掌握 ${masteredCount()} 词，🪙${save.coins}！来挑战我吧！`;
    if(navigator.share){try{await navigator.share({title:"WORD RUSH",text:t});}catch(e){}}
    else{try{await navigator.clipboard.writeText(t);toast("📤 已复制到剪贴板");}catch(e){toast(t);}}};
  $("#btnAchvHome").onclick=()=>{renderAchv();show("scr-achv");};
  $("#btnReview").onclick=()=>startSession("review","🧠 艾宾浩斯复习",dueWords());
  $("#btnWrongPractice").onclick=()=>startSession("wrong","✏️ 错题重练",wrongWords());
  $("#btnWrongView").onclick=()=>{$$("#listTabs .tab").forEach(t=>t.classList.toggle("on",t.dataset.f==="wrong"));renderList();show("scr-list");};
  ["btnKey","btnSfx","btnVoice"].forEach((id,i)=>{const k=["key","sfx","voice"][i],b=$("#"+id);
    const s=()=>b.classList.toggle("off",!save.toggles[k]);s();b.onclick=()=>{save.toggles[k]=!save.toggles[k];persist();s();};});
  $("#mClose").onclick=closeModal;$("#mMask").onclick=e=>{if(e.target.id==="mMask")closeModal();};
  $$(".mcard[data-mode]").forEach(m=>m.onclick=()=>{sfx("click");const g=m.dataset.mode;
    if(g==="book"){renderBook();show("scr-book");}else if(g==="list"){renderList();show("scr-list");}
    else if(g==="shop"){renderShop();show("scr-shop");}else if(g==="petal"){petalNew();show("scr-petal");}
    else if(g==="rush"){RS=null;show("scr-rush");$("#rsTimePlusN").textContent=save.items.timeplus;}
    else if(g==="fall"){show("scr-fall");setTimeout(fallInit,50);}
    else if(g==="pvp"){show("scr-pvp");}else if(g==="p2p"){show("scr-p2p");}});
  $("#ssSubmit").onclick=ssSubmit;$("#ssSkip").onclick=ssSkip;
  $("#ssInput").addEventListener("keydown",e=>{if(e.key==="Enter")(SS&&SS.locked?ssNext:ssSubmit)();});
  $("#ssHint").onclick=()=>{if(!SS||save.items.hint<=0)return toast("💡 提示卡不足");save.items.hint--;persist();
    $("#ssHintN").textContent=save.items.hint;$("#ssInput").value=SS.words[SS.i].w[0];$("#ssInput").focus();};
  $("#ptStart").onclick=petalStart;$("#ptNext").onclick=petalNew;$("#ptInput").addEventListener("input",petalCheck);
  $("#ptHint").onclick=()=>{if(!PT||PT.phase!==2||save.items.hint<=0)return toast("💡 提示卡不足");save.items.hint--;persist();
    $("#ptHintN").textContent=save.items.hint;const $i=$("#ptInput");$i.value=PT.it.w.slice(0,$i.value.length+1);petalCheck();};
  $("#rsStart").onclick=rushStart;$("#rsInput").addEventListener("keydown",e=>{if(e.key==="Enter")rushSubmit();});
  $("#rsTimePlus").onclick=()=>{if(!RS||!RS.timer)return toast("请先开始冲刺");if(save.items.timeplus<=0)return toast("⏳ 药水不足");
    save.items.timeplus--;persist();RS.time+=10;$("#rsTimePlusN").textContent=save.items.timeplus;toast("⏱️ +10 秒！");};
  $("#flStart").onclick=fallStart;$("#flInput").addEventListener("input",fallInput);
  $("#flSlow").onclick=()=>{if(!FL||!FL.run||save.items.slow<=0)return toast("❄️ 道具不足");save.items.slow--;persist();FL.slowUntil=NOW()+6000;updateFallHUD();toast("❄️ 减速 6 秒！");};
  $("#flShield").onclick=()=>toast(save.items.shield>0?"🛡️ 护盾就绪（触底自动生效）":"🛡️ 道具不足");
  $("#pvpAI").onclick=()=>{pvpMode="ai";};$("#pvpLocal").onclick=()=>{pvpMode="local";};
  $$(".diff").forEach(b=>b.onclick=()=>{pvpDiff=+b.dataset.d;$$(".diff").forEach(x=>{x.classList.toggle("on",x===b);x.classList.toggle("ghost",x!==b);});});
  $("#pvpGo").onclick=pvpStart;$("#pvpSubmit").onclick=pvpSubmit;
  $("#pvpInput").addEventListener("keydown",e=>{if(e.key==="Enter")pvpSubmit();});
  $("#p2pCreate").onclick=p2pCreate;$("#p2pJoin").onclick=p2pJoin;
  $("#p2pCopy").onclick=()=>{try{navigator.clipboard.writeText($("#p2pRoomId").textContent);toast("📋 已复制");}catch(e){}};
  $("#p2pSubmit").onclick=p2pSubmit;$("#p2pInput").addEventListener("keydown",e=>{if(e.key==="Enter")p2pSubmit();});
  $$("#bookFilter .tab").forEach(t=>t.onclick=()=>{$$("#bookFilter .tab").forEach(x=>x.classList.remove("on"));t.classList.add("on");renderBook();});
  $$("#listTabs .tab").forEach(t=>t.onclick=()=>{$$("#listTabs .tab").forEach(x=>x.classList.remove("on"));t.classList.add("on");renderList();});
  ["bookBack","listBack","shopBack","achvBack"].forEach(id=>$("#"+id).onclick=goHome);
}
applyTheme();bind();renderGate();updateHUD();checkAch();
window.addEventListener("resize",()=>{if(FL&&!FL.run)fallInit();});