export const VIRAL = {
  topics: [
    { id: 'layoff', name: '空档后我每天假装上班', heat: 18, audience: '打工人' },
    { id: 'commute', name: '通勤 11 年，我第一次坐过站', heat: 12, audience: '城市青年' },
    { id: 'family', name: '我妈以为我还在大厂', heat: 15, audience: '家庭' },
    { id: 'ai', name: 'AI 把我原来的活干了', heat: 20, audience: '职场' },
  ],
  titles: [
    { id: 't1', text: 'HR 说不用来了，我照常出门了 21 天', ctr: 20, risk: 2 },
    { id: 't2', text: '空档后，我成了图书馆最准时的人', ctr: 14, risk: 1 },
    { id: 't3', text: '35 岁，我把工牌挂上了闲鱼', ctr: 18, risk: 5 },
    { id: 't4', text: '今天也是假装上班的一天', ctr: 9, risk: 1 },
  ],
  covers: [
    { id: 'c1', name: '空工位', match: 10, risk: 1 },
    { id: 'c2', name: '图书馆窗边', match: 8, risk: 0 },
    { id: 'c3', name: '地铁玻璃倒影', match: 12, risk: 3 },
  ],
  times: [
    { id: 'm', name: '早上 8:00', bonus: 8 },
    { id: 'n', name: '晚上 22:00', bonus: 12 },
    { id: 'l', name: '凌晨 1:00', bonus: 5 },
  ],
};

export const LEDGER = {
  rounds: 3,
  priceOptions: [
    { price: 8, label: '8 元 · 走量', demand: 26, margin: 3 },
    { price: 12, label: '12 元 · 常规', demand: 18, margin: 6 },
    { price: 18, label: '18 元 · 高端', demand: 10, margin: 10 },
  ],
  stockOptions: [
    { stock: 12, label: '少进 12 份', cost: 72 },
    { stock: 24, label: '常规 24 份', cost: 144 },
    { stock: 36, label: '多进 36 份', cost: 216 },
  ],
  weather: [
    { name: '晴天', demand: 1.15 },
    { name: '阴天', demand: 1.0 },
    { name: '下雨', demand: 0.72 },
  ],
};

export const DELIVERY = {
  duration: 24,
  orders: [
    { id: 'o1', label: '写字楼 · 咖啡', pay: 8, distance: 1.2, time: 3 },
    { id: 'o2', label: '医院 · 药', pay: 12, distance: 2.4, time: 5 },
    { id: 'o3', label: '老小区 6 楼 · 外卖', pay: 9, distance: 1.8, time: 4 },
    { id: 'o4', label: '学校 · 文件', pay: 15, distance: 3.1, time: 6 },
    { id: 'o5', label: '商场 · 奶茶', pay: 7, distance: 0.8, time: 2 },
    { id: 'o6', label: '郊区 · 蛋糕', pay: 22, distance: 5.6, time: 9 },
    { id: 'o7', label: '酒店 · 行李', pay: 18, distance: 3.8, time: 7 },
    { id: 'o8', label: '夜市 · 食材', pay: 11, distance: 2.0, time: 4 },
  ],
};

export const EXAM = {
  days: 7,
  subjects: [
    { id: 'xingce', name: '行测', weight: 1.2 },
    { id: 'shenlun', name: '申论', weight: 1.0 },
    { id: 'interview', name: '面试', weight: 0.9 },
  ],
  baseScore: 30,
};

export const INTERROGATION = [
  {
    q: '“你今天怎么这么早就回来了？”',
    fragments: [
      { text: '“项目提前收尾，领导让我们早点走。”', fit: 2, bad: false },
      { text: '“我请了半天假，去医院拿报告。”', fit: 2, bad: false },
      { text: '“公司今天停电，全楼都放假。”', fit: 1, bad: false },
      { text: '“我下午一直在公司，你记错了吧。”', fit: 0, bad: true },
      { text: '“加班太累了，我提前回来睡会儿。”', fit: 1, bad: false },
      { text: '“你不是也在家吗，怎么问我？”', fit: 0, bad: true },
    ],
  },
  {
    q: '“你工牌呢？怎么没见你戴？”',
    fragments: [
      { text: '“新工牌在换，旧的收起来了。”', fit: 2, bad: false },
      { text: '“今天居家办公，不用戴。”', fit: 1, bad: false },
      { text: '“挂绳断了，我放抽屉里了。”', fit: 2, bad: false },
      { text: '“工牌有什么好戴的，谁看啊。”', fit: 0, bad: true },
      { text: '“公司改成刷脸了，不用工牌。”', fit: 1, bad: false },
      { text: '“你是不是翻我东西了？”', fit: 0, bad: true },
    ],
  },
  {
    q: '“家长会为什么是你去？你不用上班吗？”',
    fragments: [
      { text: '“我调休，正好有空。”', fit: 2, bad: false },
      { text: '“公司这周不忙，我请了半天假。”', fit: 2, bad: false },
      { text: '“老师点名要父母去，我就去了。”', fit: 1, bad: false },
      { text: '“我上不上班，跟你有关系吗？”', fit: 0, bad: true },
      { text: '“我最近在家办公，时间自由。”', fit: 1, bad: false },
      { text: '“你是不是希望我不去？”', fit: 0, bad: true },
    ],
  },
];
