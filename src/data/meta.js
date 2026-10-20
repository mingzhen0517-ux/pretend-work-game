export const CHECKLIST = [
  { id: 'sleep_in', label: '睡到自然醒', flag: 'sleep_in' },
  { id: 'library', label: '在图书馆坐一天', flag: 'library' },
  { id: 'park', label: '在公园发呆', flag: 'park' },
  { id: 'learn_ai', label: '学一个 AI 工具', flag: 'learn_ai' },
  { id: 'applied_job', label: '认真投一次简历', flag: 'applied_job' },
  { id: 'interview', label: '参加一场面试', flag: 'interview' },
  { id: 'stall', label: '去夜市摆一次摊', flag: 'stall' },
  { id: 'takeout', label: '跑一次外卖', flag: 'takeout' },
  { id: 'gig', label: '靠灵活就业赚到钱', flag: 'gig' },
  { id: 'video', label: '发一条自己的视频', flag: 'video' },
  { id: 'live', label: '开一场直播', flag: 'live' },
  { id: 'freelance', label: '接一单私活', flag: 'freelance' },
  { id: 'exam', label: '为考编/考公刷一套题', flag: 'exam' },
  { id: 'home', label: '回一次老家', flag: 'go_home' },
  { id: 'parent_meal', label: '陪父母吃一顿饭', flag: 'parent_meal' },
  { id: 'kid_time', label: '陪孩子写一次作业', flag: 'kid_time' },
  { id: 'gym', label: '去一次健身房', flag: 'gym' },
  { id: 'health_check', label: '做一次体检', flag: 'health_check' },
  { id: 'sell_stuff', label: '卖一件旧东西', flag: 'sell_stuff' },
  { id: 'fix_badge', label: '修一修旧工牌', flag: 'fix_badge' },
  { id: 'coffee', label: '认真学一次咖啡/烘焙', flag: 'learn_coffee' },
  { id: 'wishlist', label: '写一份遗愿清单', flag: 'wishlist' },
  { id: 'old_colleague', label: '约一个老同事聊聊', flag: 'old_colleague' },
  { id: 'fake_coach', label: '收一个“空档学员”', flag: 'fake_coach' },
];

export const MEMORIES = [
  { id: 'm_subway', title: '第 1 天 · 地铁', text: '这条线你坐了 11 年。哪一站开门、哪一节车厢离电梯最近，你都知道。', unlock: { day: 1 } },
  { id: 'm_escalator', title: '第 3 天 · 扶梯', text: '你下意识站到右边，把左边让给赶时间的人。你现在不赶时间了。', unlock: { day: 3 } },
  { id: 'm_library', title: '图书馆 · 靠窗', text: '阳光从百叶窗里漏下来。你旁边的人也在改简历，你们谁都没抬头。', unlock: { location: 'library' } },
  { id: 'm_cafe', title: '咖啡店 · 35 块', text: '你买了一杯最便宜的美式，坐了一下午。店员没有赶你。', unlock: { location: 'cafe' } },
  { id: 'm_nightmarket', title: '夜市 · 第一盏灯', text: '油烟升起来的时候，整条街都亮了。你突然觉得，生活还可以这样开始。', unlock: { location: 'nightmarket' } },
  { id: 'm_school', title: '学校门口 · 放学', text: '你第一次在下午四点半站在校门口。孩子看见你，跑得比平时快。', unlock: { flag: 'kid_time' } },
  { id: 'm_hospital', title: '医院走廊 · 塑料椅', text: '医院的灯是白的，椅子是硬的。你在这里学会了等。', unlock: { flag: 'health_check' } },
  { id: 'm_oldoffice', title: '前公司楼下 · 17:58', text: '下班的人从旋转门里涌出来。你往旁边让了让。', unlock: { location: 'oldoffice' } },
  { id: 'm_train', title: '返乡高铁 · 4 小时', text: '窗外的楼越来越矮，田越来越多。你睡着了，醒来时已经过了两站。', unlock: { route: 'home', stage: 1 } },
  { id: 'm_badge', title: '旧工牌 · 划痕', text: '你擦掉工牌上的划痕，照片里的人还在笑。你不太记得他当时在想什么。', unlock: { flag: 'fix_badge' } },
  { id: 'm_laozhao', title: '老赵的炒粉 · 加蛋', text: '老赵说：“别急着找下家。先想想，有没有哪一天是你自己安排的。”', unlock: { flag: 'old_colleague' } },
  { id: 'm_family', title: '全家福 · 用力笑', text: '照片里每个人都笑得很用力。你现在才知道，那一年大家都不容易。', unlock: { flag: 'parent_meal' } },
];

export const PERSONALITY_RESULTS = [
  {
    id: 'performer', name: '体面表演家', icon: '🎭', persona: 'zhou', card: 'c_zhou',
    desc: '你可以穿着衬衫在图书馆坐一天，只为了不让别人担心。体面是你的铠甲，也是你的负担。',
    quote: '只要我还像个体面人，事情就还没那么糟。',
  },
  {
    id: 'gambler', name: '搞钱赌徒', icon: '🎲', persona: 'zhao', card: 'c_zhao',
    desc: '你相信问题都能用现金流解决。风险越大，你越想试一把。',
    quote: '稳定是别人的，机会是我的。',
  },
  {
    id: 'learner', name: '学习型难民', icon: '📚', persona: 'lin', card: 'c_lin',
    desc: '你习惯把焦虑变成课程、证书和笔记。学习让你觉得还在往前走。',
    quote: '只要我还在学，就不算停下来。',
  },
  {
    id: 'glue', name: '家庭粘合剂', icon: '🧩', persona: 'li', card: 'c_li',
    desc: '你最先想到的总是别人。你擅长把家撑住，却不擅长说自己撑不住。',
    quote: '我没事，你们好好的就行。',
  },
  {
    id: 'philosopher', name: '躺平哲学家', icon: '🌿', persona: 'liu', card: 'c_liu',
    desc: '你不是不努力，你只是不想再为别人的标准努力。你在学习怎么为自己活。',
    quote: '人生不是只有上岸这一种方向。',
  },
  {
    id: 'ranger', name: '城市游侠', icon: '🛵', persona: 'chen', card: 'c_chen',
    desc: '你擅长在城市的缝隙里找机会。你不怕从头开始，只怕被困住。',
    quote: '路是走出来的，不是招聘软件推出来的。',
  },
];

export const PERSONALITY_QUESTIONS = [
  {
    id: 'q1', q: 'HR 说完“明天不用来了”，你第一反应是？',
    options: [
      { text: '先把表情稳住，别让人看出来', scores: { performer: 3, glue: 1 } },
      { text: '算一下补偿金能撑几个月', scores: { gambler: 3, ranger: 1 } },
      { text: '打开招聘软件，先投十份', scores: { learner: 3, performer: 1 } },
    ],
  },
  {
    id: 'q2', q: '第二天早上，你最想去哪？',
    options: [
      { text: '图书馆，有空调，也像在上班', scores: { performer: 2, learner: 2 } },
      { text: '咖啡馆，见个人，打听机会', scores: { ranger: 2, gambler: 2 } },
      { text: '公园，先坐一会儿', scores: { philosopher: 3, glue: 1 } },
    ],
  },
  {
    id: 'q3', q: '手机里最不敢点开的是？',
    options: [
      { text: '家庭群和父母的未接来电', scores: { glue: 3, performer: 1 } },
      { text: '银行余额和账单', scores: { gambler: 3, ranger: 1 } },
      { text: '前同事的升职朋友圈', scores: { performer: 2, learner: 2 } },
    ],
  },
  {
    id: 'q4', q: '朋友问你最近怎么样，你会说？',
    options: [
      { text: '“在看机会，挺好的。”', scores: { performer: 3, learner: 1 } },
      { text: '“刚出来，准备做点自己的事。”', scores: { gambler: 2, ranger: 2 } },
      { text: '“先歇一阵，想清楚再说。”', scores: { philosopher: 3, glue: 1 } },
    ],
  },
  {
    id: 'q5', q: '如果突然多出 5 万，你会先？',
    options: [
      { text: '报个课/考个证，提升自己', scores: { learner: 3, performer: 1 } },
      { text: '进货/投流/试个小生意', scores: { gambler: 3, ranger: 1 } },
      { text: '存起来，先保证家里安全', scores: { glue: 3, philosopher: 1 } },
    ],
  },
  {
    id: 'q6', q: '第 21 天，你最想听到哪句话？',
    options: [
      { text: '“欢迎回来上班。”', scores: { performer: 2, learner: 2 } },
      { text: '“这个月赚的够花了。”', scores: { gambler: 3, ranger: 1 } },
      { text: '“没关系，我们慢慢来。”', scores: { glue: 2, philosopher: 2 } },
    ],
  },
];

export const BADGE_TITLES = [
  '图书馆首席内容官', '城市漫游研究员', '家庭首席情绪官', '夜市商业分析师',
  'AI 提示词工程师（待业版）', '地铁线路体验官', '公园长椅战略顾问', '前公司楼下观察员',
  '空档期人生教练', '咖啡因耐受测试员', '简历改版艺术家', '体面维持专员',
];

export const NAMING_MOMENTS = {
  3: {
    id: 'naming_mother',
    title: '母亲的电话',
    body: '母亲问：“最近忙不忙？你王阿姨说你好像瘦了。”电话那头有电视声。',
    euphemism: '“项目收尾，有点忙。”',
    direct: '“妈，我被裁了。”',
    family: false,
  },
  10: {
    id: 'naming_zhao',
    title: '老赵的炒粉摊',
    body: '老赵一边炒粉一边问：“你最近也没去上班？”油烟很大，他的声音很平。',
    euphemism: '“岗位调整，先歇歇。”',
    direct: '“对，我被裁了。”',
    family: false,
  },
  18: {
    id: 'naming_family',
    title: '餐桌上的停顿',
    body: '伴侣把筷子放下：“你最近……是不是有事瞒着我？”孩子抬头看你。',
    euphemism: '“公司调整，我休息一阵。”',
    direct: '“对，我被裁了。”',
    family: true,
  },
  21: {
    id: 'naming_final',
    title: '家庭会议',
    body: '一家人围坐在餐桌旁。账单、学费、下个月的房贷，都摊在桌上。',
    euphemism: '“公司调整，我在想办法。”',
    direct: '“我被裁了。”',
    family: true,
  },
};

export const WEEKLY_REPORTS = [
  {
    week: 1, title: '第一周 · 维持正常', okr: 'O：让生活看起来没变化。KR1：每天 8:15 出门；KR2：至少圆过 3 次谎；KR3：不让家里发现工牌。',
    lines: ['亮点：图书馆的座位已经混熟。', '风险：邻居开始在电梯里多看你一眼。', '下周计划：找一个能赚钱的方向。'],
  },
  {
    week: 2, title: '第二周 · 寻找第二曲线', okr: 'O：在空档期找到一条能走的路。KR1：推进一条路线；KR2：至少赚到第一笔钱；KR3：控制露馅值。',
    lines: ['亮点：你开始有一件“每天要做的事”。', '风险：账单和第二笔硬支出正在靠近。', '下周计划：把路线推到下一阶段。'],
  },
  {
    week: 3, title: '第三周 · 纸包不住火', okr: 'O：在第 21 天前做一个决定。KR1：路线冲到 3 段；KR2：准备好家庭会议；KR3：决定要不要说出那个词。',
    lines: ['亮点：你已经不是第一天那个只会演的人了。', '风险：时间、现金和信任，都在减少。', '下周计划：面对那顿饭。'],
  },
];
