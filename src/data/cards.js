// 效果字段：cash, face, spirit, health, trust, suspicion, pro, people, street,
// route:{routeId: amount}, clue, flag, energy, draw
export const STARTING_DECK = [
  's_rest', 's_apply', 's_learn', 's_network', 's_gig', 's_video', 's_family', 's_disguise', 's_walk', 's_budget',
];

export const CARDS = [
  // ---------- 起始 10 ----------
  {
    id: 's_rest', name: '休息一天', cost: 0, tags: ['休息'], rarity: 'common', kind: 'instant',
    desc: '把手机调成静音，睡到自然醒。世界不会因为你停一天就塌。',
    effects: { spirit: 6, health: 4, flag: 'sleep_in' },
  },
  {
    id: 's_apply', name: '投简历', cost: 1, tags: ['求职'], rarity: 'common', kind: 'check',
    check: { stat: 'pro', diff: 0.05, label: '专业' },
    desc: '把简历投进一个看起来还行的岗位。已读不回也是回复。',
    success: { route: { rehire: 1 }, spirit: 2, clue: 'offer', flag: 'applied_job' },
    fail: { spirit: -3, suspicion: 2, route: { rehire: 1 } },
  },
  {
    id: 's_learn', name: '学点新东西', cost: 1, tags: ['学习'], rarity: 'common', kind: 'instant',
    desc: '打开一个免费课程。学了 20 分钟，感觉自己又行了。',
    effects: { pro: 1, spirit: -1, route: { freelance: 1 }, flag: 'learn_ai' },
  },
  {
    id: 's_network', name: '约前同事喝咖啡', cost: 1, tags: ['人情'], rarity: 'common', kind: 'instant',
    desc: '不聊工作，先聊谁又升了。信息比咖啡有用。',
    effects: { people: 1, cash: -35, route: { return: 1, rehire: 1 }, clue: 'boss_wechat', flag: 'old_colleague' },
  },
  {
    id: 's_gig', name: '接个零活', cost: 1, tags: ['搞钱'], rarity: 'common', kind: 'instant',
    desc: '帮人做一版方案，钱不多，但当天结。',
    effects: { cash: 450, health: -3, route: { freelance: 1, gig: 1 }, flag: 'freelance' },
  },
  {
    id: 's_video', name: '拍条视频', cost: 1, tags: ['内容'], rarity: 'common', kind: 'minigame',
    minigame: 'viral', routeId: 'content',
    desc: '把“空档日常”拍成 60 秒。算法可能会喜欢你，也可能会无视你。',
    effects: { flag: 'video' },
  },
  {
    id: 's_family', name: '陪家人吃顿饭', cost: 1, tags: ['家庭'], rarity: 'common', kind: 'instant',
    desc: '不解释，不汇报，只吃饭。',
    effects: { trust: 6, spirit: 4, route: { family: 1 }, flag: 'parent_meal' },
  },
  {
    id: 's_disguise', name: '练习伪装', cost: 1, tags: ['伪装'], rarity: 'common', kind: 'instant',
    desc: '对着镜子练习“最近项目很忙”的表情。',
    effects: { face: 3, suspicion: -5, route: { fake: 1 } },
  },
  {
    id: 's_walk', name: '城市散步', cost: 0, tags: ['休息'], rarity: 'common', kind: 'instant',
    desc: '不坐地铁，沿着一条没走过的路走。城市比工位大。',
    effects: { health: 4, spirit: 3, suspicion: 2, flag: 'park' },
  },
  {
    id: 's_budget', name: '算一遍存款', cost: 0, tags: ['搞钱'], rarity: 'common', kind: 'instant',
    desc: '把房租、账单、下个月要还的钱写在一张纸上。',
    effects: { spirit: 2, clue: 'bank_balance', flag: 'budget' },
  },

  // ---------- 9 张角色专属 ----------
  {
    id: 'c_lin', name: '一键三连', cost: 1, tags: ['内容'], rarity: 'rare', kind: 'instant', personaId: 'lin',
    desc: '给同行点赞、评论、转发。你也不知道是在帮别人，还是在帮自己。',
    effects: { route: { content: 2 }, spirit: 3, suspicion: 2, flag: 'video' },
  },
  {
    id: 'c_su', name: '夜班后遗症', cost: 0, tags: ['休息'], rarity: 'rare', kind: 'instant', personaId: 'su',
    desc: '值了太多年夜班，白天反而睡不着。躺一会儿，也算休息。',
    effects: { health: 5, spirit: -2, route: { exam: 1 }, flag: 'health_check' },
  },
  {
    id: 'c_chen', name: '熬夜改简历', cost: 2, tags: ['求职'], rarity: 'rare', kind: 'check', personaId: 'chen',
    check: { stat: 'pro', diff: 0.1, label: '专业' },
    desc: '把“负责”改成“主导”，把“参与”改成“从 0 到 1”。',
    success: { route: { rehire: 2, freelance: 1 }, spirit: 2, health: -3 },
    fail: { spirit: -4, health: -3, route: { rehire: 1 } },
  },
  {
    id: 'c_li', name: '家长群话术', cost: 1, tags: ['人情', '家庭'], rarity: 'rare', kind: 'instant', personaId: 'li',
    desc: '在家长群里体面地回复“收到”，顺便打听一下谁家孩子也在找工作。',
    effects: { trust: 6, people: 1, route: { family: 1 }, suspicion: -3 },
  },
  {
    id: 'c_zhou', name: '中层话术', cost: 1, tags: ['人情'], rarity: 'rare', kind: 'check', personaId: 'zhou',
    check: { stat: 'people', diff: 0, label: '人情' },
    desc: '把“我被优化了”说成“我在看新机会”。',
    success: { route: { return: 2, rehire: 1 }, face: 2 },
    fail: { spirit: -3, suspicion: 3 },
  },
  {
    id: 'c_zhao', name: '机器不会说谎', cost: 1, tags: ['专业', '生意'], rarity: 'rare', kind: 'check', personaId: 'zhao',
    check: { stat: 'pro', diff: 0.05, label: '专业' },
    desc: '修好一台旧机器。它不关心你的工龄，只关心你会不会。',
    success: { route: { openstore: 2, gig: 1 }, cash: 200 },
    fail: { health: -3, spirit: -2 },
  },
  {
    id: 'c_ma', name: '老资格', cost: 1, tags: ['人情'], rarity: 'rare', kind: 'instant', personaId: 'ma',
    desc: '给二十年的老关系打电话。有人接，有人没接。',
    effects: { route: { return: 2, home: 1 }, people: 1, clue: 'boss_wechat' },
  },
  {
    id: 'c_fang', name: '三十年经验', cost: 1, tags: ['专业'], rarity: 'rare', kind: 'instant', personaId: 'fang',
    desc: '把供应链的旧经验翻译成新语言。年龄是成本，也是壁垒。',
    effects: { route: { rehire: 1, crossborder: 2 }, pro: 1, clue: 'client_praise' },
  },
  {
    id: 'c_liu', name: '见人就笑', cost: 0, tags: ['人情', '家庭'], rarity: 'rare', kind: 'instant', personaId: 'liu',
    desc: '你卖了一辈子东西，最会看人脸色。现在，先对自己笑一个。',
    effects: { face: 3, trust: 4, route: { gig: 1, family: 1 }, spirit: 2 },
  },

  // ---------- 21 张通用 ----------
  {
    id: 'library_day', name: '在图书馆坐一天', cost: 0, tags: ['学习', '伪装'], rarity: 'common', kind: 'instant',
    desc: '免费空调、免费热水、免费的自习氛围。你旁边的人也在改简历。',
    effects: { pro: 1, suspicion: -4, route: { freelance: 1 }, flag: 'library' },
  },
  {
    id: 'coffee_meet', name: '约人喝咖啡', cost: 1, tags: ['人情'], rarity: 'common', kind: 'instant',
    desc: '35 块的美式，换来一个可能的机会。',
    effects: { cash: -35, people: 1, suspicion: 2, route: { return: 1 }, clue: 'witness' },
  },
  {
    id: 'park_nap', name: '在公园长椅睡一觉', cost: 1, tags: ['休息'], rarity: 'common', kind: 'instant',
    desc: '阳光很好。你梦见自己还在开会。',
    effects: { spirit: 7, health: 3, suspicion: 3, flag: 'park' },
  },
  {
    id: 'ex_office', name: '去前公司楼下', cost: 1, tags: ['伪装', '求职'], rarity: 'common', kind: 'instant',
    desc: '不上去，就在楼下站一会儿。看那些和你无关的人进进出出。',
    effects: { suspicion: 8, face: 2, route: { return: 1 }, clue: 'boss_wechat' },
  },
  {
    id: 'takeout', name: '跑半天外卖', cost: 1, tags: ['搞钱'], rarity: 'common', kind: 'instant',
    desc: '电动车、头盔、超时提醒。钱是当天结的。',
    effects: { cash: 450, health: -4, route: { gig: 1 }, flag: 'takeout' },
  },
  {
    id: 'stall_prep', name: '去夜市踩点', cost: 1, tags: ['生意'], rarity: 'common', kind: 'instant',
    desc: '看别人怎么摆、怎么喊、怎么收摊。',
    effects: { cash: -100, street: 1, route: { stall: 1 }, flag: 'stall' },
  },
  {
    id: 'content_plan', name: '列 10 个选题', cost: 1, tags: ['内容'], rarity: 'common', kind: 'instant',
    desc: '“空档后我每天假装上班”排在第 1 个。你不知道它会不会火。',
    effects: { pro: 1, route: { content: 1 }, flag: 'video' },
  },
  {
    id: 'live_stream', name: '开一场直播', cost: 2, tags: ['内容'], rarity: 'common', kind: 'instant',
    desc: '直播间 7 个人，其中 3 个是机器人。你还是讲了两个小时。',
    effects: { cash: 700, face: 3, suspicion: 8, route: { content: 1 }, flag: 'live' },
  },
  {
    id: 'freelance_gig', name: '接一单私活', cost: 1, tags: ['搞钱', '内容'], rarity: 'common', kind: 'instant',
    desc: '客户说“很简单”，然后改了 5 版。',
    effects: { cash: 900, pro: 1, route: { freelance: 1 }, flag: 'freelance' },
  },
  {
    id: 'study_ai', name: '学 AI 工具', cost: 1, tags: ['学习'], rarity: 'common', kind: 'instant',
    desc: '把 AI 当成新同事。它不抢功，也不交社保。',
    effects: { pro: 1, spirit: -2, route: { freelance: 1 }, flag: 'learn_ai' },
  },
  {
    id: 'exam_study', name: '刷一套题', cost: 1, tags: ['学习'], rarity: 'common', kind: 'instant',
    desc: '错 18 道。你把错题抄下来，手有点抖。',
    effects: { pro: 1, health: -3, route: { exam: 1 }, flag: 'exam' },
  },
  {
    id: 'return_probe', name: '向前领导试探', cost: 1, tags: ['人情'], rarity: 'common', kind: 'instant',
    desc: '发一句“最近怎么样”，等三个小时，再发一句“有空聊聊？”。',
    effects: { suspicion: 4, face: 1, route: { return: 1 }, clue: 'boss_wechat' },
  },
  {
    id: 'home_call', name: '给父母打电话', cost: 0, tags: ['家庭'], rarity: 'common', kind: 'instant',
    desc: '不报喜也不报忧，只问他们晚饭吃了什么。',
    effects: { trust: 5, spirit: 4, route: { home: 1 }, flag: 'parent_meal' },
  },
  {
    id: 'kid_time', name: '陪孩子写作业', cost: 1, tags: ['家庭'], rarity: 'common', kind: 'instant',
    desc: '你教她数学，她教你“不会也没关系”。',
    effects: { trust: 6, spirit: 3, route: { family: 1 }, flag: 'kid_time' },
  },
  {
    id: 'gym', name: '去健身房', cost: 1, tags: ['休息'], rarity: 'common', kind: 'instant',
    desc: '跑了 3 公里。至少这件事，付出就有回报。',
    effects: { health: 7, spirit: 3, flag: 'gym' },
  },
  {
    id: 'health_check', name: '去做个体检', cost: 1, tags: ['休息'], rarity: 'common', kind: 'instant',
    desc: '报告上的箭头比简历上的还多。',
    effects: { cash: -200, health: 3, clue: 'health_report', flag: 'health_check' },
  },
  {
    id: 'sell_stuff', name: '卖点旧东西', cost: 0, tags: ['搞钱'], rarity: 'common', kind: 'instant',
    desc: '旧相机、旧包、旧工牌。有人买，有人只问不买。',
    effects: { cash: 600, spirit: -4, flag: 'sell_stuff' },
  },
  {
    id: 'fix_badge', name: '修一修旧工牌', cost: 0, tags: ['伪装'], rarity: 'common', kind: 'instant',
    desc: '换一根挂绳，擦掉划痕。照片里的人还在笑。',
    effects: { face: 3, spirit: -3, clue: 'old_badge', flag: 'fix_badge' },
  },
  {
    id: 'wishlist', name: '写一份遗愿清单', cost: 0, tags: ['休息'], rarity: 'common', kind: 'instant',
    desc: '写到第 7 条，你发现很多事不需要等有钱。',
    effects: { spirit: 5, flag: 'wishlist' },
  },
  {
    id: 'crossborder', name: '研究跨境选品', cost: 1, tags: ['生意', '内容'], rarity: 'common', kind: 'instant',
    desc: '后台数据、汇率、物流时效。你越看越觉得能行。',
    effects: { cash: -300, pro: 1, route: { crossborder: 1 }, flag: 'crossborder' },
  },
  {
    id: 'fake_coach', name: '收第一个“学员”', cost: 2, tags: ['伪装'], rarity: 'common', kind: 'instant',
    desc: '教一个刚收到通知的年轻人怎么在图书馆坐一天。他给你转了 200。',
    effects: { cash: 500, route: { fake: 2 }, suspicion: 6, flag: 'fake_coach' },
  },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const UNIQUE_CARDS = CARDS.filter((c) => c.personaId);
export const COMMON_CARDS = CARDS.filter((c) => !c.personaId && !STARTING_DECK.includes(c.id));
