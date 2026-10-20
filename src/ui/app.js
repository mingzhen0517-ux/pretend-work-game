import { PERSONAS, PERSONA_BY_ID } from '../data/personas.js';
import { ROUTES, ROUTE_BY_ID, ROUTE_IDS } from '../data/routes.js';
import { ENDINGS, ENDING_BY_ID } from '../data/endings.js';
import { CLUES, CLUE_BY_ID } from '../data/clues.js';
import { CARD_BY_ID } from '../data/cards.js';
import { DAY_LOCATIONS, LOCATION_BY_ID } from '../data/locations.js';
import { EVENTS } from '../data/events.js';
import { PHONE_POSTS } from '../data/phone.js';
import { CHECKLIST, MEMORIES, PERSONALITY_QUESTIONS, PERSONALITY_RESULTS, BADGE_TITLES, NAMING_MOMENTS, WEEKLY_REPORTS } from '../data/meta.js';
import { DIALOGUE_BY_ID, DIALOGUES } from '../data/dialogues.js';
import { VIRAL, LEDGER, DELIVERY, EXAM, INTERROGATION } from '../data/minigames.js';
import {
  createRun, drawHand, getCard, makeFocusCard, applyEffects, addClue, log, addHistory,
  checkChance, rollCheck, evaluateEnding, billAmount, dueBillIndex, payBill, resolveBillShortfall,
  applyNaming, draftRewards, takeReward, startNewDay, adjustEnergyForHealth, getTopRoute, formatMoney,
  clamp, statValue, checklistCount, MAX_DAY, isFakeLocked,
} from '../core/game.js';
import { createDialogueState, dialogueAction, resolveDialogue, dialogueHint, dialogueMeterLabel } from '../core/dialogue.js';
import { viralResult, ledgerRound, ledgerResult, deliveryResult, examResult, interrogationResult } from '../core/minigames.js';
import { loadRun, saveRun, clearRun, loadMeta, saveMeta, loadSettings, saveSettings, recordRunEnd, unlockMetaFlags, resetAll } from '../core/save.js';
import { scorePersonality, personalityResult } from '../core/personality.js';
import { portraitSVG, npcPortraitSVG, locationSVG, endingArtSVG, shareBadgeSVG, svgDataURI } from './art.js';
import { sfx, startBgm, setMuted, unlockAudio } from './audio.js';
import { renderPoster, shareOrDownload, shareText, getShareUrl } from './share.js';

function engineLabel(id) {
  return ({ dialogue: '关键对话', viral: '内容实验', ledger: '生意账本', delivery: '跑单', exam: '备考', interrogation: '伪装盘问' })[id] || id;
}

function labelEffect(key, value) {
  const names = { pro: '专业', people: '人情', street: '野路子', cash: '现金', face: '体面', spirit: '心气', health: '健康', trust: '信任', suspicion: '露馅', energy: '精力' };
  if (key === 'route' && value && typeof value === 'object') {
    return Object.entries(value).map(([id, v]) => `${ROUTE_BY_ID[id]?.name || id}+${v}`).join(' ');
  }
  if (key === 'flag') return '';
  const name = names[key] || key;
  if (key === 'cash') return `${value > 0 ? '+' : ''}${value} 现金`;
  return `${name}${value > 0 ? '+' : ''}${value}`;
}

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => formatMoney(n);
const dateSeed = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const app = {
  screen: 'title',
  run: null,
  meta: null,
  settings: null,
  modal: null,
  personality: { index: 0, answers: [] },
  selectedPersona: null,
  prologueStep: 0,
  toast: [],
  share: null,
  referral: null,
  debug: false,
  mini: null,
  dialogue: null,
  dialogueMenu: null,
  afterMini: null,
  finalDialogue: false,
  night: null,
  daily: null,
  afterBill: null,
  lastFocusChange: 0,
  focusFilter: '全部',
  phoneOpen: false,
};

function prologueBeats(persona) {
  const pause = persona.pause || {};
  return [
    { who: '那一天', text: pause.line || '从明天开始，你不用去公司上班了。' },
    { who: '你', text: '你没有告诉任何人。第二天 8:15，你照常出门。' },
    { who: '心里', text: '你给这段日子起了个名字：空档期。' },
    ...(persona.opening || []).slice(0, 1),
  ];
}

const MAIN_DIALOGUE_DAYS = { 2: 'd_main_hr', 9: 'd_main_landlord', 12: 'd_main_zhangpeng', 15: 'd_main_boss' };

function boot() {
  app.meta = loadMeta();
  app.settings = loadSettings();
  setMuted(app.settings.muted);
  applyBodySettings();
  const params = new URLSearchParams(location.search);
  app.referral = params.get('ref');
  app.debug = params.get('debug') === '1';
  const seedParam = params.get('seed');
  if (seedParam) app.daily = { seed: seedParam, persona: params.get('persona') || 'zhou' };
  const saved = loadRun();
  if (saved && !saved.ended) app.run = saved;
  app.screen = 'title';
  render();
  startBgm('title');
  const el = document.getElementById('app');
  el.addEventListener('click', onClick);
  el.addEventListener('pointerdown', () => unlockAudio(), { once: true });
  window.addEventListener('keydown', onKey);
}

function applyBodySettings() {
  document.body.classList.toggle('reduced-motion', !!app.settings.reducedMotion);
  document.body.classList.toggle('text-lg', app.settings.textSize === 'lg');
  document.body.classList.toggle('text-xl', app.settings.textSize === 'xl');
  setMuted(!!app.settings.muted);
}

function persist() {
  if (app.run && !app.run.ended) saveRun(app.run);
  saveMeta(app.meta);
}

function go(screen) {
  app.screen = screen;
  app.toast = [];
  app.modal = null;
  render();
  window.scrollTo?.(0, 0);
}

function render() {
  const el = document.getElementById('app');
  if (!el) return;
  el.innerHTML = `${renderScreen()}${renderModal()}${renderToasts()}`;
  if (app.screen === 'title') startBgm('title');
  else if (app.screen === 'night' || app.screen === 'ending') startBgm('night');
  else if (app.screen === 'game' || app.screen === 'select' || app.screen === 'prologue') startBgm('day');
}

function renderToasts() {
  if (!app.toast.length) return '';
  return `<div class="toast-wrap">${app.toast.map((t) => `<div class="toast ${t.kind || ''}">${esc(t.text)}</div>`).join('')}</div>`;
}

export function toast(text, kind = '') {
  const id = Math.random().toString(36).slice(2);
  app.toast.push({ id, text, kind });
  if (app.toast.length > 2) app.toast = app.toast.slice(-2);
  render();
  setTimeout(() => {
    app.toast = app.toast.filter((t) => t.id !== id);
    render();
  }, 1700);
}

function renderScreen() {
  switch (app.screen) {
    case 'title': return renderTitle();
    case 'select': return renderSelect();
    case 'prologue': return renderPrologue();
    case 'game': return renderGame();
    case 'ending': return renderEnding();
    case 'collection': return renderCollection();
    case 'settings': return renderSettings();
    case 'personality': return renderPersonality();
    default: return renderTitle();
  }
}

/* ============================== TITLE ============================== */
function cityMarkup() {
  const blocks = [
    [4, 42, 12], [8, 58, 15], [12, 34, 11], [17, 50, 18], [22, 28, 9], [26, 56, 14],
    [31, 38, 13], [35, 62, 20], [40, 44, 10], [45, 54, 16], [50, 30, 8], [54, 60, 18],
    [60, 36, 12], [64, 52, 15], [69, 26, 9], [73, 58, 17], [79, 40, 12], [84, 50, 14],
    [89, 32, 10], [93, 60, 18], [98, 44, 13],
  ];
  return `<div class="title-city" aria-hidden="true">
    <div class="city-sky"></div><div class="city-moon"></div>
    ${blocks.map(([left, bottom, h], i) => `<div class="city-block" style="left:${left}%;bottom:${22 + (i % 3) * 2}%;width:${4 + (i % 3)}%;height:${h}%">
      ${Array.from({ length: 5 }, (_, j) => `<span class="city-window ${((i + j) % 4 === 0) ? 'off' : ''}" style="left:${18 + (j % 2) * 38}%;top:${12 + j * 16}%"></span>`).join('')}
    </div>`).join('')}
    <div class="city-road"></div><div class="city-person"></div>
  </div>`;
}

function renderTitle() {
  const hasSave = !!(app.run && !app.run.ended);
  const endings = app.meta?.endings?.length || 0;
  return `<div class="screen title-screen">
    <div class="title-top">
      <div class="kicker" style="color:#9fb0c4">LINJIANG CITY · 2026</div>
      <div class="title-badge">空档第 21 天</div>
    </div>
    ${cityMarkup()}
    <div class="title-logo-wrap">
      <div class="title-kicker">A CITY RPG ABOUT TAKING A BREAK</div>
      <div class="title-logo"><span>假装</span><span>上班</span></div>
      <p class="title-tagline"><strong>有人被通知，有人主动请假，<br />有人只是想歇一歇。</strong><br />接下来的 21 天，你照常出门，把时间还给自己。</p>
    </div>
    <div class="title-actions">
      ${hasSave ? `<button class="btn btn-primary btn-wide" data-action="continue"><span>继续空档</span><span class="mono">DAY ${String(app.run.day).padStart(2, '0')}</span></button>` : ''}
      <button class="btn ${hasSave ? 'btn-dark' : 'btn-primary'} btn-wide" data-action="new-game"><span>${hasSave ? '重新开始' : '开始第 1 天'}</span><span class="mono">21 DAYS</span></button>
      ${app.daily ? `<button class="btn btn-green btn-wide" data-action="start-daily"><span>今日挑战</span><span class="mono">${esc(app.daily.seed)}</span></button>` : `<button class="btn btn-green btn-wide" data-action="start-daily"><span>今日挑战</span><span class="mono">SAME DAY</span></button>`}
      <div class="grid-2">
        <button class="btn btn-sm" data-action="personality">30 秒空档人格</button>
        <button class="btn btn-sm" data-action="collection">空档档案 ${endings}/16</button>
      </div>
      <div class="row-between" style="padding:2px 2px 0">
        <span class="tiny" style="color:#8e9aab">${app.meta?.runs || 0} 次空档 · 清单 ${CHECKLIST.filter((c) => app.meta?.checklist?.includes(c.flag)).length}/24</span>
        <div class="row" style="gap:4px">
          <button class="btn btn-ghost btn-sm" style="color:#d6d0c2" data-action="help">怎么玩</button>
          <button class="btn btn-ghost btn-sm" style="color:#d6d0c2" data-action="settings">设置</button>
        </div>
      </div>
      ${app.referral ? `<div class="tiny" style="color:#9bbf6a;text-align:center">老同事给你留了一张“同事证言”和 500 元。</div>` : ''}
    </div>
    <div class="title-foot"><span>一个关于体面、账单和把时间还给自己的故事</span><span>v1.0</span></div>
  </div>`;
}

/* ============================== SELECT ============================== */
function renderSelect() {
  return `<div class="screen select-screen">
    <div class="screen-head"><button class="icon-btn" data-action="back-title">←</button><h1>选一个按下暂停的人</h1><span class="chip chip-dark">9 个</span></div>
    <div class="screen-scroll">
      <div class="select-hero">
        <div class="kicker">CHOOSE YOUR BREAK</div>
        <h1>谁的 21 天，<br />按下暂停？</h1>
        <p>有人被通知，有人主动请假，有人只是想歇一歇。9 个年龄、职业、家庭不同的人，共享 12 条空档路线。</p>
      </div>
      <div class="persona-list">
        ${PERSONAS.map((p, i) => `<button class="persona-card" style="animation-delay:${i * 0.03}s" data-action="select-persona" data-id="${p.id}">
          <div class="persona-avatar">${portraitSVG(p, 64)}</div>
          <div class="persona-info">
            <div class="persona-name"><h3>${p.name}</h3><span class="age">${p.age} 岁 · ${p.gender}</span></div>
            <div class="persona-job">${esc(p.job)} · ${esc(p.pause?.label || '空档')}</div>
            <div class="persona-quote">${esc(p.tagline)}</div>
            <div class="persona-meta">
              <span class="chip">${money(p.cash)}</span>
              <span class="chip chip-blue">${p.pause?.type || "空档"}</span>
              <span class="chip">体面 ${p.stats.face} · 心气 ${p.stats.spirit}</span>
            </div>
            <div class="affinity-ribbon">擅长：${p.affinity.map((id) => ROUTE_BY_ID[id]?.name).join(' / ')}</div>
          </div>
        </button>`).join('')}
      </div>
      <p class="inline-note center" style="margin-top:14px">所有人物、公司与城市均为虚构。每个选择都可以重来。</p>
    </div>
  </div>`;
}

/* ============================== PROLOGUE ============================== */
function renderPrologue() {
  const persona = PERSONA_BY_ID[app.run.personaId];
  const beats = prologueBeats(persona);
  const step = Math.min(app.prologueStep, beats.length - 1);
  const beat = beats[step];
  return `<div class="screen story-screen">
    <div class="story-scroll">
      <div class="story-kicker">BREAK DAY 00 / ${esc(persona.name)}</div>
      <div class="story-scene">${locationSVG(persona.pause?.type === '主动' ? 'cafe' : 'oldoffice', 400, 150)}</div>
      <div class="story-text" key="${step}">
        <span class="speaker">${esc(beat.who)}</span>
        ${esc(beat.text)}
      </div>
      <div class="story-hint">轻触继续 · ${step + 1}/${beats.length}</div>
    </div>
    <div class="story-next">
      <button class="btn btn-primary btn-wide" data-action="prologue-next">${step >= beats.length - 1 ? '开始空档' : '继续'}</button>
      <button class="btn btn-ghost btn-wide" style="color:#8e9aab;margin-top:4px" data-action="skip-prologue">跳过序章</button>
    </div>
  </div>`;
}

/* ============================== GAME ============================== */
function syncMemories(run) {
  if (!run) return;
  run.memories = run.memories || [];
  const add = (id) => { if (id && !run.memories.includes(id)) run.memories.push(id); };
  if (run.day >= 1) add('m_subway');
  if (run.day >= 3) add('m_escalator');
  if (run.flags.library || run.location === 'library') add('m_library');
  if (run.location === 'cafe') add('m_cafe');
  if (run.location === 'oldoffice' || run.flags.oldoffice) add('m_oldoffice');
  if (run.location === 'nightmarket' || run.flags.nightmarket_visited) add('m_nightmarket');
  if (run.flags.kid_time) add('m_school');
  if (run.flags.health_check) add('m_hospital');
  if (run.flags.fix_badge) add('m_badge');
  if (run.flags.old_colleague) add('m_laozhao');
  if (run.flags.parent_meal) add('m_family');
  if ((run.routeStage.home || 0) >= 1) add('m_train');
}

function renderGame() {
  if (!app.run) return renderTitle();
  syncMemories(app.run);
  const run = app.run;
  const hud = renderHud(run);
  let body = '';
  if (run.phase === 'morning') body = renderMorning(run);
  else if (run.phase === 'day') body = renderDay(run);
  else if (run.phase === 'evening') body = renderEvening(run);
  else body = renderNight(run);
  return `<div class="screen day-screen">
    ${hud}
    ${body}
    <div class="bottom-bar">
      ${run.phase === 'day' ? `<button class="btn btn-dark" data-action="end-day">结束今天</button><button class="btn btn-secondary" data-action="open-routes">路线</button>` : ''}
      ${run.phase === 'morning' ? `<button class="btn btn-ghost" data-action="open-routes">路线</button><button class="btn btn-ghost" data-action="open-clues">底牌 ${run.clues.length}</button>` : ''}
      ${run.phase === 'evening' ? `<button class="btn btn-ghost" data-action="open-routes">路线</button>` : ''}
      ${run.phase === 'night' ? `<button class="btn btn-ghost" data-action="open-clues">底牌 ${run.clues.length}</button><button class="btn btn-ghost" data-action="open-routes">路线</button>` : ''}
    </div>
    ${run.phase === 'night' ? '' : '<div style="height:64px"></div>'}
  </div>`;
}

function renderHud(run) {
  const p = PERSONA_BY_ID[run.personaId];
  const top = getTopRoute(run);
  const focus = run.focusRoute ? ROUTE_BY_ID[run.focusRoute] : null;
  return `<header class="hud">
    <div class="hud-top">
      <div class="hud-day"><b>${String(run.day).padStart(2, '0')}</b><span>/21 空档</span><span style="color:#f2d6a0">${run.phase === 'morning' ? '早上' : run.phase === 'day' ? '白天' : run.phase === 'evening' ? '傍晚' : '夜里'}</span></div>
      <div class="hud-cash"><b>${money(run.stats.cash)}</b><span>${run.debt > 0 ? `负债 ${money(run.debt)}` : '现金'}</span></div>
    </div>
    <div class="hud-stats">
      <div class="hud-stat"><div class="label"><span>心气</span><b>${Math.round(run.stats.spirit)}</b></div><div class="meter orange"><i style="width:${run.stats.spirit}%"></i></div></div>
      <div class="hud-stat"><div class="label"><span>健康</span><b>${Math.round(run.stats.health)}</b></div><div class="meter blue"><i style="width:${run.stats.health}%"></i></div></div>
      <div class="hud-stat"><div class="label"><span>露馅</span><b style="color:${run.stats.suspicion > 60 ? '#f08b57' : '#f2e8d5'}">${Math.round(run.stats.suspicion)}%</b></div><div class="meter red"><i style="width:${run.stats.suspicion}%"></i></div></div>
    </div>
    <div class="hud-sub">
      <span class="chip">体面 <b>${Math.round(run.stats.face)}</b></span>
      <span class="chip">信任 <b>${Math.round(run.stats.trust)}</b></span>
      <span class="chip">专 <b>${run.skills.pro}</b> 人 <b>${run.skills.people}</b> 野 <b>${run.skills.street}</b></span>
      ${focus ? `<span class="chip" style="border-color:#d9a441;color:#f2d6a0">重点 ${esc(focus.name)}</span>` : ''}
      ${top && top.stage > 0 ? `<span class="chip">${esc(ROUTE_BY_ID[top.id].name)} ${top.stage}/3</span>` : ''}
    </div>
    <div class="hud-top" style="margin-top:6px">
      <div class="energy-dots">${Array.from({ length: run.maxEnergy || 6 }, (_, i) => `<i class="${i < run.energy ? 'on' : ''}"></i>`).join('')}</div>
      <div class="hud-icons">
        <button class="icon-btn" data-action="open-clues" title="底牌">🃏</button>
        <button class="icon-btn" data-action="open-routes" title="路线">🧭</button>
        <button class="icon-btn" data-action="help" title="怎么玩">?</button>
        <button class="icon-btn" data-action="settings" title="设置">⚙</button>
      </div>
    </div>
  </header>`;
}

function coach(run) {
  if (!run || run.day > 2) return '';
  const text = run.phase === 'morning' ? '第 1 步：选一个地方，今天就在那里“上班”。'
    : run.phase === 'day' ? '第 2 步：点卡片做事。绿点是精力，红色是露馅。'
    : run.phase === 'evening' ? '第 3 步：选今晚怎么回家。'
    : '第 4 步：领一个奖励，然后睡觉。';
  return `<div class="coach"><span>${text}</span><button data-action="help">怎么玩</button></div>`;
}

function renderMorning(run) {
  const p = PERSONA_BY_ID[run.personaId];
  return `<div class="screen-scroll day-scroll">
    ${coach(run)}
    <div class="location-strip" style="background:#1b2431;color:#f2e8d5;border-color:#0b0d10">
      <div class="loc-art" style="border-color:#46515f">${locationSVG('oldoffice', 52, 44)}</div>
      <div class="grow"><h3>空档第 ${run.day} 天</h3><p style="color:#aeb7c5">${esc(p.family)}</p></div>
      <div class="mono" style="color:#d9a441;font-size:11px">${run.phase.toUpperCase()}</div>
    </div>
    <div class="panel" style="margin-bottom:12px">
      <div class="kicker">TODAY'S OFFICE</div>
      <h2 style="margin-top:3px">今天去哪“上班”？</h2>
      <p class="small muted" style="margin-top:4px">每个地方都有不同的加成和风险。选错了也没关系，明天还能换。</p>
    </div>
    <div class="stack">
      ${DAY_LOCATIONS.map((l, i) => `<button class="card" data-action="choose-location" data-id="${l.id}" style="animation-delay:${i * 0.03}s">
        <div class="card-cost" style="background:${l.tone};color:#fff">${l.icon}</div>
        <div class="card-main">
          <div class="card-title"><h3>${l.name}</h3><span class="chip" style="font-size:8px">${l.cost ? money(l.cost) : '免费'} · 风险${l.risk}</span></div>
          <p>${esc(l.desc)}</p>
          <div class="card-tags">${Object.entries(l.arrival).filter(([k]) => ['pro','people','street','health','spirit','suspicion','route','energy'].includes(k)).slice(0, 4).map(([k, v]) => `<span class="chip">${labelEffect(k, v)}</span>`).join('')}</div>
        </div>
      </button>`).join('')}
    </div>
    ${run.day >= 5 && !run.focusPicked ? `<button class="btn btn-primary btn-wide" style="margin-top:12px" data-action="pick-focus">选择一条重点路线</button>` : ''}
    <div class="day-log" style="margin-top:14px">${(run.dayLog || []).slice(-4).map((l) => `<p>${esc(l.text)}</p>`).join('') || '<p>昨天夜里，你睡得很浅。闹钟响之前就醒了。</p>'}</div>
  </div>`;
}

function renderDay(run) {
  const loc = run.location ? LOCATION_BY_ID[run.location] : null;
  const focusCard = run.focusRoute ? makeFocusCard(run, run.focusRoute) : null;
  const hand = (run.hand || []).map((id) => getCard(run, id)).filter(Boolean);
  return `<div class="screen-scroll day-scroll">
    ${coach(run)}
    ${loc ? `<div class="location-strip">
      <div class="loc-art">${locationSVG(loc.scene, 52, 44)}</div>
      <div class="grow"><h3>${loc.icon} ${loc.name}</h3><p>${esc(loc.desc)}</p></div>
      <div class="mono" style="font-size:10px;color:var(--muted)">${run.energy}/${run.maxEnergy} 精力</div>
    </div>` : ''}
    <div class="act-head"><h2>今天的安排</h2><span class="count">${run.hand?.length || 0} 张手牌 · ${run.energy} 精力</span></div>
    ${focusCard ? `<button class="card" style="border-color:#344a63;background:#eef2f6;text-align:left;width:100%" data-action="play-card" data-id="${focusCard.id}">
      <div class="card-cost" style="background:#344a63">${focusCard.cost}</div>
      <div class="card-main">
        <div class="card-title"><h3>${esc(focusCard.name)}</h3><span class="chip chip-blue" style="font-size:8px">今日重点</span></div>
        <p>${esc(focusCard.desc)}</p>
        <div class="card-tags"><span class="chip">${esc(ROUTE_BY_ID[run.focusRoute]?.name || '')}</span><span class="chip">${engineLabel(focusCard.engine)}</span></div>
      </div>
      <div class="card-check"><b>→</b><span>推进</span></div>
    </button>` : ''}
    ${hand.length ? `<div class="hand">${hand.map((c, i) => renderCard(run, c, i)).join('')}</div>` : `<div class="empty-hand">手牌用完了。可以结束今天，或等明天。</div>`}
    <div class="day-log">${(run.dayLog || []).slice(-4).map((l) => `<p>${esc(l.text)}</p>`).join('') || '<p>今天还没做什么。时间在走。</p>'}</div>
  </div>`;
}

function renderCard(run, c, i) {
  const chance = c.check ? checkChance(run, c) : null;
  const can = run.energy >= (c.cost || 0);
  const tags = (c.tags || []).slice(0, 3).map((t) => `<span class="chip">${esc(t)}</span>`).join('');
  return `<button class="card ${can ? '' : 'cant'}" data-action="play-card" data-id="${c.id}" style="animation-delay:${i * 0.03}s">
    <div class="card-cost ${c.cost === 0 ? 'zero' : ''}">${c.cost ?? 0}</div>
    <div class="card-main">
      <div class="card-title"><h3>${esc(c.name)}</h3>${c.rarity === 'rare' ? '<span class="chip chip-orange" style="font-size:8px">专属</span>' : ''}</div>
      <p>${esc(c.desc)}</p>
      <div class="card-tags">${tags}</div>
    </div>
    ${chance !== null ? `<div class="card-check"><b>${Math.round(chance * 100)}%</b><span>${c.check.label || '检定'}</span></div>` : `<div class="card-check"><b>→</b><span>${c.kind === 'minigame' ? '小游戏' : c.kind === 'route' ? '路线' : '执行'}</span></div>`}
  </button>`;
}

function renderEvening(run) {
  const moment = NAMING_MOMENTS[run.day];
  return `<div class="screen-scroll day-scroll">
    ${coach(run)}
    <div class="panel-dark panel" style="background:#1b2431;color:#f2e8d5;border-color:#0b0d10">
      <div class="kicker" style="color:#d9a441">18:30 / GOING HOME</div>
      <h1 style="font-size:26px;margin-top:4px">今天，怎么回家？</h1>
      <p class="small" style="color:#aeb7c5;margin-top:6px">${moment ? '今晚有一顿饭，或者一个电话，需要你回答。' : '你可以说实话，也可以继续演。'}</p>
    </div>
    <div class="stack" style="margin-top:12px">
      <button class="card" data-action="evening" data-id="home"><div class="card-cost zero">0</div><div class="card-main"><div class="card-title"><h3>按时回家</h3></div><p>吃饭、陪家人、把手机放远一点。信任 +4，露馅 −4。</p></div><div class="card-check"><b>⌂</b><span>稳</span></div></button>
      <button class="card" data-action="evening" data-id="overtime"><div class="card-cost">1</div><div class="card-main"><div class="card-title"><h3>说“今晚加班”</h3></div><p>在外面多待一会儿。露馅 −6，信任 −3，心气 +2。</p></div><div class="card-check"><b>☾</b><span>演</span></div></button>
      <button class="card" data-action="evening" data-id="meet"><div class="card-cost">1</div><div class="card-main"><div class="card-title"><h3>去见个人</h3></div><p>老同事、学员、或者一个不想回家的人。人情 +1，露馅 +4，花 50。</p></div><div class="card-check"><b>☕</b><span>赌</span></div></button>
      ${run.day >= 8 && !run.flags.nightmarket_visited ? `<button class="card" data-action="evening" data-id="nightmarket"><div class="card-cost">1</div><div class="card-main"><div class="card-title"><h3>去夜市看看</h3></div><p>老赵的炒粉摊。街道 +1，心气 +3，生意线 +1。</p></div><div class="card-check"><b>🏮</b><span>走</span></div></button>` : ''}
    </div>
    <p class="inline-note" style="margin-top:12px">露馅值 ${Math.round(run.stats.suspicion)}%。超过 60 时，今晚可能会有人问你问题。</p>
  </div>`;
}

function renderNight(run) {
  const nd = app.night || {};
  const report = nd.report;
  return `<div class="night-body" style="flex:1;display:flex;flex-direction:column;min-height:0;background:#1b2431;color:#f2e8d5">
    <div class="screen-scroll night-scroll" style="flex:1">
      ${coach(run)}
      <div class="night-title"><div class="kicker" style="color:#d9a441">NIGHT LOG</div><h1>第 ${run.day} 天，结束了。</h1><p>${nd.summaryLine || '今天也过完了。明天还要不要出门，明天再说。'}</p></div>
      <div class="summary-grid">
        <div class="summary-box"><div class="k">今日行动</div><div class="v">${run.dayActions || 0}</div></div>
        <div class="summary-box"><div class="k">清单</div><div class="v">${checklistCount(run)}/24</div></div>
        <div class="summary-box"><div class="k">路线</div><div class="v">${getTopRoute(run)?.stage || 0}/3</div></div>
      </div>
      ${nd.bill ? renderBillResult(nd.bill) : ''}
      ${report ? `<div class="report-card"><div class="rep-head"><div><div class="kicker" style="color:#857b68">WEEKLY REPORT</div><h3>${esc(report.title)}</h3></div><div class="report-score">${report.score}</div></div><p class="okr">${esc(report.okr)}</p>${report.lines.map((l) => `<p style="margin-top:4px">· ${esc(l)}</p>`).join('')}<p style="margin-top:6px;color:#857b68">评级：${report.grade} · 分享这张周报，看看同事怎么评。</p><button class="btn btn-sm btn-wide" style="margin-top:8px" data-action="open-share-day">分享周报</button></div>` : ''}
      <div class="panel" style="margin-top:12px;background:#222e3c;border-color:#3c4d61;color:#f2e8d5">
        <div class="row-between"><div><div class="kicker" style="color:#d9a441">REWARD</div><h3>今晚选一个</h3></div><span class="tiny" style="color:#9fb0c4">三选一</span></div>
        <div class="reward-row">
          ${(nd.rewards || []).map((r, i) => `<button class="reward-btn" data-action="take-reward" data-index="${i}"><span class="ic">${r.type === 'card' ? '🃏' : r.type === 'cash' ? '¥' : '✦'}</span><span><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></span></button>`).join('')}
        </div>
        ${nd.rewardTaken ? '<p class="tiny" style="color:#9bbf6a;margin-top:6px">已领取。明天的手牌会多一种可能。</p>' : ''}
      </div>
      <div class="panel" style="margin-top:12px;background:#222e3c;border-color:#3c4d61;color:#f2e8d5">
        <div class="row-between"><div><div class="kicker" style="color:#d9a441">PHONE</div><h3>睡前刷一会儿</h3></div><span class="tiny" style="color:#9fb0c4">点赞/略过</span></div>
        ${app.phoneOpen ? (nd.posts || []).map((p) => `<div class="phone-post"><div class="who"><b>${esc(p.author)}</b><span>${esc(p.role)}</span></div><p>${esc(p.text)}</p><div class="reactions"><button data-action="phone-like" data-id="${p.id}">♡ ${p.likes}</button><button data-action="phone-skip" data-id="${p.id}">略过</button></div></div>`).join('') : `<button class="btn btn-sm btn-wide" data-action="toggle-phone" style="margin-top:8px">展开 ${(nd.posts || []).length} 条动态</button>`}
      </div>
      <button class="btn btn-sm btn-wide" data-action="open-share-day" style="margin-top:10px">生成今日空档报告</button>
      <div style="height:10px"></div>
      <button class="btn btn-primary btn-wide" data-action="sleep">${run.day >= 21 ? '去家庭会议' : '睡觉，迎接第 ' + (run.day + 1) + ' 天'}</button>
      <p class="tiny center" style="color:#8e9aab;margin-top:8px">自动存档 · 随时可以回到标题</p>
    </div>
  </div>`;
}

function renderBillResult(bill) {
  if (!bill) return '';
  if (bill.paid) return `<div class="panel" style="margin-top:12px;background:#dfe9c9;border-color:#6f8f4d"><div class="row-between"><b>硬支出已支付</b><span class="mono">−${money(bill.amount)}</span></div><p class="tiny" style="margin-top:4px">第 ${bill.index + 1} 笔。余额 ${money(bill.cashAfter)}。</p></div>`;
  return `<div class="panel" style="margin-top:12px;background:#f0cfc9;border-color:#b64a3b"><div class="row-between"><b>账单还差 ${money(bill.shortfall)}</b><span class="mono">${money(bill.amount)}</span></div><p class="tiny" style="margin-top:4px">今晚得想个办法。</p></div>`;
}

/* ============================== ENDING ============================== */
function renderEnding() {
  const run = app.run;
  const ending = ENDING_BY_ID[run?.endingId] || ENDING_BY_ID.e_halfway;
  const persona = PERSONA_BY_ID[run?.personaId] || PERSONAS[0];
  const checklist = run ? checklistCount(run) : 0;
  if (run) run.checklistCount = checklist;
  return `<div class="screen ending-screen">
    <div class="screen-scroll ending-scroll">
      <div class="ending-art">${endingArtSVG(ending)}</div>
      <div class="ending-kicker">ENDING ${String(ending.num).padStart(2, '0')} / 16 · ${esc(persona.name)}</div>
      <div class="ending-title">${esc(ending.name)}</div>
      <div class="ending-quote">“${esc(ending.quote)}”</div>
      <div class="ending-prose">${ending.text.map((t) => `<p>${esc(t)}</p>`).join('')}<p style="color:#f2d6a0">${esc(app.run?.flags?.saidTheWord ? ending.coda.said : ending.coda.notSaid)}</p>${persona.endingId === ending.id ? `<p style="color:#f2d6a0">${esc(persona.familyLine)}</p>` : ''}</div>
      <div class="ending-stats summary-grid">
        <div class="summary-box"><div class="k">空档天数</div><div class="v">${run?.day || 21}</div></div>
        <div class="summary-box"><div class="k">现金</div><div class="v ${run?.stats.cash < 0 ? 'bad' : 'good'}">${money(run?.stats.cash || 0)}</div></div>
        <div class="summary-box"><div class="k">清单</div><div class="v">${checklist}/24</div></div>
      </div>
      <div class="new-unlock">已收录结局 ${app.meta?.endings?.length || 0}/16 · 说出那句话 ${run?.flags?.saidTheWord ? '是' : '否'} · 空档人格：${esc(app.meta?.personality?.name || '体面表演家')}</div>
      <div class="ending-actions">
        <button class="btn btn-primary btn-wide" data-action="open-share-ending">生成空档报告</button>
        <button class="btn btn-dark btn-wide" data-action="ending-collection">查看结局图鉴</button>
        <button class="btn btn-wide" data-action="new-game">换一个人，再空档 21 天</button>
        <button class="btn btn-ghost btn-wide" style="color:#8e9aab" data-action="back-title">回到标题</button>
      </div>
    </div>
  </div>`;
}

/* ============================== COLLECTION ============================== */
function renderCollection() {
  const meta = app.meta || {};
  const unlocked = new Set(meta.endings || []);
  return `<div class="screen">
    <div class="screen-head"><button class="icon-btn" data-action="back-title">←</button><h1>空档档案</h1><span class="chip chip-dark">${unlocked.size}/16</span></div>
    <div class="screen-scroll">
      <div class="panel" style="margin-bottom:12px">
        <div class="row-between"><div><div class="kicker">BREAK FILE</div><h2>你演过的人生</h2></div><div class="mono" style="text-align:right"><b style="font-size:24px;color:var(--orange)">${meta.runs || 0}</b><div class="tiny muted">次空档</div></div></div>
        <p class="small" style="margin-top:6px">结局 ${unlocked.size}/16 · 清单 ${CHECKLIST.filter((c) => meta.checklist?.includes(c.flag)).length}/24 · 记忆 ${meta.memories?.length || 0}/12</p>
      </div>
      <div class="kicker" style="margin:4px 0 8px">16 个结局</div>
      <div class="collection-grid">
        ${ENDINGS.map((e) => {
          const u = unlocked.has(e.id);
          return `<div class="ending-tile ${u ? '' : 'locked'}"><div class="num">${String(e.num).padStart(2, '0')}</div><div class="tile-icon">${u ? e.icon : '🔒'}</div><h4>${u ? esc(e.name) : '？？？'}</h4><p>${u ? esc(e.quote) : '还没走到这一步。'}</p></div>`;
        }).join('')}
      </div>
      <div class="kicker" style="margin:16px 0 8px">不用上班后可以做的 24 件事</div>
      <div class="panel">
        ${CHECKLIST.map((c) => `<div class="checklist-item"><span class="check-box ${meta.checklist?.includes(c.flag) ? 'on' : ''}">${meta.checklist?.includes(c.flag) ? '✓' : ''}</span><span>${esc(c.label)}</span></div>`).join('')}
      </div>
      <div class="kicker" style="margin:16px 0 8px">12 段通勤记忆</div>
      <div class="panel">
        ${MEMORIES.map((m) => `<div class="memory-item"><h4>${meta.memories?.includes(m.id) ? esc(m.title) : '未解锁'}</h4><p>${meta.memories?.includes(m.id) ? esc(m.text) : '继续空档，会想起来的。'}</p></div>`).join('')}
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="kicker">REFERRAL</div>
        <h3 style="margin-top:3px">你的内推码：<span class="mono" style="color:var(--orange)">${esc(app.run?.referralCode || app.meta?.lastCode || 'PLAY-21')}</span></h3>
        <p class="small muted" style="margin-top:4px">把链接发给一个也在空档的朋友。对方会拿到“同事证言”和 500 元。</p>
        <button class="btn btn-sm btn-wide" style="margin-top:8px" data-action="copy-invite">复制邀请链接</button>
      </div>
    </div>
  </div>`;
}

/* ============================== SETTINGS ============================== */
function renderSettings() {
  const s = app.settings;
  return `<div class="screen">
    <div class="screen-head"><button class="icon-btn" data-action="back-title">←</button><h1>设置</h1></div>
    <div class="screen-scroll">
      <div class="panel">
        <div class="settings-row"><div><h4>静音</h4><p>关闭合成音效和背景音。</p></div><button class="switch ${s.muted ? 'on' : ''}" data-action="toggle-mute"></button></div>
        <div class="settings-row"><div><h4>减少动态</h4><p>关闭大部分动画，适合晕动或低性能设备。</p></div><button class="switch ${s.reducedMotion ? 'on' : ''}" data-action="toggle-motion"></button></div>
        <div class="settings-row"><div><h4>字号</h4><p>放大正文，不改变布局。</p></div><div class="seg">${['normal','lg','xl'].map((v) => `<button class="${s.textSize === v ? 'on' : ''}" data-action="set-text" data-id="${v}">${v === 'normal' ? '标准' : v === 'lg' ? '大' : '特大'}</button>`).join('')}</div></div>
        <div class="settings-row"><div><h4>难度</h4><p>剧情模式更宽容；标准模式更接近真实账单。</p></div><div class="seg">${['standard','story'].map((v) => `<button class="${s.difficulty === v ? 'on' : ''}" data-action="set-difficulty" data-id="${v}">${v === 'standard' ? '标准' : '剧情'}</button>`).join('')}</div></div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="kicker">ABOUT</div>
        <p class="small" style="margin-top:5px">《假装上班》是一个关于空档期、体面和第二次出发的城市 RPG。故事纯属虚构，不构成任何劳动法或投资建议。</p>
        <p class="tiny" style="margin-top:6px;color:var(--muted)">如果你正在经历失业、负债或家庭压力，请向身边的人或专业机构求助。你不是一个人。</p>
        <p class="tiny" style="margin-top:8px;color:var(--muted)">v1.0 · 本地存档 · 无账号 · 无联网请求</p>
      </div>
      <div class="panel" style="margin-top:12px">
        ${app.run ? `<button class="btn btn-sm btn-wide" data-action="open-clues">查看已收集底牌（${app.run.clues?.length || 0}/16）</button>` : ''}
        ${app.debug ? `<button class="btn btn-sm btn-wide" style="margin-top:8px" data-action="open-debug">调试面板</button>` : ''}
        <button class="btn btn-sm btn-wide" style="margin-top:8px;color:var(--red)" data-action="reset-game">清除所有本地存档</button>
      </div>
    </div>
  </div>`;
}

/* ============================== PERSONALITY ============================== */
function renderPersonality() {
  const q = PERSONALITY_QUESTIONS[app.personality.index];
  if (app.personality.result) {
    const r = app.personality.result;
    return `<div class="screen">
      <div class="screen-head"><button class="icon-btn" data-action="back-title">←</button><h1>你的空档人格</h1></div>
      <div class="screen-scroll">
        <div class="panel" style="text-align:center;padding:22px 16px">
          <div style="font-size:44px">${r.icon}</div>
          <div class="kicker" style="margin-top:8px">STANDBY PERSONALITY</div>
          <h1 style="font-size:28px;margin-top:4px">${esc(r.name)}</h1>
          <p class="small" style="margin-top:8px;color:var(--ink-soft)">${esc(r.desc)}</p>
          <div class="quote" style="margin-top:14px;text-align:left">“${esc(r.quote)}”</div>
        </div>
        <div class="panel" style="margin-top:12px">
          <h3>推荐角色：${esc(PERSONA_BY_ID[r.persona]?.name || '')}</h3>
          <p class="small muted" style="margin-top:3px">${esc(PERSONA_BY_ID[r.persona]?.tagline || '')}</p>
          <button class="btn btn-primary btn-wide" style="margin-top:10px" data-action="start-personality-persona" data-id="${r.persona}">用这个身份开始</button>
          <button class="btn btn-sm btn-wide" style="margin-top:8px" data-action="retake-personality">重新测一次</button>
        </div>
        <button class="btn btn-wide" style="margin-top:12px" data-action="collection">查看空档档案</button>
      </div>
    </div>`;
  }
  return `<div class="screen">
    <div class="screen-head"><button class="icon-btn" data-action="back-title">←</button><h1>30 秒空档人格</h1><span class="chip">${app.personality.index + 1}/6</span></div>
    <div class="screen-scroll">
      <div class="progress-line" style="margin-bottom:14px"><i style="width:${((app.personality.index) / 6) * 100}%"></i></div>
      <div class="kicker">QUESTION ${app.personality.index + 1}</div>
      <h2 style="margin:6px 0 14px">${esc(q.q)}</h2>
      <div class="stack">
        ${q.options.map((o, i) => `<button class="card" data-action="personality-answer" data-index="${i}"><div class="card-cost zero">${'ABC'[i]}</div><div class="card-main"><div class="card-title"><h3>${esc(o.text)}</h3></div></div></button>`).join('')}
      </div>
      <p class="tiny muted" style="margin-top:14px">没有正确答案。你选什么，都会在游戏里付出不同的代价。</p>
    </div>
  </div>`;
}

/* ============================== MODALS ============================== */
function renderModal() {
  if (!app.modal) return '';
  const m = app.modal;
  if (m.type === 'dialogue') return renderDialogueModal();
  if (m.type === 'mini') return renderMiniModal();
  if (m.type === 'share') return renderShareModal();
  return renderGenericModal(m);
}

function genericShell(title, body, foot = '', opts = {}) {
  return `<div class="overlay ${opts.center ? 'modal-center' : ''}" data-action="overlay-click">
    <div class="sheet ${opts.center ? 'modal-center-sheet' : ''}" data-stop="1">
      <div class="sheet-grab"></div>
      <div class="sheet-head"><div><div class="kicker">${esc(opts.kicker || 'STANDBY')}</div><h2>${esc(title)}</h2></div>${opts.close === false ? '' : `<button class="icon-btn" style="margin-left:auto" data-action="close-modal">×</button>`}</div>
      <div class="sheet-body">${body}</div>
      ${foot ? `<div class="sheet-foot">${foot}</div>` : ''}
    </div>
  </div>`;
}

function renderGenericModal(m) {
  if (m.type === 'persona') {
    const p = PERSONA_BY_ID[m.id];
    const routes = p.affinity.map((id) => ROUTE_BY_ID[id]?.name).join(' / ');
    return genericShell(`${p.name} · ${p.age} 岁`, `
      <div class="row" style="align-items:flex-start;gap:12px">
        <div class="persona-avatar" style="width:92px;height:110px">${portraitSVG(p, 92)}</div>
        <div class="grow"><div class="persona-job">${esc(p.job)} · ${esc(p.pause?.label || '空档')}</div><p class="small" style="margin-top:4px;color:var(--ink-soft)">${esc(p.tagline)}</p><p class="tiny muted" style="margin-top:5px">${esc(p.family)}</p></div>
      </div>
      <div class="stat-grid" style="margin-top:12px">
        <div class="stat-box"><div class="k">起始现金</div><div class="v">${money(p.cash)}</div></div>
        <div class="stat-box"><div class="k">三笔硬支出</div><div class="v" style="font-size:13px">${p.bills.map((b) => money(b)).join(' / ')}</div></div>
        <div class="stat-box"><div class="k">体面 / 心气</div><div class="v">${p.stats.face} / ${p.stats.spirit}</div></div>
        <div class="stat-box"><div class="k">健康 / 信任</div><div class="v">${p.stats.health} / ${p.stats.trust}</div></div>
      </div>
      <div class="panel" style="margin-top:12px;background:var(--paper-2)"><div class="kicker">专属卡</div><h3 style="margin-top:2px">${esc(CARD_BY_ID[p.cardId]?.name || '')}</h3><p class="small muted">${esc(CARD_BY_ID[p.cardId]?.desc || '')}</p><div class="pill-row" style="margin-top:6px"><span class="chip">亲和：${esc(routes)}</span><span class="chip">本命：${esc(ENDING_BY_ID[p.endingId]?.name || '')}</span></div></div>
    `, `<button class="btn btn-primary" data-action="start-run" data-id="${p.id}">开始空档 21 天</button><button class="btn" data-action="close-modal">再看看</button>`, { center: true, kicker: 'PLAYABLE PERSONA' });
  }
  if (m.type === 'focus') {
    const cat = app.focusFilter || '全部';
    const routes = ROUTES.filter((r) => cat === '全部' || r.category === cat);
    return genericShell('选择你的重点路线', `
      <p class="small muted">21 天不可能什么都做。先选一个方向，再选一条重点；不选也能玩。</p>
      <div class="pill-row" style="margin-top:9px">
        ${['全部','稳定','搞钱','生活','隐藏'].map((c) => `<button class="chip ${cat === c ? 'chip-dark' : ''}" style="border:1.5px solid var(--ink);padding:3px 9px;background:${cat === c ? 'var(--ink)' : 'var(--paper-2)'};color:${cat === c ? 'var(--paper)' : 'var(--ink)'}" data-action="focus-filter" data-id="${c}">${c}</button>`).join('')}
      </div>
      <div class="stack" style="margin-top:10px">
        ${routes.map((r) => {
          const p = PERSONA_BY_ID[app.run.personaId];
          const aff = p.affinity.includes(r.id);
          const locked = r.id === 'fake' && isFakeLocked(app.run);
          return `<button class="card ${locked ? 'cant' : ''}" ${locked ? 'disabled' : `data-action="set-focus" data-id="${r.id}"`}><div class="card-cost ${aff ? '' : 'zero'}" style="${aff ? 'background:#344a63' : ''}">${locked ? '🔒' : r.icon}</div><div class="card-main"><div class="card-title"><h3>${r.name}</h3>${aff ? '<span class="chip chip-green" style="font-size:8px">亲和</span>' : ''}<span class="chip" style="font-size:8px">${locked ? '已坦白，锁定' : engineLabel(r.engine)}</span></div><div class="card-tags"><span class="chip">${r.stages.map((st) => esc(st.name)).join(' → ')}</span><span class="chip">${esc(ENDING_BY_ID[r.endingId]?.name || '')}</span><span class="chip">${esc(r.category || '')}</span></div></div></button>`;
        }).join('')}
      </div>
    `, `<button class="btn" data-action="close-modal">先不选</button>`, { center: true, kicker: 'FOCUS ROUTE' });
  }
  if (m.type === 'event') {
    const ev = m.event;
    return genericShell(ev.title, `<p class="prose">${esc(ev.body)}</p><div class="stack" style="margin-top:12px">${ev.choices.map((c, i) => `<button class="btn btn-wide" style="justify-content:flex-start;text-align:left" data-action="resolve-event" data-index="${i}">${esc(c.text)}</button>`).join('')}</div>`, '', { center: true, kicker: 'CITY EVENT' });
  }
  if (m.type === 'check') {
    const c = CARD_BY_ID[m.cardId];
    const chance = checkChance(app.run, c, false);
    const boosted = checkChance(app.run, c, true);
    return genericShell(c.name, `<p class="prose">${esc(c.desc)}</p><div class="stat-grid" style="margin-top:12px"><div class="stat-box"><div class="k">成功率</div><div class="v" style="color:var(--green)">${Math.round(chance * 100)}%</div></div><div class="stat-box"><div class="k">稳一手后</div><div class="v" style="color:var(--orange)">${Math.round(boosted * 100)}%</div></div></div><p class="tiny muted" style="margin-top:8px">检定属性：${c.check.label} · 失败也会给一半进度，但会增加露馅或掉心气。</p>`, `<button class="btn btn-primary" data-action="confirm-check" data-boost="0">直接做</button>${app.run.energy >= 1 ? `<button class="btn btn-green" data-action="confirm-check" data-boost="1">稳一手 −1 精力</button>` : ''}`, { center: true, kicker: 'CHECK' });
  }
  if (m.type === 'naming') {
    const moment = m.moment;
    const persona = PERSONA_BY_ID[app.run.personaId];
    const hideLine = persona.pause?.hide || moment.euphemism;
    const directLine = persona.pause?.direct || moment.direct;
    return genericShell(moment.title, `<p class="prose">${esc(moment.body)}</p><p class="small muted" style="margin-top:8px">${esc(persona.familyLine)}</p><div class="stack" style="margin-top:14px"><button class="btn btn-wide" style="justify-content:flex-start;text-align:left" data-action="naming-choice" data-choice="euphemism">${esc(hideLine)}<span class="sub">体面 +5 · 露馅 +8 · 心气 −3</span></button><button class="btn btn-primary btn-wide" style="justify-content:flex-start;text-align:left" data-action="naming-choice" data-choice="direct">${esc(directLine)}<span class="sub">心气 +8 · 信任 +${moment.family ? 8 : 4} · ${moment.family ? '露馅清零，进入真相线' : '体面 −5'}</span></button></div>`, '', { center: true, kicker: '那句话' });
  }
  if (m.type === 'bill') {
    const b = m.bill;
    return genericShell('账单还差一点', `<p class="prose">第 ${b.index + 1} 笔硬支出 ${money(b.amount)}，你手里只有 ${money(b.cash)}。还差 ${money(b.shortfall)}。</p><div class="stack" style="margin-top:12px"><button class="btn btn-wide" data-action="bill-choice" data-choice="min">最低还款 <span class="sub">负债 +10% · 露馅 +8</span></button><button class="btn btn-wide" data-action="bill-choice" data-choice="borrow">找老同学借 <span class="sub">负债 +20% · 体面 −10</span></button><button class="btn btn-wide" data-action="bill-choice" data-choice="family">跟家里开口 <span class="sub">信任 −15 · 露馅 +10</span></button><button class="btn btn-wide" data-action="bill-choice" data-choice="sell">卖点东西 <span class="sub">心气 −10 · 负债 +2%</span></button></div>`, '', { center: true, kicker: 'BILL' });
  }
  if (m.type === 'routes') {
    if (!app.run) return genericShell('路线进度', '<p class="small muted">先开始一轮空档。</p>', '<button class="btn" data-action="close-modal">关闭</button>', { center: true });
    return genericShell('路线进度', `${routeListHTML(app.run)}${cluesHTML(app.run)}`, `<button class="btn" data-action="close-modal">收起</button>`, { center: true, kicker: 'ROUTE BOARD' });
  }
  if (m.type === 'clues') {
    if (!app.run) return genericShell('底牌', '<p class="small muted">先开始一轮空档。</p>', '<button class="btn" data-action="close-modal">关闭</button>', { center: true });
    return genericShell(`底牌 ${app.run?.clues?.length || 0}/16`, `${cluesHTML(app.run)}<p class="tiny muted" style="margin-top:8px">关键对话中可以打出底牌：理解 +10、戒备 −8。每场最多 2 张。</p>`, `<button class="btn" data-action="close-modal">收起</button>`, { center: true, kicker: 'EVIDENCE' });
  }
  if (m.type === 'confirm-new') {
    return genericShell('重新开始？', `<p class="prose">当前进度会被覆盖。你已经空档 ${app.run?.day || 0} 天。</p>`, `<button class="btn" data-action="close-modal">继续玩</button><button class="btn btn-primary" data-action="confirm-new-game">重新开始</button>`, { center: true, kicker: 'NEW RUN' });
  }
  if (m.type === 'help') {
    return genericShell('怎么玩', `
      <p class="small muted" style="margin-bottom:10px">一轮 21 天，每天 1–2 分钟。跟着下面四步走就行。</p>
      <div class="panel" style="box-shadow:none;background:var(--paper-2)">
        <div class="checklist-item"><span class="check-box on">1</span><span><b>选地点</b><br><span class="tiny muted">图书馆、咖啡店、公园……每个地方有不同的加成和风险。</span></span></div>
        <div class="checklist-item"><span class="check-box on">2</span><span><b>打出手牌</b><br><span class="tiny muted">点卡片做事，消耗绿点精力。红色是露馅，越低越好。</span></span></div>
        <div class="checklist-item"><span class="check-box on">3</span><span><b>结束今天</b><br><span class="tiny muted">傍晚选怎么回家；夜里领奖励、刷手机、睡觉。</span></span></div>
        <div class="checklist-item"><span class="check-box on">4</span><span><b>撑到第 21 天</b><br><span class="tiny muted">推进一条路线，或只是好好休息。结局不止“上岸”一种。</span></span></div>
      </div>
      <p class="tiny muted" style="margin-top:10px">小提示：先选一条“重点路线”，每天会多一张今日重点卡。没选也能玩。</p>
    `, `<button class="btn btn-primary" data-action="close-modal">知道了</button>`, { center: true, kicker: 'HOW TO PLAY' });
  }
  if (m.type === 'debug') {
    return genericShell('调试面板', `<p class="tiny muted">仅用于测试。所有操作会直接影响当前存档。</p><div class="grid-2" style="margin-top:10px"><button class="btn btn-sm" data-action="debug-cash">+5000 现金</button><button class="btn btn-sm" data-action="debug-day">跳过一天</button><button class="btn btn-sm" data-action="debug-suspicion">露馅 +20</button><button class="btn btn-sm" data-action="debug-trust">信任 +10</button><button class="btn btn-sm" data-action="debug-route">主导路线 +3</button><button class="btn btn-sm" data-action="debug-final">跳到第 21 天</button><button class="btn btn-sm" data-action="debug-ending">直接结算</button><button class="btn btn-sm" data-action="debug-game">返回游戏</button><button class="btn btn-sm" data-action="debug-unlock">解锁全结局</button></div>`, `<button class="btn" data-action="close-modal">关闭</button>`, { center: true, kicker: 'DEBUG' });
  }
  return genericShell('提示', '<p class="prose">这里什么也没有。</p>', '<button class="btn" data-action="close-modal">关闭</button>', { center: true });
}

function routeListHTML(run) {
  return `<div class="panel" style="box-shadow:none">${ROUTES.map((r) => {
    const stage = run.routeStage[r.id] || 0;
    const prog = run.routes[r.id] || 0;
    const next = [3, 6, 10].find((t) => prog < t) || 10;
    return `<div class="route-row"><span class="rname">${r.icon} ${r.name}</span><span class="rbar"><span class="progress-line"><i style="width:${Math.min(100, (prog / next) * 100)}%"></i></span></span><span class="rlv">${stage}/3</span></div>`;
  }).join('')}</div>`;
}

function cluesHTML(run) {
  if (!run?.clues?.length) return '<p class="small muted">还没有底牌。多出门，多问一句，多留一个证据。</p>';
  return `<div class="stack" style="margin-top:8px">${run.clues.map((id) => { const c = CLUE_BY_ID[id]; return `<div class="panel" style="box-shadow:none;background:var(--paper-2)"><div class="row-between"><b class="small">${esc(c?.name || id)}</b><span class="tag">${esc(c?.source || '')}</span></div><p class="tiny muted" style="margin-top:3px">${esc(c?.desc || '')}</p></div>`; }).join('')}</div>`;
}

/* ============================== DIALOGUE ============================== */
function renderDialogueModal() {
  const ds = app.dialogue;
  if (!ds) return '';
  const d = DIALOGUE_BY_ID[ds.id];
  if (!d) return '';
  const pctU = Math.min(100, ds.understanding);
  const pctG = Math.min(100, ds.guard);
  return `<div class="overlay" style="background:#0b1017">
    <div class="screen dialogue-screen" style="position:absolute;inset:0">
      <div class="dialogue-head">
        <div class="npc-avatar">${npcPortraitSVG(d.npc, d.npcColor, 46)}</div>
        <div class="grow"><h2>${esc(d.title)}</h2><p>${esc(d.npc)} · 第 ${ds.round} 轮 · ${ds.ended ? '对话结束' : '关键对话'}</p></div>
        <button class="icon-btn" style="background:#222d3b;border-color:#52677f;color:#f2e8d5" data-action="dialogue-abort">×</button>
      </div>
      <div class="dialogue-body">
        <div class="dialogue-meters">
          <div class="dmeter"><div class="lab"><span>理解 · ${dialogueMeterLabel(ds.understanding)}</span><b>${ds.understanding}</b></div><div class="bar"><i style="width:${pctU}%"></i></div></div>
          <div class="dmeter guard"><div class="lab"><span>戒备 · ${dialogueMeterLabel(ds.guard, 'guard')}</span><b>${ds.guard}</b></div><div class="bar"><i style="width:${pctG}%"></i></div></div>
        </div>
        <div class="dmeter" style="margin-top:8px"><div class="lab"><span>耐心</span><b>${ds.patience}/${ds.maxPatience}</b></div><div class="patience">${Array.from({ length: ds.maxPatience }, (_, i) => `<i class="${i < ds.patience ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="dialogue-need">${ds.needRevealed ? `你隐约感觉到：ta 真正在意的是「${esc(d.need)}」。` : esc(dialogueHint(ds))}</div>
        <div class="dialogue-log">
          ${ds.log.slice(-4).map((l) => `<div class="dline ${l.kind === 'you' ? 'you' : l.kind === 'system' ? 'system' : ''}">${l.kind === 'you' ? '<b>你：</b>' : l.kind === 'npc' ? `<b>${esc(d.npc)}：</b>` : ''}${esc(l.text)}</div>`).join('')}
        </div>
        ${app.run.clues.length ? `<div class="clue-row">${app.run.clues.map((id) => { const c = CLUE_BY_ID[id]; return `<button class="clue-btn" data-action="dialogue-clue" data-id="${id}">${esc(c?.name || id)}</button>`; }).join('')}</div>` : ''}
        ${ds.ended ? `<div class="panel" style="margin-top:12px;background:#222d3b;border-color:#d9a441;color:#f2e8d5"><div class="kicker" style="color:#d9a441">OUTCOME</div><h3>${ds.outcome === 'success' ? '达成共识' : ds.outcome === 'partial' ? '暂时缓和' : '谈崩了'}</h3><p class="small" style="margin-top:4px">${ds.outcome === 'success' ? '你没有赢，但你们终于听懂了彼此。' : ds.outcome === 'partial' ? '没有完全说开，但至少留了一扇门。' : '有些话说出口就收不回了。'}</p></div>` : ''}
      </div>
      ${ds.ended ? `<div class="dialogue-verbs" style="grid-template-columns:1fr"><button class="verb-btn" style="background:#d9a441;color:#211f1c" data-action="dialogue-resolve">收下这个结果</button></div>` : `<div class="dialogue-verbs">
        <button class="verb-btn" data-action="dialogue-verb" data-verb="listen">听<small>理解+5 戒备−5</small></button>
        <button class="verb-btn" data-action="dialogue-verb" data-verb="ask">问<small>挖信息 / 可能冒犯</small></button>
        <button class="verb-btn" data-action="dialogue-verb" data-verb="say">说<small>选一个立场</small></button>
        <button class="verb-btn" data-action="dialogue-verb" data-verb="stop">停<small>耐心+1 戒备+3</small></button>
      </div>`}
    </div>
  </div>`;
}

function renderDialogueSubmenu() {
  const ds = app.dialogue;
  const d = DIALOGUE_BY_ID[ds.id];
  const type = app.dialogueMenu;
  if (!type) return '';
  const items = type === 'ask' ? d.questions : d.stances;
  return `<div class="overlay" style="background:rgba(8,12,17,.75);z-index:70"><div class="sheet" style="max-height:78%"><div class="sheet-grab"></div><div class="sheet-head"><div><div class="kicker">${type === 'ask' ? 'ASK' : 'SAY'}</div><h2>${type === 'ask' ? '问什么？' : '用什么立场？'}</h2></div><button class="icon-btn" style="margin-left:auto" data-action="dialogue-sub-close">×</button></div><div class="sheet-body"><div class="stance-list">${items.map((it, i) => `<button class="stance-btn" data-action="dialogue-sub-choose" data-type="${type}" data-index="${i}">${type === 'ask' ? esc(it.text) : `<b>${esc(it.label)} · ${esc(it.stat)}</b>${esc(it.text)}`}</button>`).join('')}</div></div></div></div>`;
}

/* ============================== MINIGAME ============================== */
function renderMiniModal() {
  const m = app.mini;
  if (!m) return '';
  if (m.kind === 'viral') return renderViralMini(m);
  if (m.kind === 'ledger') return renderLedgerMini(m);
  if (m.kind === 'delivery') return renderDeliveryMini(m);
  if (m.kind === 'exam') return renderExamMini(m);
  if (m.kind === 'interrogation') return renderInterrogationMini(m);
  return '';
}

function miniShell(title, kicker, body, foot) {
  return `<div class="overlay" style="background:#0b1017;z-index:65">
    <div class="screen mini-screen" style="position:absolute;inset:0">
      <div class="screen-head" style="background:#151c25;border-color:#344154;color:#f2e8d5"><div><div class="kicker" style="color:#d9a441">${kicker}</div><h1 style="font-size:18px">${title}</h1></div><button class="icon-btn" style="margin-left:auto;background:#222d3b;border-color:#52677f;color:#f2e8d5" data-action="mini-abort">×</button></div>
      <div class="mini-body">${body}</div>
      ${foot ? `<div class="mini-actions">${foot}</div>` : ''}
    </div>
  </div>`;
}

function renderViralMini(m) {
  return miniShell('爆款制造机', 'CONTENT EXPERIMENT', `
    <div class="mini-title">STEP 1–4 / 选题 · 标题 · 封面 · 发布时间</div>
    <div class="mini-headline">这条能火吗？</div>
    <p class="mini-sub">算法不关心你的体面，只关心完播率。选一个组合，发布。</p>
    <div class="mini-panel"><div class="mini-label">选题</div>${VIRAL.topics.map((t) => `<button class="mini-option ${m.choice.topicId === t.id ? 'selected' : ''}" data-action="mini-pick" data-field="topicId" data-id="${t.id}"><span>${esc(t.name)}</span><b>热度 ${t.heat}</b></button>`).join('')}</div>
    <div class="mini-panel"><div class="mini-label">标题</div>${VIRAL.titles.map((t) => `<button class="mini-option ${m.choice.titleId === t.id ? 'selected' : ''}" data-action="mini-pick" data-field="titleId" data-id="${t.id}"><span>${esc(t.text)}</span><b>CTR ${t.ctr}</b></button>`).join('')}</div>
    <div class="mini-panel"><div class="mini-label">封面</div><div class="grid-3">${VIRAL.covers.map((c) => `<button class="mini-option ${m.choice.coverId === c.id ? 'selected' : ''}" style="flex-direction:column;align-items:flex-start" data-action="mini-pick" data-field="coverId" data-id="${c.id}"><span>${esc(c.name)}</span><b>+${c.match}</b></button>`).join('')}</div></div>
    <div class="mini-panel"><div class="mini-label">发布时间</div><div class="grid-3">${VIRAL.times.map((t) => `<button class="mini-option ${m.choice.timeId === t.id ? 'selected' : ''}" data-action="mini-pick" data-field="timeId" data-id="${t.id}"><span>${esc(t.name)}</span><b>+${t.bonus}</b></button>`).join('')}</div></div>
    ${m.result ? `<div class="mini-panel" style="border-color:#d9a441"><div class="mini-label">RESULT</div><div class="row-between"><div class="mini-score">${m.result.views.toLocaleString('zh-CN')}</div><span class="chip chip-dark">${m.result.tier}</span></div><p class="mini-sub">播放量 · 收入 ${money(m.result.cash)} · 露馅风险 +${m.result.suspicion}</p></div>` : ''}
  `, m.result ? `<button class="btn btn-primary" data-action="mini-finish">收下结果</button>` : `<button class="btn btn-primary" data-action="mini-submit-viral">发布</button>`);
}

function renderLedgerMini(m) {
  const round = m.rounds[m.current];
  return miniShell('生意账本', `BUSINESS LEDGER / ROUND ${m.current + 1}/3`, `
    <div class="mini-title">第 ${m.current + 1} 轮 · ${m.weather || '看天吃饭'}</div>
    <div class="mini-headline">${m.routeId === 'openstore' ? '今天卖多少？' : '今晚进多少货？'}</div>
    <p class="mini-sub">定价高，单份赚得多，但买的人少；进货多，摊得开，但卖不掉就是成本。</p>
    <div class="ledger-rounds">${[0, 1, 2].map((i) => `<i class="${i <= m.current ? 'on' : ''}"></i>`).join('')}</div>
    <div class="mini-panel"><div class="mini-label">定价</div>${LEDGER.priceOptions.map((p) => `<button class="mini-option ${m.price === p.price ? 'selected' : ''}" data-action="mini-pick" data-field="price" data-id="${p.price}"><span>${p.label}</span><b>成本 ${p.margin}</b></button>`).join('')}</div>
    <div class="mini-panel"><div class="mini-label">进货</div>${LEDGER.stockOptions.map((s) => `<button class="mini-option ${m.stock === s.stock ? 'selected' : ''}" data-action="mini-pick" data-field="stock" data-id="${s.stock}"><span>${s.label}</span><b>${money(s.cost)}</b></button>`).join('')}</div>
    ${m.history.length ? `<div class="mini-panel"><div class="mini-label">前三轮</div>${m.history.map((h) => `<div class="row-between small" style="margin-top:4px"><span>第 ${h.round} 轮 · ${h.weather.name}</span><b style="color:${h.profit >= 0 ? '#9bbf6a' : '#e08a79'}">${money(h.profit)}</b></div>`).join('')}</div>` : ''}
  `, `<button class="btn btn-primary" data-action="mini-ledger-next">${m.current >= 2 ? '收摊结算' : '进入下一轮'}</button>`);
}

function renderDeliveryMini(m) {
  return miniShell('跑单节奏', 'DELIVERY RUSH', `
    <div class="row-between"><div class="mini-title">剩余 ${m.timeLeft}s · 已接 ${m.accepted.length} 单</div><div class="mono" style="color:#9bbf6a">${money(m.earnings)}</div></div>
    <div class="timer-track"><i style="width:${(m.timeLeft / DELIVERY.duration) * 100}%"></i></div>
    <p class="mini-sub">点“接”拿下订单。距离越远越费体力，超时和差评会扣钱。</p>
    <div>${m.orders.map((o) => `<div class="order-card"><div class="pay">${money(o.pay)}</div><div class="meta">${esc(o.label)}<small>${o.distance} km · 约 ${o.time} 分钟</small></div><button class="btn btn-sm ${m.accepted.find((a) => a.uid === o.uid) ? 'btn-green' : ''}" data-action="mini-delivery-accept" data-id="${o.uid}" ${m.accepted.find((a) => a.uid === o.uid) ? 'disabled' : ''}>${m.accepted.find((a) => a.uid === o.uid) ? '已接' : '接'}</button></div>`).join('')}</div>
    ${m.result ? `<div class="mini-panel" style="border-color:#d9a441"><div class="mini-label">RESULT</div><div class="mini-score">${money(m.result.earnings)}</div><p class="mini-sub">完成 ${m.result.count} 单 · 健康 −${Math.max(1, m.result.count * 2)}</p></div>` : ''}
  `, m.result ? `<button class="btn btn-primary" data-action="mini-finish">收工</button>` : `<button class="btn" data-action="mini-delivery-end">提前收工</button>`);
}

function renderExamMini(m) {
  const left = EXAM.days - Object.values(m.alloc).reduce((s, v) => s + v, 0);
  return miniShell('备考日历', 'EXAM SPRINT / 7 DAYS', `
    <div class="mini-title">还剩 ${left} 天可分配</div>
    <div class="mini-headline">把 7 天分给三个科目。</div>
    <p class="mini-sub">均衡会加一点运气；全押一科也可能翻盘。身体也要留一点时间。</p>
    <div class="exam-grid">
      ${EXAM.subjects.map((s) => `<div class="exam-sub"><div class="top"><span>${s.name}</span><b style="color:#d9a441">×${s.weight}</b></div><div class="val">${m.alloc[s.id] || 0}</div><div class="controls"><button data-action="mini-exam-dec" data-id="${s.id}">−</button><button data-action="mini-exam-inc" data-id="${s.id}">＋</button></div></div>`).join('')}
      <div class="exam-sub"><div class="top"><span>休息</span><b style="color:#9bbf6a">+健康</b></div><div class="val">${m.rest || 0}</div><div class="controls"><button data-action="mini-exam-rest-dec">−</button><button data-action="mini-exam-rest-inc">＋</button></div></div>
    </div>
    ${m.result ? `<div class="mini-panel" style="border-color:#d9a441"><div class="mini-label">RESULT</div><div class="mini-score">${m.result.score}<span style="font-size:12px;color:#9fb0c4"> / 100</span></div><p class="mini-sub">${m.result.tier} · 路线 +${m.result.effects.route?.exam || 0}</p></div>` : ''}
  `, m.result ? `<button class="btn btn-primary" data-action="mini-finish">收下成绩</button>` : `<button class="btn btn-primary" data-action="mini-exam-submit" ${left > 0 ? 'disabled' : ''}>交卷</button>`);
}

function renderInterrogationMini(m) {
  const q = INTERROGATION[m.current];
  return miniShell('家庭盘问', `LIE PUZZLE / ${m.current + 1}/3`, `
    <div class="mini-title">第 ${m.current + 1} 轮 · 选一句最像真话的</div>
    <div class="mini-headline" style="font-size:20px">${esc(q.q)}</div>
    <p class="mini-sub">每句话都有破绽。前后矛盾会比沉默更危险。</p>
    <div class="fragment-list">
      ${q.fragments.map((f, i) => `<button class="fragment ${m.picks[m.current] === i ? 'selected' : ''}" data-action="mini-interrogation-pick" data-index="${i}">${esc(f.text)}</button>`).join('')}
    </div>
    <div class="ledger-rounds">${[0,1,2].map((i) => `<i class="${i <= m.current ? 'on' : ''}"></i>`).join('')}</div>
    ${m.result ? `<div class="mini-panel" style="border-color:#d9a441"><div class="mini-label">RESULT</div><div class="mini-score" style="font-size:24px">${m.result.tier}</div><p class="mini-sub">矛盾 ${m.result.contradictions} 处 · 信任 ${m.result.effects.trust > 0 ? '+' : ''}${m.result.effects.trust} · 露馅 ${m.result.effects.suspicion > 0 ? '+' : ''}${m.result.effects.suspicion}</p></div>` : ''}
  `, m.result ? `<button class="btn btn-primary" data-action="mini-finish">面对结果</button>` : `<button class="btn btn-primary" data-action="mini-interrogation-next">${m.current >= 2 ? '回答完毕' : '下一句'}</button>`);
}

/* ============================== SHARE MODAL ============================== */
function renderShareModal() {
  const s = app.share;
  if (!s) return '';
  return `<div class="overlay modal-center" style="z-index:80"><div class="sheet" style="max-width:420px">
    <div class="sheet-head"><div><div class="kicker">SHARE CARD</div><h2>你的空档报告</h2></div><button class="icon-btn" style="margin-left:auto" data-action="close-modal">×</button></div>
    <div class="sheet-body"><div class="share-preview"><img src="${s.dataUrl}" alt="空档报告分享卡" /></div>
      <div class="share-actions"><button class="btn btn-primary" data-action="share-native">保存/分享</button><button class="btn" data-action="share-copy">复制文案</button></div>
      <p class="tiny muted" style="margin-top:8px">微信内如无法直接分享，可长按图片保存，或复制文案后发给朋友。分享卡会在本地生成，不上传任何数据。</p>
    </div>
  </div></div>`;
}

/* ============================== EVENTS ============================== */
function onClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  if (target.dataset.stop) e.stopPropagation();
  const action = target.dataset.action;
  const id = target.dataset.id;
  try {
    handleAction(action, target, id, e);
  } catch (err) {
    console.error(err);
    toast('出了点问题，已记录在控制台。', 'bad');
  }
}

function handleAction(action, target, id, e) {
  switch (action) {
    case 'back-title': if (app.run?.ended) { app.run = null; clearRun(); } go('title'); break;
    case 'new-game': if (app.run && !app.run.ended) { app.modal = { type: 'confirm-new' }; render(); } else { app.run = null; clearRun(); go('select'); } break;
    case 'confirm-new-game': app.run = null; clearRun(); go('select'); break;
    case 'continue': if (app.run) resumeRun(); break;
    case 'select-persona': app.modal = { type: 'persona', id }; render(); break;
    case 'start-run': startRun(id); break;
    case 'start-personality-persona': startRun(id); break;
    case 'start-daily': startDaily(); break;
    case 'personality': app.personality = { index: 0, answers: [], result: null }; app.screen = 'personality'; app.modal = null; render(); break;
    case 'personality-answer': answerPersonality(Number(target.dataset.index)); break;
    case 'retake-personality': app.personality = { index: 0, answers: [], result: null }; render(); break;
    case 'collection': app.screen = 'collection'; app.modal = null; render(); break;
    case 'settings': app.screen = 'settings'; app.modal = null; render(); break;
    case 'about': toast('故事纯属虚构。愿你不用假装，也能被好好接住。'); break;
    case 'help': app.modal = { type: 'help' }; render(); break;
    case 'toggle-phone': app.phoneOpen = !app.phoneOpen; render(); break;
    case 'prologue-next': nextPrologue(); break;
    case 'skip-prologue': startGameFromPrologue(); break;
    case 'choose-location': chooseLocation(id); break;
    case 'play-card': playCardAction(id); break;
    case 'confirm-check': resolveCheckAction(Number(target.dataset.boost || 0)); break;
    case 'resolve-event': resolveEvent(Number(target.dataset.index)); break;
    case 'end-day': goEvening(); break;
    case 'evening': chooseEvening(id); break;
    case 'naming-choice': chooseNaming(target.dataset.choice); break;
    case 'bill-choice': chooseBill(target.dataset.choice); break;
    case 'pick-focus': app.focusFilter = '全部'; app.modal = { type: 'focus' }; render(); break;
    case 'focus-filter': app.focusFilter = id; render(); break;
    case 'set-focus': setFocus(id); break;
    case 'open-routes': if (!app.run) { toast('先开始一轮空档。'); break; } app.modal = { type: 'routes' }; render(); break;
    case 'open-clues': if (!app.run) { toast('先开始一轮空档。'); break; } app.modal = { type: 'clues' }; render(); break;
    case 'take-reward': takeRewardAction(Number(target.dataset.index)); break;
    case 'phone-like': phoneReact(id, 'like'); break;
    case 'phone-skip': phoneReact(id, 'skip'); break;
    case 'sleep': sleepToNextDay(); break;
    case 'close-modal': closeModal(); break;
    case 'overlay-click': if (target === e.target) closeModal(); break;
    case 'dialogue-verb': dialogueVerb(target.dataset.verb); break;
    case 'dialogue-sub-close': app.dialogueMenu = null; render(); break;
    case 'dialogue-sub-choose': dialogueSubChoose(target.dataset.type, Number(target.dataset.index)); break;
    case 'dialogue-clue': dialogueUseClue(id); break;
    case 'dialogue-resolve': dialogueResolve(); break;
    case 'dialogue-abort': toast('关键对话不能直接退出，先说完。'); break;
    case 'mini-pick': miniPick(target.dataset.field, id); break;
    case 'mini-submit-viral': miniSubmitViral(); break;
    case 'mini-ledger-next': miniLedgerNext(); break;
    case 'mini-delivery-accept': miniDeliveryAccept(id); break;
    case 'mini-delivery-end': miniDeliveryEnd(); break;
    case 'mini-exam-inc': miniExamAdjust(id, 1); break;
    case 'mini-exam-dec': miniExamAdjust(id, -1); break;
    case 'mini-exam-rest-inc': miniExamRest(1); break;
    case 'mini-exam-rest-dec': miniExamRest(-1); break;
    case 'mini-exam-submit': miniExamSubmit(); break;
    case 'mini-interrogation-pick': miniInterrogationPick(Number(target.dataset.index)); break;
    case 'mini-interrogation-next': miniInterrogationNext(); break;
    case 'mini-finish': miniFinish(); break;
    case 'mini-abort': miniAbort(); break;
    case 'share-native': shareNative(); break;
    case 'share-copy': shareCopy(); break;
    case 'open-share-ending': openShare('ending'); break;
    case 'open-share-day': openShare('day'); break;
    case 'copy-invite': copyInvite(); break;
    case 'ending-collection': app.screen = 'collection'; app.modal = null; render(); break;
    case 'toggle-mute': app.settings.muted = !app.settings.muted; setMuted(app.settings.muted); saveSettings(app.settings); render(); break;
    case 'toggle-motion': app.settings.reducedMotion = !app.settings.reducedMotion; applyBodySettings(); saveSettings(app.settings); render(); break;
    case 'set-text': app.settings.textSize = id; applyBodySettings(); saveSettings(app.settings); render(); break;
    case 'set-difficulty': app.settings.difficulty = id; saveSettings(app.settings); render(); break;
    case 'reset-game': if (confirm('确定清除所有本地存档？')) { resetAll(); app.meta = loadMeta(); app.run = null; go('title'); } break;
    case 'open-debug': app.modal = { type: 'debug' }; render(); break;
    case 'debug-cash': app.run.stats.cash += 5000; toast('+5000'); render(); break;
    case 'debug-day': if (app.run.day < 21) { app.run.day += 1; app.run.phase = 'morning'; app.run.location = null; app.run.energy = app.run.maxEnergy || 6; drawHand(app.run, true); toast(`跳到第 ${app.run.day} 天`); saveRun(app.run); } render(); break;
    case 'debug-suspicion': app.run.stats.suspicion = Math.min(100, app.run.stats.suspicion + 20); toast('露馅 +20'); render(); break;
    case 'debug-trust': app.run.stats.trust = Math.min(100, app.run.stats.trust + 10); toast('信任 +10'); render(); break;
    case 'debug-route': if (app.run.focusRoute) { applyEffects(app.run, { route: { [app.run.focusRoute]: 3 } }); toast('路线 +3'); } render(); break;
    case 'debug-final': app.run.day = 21; app.run.phase = 'evening'; app.modal = null; app.screen = 'game'; saveRun(app.run); render(); break;
    case 'debug-ending': finishRun(); break;
    case 'debug-game': app.screen = 'game'; app.modal = null; render(); break;
    case 'debug-unlock': app.meta.endings = ENDINGS.map((e) => e.id); saveMeta(app.meta); toast('结局已解锁'); render(); break;
    default: break;
  }
}

/* ============================== FLOW FUNDAMENTALS ============================== */
function resumeRun() {
  const run = app.run;
  if (!run || run.ended) { app.run = null; go('title'); return; }
  app.screen = 'game';
  if (run.phase === 'night') {
    app.night = null;
    enterNight();
    return;
  }
  render();
  if (run.phase === 'morning') {
    const dId = MAIN_DIALOGUE_DAYS[run.day];
    if (dId && !run.usedMainDialogues.includes(dId)) {
      app.dialogue = createDialogueState(dId, run);
      app.dialogueMenu = null;
      app.modal = { type: 'dialogue' };
      render();
      return;
    }
    if (run.day === 5 && !run.focusPicked) {
      app.modal = { type: 'focus' };
      render();
    }
  }
}

function startRun(personaId, seed = null, daily = false) {
  const p = PERSONA_BY_ID[personaId];
  if (!p) return;
  const runSeed = seed || `${dateSeed()}-${personaId}-${Math.floor(Math.random() * 99999)}`;
  const ref = app.referral && !app.meta.referralUsed ? app.referral : null;
  if (ref) app.meta.referralUsed = true;
  app.run = createRun(personaId, runSeed, app.settings.difficulty, ref);
  app.run.daily = daily;
  app.prologueStep = 0;
  app.screen = 'prologue';
  app.toast = [];
  app.modal = null;
  app.mini = null;
  app.dialogue = null;
  app.night = null;
  app.afterMini = null;
  app.finalDialogue = false;
  app.dialogueMenu = null;
  app.meta.runs = (app.meta.runs || 0) + 1;
  app.meta.lastCode = app.run.referralCode;
  saveMeta(app.meta);
  saveRun(app.run);
  render();
}

function startDaily() {
  const seed = app.daily?.seed || dateSeed();
  const persona = app.daily?.persona || PERSONAS[new Date().getDate() % PERSONAS.length].id;
  startRun(persona, `daily-${seed}-${persona}`, true);
  toast(`今日挑战：${seed} · 所有玩家同一天开始空档`, 'gold');
}

function nextPrologue() {
  const persona = PERSONA_BY_ID[app.run.personaId];
  const total = prologueBeats(persona).length;
  if (app.prologueStep >= total - 1) startGameFromPrologue();
  else { app.prologueStep += 1; render(); }
}

function startGameFromPrologue() {
  app.run.phase = 'morning';
  app.run.day = 1;
  app.screen = 'game';
  app.modal = null;
  saveRun(app.run);
  render();
  setTimeout(() => {
    if (app.run?.day === 1 && !app.run.flags.tutorialSeen) {
      app.run.flags.tutorialSeen = true;
      toast('先选一个“上班”的地方。每个地点都有加成和风险。', 'gold');
      saveRun(app.run);
    }
  }, 500);
}

function closeModal() {
  app.modal = null;
  app.mini = null;
  app.dialogue = null;
  app.dialogueMenu = null;
  render();
}

/* ============================== GAME ACTIONS ============================== */
function chooseLocation(id) {
  const l = LOCATION_BY_ID[id];
  if (!l) return;
  app.run.location = id;
  app.run.phase = 'day';
  app.run.dayActions = 0;
  applyEffects(app.run, l.arrival || {});
  if (l.id === 'nightmarket') app.run.flags.nightmarket_visited = true;
  log(app.run, `你去了${l.name}。${l.desc}`);
  addHistory(app.run, `地点：${l.name}`);
  if (l.id === 'library') unlockMemory('m_library');
  if (l.id === 'cafe') unlockMemory('m_cafe');
  if (l.id === 'oldoffice') unlockMemory('m_oldoffice');
  if (l.id === 'nightmarket') unlockMemory('m_nightmarket');
  if (app.run.day === 1) unlockMemory('m_subway');
  if (app.run.day === 3) unlockMemory('m_escalator');
  drawHand(app.run, true);
  saveRun(app.run);
  sfx('page');
  render();
}

function unlockMemory(id) {
  if (!app.run) return;
  app.run.memories = app.run.memories || [];
  if (!app.run.memories.includes(id)) {
    app.run.memories.push(id);
    toast(`解锁记忆：${MEMORIES.find((m) => m.id === id)?.title || id}`, 'good');
  }
}

function playCardAction(cardId) {
  const run = app.run;
  if (!run) return;
  const card = getCard(run, cardId);
  if (!card) return;
  if (run.energy < (card.cost || 0)) { toast('精力不够了，先结束今天吧。', 'bad'); return; }
  if (card.kind === 'check') {
    app.modal = { type: 'check', cardId };
    render();
    return;
  }
  if (card.kind === 'minigame') {
    spendCard(card);
    openMinigame(card.minigame, card.routeId, card);
    return;
  }
  if (card.kind === 'route') {
    spendCard(card, true);
    openRouteEngine(card.routeId);
    return;
  }
  // instant
  spendCard(card);
  applyEffects(run, card.effects || {});
  setFlagsFromCard(run, card);
  log(run, `你做了「${card.name}」。`);
  addHistory(run, `行动：${card.name}`);
  sfx('card');
  afterAction();
}

function spendCard(card, focus = false) {
  const run = app.run;
  if (!focus) {
    run.energy = Math.max(0, run.energy - (card.cost || 0));
    run.hand = (run.hand || []).filter((id) => id !== card.id);
    if (!run.discard.includes(card.id)) run.discard.push(card.id);
  } else {
    run.energy = Math.max(0, run.energy - (card.cost || 0));
  }
  run.dayActions = (run.dayActions || 0) + 1;
  saveRun(run);
}

function setFlagsFromCard(run, card) {
  if (!card) return;
  if (card.flags) card.flags.forEach((f) => { run.flags[f] = true; });
  if (card.flag) run.flags[card.flag] = true;
  // 从卡面效果里补一些清单/记忆
  if (card.id === 'takeout') run.flags.takeout = true;
  if (card.id === 'stall_prep') run.flags.stall = true;
  if (card.id === 's_video' || card.id === 'content_plan') run.flags.video = true;
  if (card.id === 'gym') run.flags.gym = true;
  if (card.id === 'wishlist') run.flags.wishlist = true;
  if (card.id === 'sell_stuff') run.flags.sell_stuff = true;
  if (card.id === 'fix_badge') run.flags.fix_badge = true;
  if (card.id === 'health_check') run.flags.health_check = true;
  if (card.id === 'library_day') run.flags.library = true;
  if (card.id === 'park_nap') run.flags.park = true;
  if (card.id === 'old_colleague' || card.id === 's_network') run.flags.old_colleague = true;
  if (card.id === 'home_call') run.flags.parent_meal = true;
  if (card.id === 'kid_time') run.flags.kid_time = true;
  if (card.id === 'freelance_gig' || card.id === 's_gig') run.flags.freelance = true;
  if (card.id === 'exam_study') run.flags.exam = true;
  if (card.id === 'fake_coach') run.flags.fake_coach = true;
  if (card.id === 's_apply') run.flags.applied_job = true;
}

function resolveCheckAction(boost) {
  const m = app.modal;
  if (!m || m.type !== 'check') return;
  const card = CARD_BY_ID[m.cardId];
  if (!card) { closeModal(); return; }
  if (boost && app.run.energy < 1) { toast('精力不够，稳不了这一手。', 'bad'); return; }
  if (boost) app.run.energy -= 1;
  const res = rollCheck(app.run, card, !!boost);
  spendCard(card);
  const bucket = res.ok ? card.success : card.fail;
  applyEffects(app.run, bucket || {});
  setFlagsFromCard(app.run, card);
  log(app.run, `「${card.name}」${res.ok ? (res.crit ? '大成功' : '成功') : '失败'}（${Math.round(res.chance * 100)}%）。`);
  addHistory(app.run, `检定「${card.name}」${res.ok ? '成功' : '失败'}。`);
  app.modal = null;
  sfx(res.ok ? 'success' : 'fail');
  toast(res.ok ? (res.crit ? '大成功！' : '成了。') : '没成。但日子还得过。', res.ok ? 'good' : 'bad');
  afterAction();
}

function afterAction() {
  const run = app.run;
  if (!run) return;
  adjustEnergyForHealth(run);
  // route milestone dialogue
  const routeId = triggeredRouteDialogue(run);
  if (routeId) {
    saveRun(run);
    openRouteDialogue(routeId);
    return;
  }
  // random event
  if (run.phase === 'day' && run.day > 1 && Math.random() < 0.28) {
    const ev = pickEvent(run);
    if (ev) {
      saveRun(run);
      app.modal = { type: 'event', event: ev };
      render();
      return;
    }
  }
  saveRun(run);
  render();
}

function triggeredRouteDialogue(run) {
  for (const id of ROUTE_IDS) {
    if (run.routeStage[id] >= 1 && !run.usedRouteDialogues.includes(`d_route_${id}`)) {
      if (id === 'fake' && isFakeLocked(run)) continue;
      return id;
    }
  }
  return null;
}

function openRouteDialogue(routeId) {
  const d = DIALOGUE_BY_ID[`d_route_${routeId}`];
  if (!d) return;
  app.toast = [];
  app.dialogue = createDialogueState(d.id, app.run);
  app.dialogueMenu = null;
  app.modal = { type: 'dialogue' };
  render();
}

function openRouteEngine(routeId) {
  const route = ROUTE_BY_ID[routeId];
  if (!route) return;
  if (route.engine === 'dialogue') {
    const d = DIALOGUE_BY_ID[route.dialogueId];
    if (d && !app.run.usedRouteDialogues.includes(d.id)) {
      app.toast = [];
      app.dialogue = createDialogueState(d.id, app.run);
      app.dialogueMenu = null;
      app.modal = { type: 'dialogue' };
      render();
      return;
    }
    // 已经聊过：直接推进一小步
    applyEffects(app.run, { route: { [routeId]: 1 }, spirit: 1 });
    log(app.run, `你把今天的一段时间投给了「${route.name}」。`);
    sfx('card');
    afterAction();
    return;
  }
  if (route.engine === 'viral') openMinigame('viral', routeId);
  else if (route.engine === 'ledger') openMinigame('ledger', routeId);
  else if (route.engine === 'delivery') openMinigame('delivery', routeId);
  else if (route.engine === 'exam') openMinigame('exam', routeId);
  else if (route.engine === 'interrogation') openMinigame('interrogation', routeId);
}

function pickEvent(run) {
  const pool = EVENTS.filter((ev) => !ev.tags || ev.tags.includes(20) || ev.tags.includes(30) || ev.tags.includes(40) || ev.tags.includes(50));
  const weights = pool.map((ev) => ev.weight || 1);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[0];
}

function resolveEvent(index) {
  const m = app.modal;
  if (!m || m.type !== 'event') return;
  const c = m.event.choices[index];
  if (!c) return;
  applyEffects(app.run, c.effects || {});
  log(app.run, `${m.event.title}：${c.result || c.text}`);
  addHistory(app.run, `事件「${m.event.title}」`);
  app.modal = null;
  sfx('page');
  if (c.effects?.flag) app.run.flags[c.effects.flag] = true;
  saveRun(app.run);
  render();
  toast(c.result || '事情就这样发生了。');
}

function goEvening() {
  const run = app.run;
  if (!run) return;
  run.phase = 'evening';
  saveRun(run);
  render();
}

function chooseEvening(id) {
  const run = app.run;
  if (!run) return;
  if (id === 'home') {
    applyEffects(run, { trust: 4, suspicion: -4, spirit: 2 });
    log(run, '你按时回家，和家人一起吃了饭。');
  } else if (id === 'overtime') {
    applyEffects(run, { suspicion: -6, trust: -3, spirit: 2 });
    log(run, '你说今晚加班，在楼下坐到了九点。');
  } else if (id === 'meet') {
    applyEffects(run, { cash: -50, people: 1, suspicion: 4, spirit: 1 });
    log(run, '你去见了一个人，聊了很久。');
  } else if (id === 'nightmarket') {
    applyEffects(run, { street: 1, spirit: 3, route: { stall: 1 } });
    run.flags.nightmarket_visited = true;
    log(run, '你去了夜市，老赵给你加了个蛋。');
    unlockMemory('m_nightmarket');
  }
  saveRun(run);
  // naming moment
  const moment = NAMING_MOMENTS[run.day];
  if (moment && !run.namingDone.includes(moment.id)) {
    app.modal = { type: 'naming', moment };
    render();
    return;
  }
  // suspicion interrogation
  if (run.stats.suspicion >= 60 && !run.flags.interrogatedToday) {
    run.flags.interrogatedToday = true;
    app.afterMini = 'night';
    openMinigame('interrogation', 'fake');
    return;
  }
  enterNight();
}

function chooseNaming(choice) {
  const moment = app.modal?.moment;
  if (!moment) return;
  applyNaming(app.run, choice);
  const isFinal = app.run.day === 21;
  app.modal = null;
  saveRun(app.run);
  sfx(choice === 'direct' ? 'heart' : 'page');
  toast(choice === 'direct' ? '你说出来了。天没塌。' : '你把那句话咽了回去。', choice === 'direct' ? 'good' : '');
  if (isFinal) {
    finalBillThenFinale();
  } else if (app.run.stats.suspicion >= 60 && !app.run.flags.interrogatedToday) {
    app.run.flags.interrogatedToday = true;
    app.afterMini = 'night';
    openMinigame('interrogation', 'fake');
  } else {
    enterNight();
  }
}

function finalBillThenFinale() {
  const idx = dueBillIndex(app.run);
  if (idx >= 0) {
    const b = payBill(app.run);
    if (!b.done) {
      app.afterBill = 'finale';
      app.modal = { type: 'bill', bill: { ...b, cash: app.run.stats.cash } };
      render();
      return;
    }
  }
  openFinale();
}

function openFinale() {
  const d = DIALOGUE_BY_ID.d_main_family;
  if (!d) { finishRun(); return; }
  app.toast = [];
  app.dialogue = createDialogueState(d.id, app.run);
  app.dialogueMenu = null;
  app.modal = { type: 'dialogue' };
  app.finalDialogue = true;
  render();
}

function enterNight() {
  const run = app.run;
  if (!run) return;
  app.phoneOpen = false;
  run.phase = 'night';
  const idx = dueBillIndex(run);
  let bill = null;
  if (idx >= 0) {
    const b = payBill(run);
    if (!b.done) {
      app.afterBill = 'night';
      app.modal = { type: 'bill', bill: { ...b, cash: run.stats.cash } };
      saveRun(run);
      render();
      return;
    }
    bill = { ...b, index: idx, cashAfter: run.stats.cash };
    if (idx === 0) toast(`第 1 笔硬支出 ${money(b.amount)} 已支付。`, 'gold');
  }
  const report = run.day % 7 === 0 ? makeWeeklyReport(run) : null;
  const rewards = app.night?.rewards && app.night.day === run.day ? app.night.rewards : draftRewards(run, 3);
  const posts = app.night?.posts && app.night.day === run.day ? app.night.posts : pickPhonePosts(run, 3);
  app.night = {
    day: run.day,
    bill,
    report,
    rewards,
    rewardTaken: app.night?.rewardTaken && app.night.day === run.day,
    posts,
    summaryLine: makeNightLine(run),
  };
  run.flags.interrogatedToday = false;
  saveRun(run);
  render();
}

function makeNightLine(run) {
  if (run.stats.suspicion >= 80) return '手机安静得有点反常。你把工牌藏进了抽屉最下面。';
  if (run.stats.spirit <= 25) return '你躺在床上，连手机都不想充电。';
  if (run.day >= 18) return '第 21 天快到了。你开始想，那顿饭要怎么吃。';
  if (run.stats.cash < 10000) return '你算了一下余额，决定明天少喝一杯咖啡。';
  return '今天也过完了。你把衬衫挂好，像明天真的还要上班。';
}

function makeWeeklyReport(run) {
  const week = Math.min(3, Math.ceil(run.day / 7));
  const base = WEEKLY_REPORTS[week - 1] || WEEKLY_REPORTS[0];
  const score = Math.round((run.stats.face + run.stats.spirit + run.stats.trust + (100 - run.stats.suspicion)) / 4);
  const grade = score >= 80 ? 'S' : score >= 65 ? 'A' : score >= 50 ? 'B' : 'C';
  return { ...base, score, grade, lines: [...base.lines] };
}

function pickPhonePosts(run, count) {
  const arr = PHONE_POSTS.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function chooseBill(choice) {
  const m = app.modal;
  if (!m || m.type !== 'bill') return;
  resolveBillShortfall(app.run, choice, m.bill.index);
  app.modal = null;
  saveRun(app.run);
  toast('账单处理完了，代价记在账上。', choice === 'family' ? 'bad' : '');
  if (app.afterBill === 'finale') { app.afterBill = null; openFinale(); return; }
  app.afterBill = null;
  app.night = null;
  enterNight();
}

function takeRewardAction(index) {
  const nd = app.night;
  if (!nd || nd.rewardTaken) return;
  const r = nd.rewards[index];
  if (!r) return;
  takeReward(app.run, r);
  nd.rewardTaken = true;
  sfx('cash');
  toast(`拿到：${r.name}`, 'good');
  saveRun(app.run);
  render();
}

function phoneReact(id, kind) {
  const run = app.run;
  if (!run) return;
  if (run.flags[`phone_${id}`]) return;
  const post = PHONE_POSTS.find((p) => p.id === id);
  if (!post) return;
  if (kind === 'like') {
    applyEffects(run, { spirit: 1, face: 1 });
    log(run, '你给一条朋友圈点了赞。');
  } else {
    applyEffects(run, { spirit: 0 });
  }
  run.flags[`phone_${id}`] = true;
  saveRun(run);
  toast(kind === 'like' ? '点了个赞。' : '划过去了。');
  render();
}

function sleepToNextDay() {
  const run = app.run;
  if (!run) return;
  // collapse check
  if (run.stats.cash < -20000 || run.stats.trust <= 0) {
    finishRun('e_collapse');
    return;
  }
  if (run.day >= 21) {
    finalBillThenFinale();
    return;
  }
  startNewDay(run);
  app.night = null;
  app.modal = null;
  saveRun(run);
  render();
  // morning scheduled main dialogue
  const dId = MAIN_DIALOGUE_DAYS[run.day];
  if (dId && !run.usedMainDialogues.includes(dId)) {
    app.dialogue = createDialogueState(dId, run);
    app.dialogueMenu = null;
    app.modal = { type: 'dialogue' };
    render();
    return;
  }
  if (run.day === 5 && !run.focusPicked) {
    app.modal = { type: 'focus' };
    render();
  }
}

function setFocus(id) {
  const run = app.run;
  if (!run) return;
  if (id === 'fake' && isFakeLocked(run)) { toast('你已经对家人说出了那句话，伪装大师线锁定了。', 'bad'); return; }
  run.focusRoute = id;
  run.focusPicked = true;
  if (personaAffinity(run.personaId, id)) applyEffects(run, { route: { [id]: 1 }, spirit: 2 });
  log(run, `你把接下来一段时间的重点定为「${ROUTE_BY_ID[id].name}」。`);
  app.modal = null;
  sfx('success');
  toast(`重点路线：${ROUTE_BY_ID[id].name}`, 'gold');
  saveRun(run);
  render();
}

function personaAffinity(personaId, routeId) {
  return PERSONA_BY_ID[personaId]?.affinity?.includes(routeId);
}

/* ============================== DIALOGUE ACTIONS ============================== */
function dialogueVerb(verb) {
  const ds = app.dialogue;
  if (!ds || ds.ended) return;
  if (verb === 'ask' || verb === 'say') {
    app.dialogueMenu = verb;
    render();
    // append submenu after base render
    const el = document.getElementById('app');
    el.insertAdjacentHTML('beforeend', renderDialogueSubmenu());
    return;
  }
  dialogueAction(ds, app.run, verb);
  sfx('page');
  render();
}

function dialogueSubChoose(type, index) {
  const ds = app.dialogue;
  if (!ds || ds.ended) return;
  dialogueAction(ds, app.run, type, { index });
  app.dialogueMenu = null;
  sfx('card');
  render();
}

function dialogueUseClue(id) {
  const ds = app.dialogue;
  if (!ds || ds.ended) return;
  dialogueAction(ds, app.run, 'clue', { clueId: id });
  sfx('card');
  render();
}

function dialogueResolve() {
  const ds = app.dialogue;
  if (!ds) return;
  const result = resolveDialogue(ds, app.run);
  app.dialogue = null;
  app.modal = null;
  app.dialogueMenu = null;
  sfx(result.outcome === 'success' ? 'success' : result.outcome === 'partial' ? 'page' : 'fail');
  toast(result.outcome === 'success' ? '你们谈成了。' : result.outcome === 'partial' ? '暂时缓和。' : '谈崩了，但还没完。', result.outcome === 'success' ? 'good' : result.outcome === 'fail' ? 'bad' : '');
  saveRun(app.run);
  if (app.finalDialogue) {
    app.finalDialogue = false;
    finishRun();
    return;
  }
  render();
  // route dialogue may have pushed stage; check random event not needed
}

/* ============================== MINIGAMES ============================== */
function openMinigame(kind, routeId, card = null) {
  app.toast = [];
  app.modal = { type: 'mini' };
  app.mini = {
    kind, routeId, card, result: null, startedAt: Date.now(),
    choice: { topicId: VIRAL.topics[0].id, titleId: VIRAL.titles[0].id, coverId: VIRAL.covers[0].id, timeId: VIRAL.times[0].id },
    price: LEDGER.priceOptions[1].price, stock: LEDGER.stockOptions[1].stock, rounds: [], current: 0, history: [], weather: null,
    alloc: { xingce: 0, shenlun: 0, interview: 0 }, rest: 0,
    picks: [null, null, null], accepted: [], orders: [], timeLeft: DELIVERY.duration, earnings: 0,
  };
  if (kind === 'delivery') {
    app.mini.orders = shuffleOrders();
    app.mini.timer = setInterval(() => {
      if (!app.mini || app.mini.kind !== 'delivery' || app.mini.result) { clearInterval(app.mini?.timer); return; }
      app.mini.timeLeft = Math.max(0, app.mini.timeLeft - 1);
      if (app.mini.timeLeft <= 0) {
        clearInterval(app.mini.timer);
        miniDeliveryEnd();
      } else {
        render();
      }
    }, 1000);
  }
  render();
}

function shuffleOrders() {
  const arr = DELIVERY.orders.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 6).map((o, i) => ({ ...o, uid: `${o.id}-${i}` }));
}

function miniPick(field, value) {
  const m = app.mini;
  if (!m || m.result) return;
  if (field === 'price') m.price = Number(value);
  else if (field === 'stock') m.stock = Number(value);
  else m.choice[field] = value;
  sfx('click');
  render();
}

function miniSubmitViral() {
  const m = app.mini;
  if (!m) return;
  m.result = viralResult(m.choice, app.run, m.routeId || 'content');
  sfx(m.result.tier === '爆了' ? 'success' : 'page');
  render();
}

function miniLedgerNext() {
  const m = app.mini;
  if (!m) return;
  const r = ledgerRound(app.run, m.current, m.price, m.stock);
  m.history.push(r);
  m.weather = r.weather.name;
  m.current += 1;
  if (m.current >= 3) {
    m.result = ledgerResult(app.run, m.history, m.routeId || 'stall');
    sfx(m.result.profit >= 0 ? 'cash' : 'fail');
  }
  render();
}

function miniDeliveryAccept(uid) {
  const m = app.mini;
  if (!m || m.result) return;
  if (m.accepted.find((o) => o.uid === uid)) return;
  const o = m.orders.find((x) => x.uid === uid);
  if (!o) return;
  m.accepted.push(o);
  m.earnings += o.pay;
  sfx('cash');
  render();
}

function miniDeliveryEnd() {
  const m = app.mini;
  if (!m || m.result) return;
  if (m.timer) clearInterval(m.timer);
  m.result = deliveryResult(app.run, m.accepted);
  sfx('cash');
  render();
}

function miniExamAdjust(id, delta) {
  const m = app.mini;
  if (!m || m.result) return;
  const used = Object.values(m.alloc).reduce((s, v) => s + v, 0) + m.rest;
  if (delta > 0 && used >= EXAM.days) return;
  m.alloc[id] = Math.max(0, Math.min(EXAM.days, (m.alloc[id] || 0) + delta));
  sfx('click');
  render();
}

function miniExamRest(delta) {
  const m = app.mini;
  if (!m || m.result) return;
  const used = Object.values(m.alloc).reduce((s, v) => s + v, 0) + m.rest;
  if (delta > 0 && used >= EXAM.days) return;
  m.rest = Math.max(0, m.rest + delta);
  render();
}

function miniExamSubmit() {
  const m = app.mini;
  if (!m) return;
  m.result = examResult(app.run, { ...m.alloc, rest: m.rest });
  sfx(m.result.score >= 60 ? 'success' : 'fail');
  render();
}

function miniInterrogationPick(index) {
  const m = app.mini;
  if (!m || m.result) return;
  m.picks[m.current] = index;
  sfx('click');
  render();
}

function miniInterrogationNext() {
  const m = app.mini;
  if (!m) return;
  if (m.picks[m.current] === null) { toast('先选一句。', 'bad'); return; }
  if (m.current >= 2) {
    m.result = interrogationResult(app.run, m.picks);
    sfx(m.result.tier === '信了' ? 'success' : 'fail');
  } else {
    m.current += 1;
  }
  render();
}

function miniFinish() {
  const m = app.mini;
  if (!m) return;
  if (m.timer) clearInterval(m.timer);
  // route progress already applied by result; ensure min progress
  if (m.routeId && (!m.result?.effects?.route || !m.result.effects.route[m.routeId])) {
    applyEffects(app.run, { route: { [m.routeId]: 1 } });
  }
  app.mini = null;
  app.modal = null;
  saveRun(app.run);
  if (app.afterMini === 'night') { app.afterMini = null; enterNight(); return; }
  if (app.afterMini === 'finale') { app.afterMini = null; finalBillThenFinale(); return; }
  afterAction();
}

function miniAbort() {
  const m = app.mini;
  if (m?.timer) clearInterval(m.timer);
  app.mini = null;
  app.modal = null;
  app.afterMini = null;
  saveRun(app.run);
  toast('你提前收手了。今天的时间已经花掉了。', 'bad');
  afterAction();
}

/* ============================== END / SHARE ============================== */
function finishRun(forcedId = null) {
  const run = app.run;
  if (!run) return;
  syncMemories(run);
  const endingId = forcedId || evaluateEnding(run);
  run.endingId = endingId;
  run.ended = true;
  run.phase = 'ending';
  app.meta = recordRunEnd(app.meta, run, endingId);
  app.meta = unlockMetaFlags(app.meta, run);
  if (run.memories?.length) app.meta.memories = Array.from(new Set([...(app.meta.memories || []), ...run.memories]));
  app.meta.lastCode = run.referralCode;
  saveMeta(app.meta);
  saveRun(run);
  app.screen = 'ending';
  app.toast = [];
  app.modal = null;
  app.mini = null;
  app.dialogue = null;
  sfx(endingId === 'e_collapse' ? 'alarm' : 'success');
  render();
}

function openShare(kind = 'ending') {
  const run = app.run;
  if (!run) { toast('先生成一局空档报告。'); return; }
  const endingId = run.endingId || evaluateEnding(run);
  run.checklistCount = checklistCount(run);
  run.personality = app.meta?.personality?.name || '体面表演家';
  const canvas = renderPoster(run, endingId, kind);
  app.share = { canvas, dataUrl: canvas.toDataURL('image/png'), kind };
  app.toast = [];
  app.modal = { type: 'share' };
  render();
}

async function shareNative() {
  if (!app.share) return;
  const res = await shareOrDownload(app.share.canvas, app.run, app.share.kind);
  if (res.ok) toast(res.method === 'share' ? '已打开分享面板。' : '图片已保存。', 'good');
  else if (res.reason !== '已取消') toast(res.reason || '分享失败，可以长按图片保存。', 'bad');
}

async function shareCopy() {
  const text = shareText(app.run, app.run?.endingId || evaluateEnding(app.run), app.share?.kind || 'ending');
  try {
    await navigator.clipboard.writeText(text);
    toast('文案已复制。', 'good');
  } catch {
    toast('复制失败，请手动选择文字。', 'bad');
  }
}

function copyInvite() {
  const code = app.run?.referralCode || app.meta?.lastCode || 'PLAY-21';
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('ref', code);
  url.searchParams.set('utm_source', 'invite');
  const text = `我在《假装上班》空档了 21 天。给你留了一张“同事证言”和 500 元：${url.toString()}`;
  navigator.clipboard?.writeText(text).then(() => toast('邀请链接已复制。', 'good')).catch(() => toast(url.toString()));
}

function answerPersonality(index) {
  const p = app.personality;
  p.answers.push(index);
  if (p.index >= PERSONALITY_QUESTIONS.length - 1) {
    const res = scorePersonality(p.answers);
    p.result = res.result;
    app.meta.personality = res.result;
    saveMeta(app.meta);
    sfx('success');
  } else {
    p.index += 1;
    sfx('click');
  }
  render();
}

/* ============================== KEYBOARD ============================== */
function onKey(e) {
  if (e.key === 'Escape' && app.modal) { closeModal(); return; }
  if (app.screen !== 'game') return;
  if (app.modal) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 5) {
    const ids = app.run?.hand || [];
    if (ids[n - 1]) playCardAction(ids[n - 1]);
  }
  if (e.key === 'Enter') {
    if (app.run?.phase === 'day') goEvening();
  }
}

export function initApp() {
  boot();
}
