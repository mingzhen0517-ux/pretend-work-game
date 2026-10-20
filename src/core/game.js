import { createRng, hashString } from './rng.js';
import { PERSONA_BY_ID } from '../data/personas.js';
import { STARTING_DECK, CARD_BY_ID, COMMON_CARDS } from '../data/cards.js';
import { ROUTES, ROUTE_BY_ID, ROUTE_IDS, ROUTE_THRESHOLDS } from '../data/routes.js';
import { ENDING_BY_ID } from '../data/endings.js';
import { CLUE_BY_ID } from '../data/clues.js';
import { NAMING_MOMENTS, CHECKLIST } from '../data/meta.js';

export const BILL_DAYS = [7, 14, 21];
export const MAX_DAY = 21;
export const HAND_SIZE = 4;

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function createRun(personaId, seed = Date.now(), difficulty = 'standard', referral = null) {
  const persona = PERSONA_BY_ID[personaId] || PERSONA_BY_ID.zhou;
  const rng = createRng(seed);
  const deck = [...STARTING_DECK, persona.cardId];
  const flags = {};
  CHECKLIST.forEach((c) => { flags[c.flag] = false; });
  flags.saidTheWord = false;
  flags.toldFamily = false;
  flags.fakeLocked = false;
  flags.exposed = false;
  flags.familySupport = false;
  flags.started = true;
  const routes = {};
  ROUTE_IDS.forEach((id) => { routes[id] = 0; });
  const state = {
    v: 1,
    runId: `${personaId}-${seed}-${hashString(String(seed)).toString(36)}`,
    seed: String(seed),
    rngState: rng.state,
    personaId: persona.id,
    day: 1,
    phase: 'morning',
    energy: 6,
    maxEnergy: 6,
    stats: {
      cash: persona.cash,
      face: persona.stats.face,
      spirit: persona.stats.spirit,
      health: persona.stats.health,
      trust: persona.stats.trust,
      suspicion: 0,
    },
    skills: { ...persona.skills },
    deck,
    hand: [],
    discard: [],
    clues: [],
    flags,
    routes,
    routeStage: Object.fromEntries(ROUTE_IDS.map((id) => [id, 0])),
    usedRouteDialogues: [],
    focusRoute: null,
    focusPicked: false,
    location: null,
    dayActions: 0,
    dayLog: [],
    history: [],
    billsPaid: [false, false, false],
    debt: 0,
    difficulty,
    referralCode: makeShareCode(persona.id, seed),
    referredBy: referral || null,
    weeklyReportsSeen: [],
    namingDone: [],
    usedMainDialogues: [],
    usedMinigames: [],
    familySupportCard: false,
    ended: false,
    endingId: null,
    createdAt: Date.now(),
  };
  if (referral) {
    state.stats.cash += 500;
    addClue(state, 'witness');
    state.flags.referral = true;
    log(state, '一位老同事给你留了 500 元和一张“同事证言”。');
  }
  drawHand(state);
  return state;
}

export function makeShareCode(personaId, seed) {
  const raw = `${personaId}-${seed}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = hashString(raw);
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[h % chars.length];
    h = Math.floor(h / chars.length) + 17;
  }
  return out;
}

export function getRng(state) {
  const rng = createRng(state.rngState || state.seed);
  return rng;
}

export function syncRng(state, rng) {
  state.rngState = rng.state;
}

export function drawHand(state, force = false) {
  const rng = getRng(state);
  let hand = state.hand ? state.hand.slice() : [];
  if (force) {
    hand.forEach((id) => { if (!state.discard.includes(id)) state.discard.push(id); });
    hand = [];
  }
  while (hand.length < HAND_SIZE) {
    if (!state.deck.length) {
      if (!state.discard.length) break;
      state.deck = rng.shuffle(state.discard);
      state.discard = [];
    }
    const card = state.deck.shift();
    if (!card) break;
    if (hand.includes(card)) {
      state.discard.push(card);
      continue;
    }
    hand.push(card);
  }
  state.hand = hand;
  syncRng(state, rng);
  return hand;
}

export function discardCard(state, cardId) {
  state.hand = (state.hand || []).filter((id) => id !== cardId);
  if (!state.discard.includes(cardId)) state.discard.push(cardId);
}

export function getCard(state, id) {
  if (String(id).startsWith('focus_')) {
    return makeFocusCard(state, id.replace('focus_', ''));
  }
  if (id === 'family_support') {
    return {
      id: 'family_support', name: '家人托底', cost: 0, tags: ['家庭'], rarity: 'special', kind: 'instant',
      desc: '你已经说出口了。家里知道你在空档，但不再假装不知道。',
      effects: { trust: 4, spirit: 5, suspicion: -8 },
      special: true,
    };
  }
  return CARD_BY_ID[id];
}

export function makeFocusCard(state, routeId) {
  const route = ROUTE_BY_ID[routeId];
  if (!route) return null;
  const stage = state.routeStage?.[routeId] || 0;
  const stageName = route.stages[Math.min(stage, route.stages.length - 1)]?.name || '推进';
  const engineLabel = {
    dialogue: '关键对话', viral: '内容实验', ledger: '生意账本', delivery: '跑单', exam: '备考', interrogation: '伪装盘问',
  }[route.engine] || '推进';
  return {
    id: `focus_${routeId}`,
    name: `今日重点：${stageName}`,
    cost: 1,
    tags: [route.name, engineLabel],
    rarity: 'focus',
    kind: 'route',
    routeId,
    engine: route.engine,
    desc: `把今天的一段时间投给「${route.name}」。${route.desc}`,
    focus: true,
  };
}

export function addClue(state, clueId) {
  if (!clueId || !CLUE_BY_ID[clueId]) return false;
  if (state.clues.includes(clueId)) return false;
  state.clues.push(clueId);
  return true;
}

export function log(state, text, kind = 'info') {
  state.dayLog = state.dayLog || [];
  state.dayLog.push({ text, kind, day: state.day });
  if (state.dayLog.length > 80) state.dayLog.shift();
}

export function addHistory(state, text) {
  state.history = state.history || [];
  state.history.push({ day: state.day, text });
  if (state.history.length > 120) state.history.shift();
}

export function statValue(state, stat) {
  if (['pro', 'people', 'street'].includes(stat)) return state.skills[stat] || 0;
  if (stat === 'trust') return state.stats.trust;
  if (stat === 'face') return state.stats.face;
  if (stat === 'spirit') return state.stats.spirit;
  if (stat === 'health') return state.stats.health;
  return 0;
}

export function checkChance(state, card, boost = false) {
  if (!card?.check) return 1;
  const stat = card.check.stat;
  const skill = statValue(state, stat);
  let chance;
  if (['pro', 'people', 'street'].includes(stat)) {
    chance = 0.35 + skill * 0.08 + (state.stats.face || 0) * 0.0015 - (card.check.diff || 0);
  } else {
    chance = 0.35 + (skill / 20) - (card.check.diff || 0);
  }
  if (boost) chance += 0.15;
  return clamp(chance, 0.15, 0.95);
}

export function rollCheck(state, card, boost = false) {
  const rng = getRng(state);
  const chance = checkChance(state, card, boost);
  const roll = rng.next();
  syncRng(state, rng);
  const ok = roll <= chance;
  const crit = ok && roll <= chance * 0.2;
  const critFail = !ok && roll > 0.95;
  return { ok, crit, critFail, chance, roll };
}

export function applyEffects(state, effects = {}, context = {}) {
  if (!effects || typeof effects !== 'object') return state;
  const s = state.stats;
  const difficultyMod = state.difficulty === 'story' ? 0.7 : 1;
  const applyDelta = (key, value) => {
    if (!value) return;
    if (key === 'cash') { s.cash += value; return; }
    if (['face', 'spirit', 'health', 'trust', 'suspicion'].includes(key)) {
      let v = value;
      if (key === 'suspicion' && value > 0) v = Math.round(value * difficultyMod);
      s[key] = clamp(s[key] + v, 0, 100);
      return;
    }
    if (['pro', 'people', 'street'].includes(key)) {
      state.skills[key] = clamp((state.skills[key] || 0) + value, 0, 5);
      return;
    }
    if (key === 'debt') { state.debt = Math.max(0, (state.debt || 0) + value); return; }
    if (key === 'energy') { state.energy = clamp(state.energy + value, 0, state.maxEnergy); return; }
    if (key === 'clue') { addClue(state, value); return; }
    if (key === 'flag') { state.flags[value] = true; return; }
    if (key === 'unflag') { state.flags[value] = false; return; }
    if (key === 'route') {
      Object.entries(value).forEach(([routeId, amount]) => {
        if (!ROUTE_BY_ID[routeId]) return;
        state.routes[routeId] = Math.max(0, (state.routes[routeId] || 0) + amount);
        updateRouteStage(state, routeId);
      });
      return;
    }
    if (key === 'routeProgress') {
      Object.entries(value).forEach(([routeId, amount]) => {
        if (!ROUTE_BY_ID[routeId]) return;
        state.routes[routeId] = Math.max(0, (state.routes[routeId] || 0) + amount);
        updateRouteStage(state, routeId);
      });
      return;
    }
    if (key === 'custom' && typeof value === 'function') value(state, context);
  };
  Object.entries(effects).forEach(([k, v]) => applyDelta(k, v));
  if (s.suspicion >= 100) state.flags.exposed = true;
  if (s.trust <= 0) state.flags.collapse = true;
  if (s.health <= 0) state.flags.hospital = true;
  return state;
}

export function updateRouteStage(state, routeId) {
  const progress = state.routes[routeId] || 0;
  let stage = 0;
  ROUTE_THRESHOLDS.forEach((th, idx) => { if (progress >= th) stage = idx + 1; });
  const prev = state.routeStage[routeId] || 0;
  if (stage > prev) {
    state.routeStage[routeId] = stage;
    state.flags[`route_${routeId}_${stage}`] = true;
    const route = ROUTE_BY_ID[routeId];
    addHistory(state, `路线「${route.name}」推进到 ${route.stages[stage - 1]?.name || stage}。`);
    if (routeId === 'home' && stage >= 1) state.flags.go_home = true;
    if (routeId === 'openstore' && stage >= 1) state.flags.learn_coffee = true;
    if (routeId === 'gig' && stage >= 1) state.flags.gig = true;
    if (routeId === 'fake' && stage >= 1) state.flags.fake_coach = true;
    return stage;
  }
  return null;
}

export function getTopRoute(state) {
  let best = null;
  for (const id of ROUTE_IDS) {
    const stage = state.routeStage[id] || 0;
    const progress = state.routes[id] || 0;
    if (!best || stage > best.stage || (stage === best.stage && progress > best.progress)) {
      best = { id, stage, progress };
    }
  }
  return best;
}

export function isFakeLocked(state) {
  return !!state.flags.toldFamily || !!state.flags.fakeLocked;
}

export function evaluateEnding(state) {
  const s = state.stats;
  if (s.cash < -20000 || s.trust <= 0 || state.flags.collapse) return 'e_collapse';
  const top = getTopRoute(state);
  if (top && top.stage >= 3) {
    const route = ROUTE_BY_ID[top.id];
    if (top.id === 'fake' && isFakeLocked(state)) {
      // 伪装线被真相锁住，落入通用结局
    } else if (top.id === 'home' && !state.flags.go_home && s.spirit >= 60) {
      // 把空档过成自己的慢生活，而不是回老家
      return 'e_freedom';
    } else {
      return route.endingId;
    }
  }
  if (state.flags.toldFamily && (!top || top.stage < 3) && s.trust >= 50) return 'e_sayit';
  if (top && top.stage >= 1) return 'e_halfway';
  if (s.spirit >= 60) return 'e_freedom';
  return 'e_collapse';
}

export function endingData(state) {
  const id = state.endingId || evaluateEnding(state);
  return ENDING_BY_ID[id] || ENDING_BY_ID.e_halfway;
}

export function dueBillIndex(state) {
  const idx = BILL_DAYS.indexOf(state.day);
  if (idx < 0) return -1;
  if (state.billsPaid[idx]) return -1;
  return idx;
}

export function billAmount(state) {
  const idx = dueBillIndex(state);
  if (idx < 0) return 0;
  const persona = PERSONA_BY_ID[state.personaId];
  const raw = persona.bills[idx] || 0;
  return state.difficulty === 'story' ? Math.round(raw * 0.7) : raw;
}

export function payBill(state) {
  const idx = dueBillIndex(state);
  if (idx < 0) return { done: true, amount: 0, paid: false };
  const amount = billAmount(state);
  if (state.stats.cash >= amount) {
    state.stats.cash -= amount;
    state.billsPaid[idx] = true;
    addHistory(state, `支付第 ${idx + 1} 笔硬支出 ${amount} 元。`);
    return { done: true, amount, paid: true, shortfall: 0 };
  }
  const shortfall = amount - Math.max(0, state.stats.cash);
  return { done: false, amount, paid: false, shortfall, idx };
}

export function resolveBillShortfall(state, option, idx) {
  const amount = billAmount(state);
  const cash = Math.max(0, state.stats.cash);
  const shortfall = Math.max(0, amount - cash);
  if (option === 'min') {
    state.stats.cash = 0;
    state.debt = Math.round((state.debt || 0) + shortfall * 1.1);
    state.stats.suspicion = clamp(state.stats.suspicion + 8, 0, 100);
    addHistory(state, `最低还款，新增负债 ${Math.round(shortfall * 1.1)} 元。`);
  } else if (option === 'borrow') {
    state.stats.cash = cash + shortfall - amount;
    state.debt = Math.round((state.debt || 0) + shortfall * 1.2);
    state.stats.face = clamp(state.stats.face - 10, 0, 100);
    addHistory(state, '找老同学借钱补上了账单。');
  } else if (option === 'family') {
    state.stats.cash = cash + shortfall - amount;
    state.stats.trust = clamp(state.stats.trust - (state.flags.toldFamily ? 0 : 15), 0, 100);
    state.stats.suspicion = clamp(state.stats.suspicion + 10, 0, 100);
    addHistory(state, '跟家里开口补上了账单。');
  } else if (option === 'sell') {
    state.stats.cash = cash + Math.round(shortfall * 0.8) - amount;
    state.stats.spirit = clamp(state.stats.spirit - 10, 0, 100);
    state.debt = Math.round((state.debt || 0) + shortfall * 0.2);
    addHistory(state, '卖东西补上了账单。');
  }
  state.billsPaid[idx] = true;
  state.stats.cash = Math.round(state.stats.cash);
  return state;
}

export function applyNaming(state, choice) {
  const moment = NAMING_MOMENTS[state.day];
  if (!moment) return null;
  if (state.namingDone.includes(moment.id)) return null;
  if (choice === 'direct') {
    state.flags.saidTheWord = true;
    state.stats.spirit = clamp(state.stats.spirit + 8, 0, 100);
    state.stats.trust = clamp(state.stats.trust + (moment.family ? 8 : 4), 0, 100);
    state.stats.face = clamp(state.stats.face - 5, 0, 100);
    if (moment.family) {
      state.flags.toldFamily = true;
      state.flags.fakeLocked = true;
      state.stats.suspicion = 0;
      state.stats.trust = clamp(state.stats.trust + 12, 0, 100);
      if (!state.familySupportCard && !state.deck.includes('family_support') && !state.hand.includes('family_support')) {
        state.deck.push('family_support');
        state.familySupportCard = true;
      }
      addHistory(state, '你对家人说出了那个词。');
    } else {
      addHistory(state, '你对一个信任的人说出了那个词。');
    }
  } else {
    state.stats.face = clamp(state.stats.face + 5, 0, 100);
    state.stats.suspicion = clamp(state.stats.suspicion + 8, 0, 100);
    state.stats.spirit = clamp(state.stats.spirit - 3, 0, 100);
    addHistory(state, '你把那个词咽了回去。');
  }
  state.namingDone.push(moment.id);
  return moment;
}

export function draftRewards(state, count = 3) {
  const rng = getRng(state);
  const pool = COMMON_CARDS
    .filter((c) => !state.deck.includes(c.id) && !state.hand.includes(c.id))
    .slice();
  const picks = rng.shuffle(pool).slice(0, Math.max(0, count - 1));
  syncRng(state, rng);
  const options = picks.map((c) => ({ type: 'card', cardId: c.id, name: c.name, desc: c.desc }));
  options.push({ type: 'cash', amount: 300, name: '现金 300', desc: '先拿到手的一笔小钱。' });
  return options;
}

export function takeReward(state, option) {
  if (!option) return;
  if (option.type === 'card') {
    if (state.deck.length < 18 && !state.deck.includes(option.cardId)) state.deck.push(option.cardId);
  } else if (option.type === 'cash') {
    state.stats.cash += option.amount || 300;
  } else if (option.type === 'spirit') {
    state.stats.spirit = clamp(state.stats.spirit + (option.amount || 5), 0, 100);
  } else if (option.type === 'trust') {
    state.stats.trust = clamp(state.stats.trust + (option.amount || 4), 0, 100);
  }
}

export function adjustEnergyForHealth(state) {
  const health = state.stats.health;
  state.maxEnergy = health < 30 ? 4 : health < 50 ? 5 : 6;
  state.energy = Math.min(state.energy, state.maxEnergy);
}

export function startNewDay(state) {
  state.day += 1;
  state.phase = 'morning';
  state.location = null;
  state.dayActions = 0;
  state.dayLog = [];
  state.energy = state.maxEnergy || 6;
  (state.hand || []).forEach((id) => { if (!state.discard.includes(id)) state.discard.push(id); });
  state.hand = [];
  adjustEnergyForHealth(state);
  drawHand(state);
  if (state.day === 5 && !state.focusPicked) state.phase = 'morning';
  return state;
}

export function endDay(state) {
  state.phase = 'night';
  (state.hand || []).forEach((id) => { if (!state.discard.includes(id)) state.discard.push(id); });
  state.hand = [];
  return state;
}

export function dailyPosts(state, count = 3) {
  const rng = getRng(state);
  const all = Array.from({ length: 40 }, (_, i) => `p${i + 1}`);
  const picks = rng.shuffle(all).slice(0, count);
  syncRng(state, rng);
  return picks;
}

export function checklistCount(state) {
  return CHECKLIST.filter((c) => state.flags[c.flag]).length;
}

export function isGameOver(state) {
  return state.ended || state.day > MAX_DAY;
}

export function formatMoney(n) {
  const v = Math.round(n || 0);
  return `${v < 0 ? '-' : ''}¥${Math.abs(v).toLocaleString('zh-CN')}`;
}

export function routeNeedle(state) {
  return state.focusRoute ? ROUTE_BY_ID[state.focusRoute] : null;
}
