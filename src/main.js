/* ================= 工具 ================= */
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a),
  pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const escA = (s) => escHtml(s).replace(/"/g, "&quot;");
const vib = (ms) => {
  try {
    navigator.vibrate && navigator.vibrate(ms);
  } catch (e) {}
}
const wFont = (n) =>
  n > 9 ? "clamp(1.2rem,4.6vw,2.2rem)" : "clamp(1.8rem,6vw,3.3rem)";
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const P = (s) => (s ? s.split("|").map((p) => p.split("@")) : []);
const K = "wordrush_v1";

const POS = {
  n: "名词",
  v: "动词",
  a: "形容词",
  d: "副词",
  p: "介词",
  c: "连词",
  r: "代词",
  t: "数词",
  i: "感叹词",
  e: "短语",
};
const posCls = (p) => (["n", "v", "a", "d", "e"].includes(p) ? p : "x");
const LVN = ["陌生", "初识", "熟悉", "掌握", "牢固", "永久"];

/* ================= 词库定义（含扩展） ================= */
const BOOKS = [
  // ---------- 人教版（北京教材）9册 ----------
  {
    id: "j1",
    stage: "初中",
    name: "七年级 · 上",
    color: "#ffd84d",
    units: [
      {
        s: "S",
        n: "Starter 预备篇",
        w: "hello@你好@i|hi@嗨@i|morning@早晨@n|afternoon@下午@n|evening@晚上@n|fine@好的@a|thanks@感谢@i|spell@拼写@v|please@请@d",
        p: "good morning@早上好|how are you@你好吗",
      },
      {
        n: "结识新朋友",
        w: "name@名字@n|nice@令人愉快的@a|meet@遇见@v|your@你的@r|his@他的@r|her@她的@r|first@第一的@t|last@最后的@a|number@号码@n|friend@朋友@n",
        p: "nice to meet you@很高兴见到你",
      },
      {
        n: "我的家庭",
        w: "sister@姐妹@n|brother@兄弟@n|mother@母亲@n|father@父亲@n|parent@父母亲@n|grandparent@祖父母@n|family@家庭@n|cousin@堂表兄妹@n|aunt@姑姨@n|uncle@叔舅@n|photo@照片@n",
      },
      {
        n: "学习用品",
        w: "pencil@铅笔@n|eraser@橡皮@n|dictionary@词典@n|schoolbag@书包@n|mine@我的@r|yours@你的@r|hers@她的@r|find@找到@v|must@必须@v|owner@主人@n",
        p: "excuse me@打扰一下",
      },
      {
        n: "房间方位",
        w: "where@在哪里@d|table@桌子@n|bed@床@n|bookcase@书柜@n|sofa@沙发@n|chair@椅子@n|under@在下面@p|know@知道@v|tidy@整洁的@a|everywhere@到处@d",
      },
      {
        n: "球类运动",
        w: "soccer@足球@n|tennis@网球@n|basketball@篮球@n|volleyball@排球@n|have@有@v|let@让@v|sound@听起来@v|play@玩@v|relaxing@放松的@a|fun@有趣的@a",
        p: "play sports@做运动",
      },
      {
        n: "喜爱食物",
        w: "banana@香蕉@n|hamburger@汉堡@n|tomato@西红柿@n|salad@沙拉@n|strawberry@草莓@n|bread@面包@n|breakfast@早餐@n|lunch@午餐@n|dinner@晚餐@n|fruit@水果@n|vegetable@蔬菜@n",
        p: "how about@…怎么样",
      },
      {
        n: "服装购物",
        w: "dollar@美元@n|sock@短袜@n|shorts@短裤@n|trousers@长裤@n|shoe@鞋@n|skirt@裙子@n|sweater@毛衣@n|T-shirt@T恤@n|big@大的@a|small@小的@a|buy@买@v|sell@卖@v",
      },
      {
        n: "生日月份",
        w: "when@何时@d|month@月@n|January@一月@n|February@二月@n|March@三月@n|April@四月@n|May@五月@n|June@六月@n|birthday@生日@n|party@聚会@n",
      },
      {
        n: "学科科目",
        w: "subject@学科@n|favorite@最喜欢的@a|science@科学@n|music@音乐@n|math@数学@n|geography@地理@n|history@历史@n|busy@忙碌的@a|free@空闲的@a|lesson@课@n|teacher@老师@n",
      },
    ],
  },
  {
    id: "j2",
    stage: "初中",
    name: "七年级 · 下",
    color: "#7cc7ff",
    units: [
      {
        n: "才能俱乐部",
        w: "guitar@吉他@n|sing@唱@v|swim@游泳@v|dance@跳舞@v|draw@画@v|chess@国际象棋@n|speak@说@v|join@加入@v|club@俱乐部@n|tell@告诉@v",
        p: "be good at@擅长",
      },
      {
        n: "日常作息",
        w: "dress@穿衣服@v|brush@刷@v|tooth@牙齿@n|shower@淋浴@n|usually@通常@d|early@早的@a|fifty@五十@t|work@工作@v|station@电台@n|night@夜晚@n|funny@滑稽的@a",
        p: "get up@起床",
      },
      {
        n: "交通出行",
        w: "train@火车@n|bus@公交车@n|subway@地铁@n|ride@骑@v|bike@自行车@n|sixty@六十@t|seventy@七十@t|eighty@八十@t|minute@分钟@n|far@远的@a|kilometer@千米@n",
        p: "by bus@乘公交车",
      },
      {
        n: "校规家规",
        w: "rule@规则@n|arrive@到达@v|hallway@走廊@n|hall@大厅@n|dining@进餐@n|listen@听@v|fight@打架@v|wear@穿@v|important@重要的@a|quiet@安静的@a|noisy@吵闹的@a",
        p: "be on time@准时",
      },
      {
        n: "动物世界",
        w: "panda@熊猫@n|zoo@动物园@n|animal@动物@n|cute@可爱的@a|lazy@懒散的@a|smart@聪明的@a|beautiful@美丽的@a|kind@种类@n|Australia@澳大利亚@n|Africa@非洲@n|pet@宠物@n|elephant@大象@n",
      },
      {
        n: "正在做什么",
        w: "newspaper@报纸@n|use@使用@v|soup@汤@n|wash@洗@v|movie@电影@n|tomorrow@明天@d|pool@游泳池@n|shop@购物@v|supermarket@超市@n|study@学习@v|drink@喝@v",
      },
      {
        n: "天气状况",
        w: "rain@下雨@v|windy@有风的@a|cloudy@多云的@a|sunny@晴朗的@a|snow@下雪@v|weather@天气@n|cook@做饭@v|bad@坏的@a|park@公园@n|message@消息@n|cold@冷的@a|hot@热的@a",
        p: "take a message@捎个口信",
      },
      {
        n: "问路指路",
        w: "post@邮寄@v|office@办公室@n|police@警方@n|hotel@旅馆@n|restaurant@餐馆@n|bank@银行@n|hospital@医院@n|street@街道@n|pay@付费@v|near@近的@p|across@穿过@p|town@镇@n",
        p: "post office@邮局",
      },
      {
        n: "外貌描述",
        w: "curly@卷曲的@a|straight@笔直的@a|tall@高的@a|short@矮的@a|thin@瘦的@a|heavy@重的@a|build@身材@n|tonight@今晚@d|handsome@英俊的@a|actor@演员@n|person@人@n|nose@鼻子@n",
      },
      {
        n: "点餐美食",
        w: "beef@牛肉@n|mutton@羊肉@n|cabbage@卷心菜@n|potato@土豆@n|noodle@面条@n|bowl@碗@n|tofu@豆腐@n|meat@肉@n|dumpling@饺子@n|porridge@粥@n|special@特色菜@n|order@点菜@v",
      },
      {
        n: "周末活动",
        w: "camp@扎营@v|lake@湖@n|beach@海滩@n|badminton@羽毛球@n|butterfly@蝴蝶@n|mouse@老鼠@n|baby@婴儿@n|shout@呼叫@v|surprise@惊奇@n|language@语言@n|farm@农场@n",
      },
      {
        n: "难忘周末",
        w: "visitor@访问者@n|fly@放飞@v|kite@风筝@n|museum@博物馆@n|fire@火@n|natural@自然的@a|scared@害怕的@a|awake@醒着的@a|start@开始@v|jump@跳@v|snake@蛇@n|tired@疲倦的@a",
        p: "stay up@熬夜",
      },
    ],
  },
  {
    id: "j3",
    stage: "初中",
    name: "八年级 · 上",
    color: "#ff8fa3",
    units: [
      {
        n: "假期生活",
        w: "anywhere@任何地方@d|wonderful@精彩的@a|quite@相当@d|everyone@每人@r|something@某事@r|nothing@没有什么@r|bored@无聊的@a|diary@日记@n|activity@活动@n|decide@决定@v",
      },
      {
        n: "锻炼频率",
        w: "housework@家务@n|hardly@几乎不@d|ever@曾经@d|Internet@因特网@n|program@节目@n|full@满的@a|swing@摇摆舞@n|maybe@可能@d|magazine@杂志@n|however@然而@d",
        p: "hardly ever@几乎不",
      },
      {
        n: "朋友比较",
        w: "outgoing@外向的@a|both@两者都@r|louder@更大声的@a|similar@相似的@a|different@不同的@a|saying@谚语@n|reach@到达@v|hand@手@n|touch@触动@v|heart@内心@n|laugh@笑@v",
      },
      {
        n: "最佳影院",
        w: "theater@剧院@n|comfortable@舒适的@a|seat@座位@n|screen@屏幕@n|close@近的@a|ticket@票@n|worst@最差的@a|cheaply@便宜地@d|choose@选择@v|carefully@细致地@d|talent@才艺@n|winner@获胜者@n",
      },
      {
        n: "电视节目",
        w: "sitcom@情景喜剧@n|news@新闻@n|educational@教育性的@a|plan@计划@n|hope@希望@v|happen@发生@v|expect@期待@v|joke@笑话@n|comedy@喜剧@n|action@动作@n|cartoon@卡通@n",
      },
      {
        n: "未来打算",
        w: "doctor@医生@n|engineer@工程师@n|violinist@小提琴手@n|pilot@飞行员@n|pianist@钢琴家@n|scientist@科学家@n|college@学院@n|education@教育@n|medicine@医学@n|university@大学@n|foreign@外国的@a",
      },
      {
        n: "机器人与未来",
        w: "robot@机器人@n|paper@纸@n|pollution@污染@n|environment@环境@n|planet@行星@n|earth@地球@n|plant@种植@v|peace@和平@n|space@太空@n|apartment@公寓@n|human@人类的@a",
      },
      {
        n: "动手制作",
        w: "blender@搅拌器@n|peel@剥皮@v|pour@倒@v|yogurt@酸奶@n|honey@蜂蜜@n|watermelon@西瓜@n|spoon@勺@n|pot@锅@n|sugar@糖@n|finally@最后@d|salt@盐@n",
        p: "cut up@切碎",
      },
      {
        n: "聚会邀请",
        w: "prepare@准备@v|exam@考试@n|available@有空的@a|hang@悬挂@v|catch@赶上@v|accept@接受@v|refuse@拒绝@v|invitation@邀请@n|concert@音乐会@n|calendar@日历@n",
        p: "hang out@常去",
      },
      {
        n: "如果那么",
        w: "video@录像@n|organize@组织@v|chocolate@巧克力@n|upset@难过的@a|taxi@出租车@n|advice@建议@n|travel@旅行@v|agent@经纪人@n|expert@专家@n|teenager@青少年@n|normal@正常的@a|careless@粗心的@a",
      },
    ],
  },
  {
    id: "j4",
    stage: "初中",
    name: "八年级 · 下",
    color: "#6fe3d4",
    units: [
      {
        n: "健康问题",
        w: "matter@事情@n|stomach@胃@n|throat@咽喉@n|fever@发烧@n|headache@头痛@n|cough@咳嗽@v|rest@休息@v|dentist@牙医@n|sick@生病的@a|knee@膝盖@n|breathe@呼吸@v",
        p: "lie down@躺下",
      },
      {
        n: "志愿服务",
        w: "clean-up@大扫除@n|sign@标志@n|notice@通知@n|volunteer@志愿者@n|lonely@孤独的@a|cheer@欢呼@v|clever@聪明的@a|raise@筹集@v|journey@旅程@n|disabled@残疾的@a|blind@失明的@a|deaf@聋的@a",
        p: "cheer up@振作起来",
      },
      {
        n: "家务劳动",
        w: "chore@杂务@n|sweep@扫@v|floor@地板@n|fold@叠@v|mess@杂乱@n|throw@扔@v|neither@也不@d|shirt@衬衫@n|borrow@借入@v|lend@借出@v|finger@手指@n|waste@浪费@v",
      },
      {
        n: "亲子沟通",
        w: "allow@允许@v|wrong@错误的@a|guess@猜测@v|deal@大量@n|relation@关系@n|communication@交流@n|argue@争吵@v|cloud@云@n|elder@年长的@a|instead@反而@d|nervous@紧张的@a|offer@主动给@v|proper@恰当的@a",
      },
      {
        n: "暴雨时刻",
        w: "rainstorm@暴风雨@n|alarm@闹钟@n|begin@开始@v|heavily@沉重地@d|suddenly@突然@d|strange@奇怪的@a|storm@暴风雨@n|wind@风@n|light@光@n|report@报道@v|area@地区@n|window@窗户@n",
      },
      {
        n: "神话传说",
        w: "shoot@射击@v|stone@石头@n|weak@虚弱的@a|god@神@n|remind@提醒@v|voice@声音@n|brave@勇敢的@a|stupid@笨的@a|silly@傻的@a|magic@有魔力的@a|stick@棍@n|tail@尾巴@n",
      },
      {
        n: "地理之最",
        w: "square@平方的@a|meter@米@n|deep@深的@a|desert@沙漠@n|Asia@亚洲@n|tour@旅行@n|thick@厚的@a|include@包括@v|achievement@成就@n|Himalaya@喜马拉雅山@n|Everest@珠穆朗玛峰@n|risk@风险@n",
      },
      {
        n: "名著阅读",
        w: "treasure@珠宝@n|island@岛@n|classic@经典作品@n|page@页码@n|hurry@匆忙@v|due@到期的@a|ship@船@n|tool@工具@n|gun@枪@n|sand@沙@n|novel@小说@n|introduce@介绍@v",
        p: "hurry up@赶快",
      },
      {
        n: "特别经历",
        w: "amusement@娱乐@n|somewhere@某处@d|camera@相机@n|invention@发明@n|invent@发明创造@v|unbelievable@难以置信的@a|progress@进步@n|rapid@迅速的@a|unusual@不寻常的@a|toilet@厕所@n|encourage@鼓励@v|social@社会的@a",
      },
      {
        n: "旧物情怀",
        w: "yard@院子@n|sale@出售@n|sweet@甜蜜的@a|memory@记忆@n|century@世纪@n|toy@玩具@n|scarf@围巾@n|soft@软的@a|check@检查@v|junior@初级的@a|clear@清理@v|own@拥有@v",
      },
    ],
  },
  {
    id: "j5",
    stage: "初中",
    name: "九年级 · 全一册",
    color: "#ffb066",
    units: [
      {
        n: "学习方法",
        w: "textbook@教科书@n|conversation@交谈@n|aloud@大声地@d|pronunciation@发音@n|sentence@句子@n|patient@有耐心的@a|expression@表情@n|discover@发现@v|secret@秘密@n|grammar@语法@n",
        p: "word by word@逐字地",
      },
      {
        n: "传统节日",
        w: "mooncake@月饼@n|lantern@灯笼@n|relative@亲戚@n|pound@磅@n|steal@偷@v|lay@放置@v|dessert@甜点@n|garden@花园@n|admire@欣赏@v|treat@招待@v",
      },
      {
        n: "礼貌询问",
        w: "restroom@洗手间@n|stamp@邮票@n|beside@在旁边@p|postcard@明信片@n|pardon@原谅@v|washroom@卫生间@n|bathroom@浴室@n|suggest@建议@v|staff@工作人员@n|grape@葡萄@n",
      },
      {
        n: "今昔变化",
        w: "humorous@幽默的@a|silent@沉默的@a|helpful@有帮助的@a|score@得分@n|background@背景@n|interview@采访@v|Asian@亚洲的@a|dare@敢于@v|private@私人的@a|require@需要@v|European@欧洲的@a",
      },
      {
        n: "中国制造",
        w: "chopstick@筷子@n|coin@硬币@n|fork@餐叉@n|blouse@女衬衫@n|silver@银@n|glass@玻璃@n|cotton@棉@n|steel@钢@n|fair@展览会@n|produce@生产@v|widely@广泛地@d|France@法国@n",
      },
      {
        n: "伟大发明",
        w: "heel@鞋跟@n|scoop@勺子@n|electricity@电@n|style@风格@n|project@项目@n|pleasure@高兴@n|daily@每日的@a|pioneer@先驱@n|mention@提到@v|boil@煮沸@v|smell@气味@v",
      },
      {
        n: "青春规则",
        w: "tiny@极小的@a|field@田野@n|hug@拥抱@v|lift@举起@v|badly@严重地@d|awful@糟糕的@a|teen@青少年@n|regret@遗憾@v|poem@诗@n|community@社区@n|choice@选择@n",
      },
      {
        n: "推测归属",
        w: "whose@谁的@r|attend@出席@v|valuable@贵重的@a|picnic@野餐@n|rabbit@兔子@n|bury@埋藏@v|lab@实验室@n|coat@外套@n|sleepy@困倦的@a|land@降落@v|noise@噪音@n",
      },
      {
        n: "音乐电影",
        w: "prefer@更喜欢@v|lyrics@歌词@n|smooth@平滑的@a|electronic@电子的@a|spare@空闲的@a|director@导演@n|case@情况@n|war@战争@n|superhero@超级英雄@n|documentary@纪录片@n",
      },
      {
        n: "礼仪习俗",
        w: "bow@鞠躬@v|kiss@亲吻@v|greet@问候@v|value@重视@v|capital@首都@n|mad@生气的@a|passport@护照@n|behave@表现@v|except@除了@p|customs@习俗@n|basic@基本的@a",
      },
      {
        n: "情绪影响",
        w: "drive@迫使@v|friendship@友谊@n|king@国王@n|palace@宫殿@n|grey@灰色的@a|lemon@柠檬@n|fame@名声@n|wealth@财富@n|banker@银行家@n|pale@苍白的@a|examine@检查@v|shoulder@肩膀@n",
      },
      {
        n: "意外事件",
        w: "unexpected@出乎意料的@a|backpack@背包@n|oversleep@睡过头@v|ring@响铃@v|worker@工人@n|stare@凝视@v|airport@机场@n|burn@燃烧@v|alive@活着的@a|cancel@取消@v|announce@宣布@v",
      },
      {
        n: "保护环境",
        w: "shark@鲨鱼@n|fin@鳍@n|cruel@残忍的@a|harmful@有害的@a|chain@链子@n|ecosystem@生态系统@n|industry@工业@n|law@法律@n|scientific@科学的@a|afford@承担得起@v|reusable@可重复使用的@a",
      },
      {
        n: "毕业季",
        w: "survey@调查@n|standard@标准@n|instruction@指令@n|double@加倍@v|overcome@克服@v|caring@体贴的@a|congratulate@祝贺@v|thirsty@渴望的@a|thankful@感谢的@a|separate@分开@v",
      },
    ],
  },
  {
    id: "g1",
    stage: "高中",
    name: "必修第一册",
    color: "#c6a9ff",
    units: [
      {
        n: "青春生活",
        w: "teenage@青少年的@a|ballet@芭蕾@n|debate@辩论@n|recommend@推荐@v|content@内容@n|movement@动作@n|greenhouse@温室@n|suitable@合适的@a|graduate@毕业@v|advanced@高级的@a",
        p: "sign up@报名",
      },
      {
        n: "环球旅行",
        w: "apply@申请@v|amazing@令人惊叹的@a|arrange@安排@v|narrow@狭窄的@a|powerful@强大的@a|empire@帝国@n|source@来源@n|flat@平坦的@a|accommodation@住处@n|unique@独特的@a|path@小路@n",
      },
      {
        n: "体育健康",
        w: "fitness@健康@n|stadium@体育场@n|boxing@拳击@n|honor@荣誉@n|glory@荣耀@n|medal@奖章@n|champion@冠军@n|athlete@运动员@n|master@大师@n|pretend@假装@v",
        p: "work out@锻炼",
      },
      {
        n: "自然灾害",
        w: "disaster@灾难@n|tornado@龙卷风@n|drought@干旱@n|landslide@山体滑坡@n|flood@洪水@n|volcanic@火山的@a|tsunami@海啸@n|ruin@废墟@n|shock@震惊@n|rescue@营救@v|trap@困住@v",
      },
      {
        n: "语言世界",
        w: "attitude@态度@n|refer@提到@v|system@体系@n|despite@尽管@p|equal@平等的@a|demand@要求@v|vocabulary@词汇@n|accent@口音@n|native@本国的@a|global@全球的@a",
      },
    ],
  },
  {
    id: "g2",
    stage: "高中",
    name: "必修第二册",
    color: "#8de18a",
    units: [
      {
        n: "文化遗产",
        w: "heritage@遗产@n|creative@创造性的@a|preserve@保护@v|promote@促进@v|application@申请@n|balance@平衡@n|tradition@传统@n|ancient@古代的@a|donate@捐赠@v|disappear@消失@v|professional@专业的@a",
      },
      {
        n: "野生动物",
        w: "illegal@非法的@a|hunt@打猎@v|immediately@立即@d|species@物种@n|rate@速度@n|extinction@灭绝@n|habitat@栖息地@n|reserve@保护区@n|aware@意识到的@a|remove@移除@v",
        p: "in danger@处于危险中",
      },
      {
        n: "互联网时代",
        w: "blog@博客@n|engine@引擎@n|chat@聊天@v|stream@流播@v|identity@身份@n|convenient@方便的@a|cash@现金@n|update@更新@v|database@数据库@n|software@软件@n|privacy@隐私@n|target@目标@n",
      },
      {
        n: "历史传统",
        w: "kingdom@王国@n|belong@属于@v|puzzle@谜题@n|military@军事的@a|surround@环绕@v|defense@防御@n|legal@法律的@a|battle@战役@n|port@港口@n|location@位置@n",
      },
      {
        n: "音乐世界",
        w: "classical@古典的@a|compose@作曲@v|opportunity@机会@n|performer@表演者@n|piano@钢琴@n|ordinary@普通的@a|enable@使能够@v|prove@证明@v|award@奖@n|conductor@指挥@n|original@原创的@a",
      },
    ],
  },
  {
    id: "g3",
    stage: "高中",
    name: "必修第三册",
    color: "#7cc7ff",
    units: [
      {
        n: "节日庆典",
        w: "festival@节日@n|celebration@庆典@n|harvest@丰收@n|origin@起源@n|religious@宗教的@a|figure@人物@n|typical@典型的@a|commercial@商业化的@a|belief@信仰@n|occasion@场合@n",
      },
      {
        n: "道德美德",
        w: "moral@道德的@a|virtue@美德@n|dilemma@困境@n|precious@珍贵的@a|complain@抱怨@v|tuition@学费@n|scholarship@奖学金@n|physician@医生@n|hire@雇用@v|reject@拒绝@v|appointment@预约@n",
      },
      {
        n: "多元文化",
        w: "diverse@多样的@a|fortune@机会@n|snack@小吃@n|dairy@奶制品@n|construction@建筑@n|historical@历史的@a|immigration@移民@n|seek@寻找@v|earn@挣钱@v|occur@发生@v|climate@气候@n|mission@使命@n",
      },
      {
        n: "太空探索",
        w: "astronomy@天文学@n|universe@宇宙@n|satellite@卫星@n|launch@发射@v|orbit@轨道@n|signal@信号@n|resource@资源@n|shallow@浅的@a|mystery@神秘@n|frontier@前沿@n|vehicle@交通工具@n",
      },
      {
        n: "金钱价值",
        w: "base@根据@n|tone@语气@n|spot@发现@v|permit@许可@v|patience@耐心@n|grateful@感激的@a|limit@限制@v|serve@服务@v|scene@场景@n|narrator@叙述者@n",
      },
    ],
  },
  {
    id: "g4",
    stage: "高中",
    name: "选择性必修一",
    color: "#ff9e7a",
    units: [
      {
        n: "杰出人物",
        w: "crucial@至关重要的@a|vital@重要的@a|objective@目标@n|obtain@获得@v|acknowledge@承认@v|analysis@分析@n|apparent@显然的@a|commit@承诺@v|distinct@独特的@a|genius@天才@n|patent@专利@n",
      },
      {
        n: "展望未来",
        w: "predict@预测@v|innovation@创新@n|encounter@遭遇@v|oppose@反对@v|automatic@自动的@a|relevant@相关的@a|efficient@高效的@a|emphasis@强调@n|prospect@前景@n|fundamental@基本的@a",
      },
      {
        n: "国家公园",
        w: "breathtaking@惊人的@a|valley@山谷@n|vast@辽阔的@a|meadow@草地@n|boundary@边界@n|ban@禁止@v|visible@看得见的@a|extraordinary@非凡的@a|landscape@风景@n|territory@领土@n",
      },
      {
        n: "肢体语言",
        w: "gesture@手势@n|facial@面部的@a|interaction@互动@n|appropriate@恰当的@a|occupy@占据@v|reveal@揭示@v|internal@内部的@a|assess@评估@v|obstacle@障碍@n|barrier@屏障@n",
      },
      {
        n: "农耕智慧",
        w: "agriculture@农业@n|crop@庄稼@n|yield@产量@n|nutrition@营养@n|organic@有机的@a|fertilizer@化肥@n|irrigation@灌溉@n|cultivate@栽培@v|abundance@丰富@n|boost@促进@v",
        p: "thanks to@多亏",
      },
    ],
  },
  // ---------- 外研版（新标准）七年级上册 ----------
  {
    id: "w1",
    stage: "初中",
    name: "外研版七上",
    color: "#f9a825",
    units: [
      {
        s: "S",
        n: "Starter 预备",
        w: "hello@你好@i|hi@嗨@i|goodbye@再见@i|thanks@感谢@i|sorry@抱歉@a|please@请@d|yes@是的@d|no@不@d|OK@好的@i|name@名字@n|friend@朋友@n|teacher@老师@n",
        p: "good morning@早上好",
      },
      {
        n: "Module 1 自我介绍",
        w: "I@我@r|you@你@r|he@他@r|she@她@r|we@我们@r|they@他们@r|my@我的@r|your@你的@r|his@他的@r|her@她的@r|from@来自@p|China@中国@n|England@英国@n|America@美国@n",
        p: "be from@来自",
      },
      {
        n: "Module 2 家人",
        w: "father@父亲@n|mother@母亲@n|brother@兄弟@n|sister@姐妹@n|uncle@叔叔@n|aunt@阿姨@n|cousin@表兄妹@n|grandfather@爷爷@n|grandmother@奶奶@n|family@家庭@n|photo@照片@n|love@爱@v",
        p: "look at@看",
      },
    ],
  },
  // ---------- 新概念英语第一册 ----------
  {
    id: "n1",
    stage: "其他",
    name: "新概念第一册",
    color: "#d32f2f",
    units: [
      {
        s: "L1-2",
        n: "基础对话",
        w: "excuse@原谅@v|me@我@r|yes@是的@d|is@是@v|this@这个@r|your@你的@r|handbag@手提包@n|pardon@请再说一遍@v|thank@感谢@v|very@非常@d|much@多@d|not@不@d",
        p: "excuse me@打扰",
      },
      {
        s: "L3-4",
        n: "物品与复数",
        w: "umbrella@雨伞@n|ticket@票@n|number@号码@n|five@五@t|six@六@t|seven@七@t|eight@八@t|nine@九@t|ten@十@t|coat@外套@n|dress@连衣裙@n|skirt@裙子@n",
      },
      {
        s: "L5-6",
        n: "句型扩展",
        w: "Mr@先生@n|Mrs@夫人@n|miss@小姐@n|good@好的@a|morning@早晨@n|afternoon@下午@n|evening@晚上@n|how@怎样@d|well@好@d|fine@好的@a|nice@令人愉快的@a|meet@遇见@v",
      },
    ],
  },
  // ---------- KET 核心词汇 ----------
  {
    id: "ket",
    stage: "其他",
    name: "KET 核心词汇",
    color: "#1976d2",
    units: [
      {
        s: "K1",
        n: "家庭与朋友",
        w: "family@家庭@n|father@父亲@n|mother@母亲@n|brother@兄弟@n|sister@姐妹@n|uncle@叔叔@n|aunt@阿姨@n|cousin@表兄妹@n|friend@朋友@n|neighbour@邻居@n|people@人们@n|child@孩子@n",
      },
      {
        s: "K2",
        n: "食物与饮料",
        w: "apple@苹果@n|banana@香蕉@n|bread@面包@n|cake@蛋糕@n|coffee@咖啡@n|drink@饮料@n|fish@鱼@n|fruit@水果@n|juice@果汁@n|meat@肉@n|milk@牛奶@n|water@水@n",
      },
      {
        s: "K3",
        n: "旅行与交通",
        w: "train@火车@n|bus@公交车@n|car@汽车@n|bike@自行车@n|plane@飞机@n|ship@船@n|travel@旅行@v|ticket@票@n|station@车站@n|airport@机场@n|hotel@旅馆@n|map@地图@n",
      },
      {
        s: "K4",
        n: "日常活动",
        w: "work@工作@v|study@学习@v|play@玩@v|read@阅读@v|write@写@v|listen@听@v|speak@说@v|watch@看@v|help@帮助@v|like@喜欢@v|want@想要@v|need@需要@v",
      },
    ],
  },
];

/* ================= 动态词库配置（URL 或服务器相对路径，如 dict/x.csv） ================= */
const DYN_TTL = 864e5; // 缓存 24 小时
// stage：学段标签（小学/初中/高中/大学/考研/留学），显示在主页徽标与词库标签提示中
const DYN_SOURCES = [
  // ── 初中 ──
  { id: "rj7", name: "人教七年级", size: "约880词", color: "#4dd0e1", stage: "初中", url: "/vocab/人教初中七年级.csv" },
  { id: "rj8", name: "人教八年级", size: "约880词", color: "#26c6da", stage: "初中", url: "/vocab/人教初中八年级.csv" },
  { id: "rj9", name: "人教九年级", size: "约550词", color: "#00acc1", stage: "初中", url: "/vocab/人教初中九年级.csv" },
  { id: "kzc", name: "中考", size: "约1800词", color: "#5b9bd5", stage: "初中", url: "/vocab/中考英语词汇表.csv" },
  // ── 高中 ──
  { id: "rjg", name: "人教高中", size: "约3900词", color: "#7c4dff", stage: "高中", url: "/vocab/人教高中.csv" },
  // ── 大学 ──
  { id: "cet4", name: "四级", size: "约4500词", color: "#ed7d31", stage: "大学", url: "/vocab/CET4_edited.csv" },
  { id: "cet6", name: "六级", size: "约5500词", color: "#b8c4bd", stage: "大学", url: "/vocab/CET6_edited.csv" },
  { id: "tem4", name: "专四", size: "约4600词", color: "#26a69a", stage: "大学", url: "/vocab/专四.csv" },
  { id: "tem8", name: "专八", size: "约1.3万词", color: "#00897b", stage: "大学", url: "/vocab/专八.csv" },
  // ── 考研 ──
  { id: "ky", name: "考研", size: "约9600词", color: "#d81b60", stage: "考研", url: "/vocab/考研.csv" },
  // ── 留学 ──
  { id: "ielts", name: "雅思", size: "约7000词", color: "#1e88e5", stage: "留学", url: "/vocab/雅思.csv" },
  { id: "toefl", name: "TOEFL", size: "约4500词", color: "#6a1b9a", stage: "留学", url: "/vocab/TOEFL_abridged.csv" },
  { id: "gre", name: "GRE", size: "约8000词", color: "#c2185b", stage: "留学", url: "/vocab/GRE_abridged.csv" },
];

/* 学段配色：未选中词库按钮的虚线/文字按学段着色（选中后仍用词库各自主题色） */
const STAGE_COLORS = {
  小学: "#66bb6a",
  初中: "#29b6f6",
  高中: "#7c4dff",
  大学: "#ff9800",
  考研: "#ec407a",
  留学: "#5c6bc0",
};
const stageColor = (st) => STAGE_COLORS[st] || "";

/* ================= 动态词库 CSV 解析管线 ================= */
function parseCsv(text) {
  if (!text) return [];
  let s = text.replace(/^\uFEFF/, "").replace(/\r\n|\r/g, "\n").replace(/\n+$/, "");
  const rows = [];
  let row = [], field = "", i = 0, inQ = false, depth = 0;
  while (i < s.length) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 2; }
        else { inQ = false; i++; }
      } else { field += ch; i++; }
    } else if (ch === '"' && field === "") { inQ = true; i++; }
    else if (ch === "(") { depth++; field += ch; i++; }
    else if (ch === ")") { if (depth > 0) depth--; field += ch; i++; }
    else if (ch === "," && depth === 0) { row.push(field); field = ""; i++; }
    else if (ch === "\n" && depth === 0) { row.push(field); rows.push(row); row = []; field = ""; i++; }
    else { field += ch; i++; }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function cleanHeadword(w) {
  let s = w.trim();
  s = s.replace(/\s*\([^()]*\)\s*$/, "");
  return s.trim() || w.trim();
}
function mapPos(p) {
  const t = String(p || "").trim().toLowerCase().split(/[/&]/)[0].trim();
  const M = {
    n: "n", "n.": "n",
    a: "a", "a.": "a", adj: "a", "adj.": "a",
    ad: "d", "ad.": "d", adv: "d", "adv.": "d",
    v: "v", "v.": "v", vt: "v", "vt.": "v", vi: "v", "vi.": "v", aux: "v", "aux.": "v", modal: "v", "modal.": "v",
    prep: "p", "prep.": "p",
    conj: "c", "conj.": "c",
    pron: "r", "pron.": "r",
    num: "t", "num.": "t",
    int: "i", "int.": "i", interj: "i", "interj.": "i",
    phr: "e", "phr.": "e", phrase: "e",
  };
  return M[t] || "n";
}
function csvToUnits(text, { chunk = 50 } = {}) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  let wi = 0, pi = 3, di = 2;
  if (/^(word|headword|词汇|单词)(\s|$)/i.test(rows[0][0] || "")) {
    const h = rows.shift();
    const find = (names) => {
      for (let i = 0; i < h.length; i++) {
        const c = (h[i] || "").trim().toLowerCase();
        if (names.includes(c)) return i;
      }
      return -1;
    };
    const enI = find(["word", "headword", "词汇", "单词"]);
    const posI = find(["pos", "词性"]);
    const cnI = find(["definition", "meaning", "释义", "中文"]);
    wi = enI >= 0 ? enI : 0;
    pi = posI >= 0 ? posI : 3;
    di = cnI >= 0 ? cnI : 2;
  }
  const triples = [];
  let bad = 0;
  rows.forEach((row) => {
    const en = cleanHeadword(row[wi] || "");
    const cn = (row[di] || "").trim();
    if (!en || !cn) return;
    if (en.includes("@") || en.includes("|") || cn.includes("@") || cn.includes("|")) { bad++; return; }
    triples.push([en, cn, mapPos(row[pi])]);
  });
  if (bad) console.warn("动态词库：跳过含 @ 或 | 的行", bad, "行");
  if (!triples.length) return [];
  const units = [];
  for (let k = 0; k < triples.length; k += chunk) {
    const part = triples.slice(k, k + chunk);
    units.push({
      s: "U" + (k / chunk + 1),
      n: (k + 1) + "-" + Math.min(k + chunk, triples.length),
      w: part.map((t) => t.join("@")).join("|"),
    });
  }
  return units;
}

/* ================= 动态词库缓存（按来源 24h TTL） ================= */
const dynKey = (id) => "wordrush_dyn_" + id;
function dynCacheGet(id) {
  try { return JSON.parse(localStorage.getItem(dynKey(id)) || "null"); } catch (e) { return null; }
}
function dynCacheSet(id, text) {
  try { localStorage.setItem(dynKey(id), JSON.stringify({ ts: Date.now(), text })); } catch (e) { console.warn("缓存写入失败(空间不足?)", e); }
}

/* ================= 动态词库加载（按源隔离，失败不阻塞其它源） ================= */
// 返回 Promise<boolean>：true = 成功加载（BOOKS 已含该词库），false = 失败。
// opts.silent = true 时静默加载（后台缓存/惰性加载，不弹 toast，仅失败且无缓存时才提示）。
async function applyDynamicBook(src, opts = {}) {
  const silent = !!opts.silent;
  let text = null, fromCache = false;
  const c = dynCacheGet(src.id);
  if (c && Date.now() - c.ts < DYN_TTL) { text = c.text; fromCache = true; }
  else {
    try {
      const res = await fetch(src.url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      text = await res.text();
      dynCacheSet(src.id, text);
    } catch (e) {
      if (c && c.text) { text = c.text; fromCache = true; if (!silent) toast("⚠️ 词库加载失败：" + src.name + "，已使用缓存"); }
      else { if (!silent) toast("⚠️ 词库加载失败：" + src.name + "（可稍后刷新重试）"); return false; }
    }
  }
  const units = csvToUnits(text);
  if (!units.length) { if (!silent) toast("⚠️ 词库解析为空：" + src.name); return false; }
  const i = BOOKS.findIndex((b) => b.id === src.id);
  if (i >= 0) BOOKS.splice(i, 1);
  BOOKS.push({ id: src.id, stage: src.stage || "扩展词库", name: src.name, color: src.color, units });
  buildAll();
  if (!silent && fromCache) toast("📖 " + src.name + "（缓存）");
  if (!silent) toast("📖 " + src.name + " 已加载");
  return true;
}

// 找出 BOOKS 中对应 id 是否已加载（供惰性加载时判断）
const dynSource = (id) => DYN_SOURCES.find((s) => s.id === id);
const dynLoaded = (id) => !!bookOf(id);

/* ================= 扩展词库 · 每日精练（每日词量滑块 + 顺序/逆序/随机） ================= */
const DYN_DAILY_MIN = 10,
  DYN_DAILY_MAX = 100,
  DYN_DAILY_STEP = 10;
const DYN_ORDERS = ["seq", "rev", "rand"];
// 滑块值规范化：夹到 10-100 并按 10 取整
function dynNormDaily(n) {
  n = Math.round((+n || 20) / DYN_DAILY_STEP) * DYN_DAILY_STEP;
  return Math.min(DYN_DAILY_MAX, Math.max(DYN_DAILY_MIN, n));
}
// 读取（并补齐）某个扩展词库的每日精练设置
function dynCfg(id) {
  if (!S.dyn || typeof S.dyn !== "object") S.dyn = {};
  const d = S.dyn[id] || (S.dyn[id] = { daily: 20, order: "seq", pos: 0 });
  d.daily = dynNormDaily(d.daily);
  if (!DYN_ORDERS.includes(d.order)) d.order = "seq";
  if (typeof d.pos !== "number" || d.pos < 0) d.pos = 0;
  return d;
}
// 扩展词库学习进度统计（基于掌握度）：total / learned（练过）/ mastered（已牢记）
function dynProgress(id) {
  const b = bookOf(id);
  if (!b) return null;
  let learned = 0,
    mastered = 0;
  for (const it of b.items) {
    const m = S.mastery[it.en.toLowerCase()];
    if (m && m.r > 0) {
      learned++;
      if (m.lv >= 5) mastered++;
    }
  }
  return { total: b.items.length, learned, mastered };
}
// 后台静默懒加载（去重并发；失败后允许重试；加载完若仍选中该词库则刷新动态区）
const dynLoadPromises = {};
function ensureDynLoaded(src) {
  if (bookOf(src.id)) return Promise.resolve(true);
  if (!dynLoadPromises[src.id]) {
    dynLoadPromises[src.id] = applyDynamicBook(src, { silent: true }).then(
      (ok) => {
        if (!ok) delete dynLoadPromises[src.id];
        else if (S.curBook === src.id) renderHome();
        return ok;
      }
    );
  }
  return dynLoadPromises[src.id];
}
// 生成一批每日练习词：逾期复习词优先（SRS 调度）+ 新学词按顺序/逆序指针或随机推进补足，交错排列
function dynDailyQueue(items, id) {
  const cfg = dynCfg(id);
  const n = Math.min(cfg.daily, items.length);
  // 新学词选取：顺序/逆序用持久化指针逐批推进（自动跳过已学词），随机则从未学词中抽样
  const freshPick = (need) => {
    if (need <= 0) return [];
    if (cfg.order === "rand") {
      return shuffle(
        items.filter((it) => {
          const m = S.mastery[it.en.toLowerCase()];
          return !m || !m.r;
        })
      ).slice(0, need);
    }
    const base = cfg.order === "rev" ? items.slice().reverse() : items;
    const picked = [];
    for (let i = 0; i < base.length && picked.length < need; i++) {
      const it = base[(cfg.pos + i) % base.length];
      const m = S.mastery[it.en.toLowerCase()];
      if (!m || !m.r) picked.push(it);
    }
    const wrapped = cfg.pos + n >= base.length; // 指针越过词库末尾 → 本轮新词学完
    cfg.pos = (cfg.pos + n) % base.length;
    save();
    if (wrapped)
      setTimeout(
        () =>
          toast(
            "🏁 " +
              (dynSource(id)?.name || "扩展词库") +
              " 已学完一轮新词，进入复习巩固轮"
          ),
        500
      );
    return picked;
  };
  return srsDailyQueue(items, n, freshPick);
}

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

// 短语库（用于关联记忆）
const PHRASES = {
  apple: "an apple a day // 一天一个苹果",
  friend: "make friends // 交朋友",
  family: "family members // 家庭成员",
  teacher: "English teacher // 英语老师",
  school: "go to school // 去上学",
  classroom: "in the classroom // 在教室里",
  book: "read a book // 读书",
  color: "What color is it? // 它是什么颜色？",
  breakfast: "have breakfast // 吃早餐",
  lunch: "have lunch // 吃午餐",
  dinner: "have dinner // 吃晚餐",
  happy: "feel happy // 感到开心",
  sport: "play sports // 做运动",
  vegetable: "green vegetables // 绿色蔬菜",
  fruit: "fresh fruit // 新鲜水果",
  water: "drinking water // 饮用水",
  name: "first name // 名字",
  morning: "in the morning // 在早上",
  sing: "sing a song // 唱歌",
  dance: "dance to music // 随乐起舞",
  swim: "swim in the pool // 在泳池游泳",
  draw: "draw a picture // 画画",
  club: "join the club // 加入俱乐部",
  tell: "tell a story // 讲故事",
  brush: "brush teeth // 刷牙",
  shower: "take a shower // 洗淋浴",
  work: "go to work // 去上班",
  night: "at night // 在夜里",
  train: "take the train // 坐火车",
  bike: "ride a bike // 骑自行车",
  minute: "in ten minutes // 十分钟后",
  rule: "follow the rules // 遵守规则",
  arrive: "arrive at school // 到校",
  listen: "listen to music // 听音乐",
  wear: "wear a hat // 戴帽子",
  important: "important exam // 重要考试",
  quiet: "keep quiet // 保持安静",
  smart: "smart phone // 智能手机",
  beautiful: "beautiful flowers // 美丽的花",
  pet: "pet dog // 宠物狗",
  elephant: "African elephant // 非洲象",
  weather: "weather forecast // 天气预报",
  sunny: "a sunny day // 晴天",
  cold: "catch a cold // 感冒",
  hot: "hot water // 热水",
  park: "in the park // 在公园",
  message: "leave a message // 留言",
  bank: "bank account // 银行账户",
  hospital: "go to hospital // 去医院",
  street: "across the street // 过街",
  near: "near the school // 在学校附近",
  restaurant: "Italian restaurant // 意式餐馆",
  order: "take orders // 点餐",
  noodle: "beef noodles // 牛肉面",
  special: "special offer // 特价",
  surprise: "a big surprise // 大惊喜",
  language: "body language // 肢体语言",
  museum: "science museum // 科学博物馆",
  tired: "feel tired // 感到疲倦",
  jump: "jump rope // 跳绳",
  wonderful: "wonderful trip // 精彩的旅行",
  decide: "decide to go // 决定去",
  activity: "outdoor activity // 户外活动",
  bored: "feel bored // 感到无聊",
  magazine: "fashion magazine // 时尚杂志",
  program: "TV program // 电视节目",
  different: "different opinions // 不同意见",
  similar: "similar hobbies // 相似的爱好",
  reach: "reach the top // 到达顶部",
  laugh: "laugh out loud // 大笑",
  comfortable: "comfortable shoes // 舒适的鞋",
  screen: "big screen // 大屏幕",
  ticket: "movie ticket // 电影票",
  choose: "choose carefully // 仔细挑选",
  talent: "talent show // 才艺秀",
  winner: "contest winner // 比赛冠军",
  hope: "hope for the best // 抱最好期望",
  expect: "expect to win // 期待获胜",
  comedy: "comedy film // 喜剧片",
  cartoon: "cartoon character // 卡通角色",
  doctor: "see a doctor // 看医生",
  scientist: "computer scientist // 计算机科学家",
  education: "higher education // 高等教育",
  university: "go to university // 上大学",
  foreign: "foreign language // 外语",
  robot: "service robot // 服务机器人",
  pollution: "air pollution // 空气污染",
  environment: "protect the environment // 保护环境",
  planet: "save the planet // 拯救地球",
  peace: "world peace // 世界和平",
  space: "space station // 空间站",
  human: "human beings // 人类",
  peel: "peel the banana // 剥香蕉皮",
  pour: "pour the milk // 倒牛奶",
  finally: "finally succeed // 最终成功",
  prepare: "prepare for the exam // 备考",
  invitation: "party invitation // 聚会邀请",
  concert: "pop concert // 流行演唱会",
  accept: "accept the invitation // 接受邀请",
  refuse: "refuse politely // 礼貌拒绝",
  advice: "useful advice // 有用的建议",
  organize: "organize a meeting // 组织会议",
  expert: "computer expert // 电脑专家",
  normal: "normal temperature // 正常体温",
  upset: "feel upset // 感到沮丧",
  matter: "no matter what // 无论如何",
  stomach: "stomach ache // 胃痛",
  fever: "have a fever // 发烧",
  headache: "have a headache // 头痛",
  rest: "have a rest // 休息一下",
  dentist: "see the dentist // 看牙医",
  breathe: "breathe deeply // 深呼吸",
  volunteer: "school volunteer // 学校志愿者",
  raise: "raise money // 筹钱",
  journey: "long journey // 长途旅行",
  blind: "blind people // 盲人",
  sweep: "sweep the floor // 扫地",
  fold: "fold the clothes // 叠衣服",
  borrow: "borrow a book // 借书",
  lend: "lend a hand // 搭把手",
  waste: "waste time // 浪费时间",
  allow: "allow photos // 允许拍照",
  argue: "argue about money // 为钱争吵",
  nervous: "feel nervous // 感到紧张",
  proper: "proper way // 恰当方式",
  relation: "family relation // 家庭关系",
  communication: "good communication // 良好沟通",
  alarm: "alarm clock // 闹钟",
  begin: "begin to learn // 开始学习",
  suddenly: "stop suddenly // 突然停下",
  report: "news report // 新闻报道",
  window: "open the window // 开窗",
  brave: "brave girl // 勇敢的女孩",
  remind: "friendly reminder // 友情提醒",
  voice: "sweet voice // 甜美的声音",
  stick: "walking stick // 拐杖",
  magic: "magic trick // 魔术",
  deep: "deep sea // 深海",
  desert: "Sahara desert // 撒哈拉沙漠",
  include: "breakfast included // 含早餐",
  achievement: "great achievement // 巨大成就",
  risk: "take a risk // 冒险",
  treasure: "treasure map // 藏宝图",
  island: "small island // 小岛",
  classic: "classic novel // 经典小说",
  page: "page one // 第一页",
  hurry: "hurry up // 快点",
  ship: "cargo ship // 货船",
  tool: "useful tool // 有用工具",
  novel: "write a novel // 写小说",
  introduce: "introduce a friend // 介绍朋友",
  camera: "digital camera // 数码相机",
  progress: "make progress // 取得进步",
  rapid: "rapid growth // 快速增长",
  encourage: "encourage creativity // 鼓励创造力",
  social: "social media // 社交媒体",
  memory: "good memory // 好记性",
  century: "last century // 上世纪",
  check: "check the answer // 核对答案",
  own: "own room // 自己的房间",
  clear: "clear water // 清澈的水",
  sale: "on sale // 特价出售",
  sweet: "sweet smile // 甜蜜微笑",
  toy: "toy car // 玩具车",
  scarf: "woolen scarf // 羊毛围巾",
  textbook: "English textbook // 英语课本",
  aloud: "read aloud // 朗读",
  pronunciation: "clear pronunciation // 清晰发音",
  patient: "patient teacher // 耐心的老师",
  discover: "discover the truth // 发现真相",
  secret: "keep a secret // 保守秘密",
  grammar: "grammar rules // 语法规则",
  mooncake: "sweet mooncake // 甜月饼",
  lantern: "red lantern // 红灯笼",
  admire: "admire the moon // 赏月",
  treat: "sweet treat // 甜食款待",
  suggest: "suggest a plan // 提议计划",
  stamp: "collect stamps // 集邮",
  humorous: "humorous story // 幽默故事",
  silent: "silent reading // 默读",
  helpful: "helpful friend // 乐于助人的朋友",
  score: "high score // 高分",
  background: "cultural background // 文化背景",
  interview: "job interview // 求职面试",
  dare: "dare to dream // 敢于梦想",
  require: "skills required // 需要技能",
  private: "private lesson // 私人课程",
  produce: "farm produce // 农产品",
  widely: "widely used // 广泛使用",
  electricity: "save electricity // 节约用电",
  style: "learning style // 学习风格",
  project: "school project // 学校课题",
  daily: "daily life // 日常生活",
  mention: "briefly mention // 简要提到",
  boil: "boil water // 烧水",
  smell: "smell the flowers // 闻花香",
  hug: "give a hug // 给个拥抱",
  lift: "lift the box // 抬箱子",
  regret: "no regrets // 无怨无悔",
  poem: "write a poem // 写诗",
  community: "local community // 当地社区",
  choice: "make a choice // 做选择",
  valuable: "valuable experience // 宝贵经验",
  picnic: "have a picnic // 野餐",
  attend: "attend a meeting // 参加会议",
  sleepy: "feel sleepy // 犯困",
  noise: "loud noise // 巨大噪音",
  prefer: "prefer reading // 更喜欢阅读",
  director: "film director // 电影导演",
  documentary: "nature documentary // 自然纪录片",
  greet: "greet warmly // 热情问候",
  value: "good value // 高性价比",
  capital: "capital city // 首都",
  passport: "valid passport // 有效护照",
  behave: "behave well // 表现良好",
  customs: "local customs // 当地习俗",
  basic: "basic skills // 基本技能",
  friendship: "true friendship // 真正的友谊",
  palace: "Summer Palace // 颐和园",
  fame: "road to fame // 成名之路",
  wealth: "wealth of knowledge // 知识财富",
  examine: "examine carefully // 仔细检查",
  shoulder: "shoulder to shoulder // 肩并肩",
  unexpected: "unexpected gift // 意外礼物",
  backpack: "heavy backpack // 沉重书包",
  airport: "at the airport // 在机场",
  burn: "burn calories // 燃烧卡路里",
  alive: "come alive // 活跃起来",
  cancel: "cancel the meeting // 取消会议",
  announce: "announce the result // 宣布结果",
  shark: "great white shark // 大白鲨",
  harmful: "harmful to health // 有害健康",
  chain: "food chain // 食物链",
  ecosystem: "ocean ecosystem // 海洋生态",
  industry: "film industry // 电影业",
  law: "traffic law // 交通法",
  scientific: "scientific method // 科学方法",
  afford: "afford a trip // 负担得起旅行",
  reusable: "reusable bag // 环保袋",
  survey: "do a survey // 做调查",
  standard: "high standard // 高标准",
  double: "double room // 双人间",
  overcome: "overcome difficulties // 克服困难",
  congratulate: "congratulations! // 祝贺！",
  thankful: "feel thankful // 心怀感激",
  separate: "keep separate // 分开存放",
  teenage: "teenage life // 青春生活",
  debate: "class debate // 班级辩论",
  recommend: "recommend a book // 推荐一本书",
  content: "main content // 主要内容",
  movement: "body movement // 身体动作",
  greenhouse: "greenhouse effect // 温室效应",
  suitable: "suitable time // 合适时间",
  graduate: "graduate in June // 六月毕业",
  advanced: "advanced level // 高级水平",
  apply: "apply for a job // 求职",
  amazing: "amazing view // 绝美风景",
  arrange: "arrange a trip // 安排旅行",
  narrow: "narrow street // 狭窄街道",
  powerful: "powerful engine // 强劲引擎",
  empire: "ancient empire // 古帝国",
  source: "energy source // 能源来源",
  flat: "flat land // 平地",
  accommodation: "hotel accommodation // 住宿",
  unique: "unique style // 独特风格",
  path: "garden path // 小径",
  fitness: "physical fitness // 体质",
  stadium: "sports stadium // 体育场",
  honor: "great honor // 荣幸",
  glory: "road to glory // 荣耀之路",
  medal: "gold medal // 金牌",
  champion: "world champion // 世界冠军",
  athlete: "professional athlete // 职业运动员",
  pretend: "just pretend // 只是假装",
  disaster: "natural disaster // 自然灾害",
  tornado: "tornado warning // 龙卷风预警",
  drought: "severe drought // 严重干旱",
  flood: "flash flood // 山洪",
  ruin: "in ruins // 成废墟",
  shock: "culture shock // 文化冲击",
  rescue: "rescue team // 救援队",
  trap: "set a trap // 设陷阱",
  attitude: "positive attitude // 积极态度",
  refer: "refer to notes // 参考笔记",
  system: "solar system // 太阳系",
  despite: "despite difficulties // 尽管困难",
  equal: "equal chance // 平等机会",
  demand: "high demand // 高需求",
  vocabulary: "English vocabulary // 英语词汇",
  accent: "British accent // 英式口音",
  native: "native speaker // 母语者",
  global: "global warming // 全球变暖",
  heritage: "cultural heritage // 文化遗产",
  creative: "creative ideas // 创意",
  preserve: "preserve food // 保存食物",
  promote: "promote culture // 推广文化",
  application: "job application // 求职申请",
  balance: "keep balance // 保持平衡",
  tradition: "family tradition // 家庭传统",
  ancient: "ancient city // 古城",
  donate: "donate books // 捐书",
  disappear: "disappear quickly // 迅速消失",
  professional: "professional player // 职业选手",
  illegal: "illegal parking // 违章停车",
  hunt: "hunt for food // 猎食",
  immediately: "leave immediately // 立即离开",
  species: "endangered species // 濒危物种",
  rate: "success rate // 成功率",
  extinction: "face extinction // 濒临灭绝",
  habitat: "natural habitat // 自然栖息地",
  reserve: "nature reserve // 自然保护区",
  aware: "aware of danger // 意识到危险",
  remove: "remove dirt // 清除污垢",
  blog: "write a blog // 写博客",
  engine: "search engine // 搜索引擎",
  chat: "chat online // 网上聊天",
  stream: "live stream // 直播",
  identity: "identity card // 身份证",
  convenient: "convenient way // 便捷方式",
  cash: "pay in cash // 现金支付",
  update: "software update // 软件更新",
  database: "database search // 数据库检索",
  software: "free software // 免费软件",
  privacy: "personal privacy // 个人隐私",
  target: "sales target // 销售目标",
  kingdom: "animal kingdom // 动物王国",
  belong: "belong to nature // 属于自然",
  puzzle: "jigsaw puzzle // 拼图",
  military: "military museum // 军事博物馆",
  surround: "surround the garden // 环绕花园",
  defense: "self defense // 自卫",
  legal: "legal age // 法定年龄",
  battle: "fierce battle // 激战",
  port: "fishing port // 渔港",
  location: "current location // 当前位置",
  classical: "classical music // 古典音乐",
  compose: "compose a poem // 作诗",
  opportunity: "job opportunity // 工作机会",
  performer: "street performer // 街头艺人",
  piano: "play the piano // 弹钢琴",
  ordinary: "ordinary day // 平凡一天",
  enable: "enable communication // 使沟通成为可能",
  prove: "prove a point // 证明观点",
  award: "award ceremony // 颁奖礼",
  conductor: "orchestra conductor // 乐队指挥",
  original: "original idea // 原创想法",
  festival: "Spring Festival // 春节",
  celebration: "birthday celebration // 生日庆典",
  harvest: "autumn harvest // 秋收",
  origin: "word origin // 词源",
  religious: "religious art // 宗教艺术",
  figure: "historical figure // 历史人物",
  typical: "typical example // 典型例子",
  commercial: "commercial area // 商业区",
  belief: "firm belief // 坚定信念",
  occasion: "special occasion // 特殊场合",
  moral: "moral story // 道德故事",
  virtue: "traditional virtue // 传统美德",
  dilemma: "moral dilemma // 道德困境",
  precious: "precious time // 宝贵时间",
  complain: "complain about weather // 抱怨天气",
  tuition: "tuition fee // 学费",
  scholarship: "win a scholarship // 获奖学金",
  physician: "family physician // 家庭医生",
  hire: "hire workers // 雇工",
  reject: "reject an idea // 拒绝想法",
  appointment: "make an appointment // 预约",
  diverse: "diverse opinions // 多样观点",
  fortune: "fortune cookie // 幸运饼干",
  snack: "healthy snack // 健康零食",
  dairy: "dairy products // 乳制品",
  construction: "under construction // 施工中",
  historical: "historical site // 历史遗迹",
  immigration: "immigration office // 移民局",
  seek: "seek help // 寻求帮助",
  earn: "earn money // 赚钱",
  occur: "occur naturally // 自然发生",
  climate: "climate change // 气候变化",
  mission: "space mission // 太空任务",
  astronomy: "study astronomy // 学天文",
  universe: "explore the universe // 探索宇宙",
  satellite: "weather satellite // 气象卫星",
  launch: "rocket launch // 火箭发射",
  orbit: "enter orbit // 进入轨道",
  signal: "weak signal // 弱信号",
  resource: "water resource // 水资源",
  shallow: "shallow water // 浅水",
  mystery: "great mystery // 巨大谜团",
  frontier: "new frontier // 新疆域",
  vehicle: "electric vehicle // 电动车",
  base: "solid base // 坚实基础",
  tone: "polite tone // 礼貌语气",
  spot: "tourist spot // 景点",
  permit: "work permit // 工作许可证",
  patience: "with patience // 耐心",
  grateful: "grateful for help // 感激帮助",
  limit: "speed limit // 限速",
  serve: "serve customers // 服务顾客",
  scene: "beautiful scene // 美景",
  narrator: "first-person narrator // 第一人称叙述者",
  crucial: "crucial moment // 关键时刻",
  vital: "vital role // 关键作用",
  objective: "learning objective // 学习目标",
  obtain: "obtain information // 获取信息",
  acknowledge: "acknowledge mistakes // 承认错误",
  analysis: "data analysis // 数据分析",
  apparent: "apparent difference // 明显差异",
  commit: "commit to memory // 牢记",
  distinct: "distinct style // 鲜明风格",
  genius: "creative genius // 创作天才",
  patent: "patent application // 专利申请",
  predict: "predict the future // 预测未来",
  innovation: "tech innovation // 科技创新",
  encounter: "encounter challenges // 遇到挑战",
  oppose: "strongly oppose // 强烈反对",
  automatic: "automatic door // 自动门",
  relevant: "relevant experience // 相关经验",
  efficient: "efficient method // 高效方法",
  emphasis: "emphasis on quality // 重视质量",
  prospect: "future prospects // 前景",
  fundamental: "fundamental change // 根本变化",
  breathtaking: "breathtaking view // 惊艳景色",
  valley: "Silicon Valley // 硅谷",
  vast: "vast ocean // 广阔海洋",
  meadow: "green meadow // 绿草地",
  boundary: "boundary line // 边界线",
  ban: "ban plastic bags // 禁塑",
  visible: "clearly visible // 清晰可见",
  extraordinary: "extraordinary talent // 非凡天赋",
  landscape: "natural landscape // 自然景观",
  territory: "vast territory // 辽阔领土",
  gesture: "hand gesture // 手势",
  facial: "facial expression // 面部表情",
  interaction: "social interaction // 社交互动",
  appropriate: "appropriate time // 合适时机",
  occupy: "occupy time // 占用时间",
  reveal: "reveal the truth // 揭示真相",
  internal: "internal error // 内部错误",
  assess: "assess progress // 评估进步",
  obstacle: "obstacle course // 障碍赛道",
  barrier: "language barrier // 语言障碍",
  agriculture: "modern agriculture // 现代农业",
  crop: "grow crops // 种庄稼",
  yield: "crop yield // 产量",
  nutrition: "nutrition label // 营养标签",
  organic: "organic food // 有机食品",
  fertilizer: "organic fertilizer // 有机肥",
  irrigation: "irrigation system // 灌溉系统",
  cultivate: "cultivate habits // 培养习惯",
  abundance: "abundance of food // 食物丰富",
  boost: "boost confidence // 提升信心",
};
const DUE = [0, 20 * 6e4, 12 * 36e5, 864e5, 2 * 864e5, 4 * 864e5];

/* ================= 存档 ================= */
function def() {
  return {
    coins: 60,
    xp: 0,
    theme: "board",
    themes: ["board"],
    items: { hint: 1, time: 0, shield: 0 },
    curBook: "j1",
    prog: {},
    mastery: {},
    ach: {},
    stats: {
      games: 0,
      words: 0,
      bestCombo: 0,
      perfect: 0,
      hardWin: 0,
      wins: 0,
      memPerfect: 0,
      unitsCleared: 0,
      p2pWins: 0,
      p2pLosses: 0,
      roomRounds: 0,
      roomWins: 0,
    },
    set: { sound: true, tts: true, osk: "auto", wordOrder: "random" },
    profile: {
      name: "",
      gender: "保密",
      avatar: "🧑",
      mood: "",
      moodEmoji: "😀",
    },
    daily: {},
    dyn: {}, // 扩展词库每日精练设置：{ [id]: { daily, order, pos } }
  };
}
let S;
try {
  S = Object.assign(def(), JSON.parse(localStorage.getItem(K) || "{}"));
  S.items = Object.assign({ hint: 1, time: 0, shield: 0 }, S.items);
  S.stats = Object.assign(def().stats, S.stats);
  S.set = Object.assign(
    { sound: true, tts: true, osk: "auto", wordOrder: "random" },
    S.set
  );
  S.profile = Object.assign(
    { name: "", gender: "保密", avatar: "🧑", mood: "", moodEmoji: "😀" },
    S.profile
  );
  if (!S.daily) S.daily = {};
  if (!S.dyn || typeof S.dyn !== "object") S.dyn = {};
} catch (e) {
  S = def();
}
const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {}
};
const mOf = (en) =>
  S.mastery[en.toLowerCase()] ||
  (S.mastery[en.toLowerCase()] = {
    lv: 0,
    r: 0,
    w: 0,
    due: 0,
    reps: 0, // 连续答对次数（答错归零）
    lapses: 0, // 遗忘重学次数
    iv: 0, // 当前复习间隔（天）
    ef: 2.5, // SM-2 难度系数（1.3-2.8，越低越难）
    first: 0, // 首次学习时间
    last: 0, // 最近答题时间
    rt: 0, // 平均反应时长（毫秒）
  });

/* ================= SRS 间隔重复调度（SM-2 改进版，贴合遗忘曲线） =================
 * 间隔阶梯：新词当天 10 分钟学习步 → 次日 → 2 天 → iv×ef（约 5/13/33/83 天）→ 最长 180 天；
 * 答错进入 10 分钟重学步且难度系数下调；永久词（iv≥60 天）到期仍低频维护复习。 */
const SRS_DAY = 86400000,
  SRS_STUDY_STEP = 10 * 60000, // 新词/重学词的当天学习步
  SRS_MAX_IV = 180; // 最长间隔（天）
// 答题质量 q(1-5)：未拼出=1（遗忘）；拼对则按错键数与反应速度评定
function srsQ(ok, errs, rtMs, len) {
  if (!ok) return 1;
  let q = errs === 0 ? 5 : errs === 1 ? 3 : 2;
  if (rtMs > 0 && len) {
    const budget = 1200 + len * 500; // 速度阈值：1.2s + 0.5s/字母
    if (q === 5 && rtMs > budget * 1.6) q = 4; // 零错但过慢不给满分
  }
  return q;
}
// 由调度状态派生界面等级（0-5 六档，与 LVN 对齐）
function srsLv(m) {
  if (!m.r) return 0;
  if (!m.reps) return 1; // 重学中
  if (m.iv < 4) return 2;
  if (m.iv < 15) return 3;
  if (m.iv < 60) return 4;
  return 5;
}
// 核心调度：ok 是否拼对、errs 错键数、rtMs 反应时长（毫秒，0=未知）
function srsGrade(it, ok, errs, rtMs) {
  const m = mOf(it.en),
    now = Date.now(),
    q = srsQ(ok, errs, rtMs, it.en.length);
  if (!m.first) m.first = now;
  m.last = now;
  if (ok) {
    m.r++;
    if (rtMs > 0)
      m.rt = m.rt ? Math.round(m.rt * 0.7 + rtMs * 0.3) : rtMs;
    if (q >= 3) {
      m.reps++;
      if (m.reps === 1) {
        m.iv = 1;
        m.due = now + SRS_STUDY_STEP; // 新词当天 10 分钟再现
      } else if (m.reps === 2) {
        m.iv = 1;
        m.due = now + SRS_DAY; // 学习步通过 → 次日复习
      } else {
        m.iv = m.reps === 3 ? 2 : Math.max(2, Math.round(m.iv * m.ef));
        m.iv = Math.min(m.iv, SRS_MAX_IV);
        m.due = now + m.iv * SRS_DAY;
      }
      m.ef = clamp(
        m.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
        1.3,
        2.8
      );
    } else {
      m.w++; // 拼对但错键多：不进阶，当天再现
      m.due = now + SRS_STUDY_STEP;
    }
  } else {
    m.w++;
    m.lapses++;
    m.reps = 0;
    m.iv = 0;
    m.ef = Math.max(1.3, m.ef - 0.2);
    m.due = now + SRS_STUDY_STEP; // 重学步
  }
  m.lv = srsLv(m);
  if (m.lv === 5) S.stats.maxed = 1;
  save();
  return m;
}
function markWord(it, ok, errs, rtMs) {
  return srsGrade(it, ok, errs || 0, rtMs || 0);
}
// 选词优先级：逾期越久、遗忘次数越多、处于重学步的词越优先
function srsPriority(m, now) {
  now = now || Date.now();
  const overdue = Math.max(0, (now - m.due) / SRS_DAY);
  return overdue * 2 + (m.lapses || 0) * 1.5 + (m.reps === 0 ? 3 : 0);
}
// 交错排列：两组词交替穿插（组内保持原顺序）
function srsInterleave(a, b) {
  const out = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length) out.push(a[i++]);
    if (j < b.length) out.push(b[j++]);
  }
  return out;
}
// 每日练习队列：复习词优先（逾期排序，上限约 70%）+ 新学词补足剩余名额，交错排列；
// freshPick(need) 由调用方按词书顺序/随机提供新学词；复习词不足时新词自动填满，
// 新词不足（词书临近学完）时复习词自动补满，保证批次总量尽量达到 daily
function srsDailyQueue(items, daily, freshPick) {
  const now = Date.now(),
    n = Math.min(daily, items.length);
  const due = items
    .map((it) => ({ it, m: S.mastery[it.en.toLowerCase()] }))
    .filter((x) => x.m && x.m.r > 0 && x.m.due <= now)
    .sort((a, b) => srsPriority(b.m, now) - srsPriority(a.m, now))
    .map((x) => x.it);
  const reviewCap = Math.round(n * 0.7),
    reviewCount = Math.min(due.length, reviewCap);
  const fresh = freshPick(n - reviewCount);
  const review = due.slice(0, n - fresh.length);
  return srsInterleave(review, fresh);
}
// 游戏挑战加权抽词：50% 逾期/重学词 · 30% 近期新词 · 20% 已掌握维护词；配额不足逐级回填
function weightedPool(items, limit) {
  const now = Date.now(),
    due = [],
    recent = [],
    mast = [],
    never = [];
  for (const it of items) {
    const m = S.mastery[it.en.toLowerCase()];
    if (!m || !m.r) never.push(it);
    else if (m.due <= now) due.push(it);
    else if ((m.reps || 0) <= 2 || (m.iv || 0) < 4) recent.push(it);
    else mast.push(it);
  }
  const n = Math.min(limit || 40, items.length),
    nDue = Math.round(n * 0.5),
    nRecent = Math.round(n * 0.3);
  const take = (arr, k) => shuffle(arr).slice(0, k);
  let out = [
    ...take(due, nDue),
    ...take(recent, nRecent),
    ...take(mast, n - nDue - nRecent),
  ];
  if (out.length < n) {
    const used = new Set(out.map((x) => x.en.toLowerCase()));
    const fill = shuffle(
      [...recent, ...never, ...due, ...mast].filter(
        (it) => !used.has(it.en.toLowerCase())
      )
    );
    out = out.concat(fill.slice(0, n - out.length));
  }
  return shuffle(out);
}
const dueWords = () =>
  ALL.filter((w) => {
    const m = S.mastery[w.en.toLowerCase()];
    return m && m.r > 0 && m.due <= Date.now(); // 含永久词的长期间隔维护复习
  }).sort(
    (a, b) =>
      srsPriority(S.mastery[b.en.toLowerCase()]) -
      srsPriority(S.mastery[a.en.toLowerCase()])
  );
const wrongWords = () =>
  ALL.filter((w) => {
    const m = S.mastery[w.en.toLowerCase()];
    return m && m.w > 0 && m.lv < 4 && m.due <= Date.now(); // 升入「掌握」即毕业出错词本
  }).sort(
    (a, b) =>
      srsPriority(S.mastery[b.en.toLowerCase()]) -
      srsPriority(S.mastery[a.en.toLowerCase()])
  );

// SRS 字段迁移：旧存档 mastery 仅有 lv/r/w/due，补全 reps/lapses/iv/ef/first/last/rt（零进度丢失）
(function migrateMastery() {
  for (const k in S.mastery) {
    const m = S.mastery[k];
    if (typeof m.reps === "number") continue;
    m.ef = 2.5;
    m.lapses = 0;
    m.rt = 0;
    m.iv = (DUE[m.lv] || 0) / SRS_DAY; // 旧 lv 映射为间隔天数
    m.reps = m.lv; // 旧 lv ≈ 连续答对次数
    m.first = m.due ? m.due - (DUE[m.lv] || 0) : 0;
    m.last = m.first;
  }
})();
function lvl(xp) {
  let lv = 1,
    need = 100,
    r = xp;
  while (r >= need) {
    r -= need;
    lv++;
    need = 100 + (lv - 1) * 50;
  }
  return { lv, into: r, need };
}
const TITLES = [
  [1, "单词新手"],
  [3, "词汇学徒"],
  [5, "记忆新秀"],
  [8, "单词猎人"],
  [12, "词汇学者"],
  [16, "记忆大师"],
  [20, "单词宗师"],
  [26, "词典守望者"],
  [32, "九册通神"],
];
const titleOf = (l) => {
  let t = TITLES[0][1];
  for (const [a, b] of TITLES) if (l >= a) t = b;
  return t;
};

/* ================= 每日统计（按日期聚合，含学习/挑战/对战维度） ================= */
const DAILY_FIELDS = [
  "words", "correct", "errors", "score", "games",
  "ch", // 挑战局数（限时/陨石/记忆/竞技场）
  "mTime", "mFall", "mMem", "mBattle", // 各挑战模式局数
  "duel", "duelW", "duelL", // 单挑：场次/胜/负
  "room", "roomWin", // 乱斗：轮次/第一名次数
];
const dayKey = (d) => d.toISOString().slice(0, 10);
/* 取某日记录（自动补齐旧记录缺失字段 = 结构迁移） */
function dailyRec(key) {
  if (!S.daily || typeof S.daily !== "object") S.daily = {};
  if (!S.daily[key]) S.daily[key] = {};
  const d = S.daily[key];
  for (const k of DAILY_FIELDS) if (typeof d[k] !== "number") d[k] = 0;
  return d;
}
/* 裁剪过久的历史（保留最近 400 天），避免 localStorage 膨胀 */
function pruneDaily() {
  const keys = Object.keys(S.daily).sort();
  if (keys.length <= 400) return;
  for (const k of keys.slice(0, keys.length - 400)) delete S.daily[k];
}
/* kind: run(闯关/复习/每日精练) | time | fall | memory | battle | duel | room */
function updateDailyStats(correct, errors, score, kind, win) {
  const d = dailyRec(dayKey(new Date()));
  d.words += correct;
  d.correct += correct;
  d.errors += errors;
  d.score += score || 0;
  d.games += 1;
  if (kind === "time") d.mTime++;
  else if (kind === "fall") d.mFall++;
  else if (kind === "memory") d.mMem++;
  else if (kind === "battle") d.mBattle++;
  if (kind === "time" || kind === "fall" || kind === "memory" || kind === "battle") d.ch++;
  if (kind === "duel") {
    d.duel++;
    if (win) d.duelW++;
    else d.duelL++;
  }
  if (kind === "room") {
    d.room++;
    if (win) d.roomWin++;
  }
  pruneDaily();
  save();
}
/* 连续学习天数（今天还没学则从昨天往前数，不中断连胜） */
function learnStreak() {
  let streak = 0;
  const d = new Date();
  if (!(S.daily[dayKey(d)] && S.daily[dayKey(d)].words > 0)) d.setDate(d.getDate() - 1);
  while (S.daily[dayKey(d)] && S.daily[dayKey(d)].words > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
/* 取最近 n 天的每日记录（n=0 表示全部），按日期升序，缺省补零 */
function dailyRange(n) {
  const out = [];
  const today = new Date();
  if (n > 0) {
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      out.push({ date: k, rec: S.daily[k] || null });
    }
    return out;
  }
  const keys = Object.keys(S.daily).sort();
  return keys.slice(-150).map((k) => ({ date: k, rec: S.daily[k] }));
}
/* 区间汇总 */
function sumRange(rows) {
  const s = {};
  for (const k of DAILY_FIELDS) s[k] = 0;
  let active = 0;
  for (const { rec } of rows) {
    if (!rec) continue;
    for (const k of DAILY_FIELDS) s[k] += typeof rec[k] === "number" ? rec[k] : 0;
    if (rec.words > 0) active++;
  }
  s.active = active;
  s.acc = s.correct + s.errors ? Math.round((s.correct / (s.correct + s.errors)) * 100) : 0;
  return s;
}
/* 单词掌握分布：按熟练度 0~5 统计（含未学习词） */
function masteryDist() {
  const lv = [0, 0, 0, 0, 0, 0];
  let learned = 0,
    touched = 0;
  for (const m of Object.values(S.mastery)) {
    const l = Math.max(0, Math.min(5, m.lv | 0));
    lv[l]++;
    touched++;
    if (m.r > 0) learned++;
  }
  const mastered = lv[5];
  return { lv, learned, mastered, touched };
}
/* SRS 强度分布：间隔分布、EF 分布、未来到期预测 */
function srsDist() {
  const ivBuckets = [0, 0, 0, 0, 0, 0, 0, 0]; // 0天/1-3/4-7/8-14/15-30/31-60/61-180/180+
  const ivLabels = ["0d", "1-3", "4-7", "8-14", "15-30", "31-60", "61-180", "180+"];
  const efBuckets = [0, 0, 0, 0, 0, 0]; // 1.3-1.5/1.5-1.8/1.8-2.1/2.1-2.4/2.4-2.6/2.6-2.8
  const efLabels = ["1.3-", "1.5-", "1.8-", "2.1-", "2.4-", "2.6-2.8"];
  const now = Date.now();
  let learned = 0;
  for (const m of Object.values(S.mastery)) {
    if (!m.r) continue;
    learned++;
    const iv = m.iv || 0;
    if (iv <= 0) ivBuckets[0]++;
    else if (iv <= 3) ivBuckets[1]++;
    else if (iv <= 7) ivBuckets[2]++;
    else if (iv <= 14) ivBuckets[3]++;
    else if (iv <= 30) ivBuckets[4]++;
    else if (iv <= 60) ivBuckets[5]++;
    else if (iv <= 180) ivBuckets[6]++;
    else ivBuckets[7]++;
    const ef = m.ef || 2.5;
    if (ef < 1.5) efBuckets[0]++;
    else if (ef < 1.8) efBuckets[1]++;
    else if (ef < 2.1) efBuckets[2]++;
    else if (ef < 2.4) efBuckets[3]++;
    else if (ef < 2.6) efBuckets[4]++;
    else efBuckets[5]++;
  }
  // 未来到期预测（累计）：1/3/7/14/30 天后到期的词数
  const forecastDays = [1, 3, 7, 14, 30];
  const forecast = forecastDays.map((d) => 0);
  for (const m of Object.values(S.mastery)) {
    if (!m.r) continue;
    const daysToDue = Math.max(0, Math.ceil((m.due - now) / SRS_DAY));
    for (let i = 0; i < forecastDays.length; i++) {
      if (daysToDue <= forecastDays[i]) forecast[i]++;
    }
  }
  return { ivBuckets, ivLabels, efBuckets, efLabels, forecast, forecastDays, learned };
}

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

/* ================= 音效 / 朗读（修复移动端TTS） ================= */
let AC;
function ac() {
  return AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
}
function beep(f, d = 0.07, t = "square", g = 0.045) {
  if (!S.set.sound) return;
  try {
    const a = ac(),
      o = a.createOscillator(),
      v = a.createGain();
    o.type = t;
    o.frequency.value = f;
    v.gain.value = g;
    v.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d);
    o.connect(v).connect(a.destination);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) {}
}
const sTick = () => beep(760, 0.03, "square", 0.02),
  sOk = () => {
    beep(660, 0.08);
    setTimeout(() => beep(880, 0.1), 60);
  },
  sBad = () => beep(130, 0.16, "sawtooth", 0.06),
  sWin = () =>
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => beep(f, 0.14, "triangle", 0.06), i * 110)
    ),
  sShield = () => beep(420, 0.12, "triangle", 0.06);

function speak(t) {
  if (!S.set.tts) return;
  try {
    if (AC && AC.state === "suspended") AC.resume().catch(() => {});
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US";
    u.rate = 0.92;
    u.pitch = 1.0;
    u.volume = 1.0;
    const voices = speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (voice) u.voice = voice;
    u.onerror = (e) => {
      console.warn("TTS error:", e);
    };
    speechSynthesis.speak(u);
  } catch (e) {
    console.warn("speak exception:", e);
  }
}

/* ================= 头部 / 屏幕 / 屏幕键盘 ================= */
function refreshHead() {
  const l = lvl(S.xp);
  $("#coinN").textContent = S.coins;
  $("#lvBadge").textContent = "LV " + l.lv;
  $("#lvName").textContent = titleOf(l.lv);
  $("#xpBar").style.width = (l.into / l.need) * 100 + "%";
  $("#btnSound").classList.toggle("off", !S.set.sound);
  $("#btnTts").classList.toggle("off", !S.set.tts);
  $("#btnOsk").classList.toggle("off", (S.set.osk || "auto") === "off");
  $("#btnSound").textContent = S.set.sound ? "🔔" : "🔕";
  $("#btnTts").textContent = S.set.tts ? "🔊" : "🔇";
  // 顶部用户卡片：头像 + 用户名
  const pf = S.profile || {};
  const ua = $("#userAvatar");
  const un = $("#userName");
  if (ua) ua.textContent = pf.avatar || "🧑";
  if (un) {
    const nm = (pf.name || "").trim();
    un.textContent = nm ? (nm.length > 6 ? nm.slice(0, 6) + "…" : nm) : "未命名";
  }
  // 主页心情栏（仅主页存在该节点）
  const moodEl = $("#userMood");
  if (moodEl) {
    const emoji = pf.moodEmoji || "😀";
    const txt = (pf.mood || "").trim();
    moodEl.innerHTML = txt
      ? `<span class="mood-emoji">${emoji}</span><span class="mood-text">${escHtml(txt)}</span>`
      : `<span class="mood-emoji">${emoji}</span><span class="mood-text" style="opacity:.5">点击设置一句话心情…</span>`;
  }
}
$("#btnSound").onclick = () => {
  S.set.sound = !S.set.sound;
  save();
  refreshHead();
};
$("#btnTts").onclick = () => {
  S.set.tts = !S.set.tts;
  save();
  refreshHead();
};
const isTouch = () =>
  matchMedia("(pointer:coarse)").matches || "ontouchstart" in window;
function oskShouldShow() {
  const m = S.set.osk || "auto";
  if (m === "on") return true;
  if (m === "off") return false;
  return isTouch() || innerWidth < 820;
}
function refreshOsk() {
  const el = $("#osk");
  const on =
    $("#scr-game").classList.contains("on") && G && G.active && oskShouldShow();
  el.classList.toggle("show", on);
}
$("#btnOsk").onclick = () => {
  const order = ["auto", "on", "off"],
    cur = S.set.osk || "auto",
    next = order[(order.indexOf(cur) + 1) % 3];
  S.set.osk = next;
  save();
  refreshOsk();
  refreshHead();
  toast(
    "🎹 屏幕键盘：" +
      { auto: "自动（触屏设备显示）", on: "强制开启", off: "关闭" }[next]
  );
};

function buildOsk() {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const pad = [0, 4, 10];
  let html = rows
    .map(
      (r, i) =>
        `<div class="osk-row" style="padding-left:${pad[i]}%;padding-right:${
          pad[i]
        }%">${[...r]
          .map((c) => `<button data-k="${c}">${c.toUpperCase()}</button>`)
          .join("")}</div>`
    )
    .join("");
  html += `<div class="osk-row" style="justify-content:center;padding:0 10%;">
    <button data-k=" " class="space" style="flex:1;max-width:60%;">␣ 空格</button>
  </div>`;
  $("#osk").innerHTML = html;
  $$("#osk button").forEach((b) => {
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      routeChar(b.dataset.k);
      b.classList.add("press");
      setTimeout(() => b.classList.remove("press"), 120);
    });
    b.addEventListener("contextmenu", (ev) => ev.preventDefault());
  });
}
addEventListener("resize", refreshOsk);
function go(id) {
  $$(".scr").forEach((s) => s.classList.remove("on"));
  $("#" + id).classList.add("on");
  window.scrollTo({ top: 0 });
  if (id === "scr-home") renderHome();
  if (id === "scr-book") renderBook();
  if (id === "scr-shop") renderShop();
  if (id === "scr-table") renderTable();
  if (id === "scr-stats") renderStats();
  refreshOsk();
}
function toast(t, sub) {
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = t + (sub ? `<small>${sub}</small>` : "");
  $("#toasts").appendChild(d);
  setTimeout(() => {
    d.style.transition = ".4s";
    d.style.opacity = 0;
    setTimeout(() => d.remove(), 400);
  }, 3200);
}
function burst(x, y, c) {
  for (let i = 0; i < 13; i++) {
    const s = document.createElement("span");
    s.className = "shard";
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.background = c;
    s.style.setProperty("--dx", rnd(-90, 90) + "px");
    s.style.setProperty("--dy", rnd(-110, 40) + "px");
    $("#fx").appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}
function floaty(x, y, txt, c) {
  const s = document.createElement("span");
  s.className = "floaty";
  s.textContent = txt;
  s.style.left = x + "px";
  s.style.top = y + "px";
  s.style.color = c;
  $("#fx").appendChild(s);
  setTimeout(() => s.remove(), 1000);
}
function coinBump() {
  const e = $("#hCoin");
  e.classList.remove("bump");
  void e.offsetWidth;
  e.classList.add("bump");
}

/* ================= 成就 ================= */
const ACH = [
  ["first", "初来乍到", "完成第一局游戏", (s) => s.stats.games >= 1],
  ["c10", "连击新星", "达成 10 连击", (s) => s.stats.bestCombo >= 10],
  ["c25", "心流状态", "达成 25 连击", (s) => s.stats.bestCombo >= 25],
  ["w100", "百词斩", "累计拼对 100 词", (s) => s.stats.words >= 100],
  ["w500", "词汇大亨", "累计拼对 500 词", (s) => s.stats.words >= 500],
  ["p3", "完美主义", "任意单元三星通关", (s) => s.stats.perfect >= 1],
  ["beat", "精英杀手", "对战击败精英机器人", (s) => s.stats.hardWin >= 1],
  ["rich", "小有积蓄", "持有 1000 金币", (s) => s.coins >= 1000],
  ["max", "永久记忆", "首个单词达到永久记忆", (s) => s.stats.maxed >= 1],
  ["win5", "常胜将军", "累计获胜 5 次", (s) => s.stats.wins >= 5],
  [
    "bloom",
    "花语者",
    "花瓣记忆累计完美拼写 10 词",
    (s) => s.stats.memPerfect >= 10,
  ],
  [
    "unit20",
    "单元猎人",
    "累计通关 20 个单元",
    (s) => s.stats.unitsCleared >= 20,
  ],
  ["p2p_win", "🌐 联机首胜", "赢得一场联机对战", (s) => s.stats.p2pWins >= 1],
  [
    "p2p_warrior",
    "🌐 联机勇士",
    "赢得 5 场联机对战",
    (s) => s.stats.p2pWins >= 5,
  ],
];

function checkAch() {
  for (const [id, n, d, f] of ACH) {
    if (!S.ach[id] && f(S)) {
      S.ach[id] = 1;
      S.coins += 30;
      save();
      toast("🏅 成就解锁：" + n, "奖励 30 金币 · " + d);
      coinBump();
    }
  }
}
function getAchProgress(id) {
  const map = {
    first: S.stats.games,
    c10: S.stats.bestCombo,
    c25: S.stats.bestCombo,
    w100: S.stats.words,
    w500: S.stats.words,
    p3: S.stats.perfect,
    beat: S.stats.hardWin,
    rich: S.coins,
    max: S.stats.maxed,
    win5: S.stats.wins,
    bloom: S.stats.memPerfect,
    unit20: S.stats.unitsCleared,
    p2p_win: S.stats.p2pWins,
    p2p_warrior: S.stats.p2pWins,
  };
  return map[id] || 0;
}
function getAchTarget(id) {
  const map = {
    first: 1,
    c10: 10,
    c25: 25,
    w100: 100,
    w500: 500,
    p3: 1,
    beat: 1,
    rich: 1000,
    max: 1,
    win5: 5,
    bloom: 10,
    unit20: 20,
    p2p_win: 1,
    p2p_warrior: 5,
  };
  return map[id] || 1;
}
function showAchievementModal() {
  const html = `<h3>🏆 成就榜</h3><div class="sub">每解锁一个成就奖励 30 金币</div><div style="display:grid;grid-template-columns:1fr;gap:8px;text-align:left;max-height:50vh;overflow-y:auto;padding:4px 0">${ACH.map(
    ([id, n, d]) => {
      const done = !!S.ach[id];
      const prog = getAchProgress(id),
        target = getAchTarget(id);
      const pct = Math.min(100, Math.round((prog / target) * 100));
      return `<div style="display:flex;align-items:center;gap:10px;border-bottom:1px dashed var(--line);padding:6px 0;flex-wrap:wrap;"><span style="font-size:1.4rem">${
        done ? "✅" : "⬜"
      }</span><div style="flex:1;min-width:120px"><b>${n}</b><div style="font-size:.7rem;color:var(--sub)">${d}</div></div><div style="width:100px;height:6px;background:var(--panel);border-radius:99px;overflow:hidden;flex-shrink:0"><div style="height:100%;width:${pct}%;background:${
        done ? "var(--ok)" : "var(--c-y)"
      };border-radius:99px;transition:width .4s"></div></div><span style="font-size:.7rem;min-width:40px;text-align:right;color:var(--sub)">${
        done ? "✔️" : prog + "/" + target
      }</span></div>`;
    }
  ).join(
    ""
  )}</div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">关闭</button></div>`;
  openModal(html);
}
function showShareModal() {
  const b = bookOf(S.curBook),
    pr = S.prog[b.id] || { cleared: 0 };
  const url = new URL(location.href);
  const data = {
    book: S.curBook,
    mode: "level",
    unit: Math.min(pr.cleared, b.units.length - 1),
  };
  url.searchParams.set("challenge", btoa(JSON.stringify(data)));
  const shareUrl = url.toString();
  const html = `<h3>📤 分享挑战</h3><div class="sub">将以下链接发给好友，对方打开后自动进入同一单元挑战</div><div style="background:var(--panel);border-radius:10px;padding:12px;word-break:break-all;font-size:.8rem;border:1px solid var(--line);margin:12px 0;font-family:monospace">${escHtml(
    shareUrl
  )}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;"><button class="btn y sm" onclick="copyShareLink('${escA(
    shareUrl
  )}')">📋 复制链接</button>${
    navigator.share
      ? `<button class="btn c sm" onclick="navigator.share({title:'WORD RUSH 单词挑战',text:'来和我一起挑战单词吧！',url:'${escA(
          shareUrl
        )}'})">📱 分享</button>`
      : ""
  }</div><div class="sub" style="font-size:.7rem">💡 对方打开链接后会自动进入对应词库和单元，支持所有游戏模式</div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">关闭</button></div>`;
  openModal(html);
}
function copyShareLink(url) {
  navigator.clipboard
    .writeText(url)
    .then(() => toast("✅ 链接已复制"))
    .catch(() => {
      const i = document.createElement("input");
      i.value = url;
      document.body.appendChild(i);
      i.select();
      document.execCommand("copy");
      i.remove();
      toast("✅ 链接已复制");
    });
}
(function checkChallenge() {
  const params = new URLSearchParams(location.search);
  const enc = params.get("challenge");
  if (enc) {
    try {
      const data = JSON.parse(atob(enc));
      if (data.book && data.mode === "level" && data.unit !== undefined) {
        S.curBook = data.book;
        save();
        setTimeout(() => {
          renderHome();
          const b = bookOf(data.book),
            pr = S.prog[b.id] || {};
          if (data.unit <= pr.cleared) {
            toast(
              "📤 已加载分享的挑战",
              `${b.name} · ${b.units[data.unit]?.n || "单元"}`
            );
            startLevel(data.book, data.unit);
          } else {
            toast("🔒 请先完成前面的单元");
          }
        }, 500);
      }
    } catch (e) {}
  }
})();

/* ================= 顺序/随机切换 ================= */
function toggleWordOrder() {
  S.set.wordOrder = S.set.wordOrder === "random" ? "sequential" : "random";
  save();
  renderHome();
  toast(
    "📋 单词顺序：" + (S.set.wordOrder === "random" ? "🔀 随机" : "➡️ 顺序")
  );
}

/* ================= 主页 ================= */
function renderHome() {
  if (window.speechSynthesis) speechSynthesis.getVoices();

  // 词库标签：内置词库（闯关）+ 扩展词库（每日精练）同区展示，点击都只切换下方动态区
  let tabsHtml = BOOKS.filter((b) => !dynSource(b.id))
    .map(
      (b) =>
        `<button class="bktab ${b.id === S.curBook ? "on" : ""}" style="--bc:${
          b.color
        };--stc:${stageColor(b.stage)}" onclick="pickBook('${b.id}')">${b.name.replace(" · ", "")}</button>`
    )
    .join("");
  // 扩展词库始终显示名称（未加载也可选中），选中后在下方动态区设置词量/次序并懒加载
  tabsHtml += DYN_SOURCES.map(
    (s) =>
      `<button class="bktab dyn ${s.id === S.curBook ? "on" : ""}" style="--bc:${
        s.color
      };--stc:${stageColor(s.stage)}" title="${s.name} · ${s.stage ? s.stage + " · " : ""}扩展词库每日精练" onclick="pickBook('${s.id}')">${s.name}</button>`
  ).join("");
  // 顺序/随机切换按钮（仅内置闯关相关）
  tabsHtml += `<button class="bktab order-btn" onclick="toggleWordOrder()" style="--bc:var(--c-c);margin-left:auto;">${
    S.set.wordOrder === "random" ? "🔀 随机" : "➡️ 顺序"
  }</button>`;
  $("#bkTabs").innerHTML = tabsHtml;

  // 当前选中：扩展词库（可能尚未加载）还是内置词库
  const dynSrc = dynSource(S.curBook);
  let b = bookOf(S.curBook);
  if (!dynSrc && !b) {
    // 兜底：选中项异常时回退到第一个内置词库
    S.curBook = BOOKS.find((x) => !dynSource(x.id))?.id || BOOKS[0].id;
    b = bookOf(S.curBook);
  }
  if (dynSrc) {
    // ── 扩展词库·每日精练动态区 ──
    const cfg = dynCfg(dynSrc.id);
    $("#heroName").textContent = dynSrc.name;
    $("#heroTag").textContent = dynSrc.stage ? "扩展 · " + dynSrc.stage : "扩展词库";
    $("#heroTag").style.background = dynSrc.color;
    $("#heroMeta").textContent = b
      ? `${b.items.length} 词条 · 每日精练 ${cfg.daily} 词/天`
      : `${dynSrc.size || "扩展词库"} · 点击开始自动加载`;
    $("#lvMap").style.display = "none";
    $("#btnStart").style.display = "none";
    $("#dynPanel").style.display = "";
    $("#btnDynStart").style.display = "";
    $("#btnDynStart").disabled = false;
    renderDynPanel(dynSrc.id, b);
    if (!b) ensureDynLoaded(dynSrc); // 未加载则后台静默拉取，完成后自动刷新
  } else {
    // ── 内置词库·闯关动态区（功能不变） ──
    $("#dynPanel").style.display = "none";
    $("#btnDynStart").style.display = "none";
    $("#lvMap").style.display = "";
    $("#btnStart").style.display = "";
    const pr = S.prog[b.id] || { cleared: 0, stars: {} },
      lvN = b.units.length;
    $("#heroName").textContent = b.name;
    $("#heroTag").textContent = b.stage;
    $("#heroTag").style.background = b.color;
    const got = Object.values(pr.stars || {}).reduce((a, c) => a + c, 0);
    $("#heroMeta").textContent = `${b.units.length} 个单元 · ${
      b.items.length
    } 词条 · 已通 ${pr.cleared} 单元 · ⭐ ${got}/${lvN * 3}`;
    $("#lvMap").innerHTML = b.units
      .map((u, i) => {
        const st = pr.stars?.[i],
          unlocked = i <= pr.cleared,
          cur = i === pr.cleared && unlocked;
        return `<div class="lvchip ${cur ? "cur" : ""} ${
          unlocked ? "" : "lock"
        }" title="${u.n}" onclick="clickLv(${i})"><b>${u.s}</b><span class="st">${
          st ? "★".repeat(st) + "☆".repeat(3 - st) : unlocked ? "GO" : "🔒"
        }</span></div>`;
      })
      .join("");
    const nxt = Math.min(pr.cleared, lvN - 1);
    $("#btnStart").textContent =
      pr.cleared >= lvN
        ? "🔁 重新挑战全册"
        : `▶ 开始 ${b.units[nxt].s} · ${b.units[nxt].n}`;
  }
  const today = new Date().toISOString().slice(0, 10);
  const dstat = S.daily[today] || {
    words: 0,
    correct: 0,
    errors: 0,
    score: 0,
    games: 0,
  };
  const acc =
    dstat.correct + dstat.errors
      ? Math.round((dstat.correct / (dstat.correct + dstat.errors)) * 100)
      : 0;
  $(
    "#todayStats"
  ).innerHTML = `<span>📅 今日学习：<b style="color:var(--c-y)">${dstat.words}</b> 词</span>
   <span>✅ 正确：<b style="color:var(--ok)">${dstat.correct}</b></span>
   <span>❌ 错误：<b style="color:var(--bad)">${dstat.errors}</b></span>
   <span>🎯 正确率：<b style="color:var(--c-c)">${acc}%</b></span>
   <span>🏅 局数：<b>${dstat.games}</b></span>`;
  const due = dueWords().length,
    wr = wrongWords().length;
  $("#dueN").textContent = due;
  $("#dueTxt").textContent = due
    ? "根据遗忘曲线，这些词该见面了"
    : "太棒了，暂无待复习单词 ✨";
  $("#btnReview").disabled = !due;
  $("#wrongN").textContent = wr;
  $("#btnWrong").disabled = !wr;
  // ── 今日任务卡：纯数据展示（待复习 + 新学目标 + 已完成 + 进度条） ──
  // 复习入口统一走下方「今日复习任务」卡片的「开始复习」按钮，避免重复
  const freshGoal = dynSrc ? dynCfg(dynSrc.id).daily : 20;
  const goal = due + freshGoal;
  const done = dstat.words || 0;
  const pct = goal ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  $("#todayTask").innerHTML = goal
    ? `<div class="task-card">
        <div class="task-head">
          <span class="task-title">🎯 今日任务</span>
          <span class="task-pct"><b style="color:var(--c-y)">${done}</b> / ${goal} 词 · ${pct}%</span>
        </div>
        <div class="task-bar"><i style="width:${pct}%"></i></div>
        <div class="task-body">
          <div class="task-item"><span class="tk-due">⏰ 待复习</span><b>${due}</b></div>
          <div class="task-item"><span class="tk-fresh">🌱 新学目标</span><b>${freshGoal}</b></div>
          <div class="task-item"><span class="tk-done">✅ 已完成</span><b>${done}</b></div>
        </div>
      </div>`
    : "";
  refreshHead();
}
window.pickBook = (id) => {
  S.curBook = id;
  save();
  renderHome();
  // 选中扩展词库：后台静默懒加载，完成后自动刷新进度（不阻塞页面）
  const src = dynSource(id);
  if (src) ensureDynLoaded(src);
};
// 渲染扩展词库·每日精练动态区：进度条/文本 + 滑块值 + 次序分段
function renderDynPanel(id, b) {
  const cfg = dynCfg(id);
  $("#dynDaily").value = cfg.daily;
  $("#dynDailyVal").textContent = cfg.daily;
  $("#btnDynStart").textContent = `▶ 开始今日练习（${cfg.daily} 词）`;
  $$("#dynOrderSeg .seg").forEach((x) =>
    x.classList.toggle("on", x.dataset.v === cfg.order)
  );
  const fill = $("#dynProgFill"),
    txt = $("#dynProgTxt");
  const p = dynProgress(id);
  if (!p || !b) {
    fill.style.width = "0%";
    txt.textContent =
      "⏳ 词库尚未加载：点「开始今日练习」自动加载（首次需联网，之后走本地缓存）";
    return;
  }
  let pct, line;
  if (cfg.order === "rand") {
    pct = p.total ? Math.round((p.learned / p.total) * 100) : 0;
    line = `🔀 随机模式 · 已学 ${p.learned}/${p.total} 词（${pct}%）· 已掌握 ${p.mastered} 词 · 每批随机抽 ${cfg.daily} 词`;
  } else {
    const pos = Math.min(cfg.pos, p.total);
    pct = p.total ? Math.round((pos / p.total) * 100) : 0;
    line = `${cfg.order === "rev" ? "⬅️ 逆序" : "➡️ 顺序"}闯关 · 本轮进度 ${pos}/${p.total}（${pct}%）· 已学 ${p.learned} 词 · 已掌握 ${p.mastered} 词`;
  }
  fill.style.width = pct + "%";
  txt.textContent = line;
}
window.clickLv = (i) => {
  const b = bookOf(S.curBook),
    pr = S.prog[b.id] || { cleared: 0, stars: {} };
  if (i > pr.cleared) {
    toast("🔒 先通过前面的单元");
    return;
  }
  startLevel(S.curBook, i);
};
$("#btnStart").onclick = () => {
  const b = bookOf(S.curBook),
    pr = S.prog[b.id] || { cleared: 0 };
  startLevel(S.curBook, Math.min(pr.cleared, b.units.length - 1));
};
$("#btnReview").onclick = () => {
  const q = dueWords().slice(0, 15); // 已按 SRS 逾期优先级排序
  if (q.length) startRun({ mode: "review", title: "复习任务", queue: q });
  else toast("✅ 暂无到期复习词，去学新词或挑战吧");
};
$("#btnWrong").onclick = () => {
  const q = wrongWords().slice(0, 15); // 已按 SRS 逾期优先级排序
  if (q.length) startRun({ mode: "review", title: "错题重练", queue: q });
  else toast("🎉 错词都已掌握，继续加油！");
};
// ── 扩展词库·每日精练控件（元素常驻，绑定一次即可） ──
$("#dynDaily").addEventListener("input", () => {
  const src = dynSource(S.curBook);
  if (!src) return;
  const cfg = dynCfg(src.id);
  cfg.daily = dynNormDaily($("#dynDaily").value);
  $("#dynDaily").value = cfg.daily;
  save();
  $("#dynDailyVal").textContent = cfg.daily;
  $("#btnDynStart").textContent = `▶ 开始今日练习（${cfg.daily} 词）`;
});
$$("#dynOrderSeg .seg").forEach((btn) =>
  btn.addEventListener("click", () => {
    const src = dynSource(S.curBook);
    if (!src) return;
    const cfg = dynCfg(src.id);
    cfg.order = btn.dataset.v;
    save();
    $$("#dynOrderSeg .seg").forEach((x) =>
      x.classList.toggle("on", x === btn)
    );
    renderDynPanel(src.id, bookOf(src.id));
  })
);
$("#btnDynStart").onclick = async () => {
  const src = dynSource(S.curBook);
  if (!src) return;
  const btn = $("#btnDynStart");
  if (btn.disabled) return;
  let b = bookOf(src.id);
  if (!b) {
    // 懒加载：进入练习前确保词库就绪
    btn.disabled = true;
    btn.textContent = "⏳ 词库加载中…";
    const ok = await ensureDynLoaded(src);
    if (!ok) {
      btn.disabled = false;
      renderDynPanel(src.id, null);
      toast("⚠️ 词库加载失败：" + src.name + "，请稍后重试");
      return;
    }
    b = bookOf(src.id);
  }
  const q = dynDailyQueue(b.items, src.id);
  if (!q.length) {
    toast("⚠️ 词库为空：" + src.name);
    return;
  }
  startRun({ mode: "daily", title: src.name, queue: q, keepOrder: true });
};

/* ================= 弹窗 ================= */
let modalOpen = false,
  modalToken = 0;
function openModal(html) {
  modalOpen = true;
  $("#mbox").innerHTML = html;
  $("#modal").classList.remove("hide");
}
function closeModal() {
  modalOpen = false;
  $("#modal").classList.add("hide");
  modalToken++;
}
window.closeModal = closeModal;

/* ================= 个人资料 ================= */
let pfBack = null, // 从联机对战入口进入资料页，保存后返回
  pfDraft = {};
const PF_AVATARS = ["🧑", "👩", "👨", "🧔", "👧", "👦", "🦊", "🐼", "🐯", "🐸", "🤖", "👻"],
  PF_MOODS = ["😀", "😄", "😎", "🥳", "😤", "😴", "🤔", "😢", "😭", "🤯", "💪", "🔥"];
$("#btnProfile").onclick = () => openProfileModal();
function openProfileModal() {
  pfDraft = Object.assign(
    { name: "", gender: "保密", avatar: "🧑", mood: "", moodEmoji: "😀" },
    S.profile || {}
  );
  const avHtml = PF_AVATARS.map(
    (e) =>
      `<button class="emopick ${pfDraft.avatar === e ? "on" : ""}" data-k="avatar" data-v="${e}" onclick="pfPick(this)">${e}</button>`
  ).join("");
  const moodHtml = PF_MOODS.map(
    (e) =>
      `<button class="emopick ${pfDraft.moodEmoji === e ? "on" : ""}" data-k="moodEmoji" data-v="${e}" onclick="pfPick(this)">${e}</button>`
  ).join("");
  openModal(
    `<h3>👤 个人资料</h3><div class="sub">设置后将展示在联机对战中对方面前</div>
  <div class="pf-row"><label>姓名</label><input class="pf-input" id="pfName" placeholder="输入昵称（最多 12 字）" maxlength="12" value="${escA(pfDraft.name)}"></div>
  <div class="pf-row"><label>性别</label><div class="pf-seg">${["男", "女", "保密"]
    .map(
      (g) =>
        `<button class="seg ${pfDraft.gender === g ? "on" : ""}" data-k="gender" data-v="${g}" onclick="pfPick(this)">${g}</button>`
    )
    .join("")}</div></div>
  <div class="pf-row"><label>头像</label><div class="emogrid">${avHtml}</div></div>
  <div class="pf-row"><label>一句话心情</label><input class="pf-input" id="pfMood" placeholder="例如：今天也要加油！" maxlength="20" value="${escA(pfDraft.mood)}"></div>
  <div class="pf-row"><label>心情表情</label><div class="emogrid">${moodHtml}</div></div>
  <div class="mbtns"><button class="btn y" onclick="saveProfile()">💾 保存</button><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`
  );
}
function pfPick(el) {
  const k = el.dataset.k,
    v = el.dataset.v;
  if (!k) return;
  pfDraft[k] = v;
  el.parentElement
    .querySelectorAll(".emopick,.seg")
    .forEach((b) => b.classList.toggle("on", b === el));
}
function saveProfile() {
  pfDraft.name = ($("#pfName")?.value || "").trim().slice(0, 12);
  pfDraft.mood = ($("#pfMood")?.value || "").trim().slice(0, 20);
  if (!pfDraft.avatar) pfDraft.avatar = "🧑";
  if (!pfDraft.moodEmoji) pfDraft.moodEmoji = "😀";
  S.profile = Object.assign({}, pfDraft);
  save();
  refreshHead();
  const back = pfBack;
  pfBack = null;
  closeModal();
  toast("👤 资料已保存");
  if (back === "p2p") openP2PMode();
}
function openProfileFromP2P() {
  pfBack = "p2p";
  openProfileModal();
}

/* ================= 错题查看 ================= */
window.showWrongList = function () {
  const list = wrongWords();
  if (!list.length) {
    toast("🎉 没有错词，继续加油！");
    return;
  }
  const html = `<h3>📖 错题本</h3><div class="sub">共 ${
    list.length
  } 个单词曾被拼错（点击发音）</div>
  <div style="max-height:60vh;overflow-y:auto;text-align:left">
    ${list
      .map((w) => {
        const m = S.mastery[w.en.toLowerCase()];
        return `<div style="border-bottom:1px dashed var(--line);padding:6px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <span><b>${w.en}</b> ${w.cn}</span>
        <span style="color:var(--bad);font-size:.8rem">错误 ${
          m ? m.w : 0
        } 次</span>
        <button class="phspk" data-t="${w.en}">🔊</button>
      </div>`;
      })
      .join("")}
  </div>
  <div class="mbtns"><button class="btn c" onclick="closeModal();$('#btnWrong').click()">错题重练</button><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">关闭</button></div>`;
  openModal(html);
};

/* ================= 模式设置弹窗 ================= */
let sel = { book: "mix", btype: "bot", diff: "mid" };
const bookOpts = () =>
  `<button class="opt on" data-b="mix" data-kind="builtin">🎲 混合词库</button>` +
  BOOKS.map(
    (b) => `<button class="opt" data-b="${b.id}" data-kind="${dynSource(b.id) ? "dyn" : "builtin"}">${b.name}</button>`
  ).join("") +
  DYN_SOURCES.filter((s) => !dynLoaded(s.id)).map(
    (s) => `<button class="opt" data-b="${s.id}" data-kind="unloaded">${s.name} <small>${s.size}</small></button>`
  ).join("");
window.openMode = (m) => {
  if (m === "time" || m === "fall" || m === "memory") {
    sel.book = "mix";
    const info = {
      time: [
        "TIME RUSH",
        "60 秒内拼出尽可能多的单词，连击越高分越高",
        "开始 ⏱ 60s",
      ],
      fall: ["WORD FALL", "单词不断坠落，在触底前把它拼完击碎", "开始 ☄️"],
      memory: [
        "PETAL MEMORY",
        "florr 花瓣记忆：先展示单词并逐字母聚焦拼读，然后隐藏，凭记忆拼写；拼错的字母最后集中提示。",
        "🌸 进入草地",
      ],
    };
    openModal(`<h3>${info[m][0]}</h3><div class="sub">${info[m][1]}</div>
  <div class="sub" style="margin-bottom:8px">选择词库：</div><div class="optrow" id="bkOpts">${bookOpts()}</div>
  <div class="mbtns"><button class="btn y" id="goBtn">${
    info[m][2]
  }</button><button class="btn sm" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`);
  }
  if (m === "battle") {
    sel.btype = "bot";
    sel.diff = "mid";
    sel.book = "mix";
    openModal(`<h3>PVP ARENA</h3><div class="sub">同一组词，谁先拼完谁赢！人机竞速或双人同屏轮流比拼。</div>
  <div class="sub" style="margin-bottom:8px">对手：</div><div class="optrow" id="btOpts">
   <button class="opt on" data-t="bot-easy">🐢 机器人·轻松</button><button class="opt" data-t="bot-mid">🐇 机器人·进阶</button><button class="opt" data-t="bot-hard">🦅 机器人·精英</button><button class="opt" data-t="2p">🎮 双人同屏</button></div>
  <div class="sub" style="margin-bottom:8px">词库：</div><div class="optrow" id="bkOpts">${bookOpts()}</div>
  <div class="mbtns"><button class="btn y" id="goBtn">⚔️ 进入竞技场</button><button class="btn sm" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`);
  }
  const tk = modalToken;
  $$("#bkOpts .opt").forEach(
    (o) =>
      (o.onclick = () => {
        if (tk !== modalToken) return;
        $$("#bkOpts .opt").forEach((x) => x.classList.remove("on"));
        o.classList.add("on");
        sel.book = o.dataset.b;
      })
  );
  if (m === "battle")
    $$("#btOpts .opt").forEach(
      (o) =>
        (o.onclick = () => {
          if (tk !== modalToken) return;
          $$("#btOpts .opt").forEach((x) => x.classList.remove("on"));
          o.classList.add("on");
          const t = o.dataset.t;
          if (t === "2p") {
            sel.btype = "2p";
          } else {
            sel.btype = "bot";
            sel.diff = t.split("-")[1];
          }
        })
    );
  $("#goBtn").onclick = async () => {
    // 若选中了尚未加载的扩展词库 → 惰性加载（静默），成功后才开局
    if (sel.book !== "mix" && !bookOf(sel.book)) {
      const src = dynSource(sel.book);
      if (src) {
        const ok = await applyDynamicBook(src, { silent: true });
        if (!ok) { toast("⚠️ 词库加载失败：" + src.name + "，请稍后重试"); return; }
      }
    }
    closeModal();
    const pool = sel.book === "mix" ? ALL : bookOf(sel.book).items;
    if (m === "time") startTime(weightedPool(pool, 40));
    else if (m === "fall")
      startFalling(weightedPool(pool.filter((w) => !w.phrase && w.en.length <= 10), 60));
    else if (m === "memory")
      startMemory(pool.filter((w) => !w.phrase && w.en.length <= 12));
    else startBattle(sel.btype, sel.diff, weightedPool(pool.filter((w) => w.en.length <= 12), 8));
  };
};

/* ================= P2P 联机（1v1 / 多人房间） ================= */
let peer = null,
  conn = null,
  p2pRoom = null,
  p2pReady = false,
  p2pMode = null, // "duel" | "room"
  oppProfile = null,
  isHost = false,
  p2pRematchMe = false,
  p2pRematchFoe = false,
  p2pLastRoomCode = "", // 记忆上次加入的房间码
  // ---- 多人房间 ----
  hostConns = {}, // 房主侧：peerId -> { conn }
  members = {}, // 双方：peerId -> { id, profile, prog, errors, done }
  myPeerId = null,
  roomMax = 16,
  p2pState = "lobby", // lobby | playing
  roomScores = {}, // 乱斗累计积分：peerId -> 得分（房主权威，随消息同步）
  roomResults = {}, // 本轮完成记录：peerId -> { time(秒), errors }（房主收集）
  roomEnded = false; // 本轮是否已结束（防重复结算）
let p2pSelBook = "mix", // 房主选定的对战词库（"mix" 或词库 id）
  p2pRoundWords = null, // 本局统一词表（房主生成，随 start 消息分发给所有人）
  p2pStarting = false; // 房主开局去重（异步加载词库期间防重复点击）
const ROOM_SEC = 60; // 乱斗每轮限时（秒）
const P2P_WORD_COUNT = 8; // 每局对战单词数

/* 房主选词库选项（复用 bookOpts 列表，但选中态绑定 p2pSelBook） */
const p2pBookOpts = () =>
  `<button class="opt${p2pSelBook === "mix" ? " on" : ""}" data-b="mix" data-kind="builtin">🎲 混合词库</button>` +
  BOOKS.map(
    (b) => `<button class="opt${p2pSelBook === b.id ? " on" : ""}" data-b="${b.id}" data-kind="${
      dynSource(b.id) ? "dyn" : "builtin"
    }">${b.name}</button>`
  ).join("") +
  DYN_SOURCES.filter((s) => !dynLoaded(s.id))
    .map(
      (s) =>
        `<button class="opt${p2pSelBook === s.id ? " on" : ""}" data-b="${s.id}" data-kind="unloaded">${s.name} <small>${s.size}</small></button>`
    )
    .join("");
/* 绑定大厅词库选项点击（乱斗/单挑大厅共用） */
function p2pBindBookOpts(sel) {
  $$(sel + " .opt").forEach((o) => {
    o.onclick = () => {
      $$(sel + " .opt").forEach((x) => x.classList.remove("on"));
      o.classList.add("on");
      p2pSelBook = o.dataset.b;
    };
  });
}
/* 生成邀请链接：?room=<房间码>&mode=duel|room，对方打开即自动加入 */
function p2pInviteUrl(mode) {
  const u = new URL(location.href);
  u.searchParams.delete("challenge"); // 邀请链接只做邀请，避免对方同时触发闯关
  u.searchParams.set("room", p2pRoom);
  u.searchParams.set("mode", mode || p2pMode || "duel");
  return u.toString();
}
/* 分享按钮组（复制链接 + 可选系统分享），房主大厅/等待卡片共用 */
function p2pShareBtns(mode) {
  const url = p2pInviteUrl(mode);
  return (
    `<div class="p2p-share"><button class="btn y sm" onclick="copyShareLink('${escA(
      url
    )}')">📋 复制邀请链接</button>` +
    (navigator.share
      ? `<button class="btn c sm" onclick="navigator.share({title:'WORD RUSH 联机对战',text:'快来和我一起单词对战！',url:'${escA(
          url
        )}'})">📱 分享</button>`
      : "") +
    `</div>`
  );
}
/* 房主按所选词库生成本局统一词表（未加载的扩展词库先惰性加载；失败回退混合词库） */
async function p2pBuildWords() {
  let pool = ALL;
  if (p2pSelBook !== "mix") {
    let b = bookOf(p2pSelBook);
    if (!b) {
      const src = dynSource(p2pSelBook);
      if (src) {
        const ok = await ensureDynLoaded(src);
        if (!ok) toast("⚠️ 词库加载失败：" + src.name + "，本局改用混合词库");
        b = bookOf(p2pSelBook);
      }
    }
    if (b) pool = b.items;
    else p2pSelBook = "mix";
  }
  const words = shuffle(pool.filter((w) => !w.phrase && w.en.length <= 10)).slice(0, P2P_WORD_COUNT);
  if (!words.length) {
    p2pSelBook = "mix";
    return shuffle(ALL.filter((w) => !w.phrase && w.en.length <= 10)).slice(0, P2P_WORD_COUNT).map((w) => ({
      en: w.en,
      cn: w.cn,
      pos: w.pos,
    }));
  }
  return words.map((w) => ({ en: w.en, cn: w.cn, pos: w.pos }));
}
/* 房主：开始单挑（首次开局/再来一局共用）——生成统一词表并随 start 分发 */
function p2pHostStartDuel() {
  if (p2pStarting) return;
  if (!conn || !conn.open) {
    toast("⚠️ 对手尚未连接");
    return;
  }
  p2pStarting = true;
  (async () => {
    try {
      const words = await p2pBuildWords();
      // 等待词库（可能含扩展词库联网加载）期间对手可能已断开
      if (!conn || !conn.open) {
        p2pStarting = false;
        toast("⚠️ 对手已断开，无法开局");
        return;
      }
      p2pRoundWords = words;
      p2pRematchMe = true;
      p2pRematchFoe = true;
      p2pStarting = false;
      sendP2P({ type: "start", words });
      startP2PBattle();
    } catch (e) {
      p2pStarting = false;
      toast("⚠️ 开局失败，请重试");
    }
  })();
}
function openP2PMode() {
  const pf = S.profile || {};
  openModal(
    `<h3>🌐 联机对战</h3><div class="sub">选择对战模式</div><div class="pf-summary"><span>${
      pf.avatar || "🧑"
    } ${
      pf.name ? escHtml(pf.name) : "<i style='opacity:.65'>未设置昵称</i>"
    }</span><button class="btn b sm" onclick="openProfileFromP2P()">✏️ 设置资料</button></div><div class="p2p-mode-grid"><button class="btn y" onclick="openDuelMode()">⚔️ 单挑</button><button class="btn c" onclick="openRoomMode()">👥 乱斗</button></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`
  );
}
function openDuelMode() {
  p2pMode = "duel";
  openModal(
    `<h3>⚔️ 单挑</h3><div class="sub">实时双人对战 · 先完成者获胜</div><div style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;justify-content:center"><button class="btn y" onclick="p2pCreateRoom()">🏠 创建房间</button><button class="btn c" onclick="p2pShowJoin()">🔗 加入房间</button></div><div id="p2pStatus" style="text-align:center;font-size:.85rem;color:var(--sub);padding:8px;border:1px dashed var(--line);border-radius:10px;display:none;">加载中...</div><div id="p2pRoomDisplay" style="text-align:center;display:none;margin:8px 0;"></div><div id="p2pJoinArea" style="display:none;text-align:center;"><input class="p2p-input" id="p2pJoinInput" placeholder="输入房间码" style="width:100%;max-width:280px;"><div style="margin-top:8px;"><button class="btn solid sm" onclick="p2pJoinRoom()">加入</button></div></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" onclick="openP2PMode()">← 返回</button><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`
  );
}
function openRoomMode() {
  p2pMode = "room";
  openModal(
    `<h3>👥 乱斗</h3><div class="sub">一个房间最多 ${roomMax} 人 · 中途可加入 · 房主随时开局</div><div class="p2p-create"><span>人数上限</span><select id="p2pMax"><option value="2">2 人</option><option value="4">4 人</option><option value="8">8 人</option><option value="16" selected>16 人</option></select><button class="btn y" onclick="roomCreate()">🏠 创建房间</button></div><div style="margin:6px 0 10px;text-align:center"><button class="btn c" onclick="roomShowJoin()">🔗 加入房间</button></div><div id="p2pStatus" style="text-align:center;font-size:.85rem;color:var(--sub);padding:8px;border:1px dashed var(--line);border-radius:10px;display:none;">加载中...</div><div id="p2pJoinArea" style="display:none;text-align:center;"><input class="p2p-input" id="p2pJoinInput" placeholder="输入房间码" style="width:100%;max-width:280px;"><div style="margin-top:8px;"><button class="btn solid sm" onclick="roomJoin()">加入</button></div></div><div class="mbtns"><button class="btn" style="border-color:#999;color:#666" onclick="openP2PMode()">← 返回</button><button class="btn" style="border-color:#999;color:#666" onclick="closeModal()">取消</button></div>`
  );
}
function p2pShowJoin() {
  $("#p2pJoinArea").style.display = "block";
}
function roomShowJoin() {
  $("#p2pJoinInput").value = p2pLastRoomCode;
  $("#p2pJoinArea").style.display = "block";
}
function p2pCreateRoom() {
  if (peer) peer.destroy();
  const id = "wordrush-" + Math.random().toString(36).slice(2, 8);
  peer = new Peer(id, { debug: 2 });
  p2pRoom = id;
  isHost = true;
  $("#p2pStatus").style.display = "block";
  $("#p2pStatus").innerHTML = "⏳ 创建房间中...";
  peer.on("open", () => {
    $("#p2pRoomDisplay").style.display = "block";
    $(
      "#p2pRoomDisplay"
    ).innerHTML = `<div>📋 房间码</div><div class="room-code">${id}</div><div style="font-size:.7rem;color:var(--sub);margin:4px 0">等待对手加入... 也可直接发链接邀请</div>${p2pShareBtns(
      "duel"
    )}`;
    $("#p2pStatus").innerHTML =
      '<span class="p2p-status connecting"><span class="dot"></span>等待连接...</span>';
    toast("🏠 房间已创建", "房间码: " + id);
  });
  peer.on("connection", (c) => {
    conn = c;
    setupP2PConnection();
  });
  peer.on("error", (e) => {
    $("#p2pStatus").innerHTML = "❌ 错误: " + e.message;
    toast("❌ 创建房间失败", e.message);
  });
}
function p2pJoinRoom(code) {
  code = (code !== undefined ? code : $("#p2pJoinInput").value).trim();
  if (!code) {
    toast("请输入房间码");
    return;
  }
  p2pLastRoomCode = code;
  if (peer) peer.destroy();
  peer = new Peer({ debug: 2 });
  isHost = false;
  peer.on("open", () => {
    $("#p2pStatus").style.display = "block";
    $("#p2pStatus").innerHTML = "⏳ 连接中...";
    conn = peer.connect(code);
    setupP2PConnection();
  });
  peer.on("error", (e) => {
    $("#p2pStatus").innerHTML = "❌ 连接失败: " + e.message;
    toast("❌ 连接失败", e.message);
  });
}
function setupP2PConnection() {
  if (!conn) return;
  conn.on("open", () => {
    const st = $("#p2pStatus");
    if (st)
      st.innerHTML =
        '<span class="p2p-status connected"><span class="dot"></span>已连接！</span>';
    toast("✅ 已连接！", "准备开始对战");
    p2pReady = true;
    p2pSelBook = "mix";
    p2pRoundWords = null;
    sendP2P({ type: "profile", profile: S.profile || {} });
    // 房主进入大厅选词后开局，客人等待房主开始（词表由房主随 start 统一分发）
    if (isHost) p2pDuelLobby();
    else p2pDuelWaiting();
  });
  conn.on("data", (data) => {
    handleP2PData(data);
  });
  conn.on("close", () => {
    conn = null;
    p2pReady = false;
    p2pRematchMe = false;
    p2pRematchFoe = false;
    // 对局进行中对手断开：本局不结算
    if (G && G.type === "p2p" && G.active) {
      endGameCleanup();
      G = null;
      openModal(
        `<h3>🔌 连接断开</h3><div class="sub">对方已退出，本局不结算</div><div class="mbtns"><button class="btn b" onclick="closeModal();go('scr-home')">返回主页</button></div>`
      );
      return;
    }
    // 对局已结束（大厅内）：房主保留房间等待新对手，加入者直接退回主页
    if (isHost && peer) {
      toast("👋 对手已退出，房间等待中");
      oppProfile = null;
    } else {
      toast("🚪 房间已关闭");
      if (peer) {
        try {
          peer.destroy();
        } catch (e) {}
        peer = null;
      }
      p2pCleanup();
      closeModal();
      go("scr-home");
    }
  });
}
function sendP2P(data) {
  if (p2pMode === "room") {
    if (isHost) roomBroadcast(data);
    else if (conn && conn.open) conn.send(data);
    return;
  }
  if (conn && conn.open) conn.send(data);
}
/* 单挑大厅（房主）：选词库 + 开始 */
function p2pDuelLobby() {
  const me = S.profile || {};
  openModal(
    `<h3>⚔️ 单挑房间</h3><div class="sub">房间码 <span class="room-code" style="font-size:1.05rem;letter-spacing:2px;padding:2px 10px">${p2pRoom}</span></div>
     ${p2pShareBtns("duel")}
     <div class="room-list" style="text-align:left;margin:10px 0">
       <div class="room-mem"><span>${me.avatar || "🧑"} ${escHtml(me.name || "你")}（我 · 房主）</span><b style="color:var(--c-y)">房主</b></div>
       <div class="room-mem"><span id="duelOppNm">⏳ 等待对手加入...</span><b id="duelOppSt"></b></div>
     </div>
     <div class="sub" style="margin-bottom:8px">选择词库（双方使用同一组词）：</div><div class="optrow" id="duelBkOpts" style="justify-content:center">${p2pBookOpts()}</div>
     <div class="mbtns"><button class="btn y" onclick="p2pHostStartDuel()">⚔️ 开始对战</button><button class="btn p" onclick="p2pHostDisband()">🚪 解散房间</button></div>`
  );
  p2pBindBookOpts("#duelBkOpts");
  if (oppProfile) {
    const el = $("#duelOppNm");
    if (el) el.textContent = (oppProfile.avatar || "👤") + " " + (oppProfile.name || "玩家");
    const st = $("#duelOppSt");
    if (st) st.textContent = "已就绪";
  }
}
/* 单挑大厅（客人）：等待房主选词开局 */
function p2pDuelWaiting() {
  const me = S.profile || {};
  openModal(
    `<h3>⚔️ 单挑</h3><div class="sub">✅ 已连接，等待房主选择词库并开始对战...</div>
     <div class="room-list" style="text-align:left;margin:10px 0">
       <div class="room-mem"><span id="duelOppNm">🏠 房主</span><b>选词中...</b></div>
       <div class="room-mem"><span>${me.avatar || "🧑"} ${escHtml(me.name || "你")}（我）</span><b style="color:var(--ok)">已就绪</b></div>
     </div>
     <div class="mbtns"><button class="btn b" onclick="p2pLeave()">🏠 退出房间</button></div>`
  );
}
let p2pData = {
  myProgress: 0,
  oppProgress: 0,
  myErrors: 0,
  oppErrors: 0,
  myDone: false,
  oppDone: false,
  words: [],
};
function startP2PBattle() {
  endGameCleanup();
  closeModal();
  // 词表由房主统一生成并随 start 消息分发；兜底：未收到时本地随机生成
  let q = p2pRoundWords;
  if (!q || !q.length) {
    q = shuffle(ALL.filter((w) => !w.phrase && w.en.length <= 10)).slice(0, P2P_WORD_COUNT);
    p2pRoundWords = q;
  }
  p2pData = {
    myProgress: 0,
    oppProgress: 0,
    myErrors: 0,
    oppErrors: 0,
    myDone: false,
    oppDone: false,
    words: q,
  };
  G = {
    type: "p2p",
    queue: q,
    idx: 0,
    typed: 0,
    errors: 0,
    correct: 0,
    combo: 0,
    best: 0,
    score: 0,
    active: true,
    started: false,
    t0: 0,
    done: false,
    finishTime: 0,
    timeLeft: ROOM_SEC,
  };
  S.stats.games++;
  save();
  go("scr-game");
  const isRoom = p2pMode === "room";
  const right = isRoom
    ? `<span class="pill">⏱ <b id="timeLeft">${ROOM_SEC}</b>s</span><span class="pill">⭐ 积分 <b id="myScore">${roomScores[myPeerId] || 0}</b></span>`
    : `<span class="pill">🔥 <b id="combo">0</b></span><span class="pill">得分 <b id="score">0</b></span><span class="pill">对手进度 <b id="oppProg">0%</b></span>`;
  const lanesHtml = isRoom
    ? `<div class="lanes" id="p2pLanes"></div>`
    : `<div class="lanes"><div class="lane"><div class="nm"><span id="meNm">🧑 你</span><span id="meP">0%</span></div><div class="moodline" id="meMood"></div><div class="track"><div class="fill me" id="meFill"></div><span class="racer" id="meR">🚀</span></div></div><div class="lane"><div class="nm"><span id="foeNm">👤 对手</span><span id="foeP">0%</span></div><div class="moodline" id="foeMood"></div><div class="track"><div class="fill foe" id="foeFill"></div><span class="racer" id="foeR">🤖</span></div></div></div>`;
  $("#arenaWrap").innerHTML =
    hudHTML(
      "#7c4dff",
      isRoom ? "👥 乱斗" : "⚔️ 单挑",
      `<span class="pill">单词 <b id="bIdx">1/${q.length}</b></span>`,
      right
    ) +
    `<div class="stage">${lanesHtml}<div id="cardBox"></div><div class="wordbox" id="wordBox"></div><div class="run-hint">${
      isRoom
        ? `限时 ${ROOM_SEC} 秒拼完 ${q.length} 个单词 · 按完成用时排名得分`
        : `拼完全部 ${q.length} 个单词 · 先完成者获胜！`
    }</div></div>`;
  refreshItems();
  if (isRoom) {
    roomEnded = false;
    roomResults = {};
    for (const m of Object.values(members)) {
      m.done = false;
      m.time = 0;
      m.prog = 0;
      m.errors = 0;
      m.correct = 0;
    }
    if (G.iv) clearInterval(G.iv);
    G.iv = setInterval(roomTick, 1000);
    roomRenderLanes();
  } else p2pRenderNames();
  showP2PWord();
  countdown().then(() => {
    if (G && G.active) {
      G.started = true;
      G.t0 = performance.now();
    }
  });
  refreshOsk();
}
function showP2PWord() {
  const it = G.queue[G.idx];
  if (!it) return;
  G.typed = 0;
  G.wordT0 = Date.now();
  $("#cardBox").innerHTML = wordCard(it, true);
  $("#wordBox").style.fontSize = wFont(it.en.length);
  paintWord($("#wordBox"), it.en, 0);
  $("#bIdx").textContent = `${G.idx + 1}/${G.queue.length}`;
}

/* 实时上报我的进度/正确数/失误数（乱斗房主广播时补 from，并同步自己的 members 记录） */
function p2pSendProgress() {
  if (!G) return;
  p2pData.myProgress = (G.idx / G.queue.length) * 100;
  p2pData.myErrors = G.errors;
  if (p2pMode === "room" && members[myPeerId]) {
    members[myPeerId].prog = p2pData.myProgress;
    members[myPeerId].errors = G.errors;
    members[myPeerId].correct = G.correct;
  }
  const msg = {
    type: "progress",
    prog: p2pData.myProgress,
    errors: G.errors,
    correct: G.correct,
  };
  if (p2pMode === "room" && isHost) msg.from = myPeerId;
  sendP2P(msg);
}
function onP2PChar(ch) {
  if (!G || !G.started || G.done) return;
  const it = G.queue[G.idx];
  if (same(ch, it.en[G.typed])) {
    G.typed++;
    sTick();
    paintWord($("#wordBox"), it.en, G.typed);
    if (G.typed >= it.en.length) {
      markWord(it, true, 0, Date.now() - (G.wordT0 || Date.now()));
      S.stats.words++;
      G.correct++;
      G.combo++;
      G.best = Math.max(G.best, G.combo);
      S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
      // ★ 新增分数累计
      G.score += 10 + Math.min(G.combo, 20) * 2;
      const scEl = $("#score");
      if (scEl) scEl.textContent = G.score;
      const cbEl = $("#combo");
      if (cbEl) cbEl.textContent = G.combo;
      sOk();
      const r = $("#wordBox").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, "var(--c-y)");
      G.idx++;
      p2pSendProgress();
      if (p2pMode === "room") roomRenderLanes();
      else updateP2PLanes();
      if (G.idx >= G.queue.length) {
        p2pData.myDone = true;
        G.done = true;
        G.finishTime = ROOM_SEC - Math.max(0, G.timeLeft); // 本轮已用秒数
        if (p2pMode === "room") {
          if (members[myPeerId]) {
            members[myPeerId].done = true;
            members[myPeerId].time = G.finishTime;
            members[myPeerId].errors = G.errors;
            members[myPeerId].correct = G.correct;
          }
          if (isHost) {
            // 房主完成：记录完成时间并广播，全员完成时提前结束本轮
            roomResults[myPeerId] = { time: G.finishTime, errors: G.errors };
            roomBroadcast({ type: "done", from: myPeerId, time: G.finishTime, errors: G.errors });
            roomRenderLanes();
            roomCheckAllDone();
          } else {
            sendP2P({ type: "done", errors: G.errors, time: G.finishTime });
            toast("🏁 你已完成！用时 " + G.finishTime + "s，等待本轮结束...");
          }
          return;
        }
        sendP2P({ type: "done", errors: G.errors, time: G.finishTime });
        checkP2PWin();
        return;
      }
      showP2PWord();
    }
  } else {
    G.errors++;
    G.combo = 0;
    const cbEl = $("#combo");
    if (cbEl) cbEl.textContent = 0;
    sBad();
    vib(50);
    paintWord($("#wordBox"), it.en, G.typed, true);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
    // 失误也实时上报，乱斗车道立即刷新各人 ✅/❌
    p2pSendProgress();
    if (p2pMode === "room") roomRenderLanes();
  }
}

function updateP2PLanes() {
  const meFill = $("#meFill");
  if (!meFill) return;
  const mp = clamp(p2pData.myProgress / 100, 0, 1),
    fp = clamp(p2pData.oppProgress / 100, 0, 1);
  meFill.style.width = mp * 100 + "%";
  $("#meR").style.left = mp * 100 + "%";
  $("#meP").textContent = Math.round(mp * 100) + "%";
  $("#foeFill").style.width = fp * 100 + "%";
  $("#foeR").style.left = fp * 100 + "%";
  $("#foeP").textContent = Math.round(fp * 100) + "%";
  $("#oppProg").textContent = Math.round(fp * 100) + "%";
}
function p2pRenderNames() {
  const me = S.profile || {},
    foe = oppProfile || {};
  const meEl = $("#meNm"),
    foeEl = $("#foeNm"),
    meMoodEl = $("#meMood"),
    foeMoodEl = $("#foeMood");
  if (meEl)
    meEl.innerHTML = (me.avatar || "🧑") + " " + escHtml(me.name || "你");
  if (foeEl)
    foeEl.innerHTML = (foe.avatar || "👤") + " " + escHtml(foe.name || "对手");
  if (meMoodEl)
    meMoodEl.textContent = ((me.moodEmoji || "") + (me.mood ? " " + me.mood : "")).trim();
  if (foeMoodEl)
    foeMoodEl.textContent = ((foe.moodEmoji || "") + (foe.mood ? " " + foe.mood : "")).trim();
}
function handleP2PData(data) {
  if (p2pMode === "room") return roomHandleData(data);
  // ---- 1v1 ----
  if (data.type === "profile") {
    oppProfile = data.profile || null;
    if ($("#foeNm")) p2pRenderNames();
    // 大厅等待界面实时显示对手昵称
    const el = $("#duelOppNm");
    if (el && oppProfile)
      el.textContent = (oppProfile.avatar || "👤") + " " + (oppProfile.name || "玩家");
    const st = $("#duelOppSt");
    if (st) st.textContent = "已就绪";
  }
  if (data.type === "progress") {
    p2pData.oppProgress = data.prog;
    p2pData.oppErrors = data.errors || 0;
    updateP2PLanes();
  }
  if (data.type === "done") {
    p2pData.oppDone = true;
    p2pData.oppErrors = data.errors || 0;
    checkP2PWin();
  }
  if (data.type === "disband") {
    toast("🚪 房主已解散房间");
    p2pLeave();
  }
  if (data.type === "rematch") {
    p2pRematchFoe = true;
    if (isHost) {
      // 房主权威：双方都点了再来一局 → 房主生成统一词表开局
      if (p2pRematchMe) p2pHostStartDuel();
    } else {
      const b = $("#btnRematch");
      if (b)
        b.innerHTML = p2pRematchMe ? "⏳ 已准备，等待房主开局..." : "✅ 接受再来一局";
    }
  }
  if (data.type === "start") {
    // 客人收到房主开局：使用房主分发的统一词表
    if (data.words) p2pRoundWords = data.words;
    p2pStarting = false;
    p2pRematchMe = true;
    p2pRematchFoe = true;
    startP2PBattle();
  }
}
function checkP2PWin() {
  if (!G || !G.active) return;
  if (p2pData.myDone && p2pData.oppDone) {
    const win = p2pData.myErrors <= p2pData.oppErrors;
    endP2PBattle(win ? 1 : 0);
    return;
  }
  if (p2pData.myDone && !p2pData.oppDone) {
    endP2PBattle(1);
    return;
  }
  if (!p2pData.myDone && p2pData.oppDone) {
    endP2PBattle(0);
    return;
  }
}
function endP2PBattle(win) {
  if (!G || G.type !== "p2p" || !G.active) return;
  endGameCleanup();
  const lvB = lvl(S.xp);
  const coins = win ? 40 : 15,
    xp = win ? 80 : 25;
  S.coins += coins;
  S.xp += xp;
  if (win) {
    S.stats.p2pWins = (S.stats.p2pWins || 0) + 1;
    S.stats.wins++;
  } else {
    S.stats.p2pLosses = (S.stats.p2pLosses || 0) + 1;
  }
  updateDailyStats(G.correct, G.errors, G.score, "duel", win);
  checkAch();
  save();
  refreshHead();
  coinBump();
  const lvA = lvl(S.xp),
    up = lvA.lv > lvB.lv;
  const foeN = oppProfile && oppProfile.name ? oppProfile.name : "对手";
  const roomBtns = isHost
    ? `<button class="btn y" id="btnRematch" onclick="p2pRequestRematch()">🔁 再来一局</button><button class="btn p" onclick="p2pHostDisband()">🚪 解散房间</button>`
    : `<button class="btn y" id="btnRematch" onclick="p2pRequestRematch()">🔁 再来一局</button><button class="btn b" onclick="p2pLeave()">🏠 返回主页</button>`;
  openModal(
    `<div style="text-align:center"><div class="stamp">${
      win ? "🏆 胜利！" : "💔 惜败"
    }</div><div class="sub">${
      win ? `击败了 ${foeN}` : `负于 ${foeN}`
    }</div>${
      up ? `<div class="lvlup">🎉 升级！LV ${lvA.lv}</div>` : ""
    }<div class="rgrid"><div class="rcell"><b>${
      G.correct
    }</b><span>拼对单词</span></div><div class="rcell"><b>${
      G.errors
    }</b><span>失误次数</span></div><div class="rcell"><b>${coins}</b><span>金币入账</span></div><div class="rcell"><b>${xp}</b><span>经验值</span></div></div><div class="mbtns">${roomBtns}</div></div>`
  );
  p2pRematchMe = false;
  p2pRematchFoe = false;
  p2pData = {
    myProgress: 0,
    oppProgress: 0,
    myErrors: 0,
    oppErrors: 0,
    myDone: false,
    oppDone: false,
    words: [],
  };
}
/* ---------- 单挑：再来一局 / 解散 / 退出 ---------- */
function p2pRequestRematch() {
  if (p2pRematchMe || !conn) return;
  p2pRematchMe = true;
  const b = $("#btnRematch");
  if (b) b.innerHTML = "⏳ 等待对方确认...";
  sendP2P({ type: "rematch" });
  // 房主：若对方也已准备，立即生成统一词表开局
  if (isHost && p2pRematchFoe) p2pHostStartDuel();
}
function p2pCleanup() {
  isHost = false;
  p2pReady = false;
  p2pRoom = null;
  p2pMode = null;
  oppProfile = null;
  p2pRematchMe = false;
  p2pRematchFoe = false;
  hostConns = {};
  members = {};
  myPeerId = null;
  p2pState = "lobby";
  roomScores = {};
  roomResults = {};
  roomEnded = false;
  roomSettled = false;
  p2pSelBook = "mix";
  p2pRoundWords = null;
  p2pStarting = false;
}
function p2pLeave() {
  if (G && G.type === "p2p") {
    endGameCleanup();
    G = null;
  }
  roomSettleFinal();
  if (conn) {
    try {
      conn.close();
    } catch (e) {}
    conn = null;
  }
  if (peer) {
    try {
      peer.destroy();
    } catch (e) {}
    peer = null;
  }
  p2pCleanup();
  closeModal();
  go("scr-home");
}
function p2pHostDisband() {
  if (p2pMode === "room") roomBroadcast({ type: "disband" });
  else sendP2P({ type: "disband" });
  setTimeout(() => {
    for (const m of Object.values(hostConns)) {
      try {
        m.conn && m.conn.close();
      } catch (e) {}
    }
    hostConns = {};
    if (peer) {
      try {
        peer.destroy();
      } catch (e) {}
      peer = null;
    }
    roomSettleFinal();
    p2pCleanup();
    closeModal();
    go("scr-home");
    toast("🚪 房间已解散");
  }, 200);
}
function endP2PBattleCleanup() {
  if (G && G.type === "p2p") {
    endGameCleanup();
    G = null;
  }
}

/* ---------- 多人房间（星型：房主为中心转发） ---------- */
function roomCreate() {
  if (peer) peer.destroy();
  roomMax = parseInt($("#p2pMax")?.value || "16", 10) || 16;
  const id = "wordrush-" + Math.random().toString(36).slice(2, 6);
  peer = new Peer(id, { debug: 2 });
  p2pRoom = id;
  isHost = true;
  p2pState = "lobby";
  hostConns = {};
  members = {};
  myPeerId = null;
  p2pSelBook = "mix";
  p2pRoundWords = null;
  p2pStarting = false;
  $("#p2pStatus").style.display = "block";
  $("#p2pStatus").innerHTML = "⏳ 创建房间中...";
  peer.on("open", () => {
    myPeerId = peer.id;
    members[myPeerId] = {
      id: myPeerId,
      profile: S.profile || {},
      prog: 0,
      errors: 0,
      correct: 0,
      done: false,
    };
    roomRenderLobby();
    toast("🏠 房间已创建", "房间码: " + id);
  });
  peer.on("connection", (c) => roomBindConn(c));
  peer.on("error", (e) => {
    $("#p2pStatus").innerHTML = "❌ 错误: " + e.message;
    toast("❌ 创建房间失败", e.message);
  });
}
function roomJoin(code) {
  code = (code !== undefined ? code : $("#p2pJoinInput").value).trim();
  if (!code) {
    toast("请输入房间码");
    return;
  }
  p2pLastRoomCode = code;
  if (peer) peer.destroy();
  peer = new Peer({ debug: 2 });
  isHost = false;
  p2pState = "lobby";
  members = {};
  p2pRoom = code;
  $("#p2pStatus").style.display = "block";
  $("#p2pStatus").innerHTML = "⏳ 连接中...";
  peer.on("open", () => {
    myPeerId = peer.id;
    conn = peer.connect(code);
    roomSetupConnection();
  });
  peer.on("error", (e) => {
    $("#p2pStatus").innerHTML = "❌ 连接失败: " + e.message;
    toast("❌ 连接失败", e.message);
  });
}
function roomSetupConnection() {
  if (!conn) return;
  conn.on("open", () => {
    p2pReady = true;
    $("#p2pStatus").innerHTML =
      '<span class="p2p-status connected"><span class="dot"></span>已连接！</span>';
    sendP2P({ type: "join", profile: S.profile || {} });
    toast("✅ 已连接房间");
  });
  conn.on("data", (d) => roomHandleData(d));
  conn.on("close", () => {
    conn = null;
    p2pReady = false;
    if (G && G.type === "p2p" && G.active) {
      endGameCleanup();
      G = null;
      openModal(
        `<h3>🔌 连接断开</h3><div class="sub">与房主的连接已断开，本局不结算</div><div class="mbtns"><button class="btn b" onclick="closeModal();go('scr-home')">返回主页</button></div>`
      );
      return;
    }
    toast("🚪 已退出房间");
    p2pCleanup();
    closeModal();
    go("scr-home");
  });
}
function roomBindConn(c) {
  hostConns[c.peer] = { conn: c };
  c.on("data", (d) => {
    if (!d) return;
    if (d.type === "join") {
      const pid = c.peer;
      if (Object.keys(members).length >= roomMax) {
        try {
          c.send({ type: "full" });
        } catch (e) {}
        return;
      }
      members[pid] = {
        id: pid,
        profile: d.profile || {},
        prog: 0,
        errors: 0,
        correct: 0,
        done: false,
      };
      roomBroadcastMembers();
      roomRenderLanes();
      if (modalOpen && $("#roomLobby")) roomRenderLobby();
    } else if (d.type === "progress") {
      const pid = c.peer;
      if (members[pid]) {
        members[pid].prog = d.prog || 0;
        members[pid].errors = d.errors || 0;
        members[pid].correct = d.correct || 0;
      }
      roomBroadcast({
        type: "progress",
        from: pid,
        prog: d.prog || 0,
        errors: d.errors || 0,
        correct: d.correct || 0,
      });
      roomRenderLanes();
    } else if (d.type === "done") {
      const pid = c.peer;
      if (members[pid]) {
        members[pid].done = true;
        members[pid].errors = d.errors || 0;
        members[pid].time = d.time || 0;
      }
      if (!roomResults[pid]) roomResults[pid] = { time: d.time || 999, errors: d.errors || 0 };
      roomBroadcast({ type: "done", from: pid, time: d.time || 0, errors: d.errors || 0 });
      roomRenderLanes();
      if (p2pState === "playing" && !roomEnded) roomCheckAllDone();
    }
  });
  c.on("close", () => {
    const pid = c.peer;
    delete hostConns[pid];
    delete members[pid];
    roomBroadcastMembers();
    roomRenderLanes();
    if (modalOpen && $("#roomLobby")) roomRenderLobby();
  });
}
function roomHandleData(d) {
  if (!d) return;
  if (d.type === "members") {
    const wasPlaying = p2pState === "playing";
    members = {};
    (d.members || []).forEach((m) => (members[m.id] = m));
    roomScores = d.scores || roomScores;
    p2pState = d.playing ? "playing" : "lobby";
    if (isHost && (wasPlaying || p2pState === "playing")) roomRenderLanes();
    else roomRenderLobby();
  } else if (d.type === "full") {
    toast("❌ 房间已满");
    p2pLeave();
  } else if (d.type === "start") {
    // 使用房主分发的统一词表
    if (d.words) p2pRoundWords = d.words;
    p2pStarting = false;
    p2pState = "playing";
    startP2PBattle();
  } else if (d.type === "disband") {
    toast("🚪 房主已解散房间");
    p2pLeave();
  } else if (d.type === "round_end") {
    roomScores = d.scores || roomScores;
    roomEndRound(d.results || {});
  } else if (d.type === "progress") {
    if (members[d.from]) {
      members[d.from].prog = d.prog || 0;
      members[d.from].errors = d.errors || 0;
      members[d.from].correct = d.correct || 0;
    }
    roomRenderLanes();
  } else if (d.type === "done") {
    if (members[d.from]) {
      members[d.from].done = true;
      members[d.from].errors = d.errors || 0;
      members[d.from].time = d.time || 0;
    }
    roomRenderLanes();
  }
}
function roomBroadcast(msg) {
  for (const m of Object.values(hostConns)) {
    if (m.conn && m.conn.open) {
      try {
        m.conn.send(msg);
      } catch (e) {}
    }
  }
}
function roomBroadcastMembers() {
  roomBroadcast({
    type: "members",
    members: Object.values(members),
    playing: p2pState === "playing",
    scores: Object.assign({}, roomScores),
  });
}
async function roomStartGame() {
  if (!isHost || p2pStarting) return;
  p2pStarting = true;
  // 房主生成统一词表（未加载的扩展词库先惰性加载），随 start 分发给全体成员
  const words = await p2pBuildWords();
  p2pRoundWords = words;
  p2pStarting = false;
  p2pState = "playing";
  roomBroadcast({ type: "start", words });
  startP2PBattle();
}
/* 每轮倒计时（房主与成员各自计时；到 0 由房主广播本轮结束） */
function roomTick() {
  if (!G || !G.active || G.type !== "p2p") return;
  G.timeLeft = Math.max(0, G.timeLeft - 1);
  const tl = $("#timeLeft");
  if (tl) tl.textContent = G.timeLeft;
  if (G.timeLeft <= 0 && isHost && !roomEnded) roomFinishRound();
}
/* 房主：全员完成 → 提前结束本轮 */
function roomCheckAllDone() {
  if (roomEnded) return;
  if (Object.values(members).every((m) => m.done)) roomFinishRound();
}
/* 房主：结束本轮 → 按完成时间排名计分并广播 */
function roomFinishRound() {
  if (roomEnded) return;
  roomEnded = true;
  if (G && G.iv) clearInterval(G.iv);
  const scores = roomRankScores();
  for (const [pid, sc] of Object.entries(scores)) {
    roomScores[pid] = (roomScores[pid] || 0) + sc;
  }
  roomBroadcast({
    type: "round_end",
    results: Object.assign({}, roomResults),
    scores: Object.assign({}, roomScores),
  });
  roomEndRound(Object.assign({}, roomResults));
}
/* 按完成时间快慢排名计分：第 1 名 = 房间人数分，依次 -1，最后一名完成者 1 分；未完成 0 分 */
function roomRankScores() {
  const N = Object.keys(members).length;
  const finishers = Object.entries(roomResults)
    .filter(([, r]) => r && typeof r.time === "number")
    .sort((a, b) => a[1].time - b[1].time);
  const out = {};
  finishers.forEach(([pid], i) => {
    out[pid] = Math.max(1, N - i);
  });
  return out;
}
/* 本轮结束（限时排名制）：按完成用时排序结算积分 */
function roomEndRound(results) {
  if (!G || G.type !== "p2p" || !G.active) return;
  endGameCleanup();
  if (G && G.iv) clearInterval(G.iv);
  // 排名：完成者按用时升序，未完成者排最后
  const N = Object.keys(members).length;
  const rows = [];
  const finishers = Object.entries(results)
    .filter(([, r]) => r && typeof r.time === "number")
    .sort((a, b) => a[1].time - b[1].time);
  finishers.forEach(([pid, r], i) => {
    const m = members[pid] || {};
    const nm = (m.profile && m.profile.name) || (pid === myPeerId ? "你" : "玩家");
    const av = (m.profile && m.profile.avatar) || "🧑";
    rows.push({ pid, nm, av, time: r.time, errors: r.errors || 0, rank: i + 1, sc: Math.max(1, N - i), done: true });
  });
  const unDone = Object.values(members).filter((m) => !finishers.some(([pid]) => pid === m.id));
  unDone.forEach((m) => {
    rows.push({ pid: m.id, nm: (m.profile && m.profile.name) || "玩家", av: (m.profile && m.profile.avatar) || "👤", time: null, errors: 0, rank: rows.length + 1, sc: 0, done: false });
  });
  rows.sort((a, b) => a.rank - b.rank);
  const myRank = rows.find((r) => r.pid === myPeerId);
  const mySc = myRank ? myRank.sc : 0;
  // 记录乱斗一轮到每日统计（第一名计入 roomWin）
  const roomWin = !!(myRank && myRank.rank === 1);
  S.stats.roomRounds = (S.stats.roomRounds || 0) + 1;
  if (roomWin) S.stats.roomWins = (S.stats.roomWins || 0) + 1;
  updateDailyStats(G.correct || 0, G.errors || 0, 0, "room", roomWin);
  const rankRows = rows
    .map(
      (r) =>
        `<div class="room-mem"><span>${["🥇", "🥈", "🥉"][r.rank - 1] || r.rank + "."} ${r.av} ${escHtml(r.nm)}${
          r.pid === myPeerId ? "（我）" : ""
        }</span><b style="color:${r.sc > 0 ? "var(--c-y)" : "var(--sub)"}">${
          r.done ? r.time.toFixed(1) + "s" : "未完成"
        } · ${r.sc > 0 ? "+" + r.sc + " 分" : "0 分"}</b></div>`
    )
    .join("");
  const stamp =
    myRank && myRank.rank === 1
      ? "🏆 本轮第一！"
      : myRank && myRank.sc > 0
      ? `🥈 第 ${myRank.rank} 名`
      : "💔 本轮未完成";
  const btns = isHost
    ? `<button class="btn y" onclick="roomStartGame()">🎮 再来一局</button><button class="btn p" onclick="p2pHostDisband()">🚪 解散房间</button>`
    : `<div class="sub">等待房主开始下一局...</div><button class="btn b" onclick="p2pLeave()">🏠 退出房间</button>`;
  openModal(
    `<div style="text-align:center"><div class="stamp">${stamp}</div><div class="sub">本轮用时排名 · +${mySc} 分</div><div class="room-list" style="text-align:left">${rankRows}</div><div class="mbtns">${btns}</div></div>`
  );
}
/* 最终结算：按本场积分一次兑换金币/经验（每 1 分 = 40 金币 + 80 经验） */
let roomSettled = false;
function roomSettleFinal() {
  if (p2pMode !== "room" || roomSettled) return;
  roomSettled = true;
  const sc = roomScores[myPeerId] || 0;
  if (sc > 0) {
    const coins = sc * 40,
      xp = sc * 80;
    S.coins += coins;
    S.xp += xp;
    checkAch();
    save();
    refreshHead();
    toast(`🏁 乱斗结算：⭐${sc} 分 → 🪙${coins} + XP${xp}`);
  }
}
function roomRenderLobby() {
  const list = Object.values(members);
  const rows = list
    .map((m) => {
      const isMe = m.id === myPeerId;
      const nm = (m.profile && m.profile.name) || (isMe ? "你" : "玩家");
      const av = (m.profile && m.profile.avatar) || (isMe ? "🧑" : "👤");
      return `<div class="room-mem"><span>${av} ${escHtml(nm)}${
        isMe ? "（我）" : ""
      }</span><b style="color:var(--c-y)">⭐ ${roomScores[m.id] || 0}</b></div>`;
    })
    .join("");
  const head = isHost
    ? `<div class="sub" style="margin:12px 0 6px">选择词库（全体成员使用同一组词）：</div><div class="optrow" id="roomBkOpts" style="justify-content:center;margin-bottom:8px">${p2pBookOpts()}</div><div class="mbtns" style="margin-top:8px"><button class="btn y" onclick="roomStartGame()">🎮 开始对战（${list.length}/${roomMax}）</button><button class="btn p" onclick="p2pHostDisband()">🚪 解散房间</button></div>`
    : `<div class="sub">${
        p2pState === "playing"
          ? "🎮 对局进行中，等待下一局开始..."
          : "⏳ 等待房主选词并开始对战..."
      }</div><div class="mbtns" style="margin-top:14px"><button class="btn b" onclick="p2pLeave()">🏠 退出房间</button></div>`;
  openModal(
    `<h3>🏠 房间 <span class="room-code" style="font-size:1.15rem;letter-spacing:2px;padding:2px 12px">${p2pRoom}</span></h3><div class="sub">${
      isHost ? "你是房主" : "已加入房间"
    } · 上限 ${roomMax} 人 · 房主可随时开始</div>${p2pShareBtns("room")}<div class="room-list" id="roomLobby">${
      rows || '<div class="sub" style="padding:8px">等待成员加入...</div>'
    }</div>${head}`
  );
  if (isHost) p2pBindBookOpts("#roomBkOpts");
}
function roomRenderLanes() {
  const wrap = $("#p2pLanes");
  if (!wrap) return;
  const list = Object.values(members);
  wrap.innerHTML = list
    .map((m) => {
      const isMe = m.id === myPeerId;
      const pct = isMe ? p2pData.myProgress : m.prog || 0;
      const done = isMe ? p2pData.myDone : !!m.done;
      const nm = (m.profile && m.profile.name) || (isMe ? "你" : "玩家");
      const av = (m.profile && m.profile.avatar) || (isMe ? "🧑" : "👤");
      const mood = m.profile
        ? ((m.profile.moodEmoji || "") + (m.profile.mood ? " " + m.profile.mood : "")).trim()
        : "";
      // 实时正确/错误数：我取本局 G，他人取 members 同步值
      const correct = isMe ? (G ? G.correct : 0) : m.correct || 0;
      const errors = isMe ? (G ? G.errors : 0) : m.errors || 0;
      return `<div class="lane"><div class="nm"><span>${av} ${escHtml(nm)}${
        isMe ? "（我）" : ""
      }${done ? " ✅" : ""} <b style="color:var(--c-y)">⭐${roomScores[m.id] || 0}</b></span><span class="lane-st"><b style="color:var(--ok)">✅${correct}</b> <b style="color:var(--bad)">❌${errors}</b> · ${Math.round(
        pct
      )}%</span></div><div class="moodline">${escHtml(mood)}</div><div class="track"><div class="fill ${
        isMe ? "me" : "foe"
      }" style="width:${clamp(pct / 100, 0, 1) * 100}%"></div></div></div>`;
    })
    .join("");
}

/* ---------- 邀请链接：自动加入 ---------- */
/* 通过邀请链接进入：打开对应模式弹窗、填入房间码并立即连接房主 */
function p2pAutoJoin(code, mode) {
  p2pLastRoomCode = code;
  if (mode === "room") {
    openRoomMode();
    roomShowJoin();
    $("#p2pJoinInput").value = code;
    toast("🔗 正在通过邀请链接加入乱斗房间...");
    roomJoin(code);
  } else {
    openDuelMode();
    p2pShowJoin();
    $("#p2pJoinInput").value = code;
    toast("🔗 正在通过邀请链接加入单挑房间...");
    p2pJoinRoom(code);
  }
}
/* 启动时检测邀请链接 ?room=<房间码>&mode=duel|room → 等 PeerJS（defer 加载）就绪后自动加入 */
(function checkP2PInvite() {
  const params = new URLSearchParams(location.search);
  const code = params.get("room");
  if (!code) return;
  const mode = params.get("mode") === "room" ? "room" : "duel";
  // 清掉邀请参数，避免刷新/收藏导致重复自动加入
  try {
    const u = new URL(location.href);
    u.searchParams.delete("room");
    u.searchParams.delete("mode");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  } catch (e) {}
  let tries = 0;
  const timer = setInterval(() => {
    if (typeof Peer !== "undefined") {
      clearInterval(timer);
      setTimeout(() => p2pAutoJoin(code, mode), 300);
    } else if (++tries > 60) {
      clearInterval(timer);
      toast("⚠️ 联机组件加载失败，请检查网络后手动输入房间码：" + code);
    }
  }, 200);
})();

/* ================= 游戏核心 ================= */
let G = null;
document.addEventListener("keydown", (e) => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if ($("#scr-home").classList.contains("on")) {
    const key = e.key.toLowerCase();
    if (key >= "1" && key <= "9") {
      const idx = parseInt(key) - 1;
      const b = bookOf(S.curBook);
      if (idx < b.units.length && idx <= (S.prog[b.id]?.cleared || 0)) {
        clickLv(idx);
      } else {
        toast("单元未解锁或不存在");
      }
      e.preventDefault();
      return;
    }
    const map = {
      r: "#btnReview",
      w: "#btnWrong",
      m: () => openMode("memory"),
      t: () => openMode("time"),
      f: () => openMode("fall"),
      b: () => openMode("battle"),
      l: () => go("scr-table"),
      p: () => go("scr-book"),
      s: () => go("scr-shop"),
      d: () => go("scr-stats"),
    };
    if (map[key]) {
      const v = map[key];
      if (typeof v === "string") {
        const el = document.querySelector(v);
        if (el) el.click();
      } else v();
      e.preventDefault();
      return;
    }
  }
  if (e.key === "Escape") {
    handleEsc();
    return;
  }
  if (modalOpen || !G || !G.active) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length === 1) {
    e.preventDefault();
    routeChar(e.key.toLowerCase());
  }
});
/* 获取当前待输入的目标字符（用于空格替代非字母字符） */
function curTargetChar() {
  if (!G || !G.active) return null;
  if (G.type === "run" || G.type === "battle" || G.type === "p2p") {
    const it = G.queue[G.idx];
    return it ? it.en[G.typed] : null;
  }
  if (G.type === "mem") {
    const it = cur();
    return it ? it.en[G.typed] : null;
  }
  if (G.type === "fall") {
    if (G.target) return G.target.it.en[G.target.matched];
    // 无锁定目标时，选位置最低（最紧急）的首字母非字母单词
    const cands = G.words.filter((w) => !/[a-z]/i.test(w.it.en[0]));
    if (cands.length) {
      const w = cands.reduce((a, b) => (a.y > b.y ? a : b));
      return w.it.en[0];
    }
    return null;
  }
  return null;
}
function routeChar(ch) {
  if (!G || !G.active) return;
  ch = String(ch).toLowerCase();
  // 屏幕键盘只有字母+空格；单词中的连字符、撇号等非字母字符统一用空格代替输入
  if (ch === " ") {
    const tc = curTargetChar();
    if (tc && !/[a-z]/.test(tc)) ch = tc.toLowerCase();
  }
  if (G.type === "run") onRunChar(ch);
  else if (G.type === "fall") onFallChar(ch);
  else if (G.type === "battle") onBattleChar(ch);
  else if (G.type === "mem") onMemChar(ch);
  else if (G.type === "p2p") onP2PChar(ch);
}

function handleEsc() {
  if (modalOpen) {
    closeModal();
    return;
  }
  if (G && G.active) {
    openModal(
      `<h3>PAUSE</h3><div class="sub">确定退出本局吗？当前进度不会保存。</div><div class="mbtns"><button class="btn c" onclick="closeModal()">继续战斗</button><button class="btn p" onclick="quitGame()">退出</button></div>`
    );
  } else if ($("#scr-game").classList.contains("on")) go("scr-home");
}
window.quitGame = () => {
  closeModal();
  if (G && G.type === "p2p") {
    if (isHost) p2pHostDisband();
    else p2pLeave();
    return;
  }
  endGameCleanup();
  go("scr-home");
};
function endGameCleanup() {
  if (!G) return;
  G.active = false;
  G.seq = (G.seq || 0) + 1;
  if (G.raf) cancelAnimationFrame(G.raf);
  if (G.iv) clearInterval(G.iv);
  refreshOsk();
}
async function countdown() {
  if (!G) return;
  G.started = false;
  const c = document.createElement("div");
  c.id = "count";
  const st = $("#arenaWrap .stage");
  if (!st) return;
  st.appendChild(c);
  for (const t of ["3", "2", "1", "GO!"]) {
    if (!G || !G.active) return;
    c.innerHTML = `<span>${t}</span>`;
    beep(t === "GO!" ? 880 : 520, 0.1, "triangle", 0.05);
    await sleep(620);
  }
  c.remove();
  if (G) G.started = true;
}
function hudHTML(mc, title, mid, right) {
  return `<div class="hud"><div class="hl"><span class="badge" style="--mc:${mc}">${title}</span>${mid}</div><div class="hl">${right}<button class="iconbtn" onclick="handleEsc()" title="退出/暂停">✕</button></div></div>`;
}
function itemBtns(show) {
  return `<button class="ibtn" id="ibHint" ${
    show.hint ? "" : 'style="display:none"'
  } onclick="useHint()">✏️<small id="nHint">${S.items.hint}</small></button>
<button class="ibtn" id="ibTime" ${
    show.time ? "" : 'style="display:none"'
  } onclick="useTime()">⏳<small id="nTime">${S.items.time}</small></button>
<button class="ibtn" id="ibShield" ${
    show.shield ? "" : 'style="display:none"'
  } onclick="useShield()">🛡️<small id="nShield">${
    S.items.shield
  }</small></button>`;
}
function refreshItems() {
  ["Hint", "Time", "Shield"].forEach((k) => {
    const el = $("#n" + k);
    if (el) el.textContent = S.items[k.toLowerCase()];
    const b = $("#ib" + k);
    if (b) b.disabled = S.items[k.toLowerCase()] <= 0;
  });
}
window.useHint = () => {
  if (!G || !G.active || !G.started || G.type !== "run" || S.items.hint <= 0)
    return;
  const it = G.queue[G.idx];
  if (!it) return;
  S.items.hint--;
  save();
  refreshItems();
  let n = 2;
  while (n-- > 0 && G.typed < it.en.length) goodChar();
};
window.useTime = () => {
  if (!G || !G.active || G.mode !== "time" || S.items.time <= 0) return;
  S.items.time--;
  save();
  refreshItems();
  G.timeLeft += 15;
  floaty(innerWidth / 2, 140, "+15s", "var(--c-c)");
  sShield();
};
window.useShield = () => {
  if (!G || !G.active || G.shield || S.items.shield <= 0) return;
  if (G.type !== "run" && G.type !== "fall") return;
  S.items.shield--;
  save();
  refreshItems();
  G.shield = true;
  toast("🛡️ 护盾已激活", "抵挡下一次失误");
  sShield();
};
function paintWord(el, word, typed, err) {
  el.innerHTML = [...word]
    .map((ch, i) => {
      const c = ch === " " ? "&nbsp;" : escHtml(ch);
      let cls =
        i < typed ? "l ok" : i === typed ? "l cur" + (err ? " err" : "") : "l";
      return `<span class="${cls}">${c}</span>`;
    })
    .join("");
}

/* ---------- 单元闯关 / 限时 / 复习 ---------- */
window.startLevel = (bookId, ui) => {
  const b = bookOf(bookId),
    u = b.units[ui];
  let queue = b.items.filter((it) => it.ui === ui);
  if (S.set.wordOrder === "random") queue = shuffle(queue);
  startRun({
    mode: "level",
    bookId,
    li: ui,
    title: `${u.s} ${u.n}`,
    queue: queue,
    lives: 3,
  });
};
window.startTime = (pool) => {
  let queue = [...pool];
  if (S.set.wordOrder === "random") queue = shuffle(queue);
  startRun({ mode: "time", title: "限时冲刺", queue: queue, time: 60 });
};
function startRun(cfg) {
  let queue = [...cfg.queue];
  // keepOrder：扩展词库每日精练已按 顺序/逆序/随机 排好，不再受全局随机开关影响
  if (!cfg.keepOrder && S.set.wordOrder === "random") queue = shuffle(queue);
  endGameCleanup();
  G = {
    type: "run",
    mode: cfg.mode,
    cfg,
    queue: queue,
    idx: 0,
    typed: 0,
    curErrs: 0,
    errors: 0,
    correct: 0,
    score: 0,
    combo: 0,
    best: 0,
    lives: cfg.lives || 0,
    timeLeft: cfg.time || 0,
    wrong: [],
    retried: new Set(),
    shield: false,
    active: true,
    started: false,
  };
  S.stats.games++;
  save();
  go("scr-game");
  const mc =
    cfg.mode === "level"
      ? "var(--c-y)"
      : cfg.mode === "time"
      ? "var(--c-c)"
      : "var(--c-b)";
  const mid =
    cfg.mode === "time"
      ? `<span class="pill">⏱ <b id="tLeft">${cfg.time}</b>s</span>`
      : `<span class="pill">进度 <b id="prog">1/${queue.length}</b></span>`;
  const right = `${
    cfg.mode === "level" ? `<span class="hearts" id="hearts">♥♥♥</span>` : ""
  }
   <span class="pill">🔥 <b id="combo">0</b></span><span class="pill">得分 <b id="score">0</b></span>
   ${itemBtns({
     hint: true,
     time: cfg.mode === "time",
     shield: cfg.mode === "level",
   })}`;
  const hd =
    cfg.mode === "level"
      ? `${cfg.title} · ${bookOf(cfg.bookId).name.split(" · ")[0]}`
      : `${cfg.title} · ${
          cfg.mode === "time"
            ? "60 秒"
            : cfg.mode === "daily"
            ? "每日精练"
            : "记忆计划"
        }`;
  const extraHint =
    cfg.mode === "time"
      ? `<div style="font-size:0.7rem;color:var(--sub);text-align:center;margin-top:4px;">拼写正确自动朗读（🔊控制）</div>`
      : "";
  $("#arenaWrap").innerHTML =
    hudHTML(mc, hd, mid, right) +
    `<div class="stage"><div id="cardBox"></div><div class="wordbox" id="wordBox"></div>
     <button class="speakbtn" onclick="speak(queue[G.idx]&&queue[G.idx].en)">🔊 听发音</button>
     <div class="run-hint">${
       cfg.mode === "level"
         ? "键入拼写（大小写均可）· 单词内错 3 次扣一颗心"
         : "键入拼写 · 连击越高分越高"
     }</div>${extraHint}</div>`;
  refreshItems();
  showWord();
  if (cfg.mode === "time") G.iv = setInterval(tickTime, 1000);
  countdown();
  refreshOsk();
}
function showWord() {
  const it = G.queue[G.idx];
  if (!it) return;
  G.typed = 0;
  G.curErrs = 0;
  G.wordT0 = Date.now();
  $("#cardBox").innerHTML = wordCard(it, false);
  $("#wordBox").style.fontSize = wFont(it.en.length);
  paintWord($("#wordBox"), it.en, 0);
  if (G.mode !== "time" && $("#prog"))
    $("#prog").textContent = `${G.idx + 1}/${G.queue.length}`;
  if (S.set.tts && G.mode !== "time") speak(it.en);
}
function tickTime() {
  if (!G || !G.active || !G.started) return;
  G.timeLeft--;
  const t = $("#tLeft");
  if (t) t.textContent = Math.max(0, Math.ceil(G.timeLeft));
  if (G.timeLeft <= 0) finishRun(true);
}
function updateRunHud() {
  $("#combo").textContent = G.combo;
  $("#score").textContent = G.score;
  const h = $("#hearts");
  if (h)
    h.textContent =
      "♥".repeat(Math.max(0, G.lives)) + "♡".repeat(Math.max(0, 3 - G.lives));
}
function goodChar() {
  const it = G.queue[G.idx];
  G.typed++;
  sTick();
  paintWord($("#wordBox"), it.en, G.typed);
  if (G.typed >= it.en.length) runComplete();
}
function onRunChar(ch) {
  if (!G.started) return;
  const it = G.queue[G.idx];
  if (!it) return;
  if (same(ch, it.en[G.typed])) {
    goodChar();
  } else {
    if (G.shield) {
      G.shield = false;
      sShield();
      floaty(innerWidth / 2, 180, "🛡️ 抵挡!", "var(--c-c)");
      return;
    }
    G.errors++;
    G.curErrs++;
    G.combo = 0;
    sBad();
    vib(50);
    paintWord($("#wordBox"), it.en, G.typed, true);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
    updateRunHud();
    if (G.curErrs >= 3) runFailWord();
  }
}
function runFailWord() {
  const it = G.queue[G.idx];
  markWord(it, false, G.curErrs, Date.now() - (G.wordT0 || Date.now()));
  G.wrong.push(it);
  if (G.mode === "level") {
    G.lives--;
    updateRunHud();
    if (G.lives <= 0) return finishRun(false);
  }
  if (!G.retried.has(it.en.toLowerCase())) {
    G.retried.add(it.en.toLowerCase());
    G.queue.push({ ...it });
  }
  G.idx++;
  if (G.idx >= G.queue.length) finishRun(true);
  else showWord();
}
function runComplete() {
  const it = G.queue[G.idx];
  const rt = Date.now() - (G.wordT0 || Date.now());
  markWord(it, true, G.curErrs, rt);
  S.stats.words++;
  G.correct++;
  G.combo++;
  G.best = Math.max(G.best, G.combo);
  S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
  const gain = 10 + Math.min(G.combo, 20) * 2;
  G.score += gain;
  const r = $("#wordBox").getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, "var(--ok)");
  if (G.combo % 5 === 0)
    floaty(innerWidth / 2, r.top - 20, "COMBO x" + G.combo + "!", "var(--c-y)");
  floaty(r.right, r.top, "+" + gain, "var(--ok)");
  sOk();
  if (G.curErrs > 0) G.wrong.push(it);
  // 会话内滞后再现：拼对但错键多(≥2)或反应过慢的词，本局结束前再出现一次
  const slowBudget = (1200 + it.en.length * 500) * 1.6;
  const needReplay =
    G.curErrs >= 2 || (rt > 0 && rt > slowBudget);
  if (
    needReplay &&
    !G.retried.has(it.en.toLowerCase()) &&
    G.mode !== "time"
  ) {
    G.retried.add(it.en.toLowerCase());
    G.queue.push({ ...it });
    floaty(innerWidth / 2, r.top - 40, "🔁 稍后再见", "var(--c-p)");
  }
  if (G.mode === "time" && S.set.tts) speak(it.en);
  updateRunHud();
  G.idx++;
  if (G.idx >= G.queue.length) finishRun(true);
  else showWord();
}
function finishRun(victory) {
  endGameCleanup();
  updateDailyStats(G.correct, G.errors, G.score);
  save();
  let stars = 0;
  if (G.mode === "level" && victory) {
    stars = G.errors === 0 ? 3 : G.errors <= 4 ? 2 : 1;
    const pr =
      S.prog[G.cfg.bookId] ||
      (S.prog[G.cfg.bookId] = { cleared: 0, stars: {} });
    const first = !pr.stars[G.cfg.li];
    pr.stars[G.cfg.li] = Math.max(pr.stars[G.cfg.li] || 0, stars);
    pr.cleared = Math.max(pr.cleared, G.cfg.li + 1);
    if (first) {
      S.stats.unitsCleared = (S.stats.unitsCleared || 0) + 1;
    }
    if (stars === 3) S.stats.perfect++;
  }
  const coins =
      G.correct * 4 + G.best * 2 + (victory && G.mode === "level" ? 20 : 0),
    xp = G.correct * 10 + G.best * 3;
  showResult({
    stamp: victory ? (G.mode === "time" ? "TIME UP!" : "CLEAR!") : "FAILED...",
    stars: G.mode === "level" ? stars : null,
    stats: [
      ["拼对单词", G.correct],
      ["最佳连击", "×" + G.best],
      ["失误按键", G.errors],
      ["本局得分", G.score],
    ],
    coins,
    xp,
    wrong: [...new Map(G.wrong.map((w) => [w.en.toLowerCase(), w])).values()],
    restart: () => {
      if (G.mode === "level") startLevel(G.cfg.bookId, G.cfg.li);
      else startRun(G.cfg);
    },
  });
  checkAch();
}

/* ---------- 🌸 花瓣记忆 ---------- */
const PETAL_COLORS = [
  "#ffffff",
  "#ffb3c9",
  "#ff6b6b",
  "#7cc7ff",
  "#ffd84d",
  "#c6a9ff",
];
const TIER_XP = [0, 60, 150, 280, 450, 700];
function flowerSVG(petals, color, size) {
  let s = "";
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    s += `<ellipse cx="0" cy="-27" rx="13" ry="23" fill="${color}" stroke="rgba(0,0,0,.25)" stroke-width="2.5" transform="rotate(${a})"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="-55 -55 110 110">${s}<circle r="15" fill="#ffd93b" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/></svg>`;
}
window.startMemory = (pool) => {
  endGameCleanup();
  if (!pool || !pool.length)
    pool = ALL.filter((w) => !w.phrase && w.en.length <= 12);
  let queue = [...pool];
  if (S.set.wordOrder === "random") queue = shuffle(queue);
  queue = queue.slice(0, 10);
  G = {
    type: "mem",
    pool,
    queue: queue,
    idx: 0,
    phase: "show",
    focus: -1,
    typed: 0,
    errsPos: {},
    correct: 0,
    perfectN: 0,
    errors: 0,
    streak: 0,
    best: 0,
    score: 0,
    sxp: 0,
    tier: 0,
    seq: 0,
    active: true,
    started: false,
    wrong: [],
  };
  S.stats.games++;
  save();
  go("scr-game");
  $("#arenaWrap").innerHTML =
    hudHTML(
      "#ff8fb3",
      "花瓣记忆 · PETAL MEMORY",
      `<span class="pill">单词 <b id="mIdx">1/${queue.length}</b></span>`,
      `<span class="pill">🌸 连对 <b id="mStreak">0</b></span><span class="pill">得分 <b id="mScore">0</b></span>`
    ) +
    `<div class="stage florr" id="memStage">
    <div class="flower-wrap" id="flowerWrap">${flowerSVG(
      5,
      "#ffffff",
      104
    )}<div class="flower-lv" id="flowerLv">LV 1 · 白花</div></div>
    <div id="memCn"></div>
    <div class="fword" id="memWord"></div>
    <div class="mem-msg" id="memMsg"></div></div>`;
  G.iv = setInterval(() => {
    if (G && G.active && G.type === "mem") {
      const p = document.createElement("span");
      p.className = "pfloat";
      p.textContent = pick(["🌸", "🌼", ""]);
      p.style.left = rnd(2, 94) + "%";
      p.style.fontSize = rnd(12, 22) + "px";
      p.style.animationDuration = rnd(4, 7) + "s";
      $("#memStage").appendChild(p);
      setTimeout(() => p.remove(), 7200);
    }
  }, 900);
  countdown().then(() => {
    if (G && G.active) memShow();
  });
  refreshOsk();
};
const cur = () => G.queue[G.idx];
const setMsg = (t) => {
  const m = $("#memMsg");
  if (m) m.textContent = t;
};
function memPaint() {
  const it = cur();
  $("#memWord").innerHTML = [...it.en]
    .map((ch, i) => {
      const c = ch === " " ? "&nbsp;" : escHtml(ch);
      if (G.phase === "show")
        return `<span class="fl ${i === G.focus ? "focus" : ""}">${c}</span>`;
      if (G.phase === "hide")
        return i < G.typed
          ? `<span class="fl mok">${c}</span>`
          : `<span class="fl hid" id="ms${i}">?</span>`;
      return `<span class="fl ${G.errsPos[i] ? "warn" : "mok"}">${c}</span>`;
    })
    .join("");
}
async function memShow() {
  if (!G || !G.active) return;
  G.phase = "show";
  G.focus = -1;
  const it = cur(),
    my = ++G.seq;
  $("#memCn").innerHTML = wordCard(it, true);
  $("#memWord").style.fontSize = wFont(it.en.length);
  memPaint();
  setMsg("👀 记住拼写 · 逐字母拼读中…");
  for (let i = 0; i < it.en.length; i++) {
    if (!G || !G.active || G.seq !== my) return;
    await sleep(560);
    G.focus = i;
    memPaint();
    if (it.en[i] !== " ") {
      speak(it.en[i]);
      beep(480 + i * 36, 0.06, "sine", 0.03);
    }
  }
  await sleep(650);
  if (!G || !G.active || G.seq !== my) return;
  speak(it.en);
  setMsg("🧠 整词再听一遍，默记拼写…");
  await sleep(1300);
  if (!G || !G.active || G.seq !== my) return;
  memHide();
}
function memHide() {
  G.phase = "hide";
  G.typed = 0;
  G.errsPos = {};
  G.wordT0 = Date.now();
  memPaint();
  setMsg("✍️ 凭记忆拼出它！正确字母会逐个点亮");
}
function onMemChar(ch) {
  if (!G.started || G.phase !== "hide") return;
  const it = cur();
  if (same(ch, it.en[G.typed])) {
    G.typed++;
    sTick();
    memPaint();
    const slot = $("#memWord").children[G.typed - 1];
    if (slot) {
      const r = slot.getBoundingClientRect();
      spawnOrb(r.left + r.width / 2, r.top + r.height / 2);
    }
    G.score += 2;
    $("#mScore").textContent = G.score;
    if (G.typed >= it.en.length) memDone();
  } else {
    G.errors++;
    G.errsPos[G.typed] = (G.errsPos[G.typed] || 0) + 1;
    sBad();
    vib(50);
    const slot = $("#ms" + G.typed);
    if (slot) {
      slot.classList.add("err");
      setTimeout(() => slot.classList.remove("err"), 220);
    }
    const bee = document.createElement("span");
    bee.className = "bee";
    bee.textContent = "🐝";
    $("#memStage").appendChild(bee);
    setTimeout(() => bee.remove(), 1200);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
  }
}
function spawnOrb(x, y) {
  const o = document.createElement("span");
  o.className = "orb";
  o.style.left = x + "px";
  o.style.top = y + "px";
  document.body.appendChild(o);
  const f = $("#flowerWrap").getBoundingClientRect();
  requestAnimationFrame(() => {
    o.style.transform = `translate(${f.left + f.width / 2 - x}px,${
      f.top + f.height / 2 - y
    }px) scale(.4)`;
    o.style.opacity = ".25";
  });
  setTimeout(() => {
    o.remove();
    const w = $("#flowerWrap");
    if (w) {
      w.classList.remove("pulse");
      void w.offsetWidth;
      w.classList.add("pulse");
    }
  }, 620);
}
async function memDone() {
  const it = cur(),
    my = ++G.seq;
  G.phase = "done";
  const errCount = Object.values(G.errsPos).reduce((a, b) => a + b, 0),
    perfect = errCount === 0;
  markWord(it, true, errCount, Date.now() - (G.wordT0 || Date.now()));
  S.stats.words++;
  S.stats.memPerfect = (S.stats.memPerfect || 0) + (perfect ? 1 : 0);
  G.correct++;
  if (perfect) {
    G.perfectN++;
    G.streak++;
    G.best = Math.max(G.best, G.streak);
  } else {
    G.streak = 0;
    G.wrong.push(it);
  }
  S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
  G.score += it.en.length * 5 + (perfect ? 15 : 0) + G.streak * 3;
  G.sxp += it.en.length * 4 + (perfect ? 20 : 5);
  memPaint();
  $("#mStreak").textContent = G.streak;
  $("#mScore").textContent = G.score;
  const badPos = Object.keys(G.errsPos)
    .map(Number)
    .map((i) => i + 1);
  setMsg(
    perfect
      ? "🌼 完美拼写！花瓣更盛了"
      : `💡 提示：第 ${badPos.join("、")} 个字母拼错了，重点记它！`
  );
  speak(it.en);
  if (perfect) sOk();
  const r = $("#memWord").getBoundingClientRect();
  burst(
    r.left + r.width / 2,
    r.top + r.height / 2,
    perfect ? "#ffb3c9" : "#ffe14d"
  );
  updateFlower();
  await sleep(perfect ? 1700 : 2300);
  if (!G || !G.active || G.seq !== my) return;
  G.idx++;
  if (G.idx >= G.queue.length) return finishMemory();
  $("#mIdx").textContent = `${G.idx + 1}/${G.queue.length}`;
  memShow();
}
function updateFlower() {
  let t = 0;
  for (let i = 0; i < TIER_XP.length; i++) if (G.sxp >= TIER_XP[i]) t = i;
  const petals = 5 + Math.min(6, G.streak);
  if (t !== G.tier) {
    G.tier = t;
    toast(
      "🌸 花朵升级！",
      "花瓣变为 " + ["白色", "粉色", "红色", "蓝色", "金色", "紫色"][t]
    );
    sWin();
  }
  $("#flowerWrap").innerHTML =
    flowerSVG(petals, PETAL_COLORS[G.tier], 104) +
    `<div class="flower-lv">LV ${G.tier + 1} · ${
      ["白花", "粉花", "红花", "蓝花", "金花", "紫花"][G.tier]
    } · ${petals}瓣</div>`;
}
function finishMemory() {
  endGameCleanup();
  updateDailyStats(G.correct, G.errors, G.score);
  save();
  showResult({
    stamp: "BLOOM!",
    stats: [
      ["完美拼写", G.perfectN + "/" + G.queue.length],
      ["最佳连对", "×" + G.best],
      ["失误按键", G.errors],
      ["本局得分", G.score],
    ],
    coins: G.correct * 4 + G.perfectN * 5 + G.best * 2,
    xp: G.correct * 12 + G.perfectN * 6,
    wrong: G.wrong,
    restart: () => openMode("memory"),
  });
}

/* ---------- 陨石单词 ---------- */
window.startFalling = (pool) => {
  endGameCleanup();
  if (!pool.length) pool = ALL.filter((w) => !w.phrase && w.en.length <= 10);
  let wordPool = [...pool];
  if (S.set.wordOrder === "random") wordPool = shuffle(wordPool);
  G = {
    type: "fall",
    pool: wordPool,
    words: [],
    target: null,
    lives: 3,
    score: 0,
    combo: 0,
    best: 0,
    correct: 0,
    errors: 0,
    spawnAcc: 1e9,
    active: true,
    started: false,
    wrong: [],
    shield: false,
    t0: 0,
  };
  S.stats.games++;
  save();
  go("scr-game");
  $("#arenaWrap").innerHTML =
    hudHTML(
      "var(--c-p)",
      "陨石单词 · WORD FALL",
      `<span class="hearts" id="hearts">♥♥♥</span>`,
      `<span class="pill">🔥 <b id="combo">0</b></span><span class="pill">得分 <b id="score">0</b></span>${itemBtns(
        { hint: false, time: false, shield: true }
      )}`
    ) +
    `<div class="stage" style="padding:18px;justify-content:flex-start"><div class="fall-area" id="fallArea"></div>
     <div class="fall-input" id="fallInput">— 输入首字母锁定单词 —</div>
     <div class="run-hint">单词坠到底线将损失一颗心 · 拼错会丢失锁定</div>
     <div style="font-size:0.7rem;color:var(--sub);text-align:center;margin-top:4px;">拼写正确自动朗读（🔊控制）</div></div>`;
  refreshItems();
  G.raf = requestAnimationFrame(fallLoop);
  countdown();
  refreshOsk();
};
let fallLast = 0;
function fallLoop(ts) {
  if (!G || !G.active || G.type !== "fall") return;
  G.raf = requestAnimationFrame(fallLoop);
  const area = $("#fallArea");
  if (!area) return;
  if (!G.started) {
    fallLast = ts;
    return;
  }
  const dt = clamp(ts - fallLast, 0, 50) / 1000;
  fallLast = ts;
  if (!G.t0) G.t0 = ts;
  const el = (ts - G.t0) / 1000;
  G.spawnAcc += dt * 1000;
  const gap = Math.max(1000, 2500 - el * 14);
  if (G.spawnAcc > gap && G.words.length < 7) {
    G.spawnAcc = 0;
    spawnFall();
  }
  const H = area.clientHeight,
    spd = 30 + el * 0.9;
  for (const w of [...G.words]) {
    w.y += spd * dt;
    w.el.style.top = w.y + "px";
    if (w.y > H - 56) bottomHit(w);
  }
}
function spawnFall() {
  const cand = G.pool.filter((p) => !G.words.some((w) => w.it.en === p.en));
  if (!cand.length) return;
  const it = pick(cand),
    el = document.createElement("div");
  el.className = "fword-f";
  el.innerHTML = escHtml(it.en);
  el.style.left = rnd(4, innerWidth < 640 ? 45 : 66) + "%";
  el.style.top = "-44px";
  $("#fallArea").appendChild(el);
  G.words.push({ it, el, y: -44, matched: 0, errs: 0, t: Date.now() });
}
function paintFall(w) {
  w.el.innerHTML = [...w.it.en]
    .map((c, i) =>
      i < w.matched ? `<span class="ok">${c}</span>` : escHtml(c)
    )
    .join("");
}
function onFallChar(ch) {
  if (!G.started) return;
  if (!G.target) {
    const cands = G.words.filter((w) => same(w.it.en[0], ch));
    if (!cands.length) return fallMiss();
    G.target = cands.reduce((a, b) => (a.y > b.y ? a : b));
    G.target.matched = 1;
    G.target.el.classList.add("target");
    paintFall(G.target);
    sTick();
    paintFallInput();
  } else {
    const w = G.target;
    if (same(ch, w.it.en[w.matched])) {
      w.matched++;
      sTick();
      paintFall(w);
      paintFallInput();
      if (w.matched >= w.it.en.length) destroyFall(w);
    } else fallMiss();
  }
}
function paintFallInput() {
  const i = $("#fallInput");
  if (!G.target) {
    i.textContent = "— 输入首字母锁定单词 —";
    return;
  }
  const w = G.target;
  i.innerHTML = [...w.it.en]
    .map((c, k) =>
      k < w.matched ? `<span style="color:var(--ok)">${c}</span>` : c
    )
    .join("");
}
function fallMiss() {
  if (G.shield) {
    G.shield = false;
    sShield();
    floaty(innerWidth / 2, 200, "🛡️ 抵挡!", "var(--c-c)");
    return;
  }
  G.errors++;
  G.combo = 0;
  sBad();
  vib(50);
  if (G.target) {
    G.target.errs++;
    G.target.el.classList.remove("target");
    G.target = null;
  }
  paintFallInput();
  $("#combo").textContent = 0;
  const st = $("#arenaWrap .stage");
  if (st) {
    st.classList.add("shake");
    setTimeout(() => st.classList.remove("shake"), 320);
  }
}
function destroyFall(w) {
  const r = w.el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top, "var(--c-y)");
  markWord(w.it, true, w.errs, Date.now() - (w.t || Date.now()));
  S.stats.words++;
  G.correct++;
  G.combo++;
  G.best = Math.max(G.best, G.combo);
  S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
  const gain = w.it.en.length * 5 + Math.min(G.combo, 15) * 2;
  G.score += gain;
  floaty(r.left, r.top, "+" + gain, "var(--c-y)");
  sOk();
  if (S.set.tts) speak(w.it.en);
  if (G.combo % 5 === 0)
    floaty(innerWidth / 2, r.top - 14, "COMBO x" + G.combo + "!", "var(--c-p)");
  w.el.remove();
  G.words = G.words.filter((x) => x !== w);
  G.target = null;
  paintFallInput();
  $("#combo").textContent = G.combo;
  $("#score").textContent = G.score;
}
function bottomHit(w) {
  markWord(w.it, false, 1, Date.now() - (w.t || Date.now()));
  if (!G.wrong.some((x) => same(x.en, w.it.en))) G.wrong.push(w.it);
  if (G.target === w) {
    G.target = null;
    paintFallInput();
  }
  w.el.remove();
  G.words = G.words.filter((x) => x !== w);
  G.lives--;
  G.combo = 0;
  sBad();
  vib(60);
  $("#hearts").textContent =
    "♥".repeat(Math.max(0, G.lives)) + "♡".repeat(Math.max(0, 3 - G.lives));
  $("#combo").textContent = 0;
  const st = $("#arenaWrap .stage");
  if (st) {
    st.classList.add("shake");
    setTimeout(() => st.classList.remove("shake"), 320);
  }
  if (G.lives <= 0) endFall();
}
function endFall() {
  endGameCleanup();
  updateDailyStats(G.correct, G.errors, G.score);
  save();
  showResult({
    stamp: "GAME OVER",
    stats: [
      ["击碎单词", G.correct],
      ["最佳连击", "×" + G.best],
      ["漏掉/失误", G.errors],
      ["本局得分", G.score],
    ],
    coins: G.correct * 4 + G.best * 2,
    xp: G.correct * 10 + G.best * 3,
    wrong: G.wrong,
    restart: () => startFalling(G.pool),
  });
}

/* ---------- 对战竞技场 ---------- */
const BOTS = {
  easy: { n: "🐢 机器人·轻松", s: 1.35 },
  mid: { n: "🐇 机器人·进阶", s: 2.35 },
  hard: { n: "🦅 机器人·精英", s: 3.45 },
};
window.startBattle = (btype, diff, pool) => {
  endGameCleanup();
  let q = shuffle(pool.filter((w) => w.en.length <= 12)).slice(0, 8);
  if (S.set.wordOrder === "sequential")
    q = pool.filter((w) => w.en.length <= 12).slice(0, 8);
  const total = q.reduce((a, w) => a + w.en.length, 0);
  G = {
    type: "battle",
    btype,
    diff,
    queue: q,
    total,
    idx: 0,
    typed: 0,
    errors: 0,
    correct: 0,
    combo: 0,
    best: 0,
    chars: 0,
    botChars: 0,
    bot: btype === "bot" ? BOTS[diff] : null,
    phase: 1,
    p: [],
    t0: 0,
    active: true,
    started: false,
    wrong: [],
  };
  S.stats.games++;
  save();
  go("scr-game");
  renderBattle();
  G.raf = requestAnimationFrame(battleLoop);
  countdown();
  refreshOsk();
};
function renderBattle() {
  const foe = G.bot ? G.bot.n : "🎮 玩家二";
  $("#arenaWrap").innerHTML =
    hudHTML(
      "var(--c-y)",
      `对战竞技场 · ${G.btype === "2p" ? "双人轮流" : "人机竞速"}`,
      `<span class="pill">单词 <b id="bIdx">1/${G.queue.length}</b></span>`,
      `<span class="pill">🔥 <b id="combo">0</b></span>`
    ) +
    `<div class="stage"><div class="lanes">
    <div class="lane"><div class="nm"><span>🧑‍ ${
      G.btype === "2p" ? (G.phase === 1 ? "玩家一" : "玩家二") : "你"
    }</span><span id="meP">0%</span></div><div class="track"><div class="fill me" id="meFill"></div><span class="racer" id="meR">🚀</span></div></div>
    <div class="lane"><div class="nm"><span>${foe}</span><span id="foeP">0%</span></div><div class="track"><div class="fill foe" id="foeFill"></div><span class="racer" id="foeR">${
      G.bot ? "🤖" : "🎮"
    }</span></div></div>
   </div>
   <div id="cardBox"></div><div class="wordbox" id="wordBox"></div>
   <div class="run-hint">抢先拼完全部 ${
     G.queue.length
   } 个单词即获胜！</div></div>`;
  showBattleWord();
  updateLanes();
}
function showBattleWord() {
  const it = G.queue[G.idx];
  G.typed = 0;
  G.wordT0 = Date.now();
  $("#cardBox").innerHTML = wordCard(it, true);
  $("#wordBox").style.fontSize = wFont(it.en.length);
  paintWord($("#wordBox"), it.en, 0);
  $("#bIdx").textContent = `${G.idx + 1}/${G.queue.length}`;
}
let bLast = 0;
function battleLoop(ts) {
  if (!G || !G.active || G.type !== "battle") return;
  G.raf = requestAnimationFrame(battleLoop);
  if (!G.started) {
    bLast = ts;
    return;
  }
  if (!G.t0) G.t0 = performance.now();
  const dt = clamp(ts - bLast, 0, 50) / 1000;
  bLast = ts;
  if (G.bot) {
    G.botChars += G.bot.s * dt * (0.88 + Math.random() * 0.24);
    if (G.botChars >= G.total) return battleEnd(false);
  }
  updateLanes();
}
function updateLanes() {
  const mp = clamp(G.chars / G.total, 0, 1),
    fp = clamp((G.bot ? G.botChars : 0) / G.total, 0, 1);
  $("#meFill").style.width = mp * 100 + "%";
  $("#meR").style.left = mp * 100 + "%";
  $("#meP").textContent = Math.round(mp * 100) + "%";
  $("#foeFill").style.width = fp * 100 + "%";
  $("#foeR").style.left = fp * 100 + "%";
  $("#foeP").textContent = Math.round(fp * 100) + "%";
}
function onBattleChar(ch) {
  if (!G.started) return;
  const it = G.queue[G.idx];
  if (same(ch, it.en[G.typed])) {
    G.typed++;
    G.chars++;
    sTick();
    paintWord($("#wordBox"), it.en, G.typed);
    updateLanes();
    if (G.typed >= it.en.length) {
      markWord(it, true, 0, Date.now() - (G.wordT0 || Date.now()));
      S.stats.words++;
      G.correct++;
      G.combo++;
      G.best = Math.max(G.best, G.combo);
      S.stats.bestCombo = Math.max(S.stats.bestCombo, G.best);
      $("#combo").textContent = G.combo;
      sOk();
      const r = $("#wordBox").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, "var(--c-y)");
      G.idx++;
      if (G.idx >= G.queue.length) return battleEnd(true);
      showBattleWord();
    }
  } else {
    G.errors++;
    G.combo = 0;
    $("#combo").textContent = 0;
    sBad();
    vib(50);
    paintWord($("#wordBox"), it.en, G.typed, true);
    const st = $("#arenaWrap .stage");
    if (st) {
      st.classList.add("shake");
      setTimeout(() => st.classList.remove("shake"), 320);
    }
  }
}
function battleEnd(win) {
  endGameCleanup();
  if (G.btype !== "2p" || G.phase === 1) {
    updateDailyStats(G.correct, G.errors, G.score, "battle");
  }
  if (G.btype === "2p") {
    const rec = {
      time: G.t0 ? (performance.now() - G.t0) / 1000 : 0,
      errors: G.errors,
    };
    G.p.push(rec);
    if (G.phase === 1) {
      openModal(
        `<h3>ROUND 1 完成！</h3><div class="sub">玩家一：用时 ${rec.time.toFixed(
          1
        )}s · 失误 ${
          rec.errors
        } 次。<br>请把键盘交给 <b>玩家二</b>，挑战同样的 8 个单词！</div><div class="mbtns"><button class="btn y" onclick="battlePhase2()">玩家二开始 ▶</button></div>`
      );
      return;
    }
    const [a, b] = G.p,
      sa = a.time + a.errors * 2,
      sb = b.time + b.errors * 2,
      w1 = sa <= sb;
    S.stats.wins++;
    save();
    return showResult({
      stamp: w1 ? "P1 WINS!" : "P2 WINS!",
      stats: [
        ["玩家一用时", a.time.toFixed(1) + "s"],
        ["玩家一失误", a.errors],
        ["玩家二用时", b.time.toFixed(1) + "s"],
        ["玩家二失误", b.errors],
      ],
      coins: 40,
      xp: 60,
      wrong: G.wrong,
      restart: () => openMode("battle"),
    });
  }
  if (win) {
    S.stats.wins++;
    if (G.diff === "hard") S.stats.hardWin = 1;
    sWin();
  }
  save();
  const diffB = { easy: 0, mid: 15, hard: 35 }[G.diff] || 0;
  showResult({
    stamp: win ? "YOU WIN!" : "LOSE...",
    stars: null,
    stats: [
      ["拼对单词", G.correct],
      ["最佳连击", "×" + G.best],
      ["失误按键", G.errors],
      ["对手", G.bot.n],
    ],
    coins: win ? 60 + diffB : 15,
    xp: win ? 80 + diffB : 25,
    wrong: G.wrong,
    restart: () => openMode("battle"),
  });
}
window.battlePhase2 = () => {
  closeModal();
  G.phase = 2;
  G.idx = 0;
  G.chars = 0;
  G.errors = 0;
  G.combo = 0;
  G.t0 = 0;
  G.active = true;
  G.started = false;
  renderBattle();
  G.raf = requestAnimationFrame(battleLoop);
  countdown();
  refreshOsk();
};

/* ---------- 结算 ---------- */
const TIPS = [
  "间隔重复：今天拼对的词，明天系统会自动安排再见一面。",
  "睡前回忆一遍本局的错词，记忆巩固效果最佳。",
  "记单词先看词性和短语，语境联想比孤立拼写更牢。",
  "花瓣记忆法：先看、再读、后藏、终写，四步闭环。",
  "连击时大脑处于“心流”状态，是背词的黄金时段。",
];
function showResult(o) {
  const lvB = lvl(S.xp);
  const coins = o.coins || 0,
    xp = o.xp || 0;
  S.coins += coins;
  S.xp += xp;
  checkAch();
  save();
  refreshHead();
  coinBump();
  const lvA = lvl(S.xp),
    up = lvA.lv > lvB.lv;
  openModal(`<div style="text-align:center">
  <div class="stamp">${o.stamp}</div>
  ${
    o.stars != null
      ? `<div class="stars">${"★".repeat(o.stars)}${"☆".repeat(
          3 - o.stars
        )}</div>`
      : ""
  }
  ${
    up
      ? `<div class="lvlup">🎉 升级！LV ${lvA.lv} · ${titleOf(lvA.lv)}</div>`
      : ""
  }
  <div class="rgrid">${o.stats
    .map(([k, v]) => `<div class="rcell"><b>${v}</b><span>${k}</span></div>`)
    .join("")}</div>
  <div class="rw"><div><b id="rCoin">0</b><small>金币入账</small></div><div><b id="rXp" style="color:#1d9e57">0</b><small>经验值</small></div>
   <div style="margin-left:auto;font-size:.75rem;color:#67788e">当前 🪙 ${
     S.coins
   } · XP ${S.xp}</div></div>
  ${
    o.wrong && o.wrong.length
      ? `<div style="font-size:.78rem;color:#67788e;text-align:left">本局错词（点击发音，已自动加入复习）：</div>
   <div class="wchips">${o.wrong
     .slice(0, 14)
     .map(
       (w) =>
         `<span class="wchip" onclick="speak('${w.en.replace(/'/g, "")}')">${
           w.en
         }</span>`
     )
     .join("")}</div>`
      : ""
  }
  <div class="tip">💡 ${pick(TIPS)}</div>
  <div class="mbtns"><button class="btn y" id="btnAgain">🔁 再来一局</button><button class="btn b" onclick="closeModal();go('scr-home')">返回主页</button></div></div>`);
  countUp($("#rCoin"), coins);
  countUp($("#rXp"), xp);
  $("#btnAgain").onclick = () => {
    closeModal();
    o.restart && o.restart();
  };
}
function countUp(el, t) {
  const s = performance.now();
  (function f(n) {
    const p = clamp((n - s) / 800, 0, 1);
    el.textContent = Math.round(t * p);
    if (p < 1) requestAnimationFrame(f);
  })(s);
}

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

/* ---------- 📋 单词表（单元学习情况与统计） ---------- */
$("#tSearch").oninput = renderTable;
$("#tFilter").onchange = renderTable;
function tPass(it, f, q) {
  const m = S.mastery[it.en.toLowerCase()];
  if (q && !it.en.toLowerCase().includes(q) && !it.cn.includes(q)) return false;
  if (f === "due") return m && m.r > 0 && m.lv < 5 && m.due <= Date.now();
  if (f === "wrong") return m && m.w > 0;
  if (f === "max") return m && m.lv >= 5;
  if (f === "new") return !m || m.r === 0;
  return true;
}
function tPhrase(it) {
  if (it.phrase) return `<b>${escHtml(it.en)}</b> ${escHtml(it.cn)}`;
  const c = PHRASES[it.en.toLowerCase()];
  if (c) {
    const [a, b] = c.split(" // ");
    return `<b>${escHtml(a)}</b> ${escHtml(b)}`;
  }
  const up = bookOf(it.book).items.filter((x) => x.phrase && x.ui === it.ui);
  if (up.length) return `📌 <b>${escHtml(up[0].en)}</b> ${escHtml(up[0].cn)}`;
  return '<span style="opacity:.4">—</span>';
}
function tRow(it) {
  const m = S.mastery[it.en.toLowerCase()],
    lvv = m ? m.lv : 0,
    pc = posCls(it.pos);
  const dueHot = m && m.r > 0 && m.lv < 5 && m.due <= Date.now();
  return `<tr onclick="speak('${it.en.replace(/'/g, "")}')">
  <td class="we2"><i class="wp wp-${pc}">${it.pos}</i>${escHtml(it.en)}</td>
  <td>${escHtml(it.cn)}</td>
  <td class="ph2">${tPhrase(it)}</td>
  <td><div class="mcell"><span class="mbar">${[1, 2, 3, 4, 5]
    .map((i) => `<i class="${i <= lvv ? "on" : ""}"></i>`)
    .join("")}</span><span class="lvn">${LVN[lvv]}</span></div></td>
  <td class="rw2"><i style="color:var(--ok)">${
    m ? m.r : 0
  }✓</i> <i style="color:var(--bad)">${m ? m.w : 0}✗</i></td>
  <td class="due ${
    dueHot ? "hot" : ""
  }" style="text-align:left;min-width:0">${fmtDue(m)}</td>
  <td><button class="spk2" onclick="event.stopPropagation();speak('${it.en.replace(
    /'/g,
    ""
  )}')">🔊</button></td></tr>`;
}
function renderTable() {
  const b = bookOf(S.curBook);
  $("#tTabs").innerHTML = BOOKS.map(
    (x) =>
      `<button class="bktab ${x.id === S.curBook ? "on" : ""}" style="--bc:${
        x.color
      }" onclick="pickTableBook('${x.id}')">${x.name.replace(
        " · ",
        ""
      )}</button>`
  ).join("");
  let totR = 0,
    totA = 0,
    learned = 0,
    mastered = 0,
    due = 0,
    wrong = 0;
  for (const it of ALL) {
    const m = S.mastery[it.en.toLowerCase()];
    if (m) {
      totR += m.r;
      totA += m.r + m.w;
      if (m.r > 0) learned++;
      if (m.lv >= 5) mastered++;
      if (m.r > 0 && m.lv < 5 && m.due <= Date.now()) due++;
      if (m.w > 0) wrong++;
    }
  }
  const acc = totR + totA ? Math.round((totR / totA) * 100) : 0;
  $(
    "#tStats"
  ).innerHTML = `<div class="tstat" style="--tc:var(--c-b)"><b>${ALL.length}</b><span>总词条</span></div>
   <div class="tstat" style="--tc:var(--c-c)"><b>${learned}</b><span>已学习</span></div>
   <div class="tstat" style="--tc:var(--ok)"><b>${mastered}</b><span>已掌握(永久)</span></div>
   <div class="tstat" style="--tc:var(--bad)"><b>${due}</b><span>待复习</span></div>
   <div class="tstat" style="--tc:var(--c-p)"><b>${wrong}</b><span>需巩固</span></div>
   <div class="tstat" style="--tc:var(--c-y)"><b>${acc}%</b><span>拼写正确率</span></div>`;
  const q = ($("#tSearch").value || "").trim().toLowerCase(),
    f = $("#tFilter").value;
  let html = "",
    shown = 0;
  b.units.forEach((u, ui) => {
    const items = b.items
      .filter((it) => it.ui === ui)
      .filter((it) => tPass(it, f, q));
    if (!items.length) return;
    let ur = 0,
      ua = 0,
      ul = 0,
      um = 0;
    b.items
      .filter((it) => it.ui === ui)
      .forEach((it) => {
        const m = S.mastery[it.en.toLowerCase()];
        if (m) {
          ur += m.r;
          ua += m.r + m.w;
          if (m.r > 0) ul++;
          if (m.lv >= 5) um++;
        }
      });
    const uacc = ua ? Math.round((ur / ua) * 100) : null;
    const pr = (S.prog[b.id] || {}).stars || {};
    html += `<div class="ublock" style="--uc:${b.color}">
   <div class="uhd"><span class="udot"></span>
    <span class="un">${u.s} · ${u.n}</span>
    <span class="us2">${items.length}/${
      b.items.filter((it) => it.ui === ui).length
    } 词 · 已学 ${ul} · 已会 ${um}${uacc != null ? ` · 正确率 ${uacc}%` : ""}${
      pr[ui] ? ` · ${"★".repeat(pr[ui])}` : ""
    }</span>
    <button class="btn c sm" onclick="startLevel('${
      b.id
    }',${ui})">练本单元 ▶</button></div>
   <div class="tblwrap"><table class="wt"><thead><tr>
    <th>单词 / 词性</th><th>中文释义</th><th>关联短语 / 搭配</th><th>掌握度</th><th>对 / 错</th><th>复习安排</th><th></th>
   </tr></thead><tbody>${items.map(tRow).join("")}</tbody></table></div></div>`;
    shown += items.length;
  });
  $("#tBody").innerHTML =
    html ||
    `<div class="panel" style="text-align:center;color:var(--sub);padding:34px">当前筛选没有匹配的单词，换个筛选条件试试～</div>`;
}
window.pickTableBook = (id) => {
  S.curBook = id;
  save();
  renderTable();
};

/* ---------- 学习数据屏幕 ---------- */
let statsRange = 7;
const STATS_RANGES = [
  [7, "近 7 天"],
  [30, "近 30 天"],
  [90, "近 90 天"],
  [0, "全部"],
];
function setStatsRange(n) {
  statsRange = n;
  renderStats();
}
function renderStats() {
  const today = dailyRec(dayKey(new Date()));
  const todayAcc =
    today.correct + today.errors
      ? Math.round((today.correct / (today.correct + today.errors)) * 100)
      : 0;
  const streak = learnStreak();
  const rows = dailyRange(statsRange);
  const s = sumRange(rows);
  const avgWords = s.active ? Math.round(s.words / s.active) : 0;
  const all = sumRange(dailyRange(0)); // 累计（自有记录以来）
  const duelTotal = (S.stats.p2pWins || 0) + (S.stats.p2pLosses || 0);
  const dist = masteryDist();
  const srs = srsDist();
  const due = dueWords().length,
    wrong = wrongWords().length;
  const totalWords = ALL.filter((w) => !w.phrase).length;
  const stages = ["陌生", "初识", "熟悉", "掌握", "牢固", "永久"];
  const stageColors = ["#9aa7b4", "#4fc3f7", "#7c4dff", "#ffb300", "#ff7043", "#2e9b57"];
  const distTotal = dist.touched || 1;
  const segHtml = stages
    .map(
      (nm, i) =>
        `<div class="mseg" style="width:${(dist.lv[i] / distTotal) * 100}%;background:${
          stageColors[i]
        }" title="${nm} ${dist.lv[i]}"></div>`
    )
    .join("");
  const segLegend = stages
    .map(
      (nm, i) =>
        `<span><i style="background:${stageColors[i]}"></i>${nm} <b>${dist.lv[i]}</b></span>`
    )
    .join("");
  const rangeBtns = STATS_RANGES.map(
    ([n, label]) =>
      `<button class="seg${statsRange === n ? " on" : ""}" onclick="setStatsRange(${n})">${label}</button>`
  ).join("");
  // 每日明细（取区间内最近 30 条有记录的日子）
  const detailRows = rows
    .filter((r) => r.rec && (r.rec.words > 0 || r.rec.games > 0))
    .slice(-30)
    .reverse()
    .map((r) => {
      const d = r.rec;
      const acc = d.correct + d.errors ? Math.round((d.correct / (d.correct + d.errors)) * 100) : 0;
      const md = r.date.slice(5).replace("-", "/");
      const tags = [];
      if (d.ch) tags.push(`挑战×${d.ch}`);
      if (d.duel) tags.push(`单挑${d.duelW}胜${d.duelL}负`);
      if (d.room) tags.push(`乱斗×${d.room}${d.roomWin ? `🏆${d.roomWin}` : ""}`);
      return `<div class="drow"><span class="ddate">${md}</span><span class="dwords">📝 ${d.words} 词</span><span class="dacc">🎯 ${acc}%</span><span class="dtags">${
        tags.join(" · ") || "学习"
      }</span></div>`;
    })
    .join("");
  $("#statsBody").innerHTML = `
  <div class="stat-cards">
    <div class="stat-card"><b style="color:var(--c-y)">${today.words}</b><span>📅 今日单词</span></div>
    <div class="stat-card"><b style="color:var(--ok)">${todayAcc}%</b><span>🎯 今日正确率</span></div>
    <div class="stat-card"><b>${today.games}</b><span>🏅 今日局数</span></div>
    <div class="stat-card"><b style="color:var(--c-p)">${streak}</b><span>🔥 连续学习天数</span></div>
  </div>
  <div class="panel chart-card">
    <div class="chart-head">
      <h3 class="chart-title">📈 学习曲线</h3>
      <div class="pf-seg">${rangeBtns}</div>
    </div>
    <canvas id="learnChart" height="220"></canvas>
    <div class="chart-legend"><span><i style="background:var(--ok)"></i>每日单词数（柱）</span><span><i style="background:var(--c-y)"></i>正确率（线）</span></div>
  </div>
  <div class="stat-cards">
    <div class="stat-card"><b>${s.words}</b><span>📝 区间单词总数</span></div>
    <div class="stat-card"><b>${avgWords}</b><span>📊 活跃日均单词</span></div>
    <div class="stat-card"><b>${s.active}</b><span>🗓 活跃天数</span></div>
    <div class="stat-card"><b style="color:var(--c-c)">${s.acc}%</b><span>🎯 区间平均正确率</span></div>
    <div class="stat-card"><b>${s.ch}</b><span>⚔️ 挑战局数</span></div>
    <div class="stat-card"><b>${s.duel + s.room}</b><span>🌐 对战场次</span></div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🧠 单词掌握情况</h3>
    <div class="mbar">${segHtml || '<div class="mseg" style="width:100%;background:#9aa7b4"></div>'}</div>
    <div class="mlegend">${segLegend}</div>
    <div class="stat-cards" style="margin-top:12px">
      <div class="stat-card sm"><b>${dist.learned}</b><span>已学单词</span></div>
      <div class="stat-card sm"><b style="color:#2e9b57">${dist.mastered}</b><span>已永久掌握</span></div>
      <div class="stat-card sm"><b style="color:var(--c-p)">${due}</b><span>⏰ 待复习</span></div>
      <div class="stat-card sm"><b style="color:var(--bad)">${wrong}</b><span>✏️ 错题本</span></div>
      <div class="stat-card sm"><b>${totalWords}</b><span>📚 词库总词数</span></div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">📊 SRS 记忆强度分析</h3>
    <div class="srs-grid">
      <div class="srs-chart-box">
        <div class="srs-chart-title">间隔分布（天）</div>
        <canvas id="ivChart" height="180"></canvas>
      </div>
      <div class="srs-chart-box">
        <div class="srs-chart-title">难度系数 EF 分布</div>
        <canvas id="efChart" height="180"></canvas>
      </div>
    </div>
    <div class="srs-forecast">
      <div class="srs-chart-title">📅 未来到期复习预测（累计）</div>
      <div class="srs-fc-cards">
        ${srs.forecastDays
          .map(
            (d, i) =>
              `<div class="srs-fc-card"><b style="color:var(--c-p)">${srs.forecast[i]}</b><span>${d} 天内</span></div>`
          )
          .join("")}
      </div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🎮 挑战模式数据</h3>
    <div class="mode-tiles">
      <div class="mtile"><span class="mic">⏱</span><b>${s.mTime}</b><span>限时冲刺 · 累计 ${all.mTime}</span></div>
      <div class="mtile"><span class="mic">☄️</span><b>${s.mFall}</b><span>陨石单词 · 累计 ${all.mFall}</span></div>
      <div class="mtile"><span class="mic">🌸</span><b>${s.mMem}</b><span>花瓣记忆 · 累计 ${all.mMem}</span></div>
      <div class="mtile"><span class="mic">⚔️</span><b>${s.mBattle}</b><span>竞技场 · 累计 ${all.mBattle}</span></div>
    </div>
    <div class="stat-cards" style="margin-top:12px">
      <div class="stat-card sm"><b>${S.stats.games || 0}</b><span>累计总局数</span></div>
      <div class="stat-card sm"><b>×${S.stats.bestCombo || 0}</b><span>最高连击</span></div>
      <div class="stat-card sm"><b>${S.stats.perfect || 0}</b><span>满星通关</span></div>
      <div class="stat-card sm"><b>${S.stats.unitsCleared || 0}</b><span>已通关单元</span></div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🌐 联机对战数据</h3>
    <div class="mode-tiles">
      <div class="mtile wide"><span class="mic">⚔️</span><b>${s.duel}</b><span>单挑场次 · ${s.duelW} 胜 ${s.duelL} 负</span><em>累计 ${duelTotal} 场 · ${S.stats.p2pWins || 0} 胜 ${S.stats.p2pLosses || 0} 负 · 胜率 ${
    duelTotal ? Math.round(((S.stats.p2pWins || 0) / duelTotal) * 100) : 0
  }%</em></div>
      <div class="mtile wide"><span class="mic">👥</span><b>${s.room}</b><span>乱斗轮次 · 🥇 ${s.roomWin} 次第一</span><em>累计 ${S.stats.roomRounds || 0} 轮 · ${S.stats.roomWins || 0} 次第一</em></div>
    </div>
  </div>
  <div class="panel">
    <h3 class="chart-title">🗓 每日明细（最近 30 条）</h3>
    <div class="dlist">${
      detailRows ||
      '<div class="sub" style="padding:10px;text-align:center">暂无学习记录，快去练几个词吧～</div>'
    }</div>
  </div>`;
  requestAnimationFrame(() => drawLearnChart(rows));
  requestAnimationFrame(() => drawSrsCharts(srs));
}
/* Canvas 学习曲线：柱状=每日单词数，折线=正确率 */
function drawLearnChart(rows) {
  const cv = $("#learnChart");
  if (!cv) return;
  const cssW = cv.clientWidth || cv.parentElement.clientWidth || 640;
  const dpr = window.devicePixelRatio || 1;
  const H = 220;
  cv.width = cssW * dpr;
  cv.height = H * dpr;
  cv.style.height = H + "px";
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();
  const cOk = css("--ok") || "#2e9b57",
    cY = css("--c-y") || "#f5b301",
    cSub = css("--sub") || "#8a93a3",
    cLine = css("--line") || "rgba(255,255,255,.15)";
  const W = cssW,
    padL = 38,
    padR = 38,
    padT = 16,
    padB = 26;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  ctx.clearRect(0, 0, W, H);
  const data = rows.map((r) => {
    const d = r.rec;
    const words = d ? d.words || 0 : 0;
    const tot = d ? (d.correct || 0) + (d.errors || 0) : 0;
    return { date: r.date, words, acc: tot ? (d.correct / tot) * 100 : null };
  });
  const totalWords = data.reduce((a, b) => a + b.words, 0);
  // 空状态
  if (!totalWords) {
    ctx.fillStyle = cSub;
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("暂无学习记录，快去练几个词吧～", W / 2, H / 2);
    return;
  }
  const maxW = Math.max(10, ...data.map((d) => d.words));
  const n = data.length;
  const step = plotW / n;
  const barW = Math.max(3, step * 0.55);
  const yWords = (v) => padT + plotH - (v / maxW) * plotH;
  const yAcc = (v) => padT + plotH - (v / 100) * plotH;
  // 网格 + 左轴（单词数）
  ctx.font = "10px sans-serif";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH / 4) * i;
    ctx.strokeStyle = cLine;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillStyle = cSub;
    ctx.textAlign = "right";
    ctx.fillText(Math.round(maxW - (maxW / 4) * i), padL - 6, y + 3);
    ctx.textAlign = "left";
    ctx.fillText([100, 75, 50, 25, 0][i] + "%", W - padR + 6, y + 3);
  }
  // 柱子
  data.forEach((d, i) => {
    const x = padL + step * i + (step - barW) / 2;
    const y = yWords(d.words);
    if (d.words > 0) {
      const g = ctx.createLinearGradient(0, y, 0, padT + plotH);
      g.addColorStop(0, cOk);
      g.addColorStop(1, cOk + "55");
      ctx.fillStyle = g;
      ctx.beginPath();
      const r = Math.min(3, barW / 2);
      ctx.roundRect(x, y, barW, padT + plotH - y, [r, r, 0, 0]);
      ctx.fill();
    }
  });
  // 正确率折线（跳过无数据日）
  ctx.strokeStyle = cY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let pen = false;
  data.forEach((d, i) => {
    if (d.acc === null) {
      pen = false;
      return;
    }
    const x = padL + step * i + step / 2,
      y = yAcc(d.acc);
    if (!pen) {
      ctx.moveTo(x, y);
      pen = true;
    } else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = cY;
  data.forEach((d, i) => {
    if (d.acc === null) return;
    const x = padL + step * i + step / 2,
      y = yAcc(d.acc);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // X 轴日期标签（最多 ~7 个）
  ctx.fillStyle = cSub;
  ctx.textAlign = "center";
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  data.forEach((d, i) => {
    if (i % labelEvery !== 0 && i !== n - 1) return;
    ctx.fillText(d.date.slice(5).replace("-", "/"), padL + step * i + step / 2, H - 8);
  });
}

/* Canvas SRS 分布图：间隔分布 + EF 分布（柱状图） */
function drawSrsCharts(srs) {
  const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();
  const cP = css("--c-p") || "#7c4dff",
    cC = css("--c-c") || "#29b6f6",
    cSub = css("--sub") || "#8a93a3",
    cLine = css("--line") || "rgba(255,255,255,.15)",
    cPanel = css("--panel") || "rgba(255,255,255,.06)";
  const drawBar = (cvId, labels, buckets, color) => {
    const cv = $("#" + cvId);
    if (!cv) return;
    const cssW = cv.clientWidth || cv.parentElement.clientWidth || 300;
    const dpr = window.devicePixelRatio || 1;
    const H = 180;
    cv.width = cssW * dpr;
    cv.height = H * dpr;
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = cssW,
      padL = 28,
      padR = 10,
      padT = 12,
      padB = 24;
    const plotW = W - padL - padR,
      plotH = H - padT - padB;
    ctx.clearRect(0, 0, W, H);
    const maxV = Math.max(1, ...buckets);
    const n = buckets.length;
    const barW = Math.max(6, (plotW / n) * 0.7);
    const step = plotW / n;
    // 网格
    ctx.font = "10px sans-serif";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padT + (plotH / 3) * i;
      ctx.strokeStyle = cLine;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillStyle = cSub;
      ctx.textAlign = "right";
      ctx.fillText(Math.round(maxV - (maxV / 3) * i), padL - 4, y + 3);
    }
    // 柱子
    buckets.forEach((v, i) => {
      const x = padL + step * i + (step - barW) / 2;
      const y = padT + plotH - (v / maxV) * plotH;
      if (v > 0) {
        const g = ctx.createLinearGradient(0, y, 0, padT + plotH);
        g.addColorStop(0, color);
        g.addColorStop(1, color + "44");
        ctx.fillStyle = g;
        ctx.beginPath();
        const r = Math.min(3, barW / 2);
        ctx.roundRect(x, y, barW, padT + plotH - y, [r, r, 0, 0]);
        ctx.fill();
      }
      ctx.fillStyle = cSub;
      ctx.textAlign = "center";
      ctx.fillText(labels[i], padL + step * i + step / 2, H - 8);
    });
  };
  drawBar("ivChart", srs.ivLabels, srs.ivBuckets, cC);
  drawBar("efChart", srs.efLabels, srs.efBuckets, cP);
}

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
