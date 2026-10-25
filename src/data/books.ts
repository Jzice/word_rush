import { S } from "../core/store";
import { speak } from "../ui/audio";

/* ================= 模块：data/books 内置词库数据 =================
 * 职责：各教材词库数据 BOOKS（人教版 / 外研版 / 新概念 / KET / 四六级）
 * 依赖：core/utils（词条格式约定 w: en@中文@pos，p: en@中文）
 * 共享状态：无（纯数据；⚠ 词条英文即掌握度进度键，改名会使 S.mastery 进度孤儿化）
 * ==================================================================== */
/* ================= 词库定义（含扩展） ================= */
export const BOOKS: any[] = [
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



