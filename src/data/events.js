export const EVENTS = [
  {
    id: 'ev_classmate', title: '同学群突然热闹', tags: [20, 30, 40], weight: 2,
    body: '张鹏在群里发了一张新办公室的照片，配文“又签了一个大单”。下面一排水滴表情。',
    choices: [
      { text: '点个赞，不说话', effects: { face: 2, spirit: -2 }, result: '你点完赞，把群设成了免打扰。' },
      { text: '私聊他，问问有没有机会', effects: { people: 1, clue: 'boss_wechat', route: { freelance: 1 } }, result: '他回得很快：“来聊聊。”你不知道是机会还是坑。' },
    ],
  },
  {
    id: 'ev_neighbor', title: '电梯里的邻居', tags: [30, 40, 50], weight: 2,
    body: '邻居阿姨盯着你的拖鞋看了两秒：“今天不上班啊？”电梯里还有两个人。',
    choices: [
      { text: '“调休。”', effects: { suspicion: 6, face: 1 }, result: '她“哦”了一声，眼神没离开你的脸。' },
      { text: '“刚下班，回来拿东西。”', effects: { suspicion: 2, spirit: -2 }, result: '你按了最近的楼层，提前出了电梯。' },
    ],
  },
  {
    id: 'ev_recruiter', title: '猎头已读不回', tags: [20, 30, 40], weight: 2,
    body: '猎头 Amy 看了你的简历，又看了你的年龄，最后回了一句“有合适的再联系你”。',
    choices: [
      { text: '追问一句“方便说下原因吗”', effects: { pro: 1, spirit: -3 }, result: '她没回。你把手机扣在桌上。' },
      { text: '把年龄改小两岁', effects: { face: 2, suspicion: 4, spirit: -2 }, result: '你盯着那行数字，最后还是改了回去。' },
    ],
  },
  {
    id: 'ev_bill_reminder', title: '账单提前到了', tags: [30, 40, 50], weight: 2,
    body: '手机弹出提醒：下周三，房贷/房租自动扣款。余额比你想的少。',
    choices: [
      { text: '先转进一笔，假装没看见', effects: { cash: -500, spirit: -2 }, result: '余额更少了，但至少暂时安全。' },
      { text: '打开记账软件，重新算一遍', effects: { spirit: 2, route: { gig: 1 } }, result: '你算出一个新数字：还能撑 19 天。' },
    ],
  },
  {
    id: 'ev_parent_call', title: '母亲的视频电话', tags: [20, 30, 40], weight: 2,
    body: '视频接通，母亲把镜头转向一桌菜：“你爸做了你爱吃的。最近是不是瘦了？”',
    choices: [
      { text: '把镜头对着白墙，说在加班', effects: { suspicion: 8, trust: -4, spirit: -3 }, result: '母亲说：“那你先忙。”她先挂了。' },
      { text: '说最近在休息', effects: { trust: 5, spirit: 2, suspicion: 3 }, result: '她沉默了两秒，说：“休息好，别硬撑。”' },
    ],
  },
  {
    id: 'ev_school', title: '家长群点名', tags: [30, 40], weight: 2,
    body: '老师在群里@所有人：下周三家长会，请父母尽量到场。朵朵在客厅喊：“爸爸/妈妈，你去吗？”',
    choices: [
      { text: '“我去。”', effects: { trust: 6, spirit: 3, flag: 'kid_time' }, result: '孩子把通知单贴在了冰箱上。' },
      { text: '“让奶奶去吧。”', effects: { trust: -5, spirit: -2, suspicion: 3 }, result: '孩子没说话，回房间关上了门。' },
    ],
  },
  {
    id: 'ev_old_office', title: '前公司发来消息', tags: [20, 30, 40], weight: 2,
    body: '王总：“有个项目临时缺人，你这两天方便来帮个忙吗？按外包算。”',
    choices: [
      { text: '答应，先赚钱', effects: { cash: 1200, health: -4, route: { return: 1 }, suspicion: 4 }, result: '你回到熟悉的会议室，发现自己还记得 Wi-Fi 密码。' },
      { text: '拒绝，不想再回去', effects: { spirit: 3, face: 2, route: { freelance: 1 } }, result: '你打出“不方便”三个字，删了又打，最后发了出去。' },
    ],
  },
  {
    id: 'ev_landlord', title: '房东的语音', tags: [20, 30, 40, 50], weight: 2,
    body: '房东发来 59 秒语音，中心思想是：下个月起涨租 300，不同意就搬。',
    choices: [
      { text: '砍价，提出年付', effects: { cash: -1000, spirit: -2, clue: 'rent_contract' }, result: '房东说“年付可以少 100”，你算了一下，还是亏。' },
      { text: '先拖着，说下周答复', effects: { spirit: -3, suspicion: 2, clue: 'rent_contract' }, result: '你把这句“下周”存进了备忘录。' },
    ],
  },
  {
    id: 'ev_gym', title: '健身房的推销', tags: [20, 30, 40], weight: 1,
    body: '教练说你现在这个状态，办张年卡最合适。你看了看镜子里的自己。',
    choices: [
      { text: '办个月卡', effects: { cash: -299, health: 6, spirit: 3, flag: 'gym' }, result: '你跑了 3 公里，感觉自己还能抢救一下。' },
      { text: '说下次一定', effects: { spirit: -1 }, result: '教练说“好的哥/姐”，眼神里没有下次。' },
    ],
  },
  {
    id: 'ev_ai', title: 'AI 把你替代了', tags: [20, 30, 40], weight: 2,
    body: '前同事发来一个链接：公司上线了新的 AI 工具，正好是你以前负责的那块。',
    choices: [
      { text: '研究它，学起来', effects: { pro: 1, spirit: -2, route: { freelance: 1 }, flag: 'learn_ai' }, result: '你花了三个小时，发现它确实比你快。' },
      { text: '关掉页面，去跑步', effects: { health: 4, spirit: 2 }, result: '你跑了很久，直到手机没电。' },
    ],
  },
  {
    id: 'ev_wedding', title: '前同事的婚礼', tags: [20, 30], weight: 1,
    body: '请柬发到群里，份子钱 800。你现在不太想去。',
    choices: [
      { text: '去，穿得体面点', effects: { cash: -800, face: 5, people: 1, suspicion: 2 }, result: '你在婚礼上被问了 6 次“最近在哪高就”。' },
      { text: '随份子，人不到', effects: { cash: -500, face: 1, spirit: -1 }, result: '你在群里发了个红包，写了“新婚快乐”。' },
    ],
  },
  {
    id: 'ev_health', title: '体检报告出来了', tags: [30, 40, 50], weight: 2,
    body: '三项异常。医生建议复查，你想起自己还没交下个月的医保。',
    choices: [
      { text: '预约复查', effects: { cash: -300, health: 4, clue: 'health_report', flag: 'health_check' }, result: '你把预约短信截了图，存进“待办”。' },
      { text: '先放一放', effects: { health: -3, spirit: -2, suspicion: 2 }, result: '你把报告折好，塞进抽屉最下面。' },
    ],
  },
  {
    id: 'ev_community', title: '社区团购群', tags: [30, 40, 50], weight: 1,
    body: '邻居在群里问：有没有人一起团水果？你突然想到，自己也可以做这个。',
    choices: [
      { text: '试着开一团', effects: { cash: -100, people: 1, route: { crossborder: 1 }, clue: 'license' }, result: '你卖了 12 箱橙子，赚了 36 块，认识了 12 个邻居。' },
      { text: '先观察', effects: { street: 1, route: { stall: 1 } }, result: '你记下了他们最常买的东西。' },
    ],
  },
  {
    id: 'ev_pet', title: '楼下的小猫', tags: [20, 30, 40, 50], weight: 1,
    body: '一只橘猫蹲在单元门口，冲你叫了一声。你想起自己已经很久没有和谁打招呼。',
    choices: [
      { text: '去买根火腿肠', effects: { cash: -5, spirit: 5 }, result: '它吃得很急。你蹲了很久。' },
      { text: '拍张照，发朋友圈', effects: { spirit: 2, suspicion: 2, face: 1 }, result: '有人评论“你最近很闲啊”。你删了那条朋友圈。' },
    ],
  },
  {
    id: 'ev_delivery_rain', title: '暴雨天的订单', tags: [20, 30, 40], weight: 2,
    body: '平台弹出“恶劣天气补贴”，一单多 3 块。窗外雨很大。',
    choices: [
      { text: '出门跑两小时', effects: { cash: 300, health: -6, route: { gig: 1 }, flag: 'takeout' }, result: '你浑身湿透，手机进水，但今天赚了 300。' },
      { text: '在家休息', effects: { health: 4, spirit: 2 }, result: '你听着雨声睡了一觉，醒来有点愧疚，又有点轻松。' },
    ],
  },
  {
    id: 'ev_badge', title: '旧工牌', tags: [20, 30, 40], weight: 1,
    body: '整理抽屉时翻出旧工牌，挂绳上还有咖啡渍。你试着刷了一下门禁，当然没反应。',
    choices: [
      { text: '收进盒子', effects: { spirit: -2, clue: 'old_badge', flag: 'fix_badge' }, result: '你把盒子放回原处，像放回一段人生。' },
      { text: '挂到闲鱼上', effects: { cash: 50, spirit: 3, face: -1 }, result: '有人问“能过门禁吗”。你回：“不能，但能装。”' },
    ],
  },
  {
    id: 'ev_exam_ad', title: '考编培训广告', tags: [20, 30], weight: 1,
    body: '“35 岁前最后的机会，上岸不是梦。”你看了看价格：12800。',
    choices: [
      { text: '报个基础班', effects: { cash: -800, pro: 1, route: { exam: 1 }, flag: 'exam' }, result: '你买了课，听了 20 分钟，做了 3 页笔记。' },
      { text: '白嫖免费资料', effects: { pro: 1, spirit: -1, route: { exam: 1 } }, result: '你存了 2G 资料，再也没打开过。' },
    ],
  },
  {
    id: 'ev_shop_window', title: '街角招租', tags: [30, 40, 50], weight: 1,
    body: '街角那间铺子贴出“转让”，玻璃上写着“适合咖啡、烘焙、小酒馆”。',
    choices: [
      { text: '打电话问转让费', effects: { cash: -0, route: { openstore: 1 }, clue: 'license', spirit: 3 }, result: '转让费 8 万，押三付一。你算了一下，刚好够。' },
      { text: '拍张照，先存着', effects: { spirit: 2, route: { openstore: 1 } }, result: '你把照片存进一个叫“以后”的相册。' },
    ],
  },
  {
    id: 'ev_old_colleague', title: '老赵的摊位', tags: [20, 30, 40], weight: 2,
    body: '老赵在夜市卖炒粉，看到你，挥了挥铲子：“来，给你加个蛋。”',
    choices: [
      { text: '坐下吃，听他聊', effects: { cash: -15, spirit: 6, people: 1, clue: 'witness', route: { stall: 1 } }, result: '他说：“别急着找下家。先想想有没有哪一天是你自己安排的。”' },
      { text: '帮他收一会儿摊', effects: { health: -2, people: 1, cash: 80, route: { stall: 1 }, flag: 'stall' }, result: '你收完摊，手上全是油烟味。莫名踏实。' },
    ],
  },
  {
    id: 'ev_mirror', title: '地铁玻璃里的自己', tags: [20, 30, 40, 50], weight: 1,
    body: '地铁进站，玻璃映出你的脸。你穿着衬衫，拎着电脑包，和旁边的人没有任何区别。',
    choices: [
      { text: '挺直背，继续演', effects: { face: 3, spirit: -2, suspicion: -2 }, result: '你看起来更像个上班的人了。' },
      { text: '提前一站下车', effects: { spirit: 4, health: 2, suspicion: 3 }, result: '你走了一站路，发现路边有一家没见过的面馆。' },
    ],
  },
  {
    id: 'ev_kid_question', title: '孩子的问题', tags: [30, 40], weight: 2,
    body: '孩子问：“你为什么每天都很早回家？是不是不用上班了？”',
    choices: [
      { text: '“最近比较闲。”', effects: { suspicion: 5, trust: -2, spirit: -2 }, result: '孩子“哦”了一声，去写作业了。' },
      { text: '“爸爸/妈妈最近在休息。”', effects: { trust: 5, spirit: 2, suspicion: 3 }, result: '孩子说：“那你可以来接我放学吗？”' },
    ],
  },
  {
    id: 'ev_weekday', title: '工作日的下午', tags: [20, 30, 40, 50], weight: 2,
    body: '下午三点，公园里全是遛狗的老人和推婴儿车的父母。你突然不知道这个点该去哪。',
    choices: [
      { text: '坐一会儿，什么都不做', effects: { spirit: 5, health: 2, suspicion: 2, flag: 'park' }, result: '你坐了一个小时，第一次没觉得浪费时间。' },
      { text: '打开招聘软件', effects: { pro: 1, spirit: -2, route: { rehire: 1 } }, result: '刷了 20 分钟，又关掉了。' },
    ],
  },
  {
    id: 'ev_friend_free', title: '朋友问你最近怎么有空', tags: [20, 30, 40], weight: 2,
    body: '朋友约你工作日喝咖啡：“你最近怎么这么闲？”',
    choices: [
      { text: '“我请了假，想休息一段。”', effects: { spirit: 5, trust: 2, suspicion: 2, flag: 'said_break' }, result: '朋友说：“挺好的，我也想。”' },
      { text: '“最近调休。”', effects: { face: 3, suspicion: 5, spirit: -1 }, result: '你把这句已经说了很多遍的话又说了一遍。' },
    ],
  },
  {
    id: 'ev_insurance', title: '保险推销电话', tags: [30, 40, 50], weight: 1,
    body: '对方说：“您现在没有单位医保的话，更应该为自己考虑。”你被戳中了。',
    choices: [
      { text: '买一份基础的', effects: { cash: -1200, health: 3, spirit: 2 }, result: '你拿到一份电子保单，感觉多了一层薄薄的底。' },
      { text: '挂掉', effects: { spirit: -1, suspicion: 1 }, result: '电话又响了两次，你没接。' },
    ],
  },
  {
    id: 'ev_friend_borrow', title: '朋友来借钱', tags: [20, 30, 40], weight: 1,
    body: '一个很久没联系的朋友开口借 5000，说下个月还。你自己下个月的账单还没着落。',
    choices: [
      { text: '借 2000', effects: { cash: -2000, people: 2, trust: 2, spirit: 2 }, result: '他连发三个“谢谢”。你不知道这钱还能不能回来。' },
      { text: '如实说最近也紧', effects: { face: -2, spirit: 1, people: -1 }, result: '他说“理解”，然后很久没再联系。' },
    ],
  },
  {
    id: 'ev_grocery', title: '超市的临期区', tags: [20, 30, 40, 50], weight: 1,
    body: '你开始熟练地在临期区挑东西。以前你从不看价格。',
    choices: [
      { text: '买两盒，省 30 块', effects: { cash: 30, spirit: 1, health: -1 }, result: '味道没什么不同。你吃得很干净。' },
      { text: '去常去的店，买新鲜的', effects: { cash: -60, spirit: 3 }, result: '你拎着袋子出来，觉得自己还没垮。' },
    ],
  },
  {
    id: 'ev_library_friend', title: '图书馆的同类', tags: [20, 30, 40], weight: 1,
    body: '连续三天，你旁边都坐着同一个年轻人。他的电脑屏幕上也是招聘网站。',
    choices: [
      { text: '递一张纸条：“加油”', effects: { spirit: 4, people: 1, route: { fake: 1 } }, result: '他愣了一下，回了一张：“你也是。”' },
      { text: '假装没看见', effects: { spirit: -1, suspicion: 1 }, result: '你们都很有默契地没有抬头。' },
    ],
  },
  {
    id: 'ev_tax', title: '个税 APP', tags: [30, 40], weight: 1,
    body: '你打开个税 APP，发现上一家公司的离职日期已经更新。系统比你先接受了这件事。',
    choices: [
      { text: '截图保存', effects: { clue: 'payslip', spirit: -2 }, result: '你把截图放进一个叫“证据”的文件夹。' },
      { text: '申请退税', effects: { cash: 600, pro: 1 }, result: '退了 600 块。你请自己吃了顿好的。' },
    ],
  },
  {
    id: 'ev_rain', title: '突然下雨', tags: [20, 30, 40, 50], weight: 1,
    body: '你站在便利店门口，没带伞。对面是前公司的写字楼，灯还亮着。',
    choices: [
      { text: '等雨停', effects: { spirit: 3, health: -1 }, result: '你看了 40 分钟雨。没有人给你发消息。' },
      { text: '冲进雨里', effects: { health: -3, spirit: 4, suspicion: 2 }, result: '你跑回家，浑身湿透，笑得像个傻子。' },
    ],
  },
  {
    id: 'ev_night_market', title: '夜市的第一盏灯', tags: [20, 30, 40, 50], weight: 2,
    body: '夜市开摊了，第一盏灯亮起来。你站在人群里，闻着油烟和糖水味。',
    choices: [
      { text: '问问摊位怎么租', effects: { route: { stall: 1 }, street: 1, flag: 'stall' }, result: '大刘说：“先来帮我两天，不收你钱。”' },
      { text: '买份炒粉，回家', effects: { cash: -15, spirit: 4 }, result: '你边走边吃，觉得这条街比写字楼有人味。' },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
