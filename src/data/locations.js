export const LOCATIONS = [
  {
    id: 'library', name: '市图书馆', icon: '📖', cost: 0, risk: '低', tone: '#6f8f4d',
    desc: '免费空调、热水和安静。你旁边的人也在改简历。',
    arrival: { pro: 1, suspicion: -3, flag: 'library', energy: 1 },
    scene: 'library',
  },
  {
    id: 'cafe', name: '街角咖啡', icon: '☕', cost: 35, risk: '中', tone: '#a67c52',
    desc: '35 块买一个座位，和一点“我还在城里”的感觉。',
    arrival: { cash: -35, people: 1, energy: 1, suspicion: 2 },
    scene: 'cafe',
  },
  {
    id: 'park', name: '中央公园', icon: '🌳', cost: 0, risk: '中', tone: '#7b9c8d',
    desc: '阳光、长椅、遛狗的人。你很容易在这里睡着。',
    arrival: { health: 3, spirit: 4, suspicion: 3, flag: 'park' },
    scene: 'park',
  },
  {
    id: 'cowork', name: '共享办公', icon: '💻', cost: 80, risk: '中', tone: '#58789a',
    desc: '按天付费的工位，周围都是“创业者”。有人会来搭话。',
    arrival: { cash: -80, street: 1, people: 1, route: { freelance: 1 } },
    scene: 'cowork',
  },
  {
    id: 'mall', name: '商场 / 影院', icon: '🛍️', cost: 100, risk: '高', tone: '#9a6f8d',
    desc: '工作日的商场很空。你突然有了大把时间，却不知道买什么。',
    arrival: { cash: -100, spirit: 5, suspicion: 5 },
    scene: 'mall',
  },
  {
    id: 'oldoffice', name: '前公司商圈', icon: '🏢', cost: 0, risk: '高', tone: '#5c6470',
    desc: '你不上去，只在楼下站一会儿。看那些和你无关的人进进出出。',
    arrival: { suspicion: 7, face: 2, route: { return: 1 }, clue: 'boss_wechat' },
    scene: 'oldoffice',
  },
  {
    id: 'jobfair', name: '人才市场', icon: '📋', cost: 0, risk: '低', tone: '#b64a3b',
    desc: '一排排展位，一张张写着“35 岁以下”的纸。',
    arrival: { pro: 1, spirit: -2, route: { rehire: 1 }, flag: 'jobfair' },
    scene: 'jobfair',
  },
  {
    id: 'nightmarket', name: '夜市', icon: '🏮', cost: 0, risk: '中', tone: '#d9a441', eveningOnly: true,
    desc: '油烟、灯串、吆喝声。这里不问你从哪来，只问你买不买。',
    arrival: { street: 1, spirit: 3, route: { stall: 1 }, flag: 'stall' },
    scene: 'nightmarket',
  },
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
export const DAY_LOCATIONS = LOCATIONS.filter((l) => !l.eveningOnly);
