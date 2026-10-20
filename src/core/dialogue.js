import { DIALOGUE_BY_ID } from '../data/dialogues.js';
import { applyEffects, addHistory, statValue, clamp } from './game.js';
import { CLUE_BY_ID } from '../data/clues.js';

export function createDialogueState(dialogueId, run) {
  const d = DIALOGUE_BY_ID[dialogueId];
  if (!d) throw new Error(`Unknown dialogue ${dialogueId}`);
  return {
    id: dialogueId,
    round: 1,
    understanding: 8,
    guard: d.guard ?? 42,
    patience: d.patience ?? 5,
    maxPatience: d.patience ?? 5,
    needRevealed: false,
    log: [{ kind: 'npc', text: d.intro }],
    usedClues: [],
    ended: false,
    outcome: null,
    lastAction: null,
  };
}

export function dialogueHint(ds) {
  const d = DIALOGUE_BY_ID[ds.id];
  if (!d) return '';
  if (!ds.needRevealed) return '先听一听，或问一个不冒犯的问题。';
  return `你隐约感觉到：ta 真正在意的是「${d.need}」。`;
}

function pushLog(ds, kind, text) {
  ds.log.push({ kind, text });
  if (ds.log.length > 30) ds.log.shift();
}

function finishIfNeeded(ds) {
  if (ds.ended) return ds;
  if (ds.understanding >= 80 && ds.guard < 50) {
    ds.ended = true;
    ds.outcome = 'success';
    pushLog(ds, 'system', '你们达成了某种共识。');
  } else if (ds.guard >= 100) {
    ds.ended = true;
    ds.outcome = 'fail';
    pushLog(ds, 'system', '对方不再想谈了。');
  } else if (ds.patience <= 0 || ds.round > 6) {
    ds.ended = true;
    ds.outcome = ds.understanding >= 50 ? 'partial' : 'fail';
    pushLog(ds, 'system', ds.outcome === 'partial' ? '话说到一半，气氛缓和了一点。' : '对话不欢而散。');
  }
  return ds;
}

export function dialogueAction(ds, run, action, payload = {}) {
  if (ds.ended) return ds;
  const d = DIALOGUE_BY_ID[ds.id];
  if (!d) return ds;
  ds.lastAction = action;

  if (action === 'listen') {
    ds.understanding = clamp(ds.understanding + 5, 0, 100);
    ds.guard = clamp(ds.guard - 5, 0, 100);
    ds.patience -= 1;
    if (!ds.needRevealed) {
      ds.needRevealed = true;
      pushLog(ds, 'system', '你听出了一点弦外之音。');
    } else {
      pushLog(ds, 'you', '你安静地听 ta 把话说完。');
    }
    ds.round += 1;
    return finishIfNeeded(ds);
  }

  if (action === 'ask') {
    const q = d.questions?.[payload.index];
    if (!q) return ds;
    ds.understanding = clamp(ds.understanding + (q.understanding || 5), 0, 100);
    ds.guard = clamp(ds.guard + (q.guard || 0), 0, 100);
    ds.patience -= 1;
    if (q.reveal === 'need') ds.needRevealed = true;
    pushLog(ds, 'you', `你问：“${q.text}”`);
    pushLog(ds, 'npc', q.line || '对方看了你一眼，没有立刻回答。');
    ds.round += 1;
    return finishIfNeeded(ds);
  }

  if (action === 'say') {
    const st = d.stances?.[payload.index];
    if (!st) return ds;
    const stat = statValue(run, st.stat);
    let under = st.understanding || 6;
    let guard = st.guard || 0;
    if (st.match) {
      if (ds.needRevealed) {
        under += 8;
        guard -= 4;
        pushLog(ds, 'system', '你说中了 ta 真正在意的东西。');
      } else {
        under += 2;
      }
    }
    if (['pro', 'people', 'street'].includes(st.stat)) under += Math.round(stat * 1.2);
    else under += Math.round(stat / 20);
    ds.understanding = clamp(ds.understanding + under, 0, 100);
    ds.guard = clamp(ds.guard + guard, 0, 100);
    ds.patience -= 1;
    pushLog(ds, 'you', st.text);
    pushLog(ds, 'npc', guard > 6 ? '对方的脸色沉了一下。' : under >= 12 ? '对方的神情松动了一点。' : '对方没有接话，但也没有走。');
    ds.round += 1;
    return finishIfNeeded(ds);
  }

  if (action === 'stop') {
    ds.patience = Math.min(ds.maxPatience, ds.patience + 1);
    ds.guard = clamp(ds.guard + 3, 0, 100);
    pushLog(ds, 'you', '你没有接话，等对方先开口。');
    ds.round += 1;
    return finishIfNeeded(ds);
  }

  if (action === 'clue') {
    const clueId = payload.clueId;
    if (!clueId || ds.usedClues.length >= 2 || !run.clues.includes(clueId)) return ds;
    if (ds.usedClues.includes(clueId)) return ds;
    const clue = CLUE_BY_ID[clueId];
    ds.usedClues.push(clueId);
    ds.understanding = clamp(ds.understanding + 10, 0, 100);
    ds.guard = clamp(ds.guard - 8, 0, 100);
    pushLog(ds, 'you', `你拿出「${clue?.name || '底牌'}」。`);
    pushLog(ds, 'npc', '对方的表情变了一下，开始重新打量你。');
    return finishIfNeeded(ds);
  }

  return ds;
}

export function resolveDialogue(ds, run) {
  const d = DIALOGUE_BY_ID[ds.id];
  if (!d) return { effects: {} };
  const bucket = ds.outcome || (ds.understanding >= 50 ? 'partial' : 'fail');
  const effects = d[bucket] || {};
  applyEffects(run, effects);
  if (d.type === 'route') {
    run.usedRouteDialogues.push(d.id);
    if (bucket === 'success') run.flags[`route_dialogue_${d.routeId}`] = true;
  } else {
    run.usedMainDialogues.push(d.id);
    run.flags[`main_dialogue_${d.id}`] = true;
  }
  addHistory(run, `关键对话「${d.title}」结束：${bucket === 'success' ? '达成共识' : bucket === 'partial' ? '暂时缓和' : '谈崩了'}。`);
  return { effects, outcome: bucket, dialogue: d };
}

export function dialogueMeterLabel(value, type) {
  if (type === 'guard') {
    if (value >= 80) return '快炸了';
    if (value >= 60) return '很戒备';
    if (value >= 40) return '有点防备';
    return '松动了';
  }
  if (value >= 80) return '快说通了';
  if (value >= 50) return '有点理解';
  if (value >= 25) return '还在试探';
  return '没听进去';
}
