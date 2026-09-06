"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const KEY="wordrush_save_v2",NOW=()=>Date.now();
const STAGES=["陌生","初识","熟悉","掌握","牢固","永久"];
function blankSave(){return{book:"ren7a",unit:0,coins:0,xp:0,w:{},unitStars:{},items:{timeplus:0,slow:0,shield:0,hint:0},
 themes:["blackboard"],theme:"blackboard",ach:{},toggles:{key:true,sfx:true,voice:true},
 stats:{games:0,reviews:0,correct:0,wrong:0,maxCombo:0,rushBest:0,fallBest:0,pvpWins:0,petals:0,boughtItems:0},
 daily:{date:"",learned:0,ok:0,ng:0,games:0}};}
let save=blankSave();try{const s=JSON.parse(localStorage.getItem(KEY));if(s)save=Object.assign(blankSave(),s);}catch(e){}
const persist=()=>localStorage.setItem(KEY,JSON.stringify(save));
function today(){const d=new Date().toISOString().slice(0,10);if(save.daily.date!==d)save.daily={date:d,learned:0,ok:0,ng:0,games:0};return save.daily;}
const book=()=>BOOKS.find(b=>b.id===save.book)||BOOKS[0];
const wKey=(b,u,i)=>b+"|"+u+"|"+i;
function prog(it){const k=wKey(it.book,it.ui,it.wi);if(!save.w[k])save.w[k]={stage:0,next:0,wrong:0,seen:0};return save.w[k];}
function wordAt(b,ui,wi){const d=BOOKS.find(x=>x.id===b).units[ui].words[wi];return{bank:b,ui,wi,...d};}
function eachWord(fn){BOOKS.forEach(b=>b.units.forEach((u,ui)=>u.words.forEach((_,wi)=>fn(wordAt(b.id,ui,wi)))));}
const isDue=p=>p.seen>0&&p.stage<5&&p.next>0&&p.next<=NOW();
const masteredCount=()=>Object.values(save.w).filter(p=>p.stage>=3).length;
const GAP={1:20*60e3,2:12*3600e3,3:24*3600e3,4:2*864e5,5:4*864e5,6:7*864e5};
function onWordCorrect(it){const p=prog(it),first=p.seen===0;p.seen++;p.stage=Math.min(5,p.stage+1);
 p.next=p.stage<5?NOW()+(GAP[p.stage]||864e5):0;save.stats.correct++;const d=today();d.ok++;if(first)d.learned++;persist();return first;}
function onWordWrong(it){const p=prog(it);p.seen=Math.max(1,p.seen);p.wrong++;p.stage=Math.max(0,p.stage-1);
 p.next=NOW()+20*60e3;save.stats.wrong++;today().ng++;persist();}
const TITLES=["单词新手","拼读学徒","词汇见习生","记忆达人","词库行者","闯关高手","单词大师","词汇宗师"];
const lvOf=xp=>1+Math.floor(xp/100);
function addReward(xp,coins){const b=lvOf(save.xp);save.xp+=xp;save.coins+=coins;persist();updateHUD();
 const a=lvOf(save.xp);if(a>b)toast(`🎉 升级！LV ${a} · ${TITLES[Math.min(a-1,7)]}`);}
function unlock(id){if(save.ach[id])return;const a=ACHV.find(x=>x.id===id);if(!a)return;save.ach[id]=1;save.coins+=a.coin;persist();updateHUD();toast(`${a.ico} 成就达成：${a.name}（+${a.coin}🪙）`);sfx("level");}
function checkAch(){const s=save.stats,m=masteredCount();
 if(s.games>=1)unlock("a1");if(s.maxCombo>=5)unlock("a2");if(s.maxCombo>=15)unlock("a3");
 if(s.reviews>=10)unlock("a4");if(s.reviews>=50)unlock("a5");if(m>=10)unlock("a6");if(m>=100)unlock("a7");
 if(s.rushBest>=600)unlock("a8");if(s.fallBest>=800)unlock("a9");if(s.pvpWins>=1)unlock("a10");
 if(s.petals>=5)unlock("a11");if(save.themes.length>=2&&s.boughtItems>=1)unlock("a12");}
let AC=null;const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type="sine",g=.12,t0=0){try{const c=ac(),o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.value=f;
 v.gain.setValueAtTime(g,c.currentTime+t0);v.gain.exponentialRampToValueAtTime(.001,c.currentTime+t0+d);
 o.connect(v).connect(c.destination);o.start(c.currentTime+t0);o.stop(c.currentTime+t0+d);}catch(e){}}
function sfx(n){if(!save.toggles.sfx)return;
 if(n==="good"){tone(660,.09);tone(880,.12,"sine",.12,.09);}else if(n==="bad")tone(150,.25,"sawtooth",.15);
 else if(n==="click")tone(500,.04,"triangle",.06);else if(n==="boom"){tone(90,.3,"sawtooth",.2);tone(60,.35,"square",.1,.02);}
 else if(n==="level")[523,659,784,1046].forEach((f,i)=>tone(f,.14,"sine",.12,i*.12));
 else if(n==="key")tone(900+Math.random()*500,.03,"square",.04);}
function speak(t){if(!save.toggles.voice||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}
function updateHUD(){$("#hCoins").textContent=save.coins;const lv=lvOf(save.xp);$("#hLv").textContent=lv;
 $("#hBar").style.width=(save.xp%100)+"%";$("#hTitle").textContent=TITLES[Math.min(lv-1,7)];
 let due=0,wrong=0;eachWord(it=>{const p=prog(it);if(isDue(p))due++;if(p.wrong>0)wrong++;});
 $("#reviewCount").textContent=due;$("#wrongCount").textContent=wrong;
 $("#reviewTip").textContent=due>0?"根据遗忘曲线，这些词该见面了":"太棒了，暂无待复习单词 ✨";
 $("#btnWrongPractice").classList.toggle("dim",wrong===0);}
function show(id){$$(".screen").forEach(s=>s.classList.add("hide"));$("#"+id).classList.remove("hide");window.scrollTo(0,0);}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;$("#toasts").appendChild(t);setTimeout(()=>t.remove(),3500);}
function modal(t,h){$("#mTitle").textContent=t;$("#mBody").innerHTML=h;$("#mMask").classList.remove("hide");}
function closeModal(){$("#mMask").classList.add("hide");}
const stageChip=p=>`<span class="chip stage st${p.stage}">${STAGES[p.stage]}</span>`;
document.addEventListener("keydown",e=>{if(save.toggles.key&&/INPUT|TEXTAREA/.test(document.activeElement?.tagName||""))sfx("key");});
/* 漂浮字母背景 */
(function(){const box=$("#bgLetters"),chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ持想念单拼记忆词";
 for(let i=0;i<26;i++){const s=document.createElement("span");s.textContent=chars[Math.floor(Math.random()*chars.length)];
  s.style.left=Math.random()*100+"%";s.style.top=Math.random()*100+"%";
  s.style.fontSize=(26+Math.random()*60)+"px";s.style.color=Math.random()>.5?"#f7d154":"#7be3a0";
  s.style.setProperty("--d",(6+Math.random()*8)+"s");s.style.setProperty("--dl",(-Math.random()*8)+"s");
  s.style.setProperty("--r",(Math.random()*30-15)+"deg");box.appendChild(s);}})();