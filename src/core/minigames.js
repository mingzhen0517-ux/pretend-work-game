import { VIRAL, LEDGER, DELIVERY, EXAM, INTERROGATION } from '../data/minigames.js';
import { applyEffects, addHistory, getRng, syncRng } from './game.js';

export function viralResult(choice, run, routeId = 'content') {
  const topic = VIRAL.topics.find((t) => t.id === choice.topicId) || VIRAL.topics[0];
  const title = VIRAL.titles.find((t) => t.id === choice.titleId) || VIRAL.titles[0];
  const cover = VIRAL.covers.find((c) => c.id === choice.coverId) || VIRAL.covers[0];
  const time = VIRAL.times.find((t) => t.id === choice.timeId) || VIRAL.times[0];
  const rng = getRng(run);
  const luck = rng.int(-4, 8);
  syncRng(run, rng);
  const score = Math.max(0, topic.heat + title.ctr + cover.match + time.bonus + luck);
  let views = 180;
  let tier = '沉了';
  if (score >= 55) { views = 320000; tier = '爆了'; }
  else if (score >= 45) { views = 86000; tier = '小爆'; }
  else if (score >= 35) { views = 12000; tier = '有起色'; }
  else if (score >= 25) { views = 1800; tier = '有人看'; }
  const cash = Math.round(Math.min(5000, views * 0.012));
  const suspicion = Math.min(18, (title.risk + cover.risk) * 2);
  const effects = { cash, suspicion, spirit: tier === '沉了' ? -3 : tier === '爆了' ? 8 : 3, route: { [routeId]: tier === '爆了' ? 3 : tier === '小爆' ? 2 : 1 }, flag: 'video' };
  applyEffects(run, effects);
  addHistory(run, `内容实验「${topic.name}」：${views.toLocaleString('zh-CN')} 播放，${tier}。`);
  return { score, views, tier, cash, suspicion, topic, title, cover, time, effects };
}

export function ledgerRound(run, roundIndex, priceId, stockId) {
  const price = LEDGER.priceOptions.find((p) => p.price === priceId) || LEDGER.priceOptions[1];
  const stock = LEDGER.stockOptions.find((s) => s.stock === stockId) || LEDGER.stockOptions[1];
  const rng = getRng(run);
  const weather = LEDGER.weather[Math.floor(rng.next() * LEDGER.weather.length)];
  const noise = rng.int(-3, 3);
  syncRng(run, rng);
  const demand = Math.max(0, Math.round(price.demand * weather.demand + noise));
  const sold = Math.min(stock.stock, demand);
  const revenue = sold * price.price;
  const profit = revenue - stock.cost;
  return { round: roundIndex + 1, price, stock, weather, demand, sold, revenue, profit, leftover: stock.stock - sold };
}

export function ledgerResult(run, rounds, routeId = 'stall') {
  const profit = rounds.reduce((s, r) => s + r.profit, 0);
  const totalSold = rounds.reduce((s, r) => s + r.sold, 0);
  const effects = {
    cash: Math.max(-1200, profit),
    health: -2,
    spirit: profit >= 150 ? 5 : profit >= 0 ? 1 : -4,
    route: { [routeId]: profit >= 150 ? 3 : profit >= 0 ? 2 : 1 },
    flag: routeId === 'openstore' ? 'learn_coffee' : 'stall',
  };
  applyEffects(run, effects);
  addHistory(run, `生意账本：卖出 ${totalSold} 份，净利润 ${profit} 元。`);
  return { profit, totalSold, effects };
}

export function deliveryResult(run, accepted) {
  const earnings = accepted.reduce((s, o) => s + o.pay, 0);
  const health = -Math.max(1, accepted.length * 2);
  const effects = { cash: earnings, health, route: { gig: accepted.length >= 5 ? 3 : accepted.length >= 3 ? 2 : 1 }, flag: 'takeout' };
  if (accepted.length >= 5) effects.flag = 'takeout';
  applyEffects(run, effects);
  addHistory(run, `跑单：完成 ${accepted.length} 单，收入 ${earnings} 元。`);
  return { earnings, count: accepted.length, effects };
}

export function examResult(run, allocation) {
  const entries = Object.entries(allocation).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const weighted = EXAM.subjects.reduce((s, sub) => s + (allocation[sub.id] || 0) * sub.weight * 9, 0);
  const balance = entries.length >= 2 ? 6 : 0;
  const rng = getRng(run);
  const luck = rng.int(-5, 8);
  syncRng(run, rng);
  const score = Math.min(100, Math.round(EXAM.baseScore + weighted + balance + luck));
  const tier = score >= 80 ? '稳了' : score >= 60 ? '有戏' : score >= 40 ? '悬' : '陪跑';
  const effects = {
    route: { exam: score >= 80 ? 3 : score >= 55 ? 2 : 1 },
    spirit: score >= 80 ? 7 : score >= 60 ? 3 : -4,
    health: -2,
    flag: 'exam',
  };
  applyEffects(run, effects);
  addHistory(run, `模拟考：${score} 分，${tier}。`);
  return { score, tier, total, effects };
}

export function interrogationResult(run, selections) {
  let score = 0;
  let contradictions = 0;
  selections.forEach((idx, round) => {
    const frag = INTERROGATION[round]?.fragments?.[idx];
    if (!frag) return;
    score += frag.fit;
    if (frag.bad) contradictions += 1;
  });
  const tier = contradictions >= 2 || score <= 1 ? '露馅' : contradictions === 1 || score <= 3 ? '半信半疑' : '信了';
  const effects = {
    trust: tier === '信了' ? 6 : tier === '半信半疑' ? -2 : -8,
    suspicion: tier === '信了' ? -12 : tier === '半信半疑' ? 5 : 18,
    spirit: tier === '信了' ? 2 : -4,
  };
  applyEffects(run, effects);
  addHistory(run, `家庭盘问：${tier}。`);
  return { score, contradictions, tier, effects };
}

export function availableOrders(seed) {
  const rng = getRng({ rngState: seed });
  const orders = [];
  const pool = DELIVERY.orders.slice();
  for (let i = 0; i < 6; i++) {
    const o = pool[Math.floor(rng.next() * pool.length)];
    orders.push({ ...o, uid: `${o.id}-${i}` });
  }
  return orders;
}
