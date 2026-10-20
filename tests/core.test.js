import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun, drawHand, getCard, makeFocusCard, checkChance, applyEffects, evaluateEnding,
  billAmount, payBill, resolveBillShortfall, applyNaming, updateRouteStage, getTopRoute,
  draftRewards, takeReward, startNewDay, dueBillIndex, clamp,
} from '../src/core/game.js';
import { createDialogueState, dialogueAction, resolveDialogue } from '../src/core/dialogue.js';
import { viralResult, ledgerRound, ledgerResult, examResult, interrogationResult, deliveryResult } from '../src/core/minigames.js';
import { scorePersonality } from '../src/core/personality.js';
import { ROUTES } from '../src/data/routes.js';
import { PERSONAS } from '../src/data/personas.js';

function fresh(persona = 'zhou') {
  return createRun(persona, `test-${persona}-42`, 'standard');
}

test('createRun: every persona starts with a valid run', () => {
  for (const p of PERSONAS) {
    const run = createRun(p.id, `seed-${p.id}`, 'standard');
    assert.equal(run.personaId, p.id);
    assert.equal(run.deck.length + run.hand.length, 11);
    assert.equal(run.hand.length, 4);
    assert.equal(Object.keys(run.routes).length, 12);
    assert.equal(run.day, 1);
    assert.ok(run.stats.cash > 0);
    assert.ok(run.referralCode.length === 6);
  }
});

test('drawHand never duplicates and reshuffles discard', () => {
  const run = fresh();
  run.deck = ['s_rest', 's_apply', 's_walk', 's_budget', 's_learn'];
  run.discard = ['s_gig', 's_family', 's_video', 's_network', 's_disguise', 's_rest'];
  run.hand = [];
  drawHand(run);
  assert.equal(run.hand.length, 4);
  assert.equal(new Set(run.hand).size, 4);
  run.hand = [];
  drawHand(run);
  assert.ok(run.hand.length >= 4);
});

test('check chances stay bounded and deterministic per seed', () => {
  const run = fresh();
  const card = getCard(run, 's_apply');
  const chance = checkChance(run, card, false);
  assert.ok(chance >= 0.15 && chance <= 0.95);
  assert.ok(checkChance(run, card, true) >= chance);
  assert.equal(clamp(200, 0, 100), 100);
});

test('route thresholds 3/6/10 advance stages', () => {
  const run = fresh();
  applyEffects(run, { route: { rehire: 3 } });
  assert.equal(run.routeStage.rehire, 1);
  applyEffects(run, { route: { rehire: 3 } });
  assert.equal(run.routeStage.rehire, 2);
  applyEffects(run, { route: { rehire: 4 } });
  assert.equal(run.routeStage.rehire, 3);
  assert.equal(getTopRoute(run).id, 'rehire');
});

test('all 12 route endings can be evaluated', () => {
  for (const r of ROUTES) {
    const run = fresh();
    run.routes[r.id] = 10;
    run.routeStage[r.id] = 3;
    assert.equal(evaluateEnding(run), r.endingId, r.id);
  }
});

test('universal endings: sayit, halfway, freedom, collapse', () => {
  let run = fresh();
  run.flags.toldFamily = true;
  run.stats.trust = 80;
  run.routeStage.rehire = 2;
  run.routes.rehire = 6;
  assert.equal(evaluateEnding(run), 'e_sayit');

  run = fresh();
  run.routeStage.rehire = 1;
  run.routes.rehire = 3;
  assert.equal(evaluateEnding(run), 'e_halfway');

  run = fresh();
  run.stats.spirit = 80;
  assert.equal(evaluateEnding(run), 'e_freedom');

  run = fresh();
  run.stats.cash = -25000;
  assert.equal(evaluateEnding(run), 'e_collapse');
});

test('fake route is locked by telling the family', () => {
  const run = fresh();
  run.routes.fake = 10;
  run.routeStage.fake = 3;
  run.flags.toldFamily = true;
  run.stats.trust = 80;
  assert.notEqual(evaluateEnding(run), 'e_fake');
});

test('bills: amount, payment, and shortfall options', () => {
  let run = fresh();
  run.day = 7;
  assert.equal(billAmount(run), 12000);
  assert.equal(dueBillIndex(run), 0);
  const paid = payBill(run);
  assert.equal(paid.paid, true);
  assert.equal(run.billsPaid[0], true);
  assert.equal(run.stats.cash, 74000);

  run = fresh();
  run.day = 7;
  run.stats.cash = 1000;
  const due = payBill(run);
  assert.equal(due.paid, false);
  assert.equal(due.shortfall, 11000);
  resolveBillShortfall(run, 'min', 0);
  assert.equal(run.billsPaid[0], true);
  assert.ok(run.debt > 0);
});

test('story difficulty reduces bills', () => {
  const run = createRun('zhou', 'story', 'story');
  run.day = 7;
  assert.equal(billAmount(run), 8400);
});

test('naming: euphemism keeps suspicion; direct family truth disarms it', () => {
  let run = fresh();
  run.day = 3;
  applyNaming(run, 'euphemism');
  assert.equal(run.flags.saidTheWord, false);
  assert.ok(run.stats.suspicion > 0);

  run = fresh();
  run.day = 18;
  run.stats.suspicion = 50;
  applyNaming(run, 'direct');
  assert.equal(run.flags.saidTheWord, true);
  assert.equal(run.flags.toldFamily, true);
  assert.equal(run.stats.suspicion, 0);
  assert.ok(run.deck.includes('family_support'));
});

test('focus card and rewards work', () => {
  const run = fresh();
  run.focusRoute = 'stall';
  const focus = makeFocusCard(run, 'stall');
  assert.equal(focus.kind, 'route');
  assert.equal(focus.routeId, 'stall');
  assert.equal(focus.cost, 1);
  const opts = draftRewards(run, 3);
  assert.ok(opts.length >= 1);
  takeReward(run, opts[0]);
});

test('dialogue: listen/ask/say update meters and resolve applies effects', () => {
  const run = fresh();
  const ds = createDialogueState('d_route_rehire', run);
  dialogueAction(ds, run, 'listen');
  assert.equal(ds.needRevealed, true);
  dialogueAction(ds, run, 'ask', { index: 0 });
  dialogueAction(ds, run, 'say', { index: 0 });
  ds.outcome = 'success';
  resolveDialogue(ds, run);
  assert.ok(run.routes.rehire >= 2);
  assert.ok(run.usedRouteDialogues.includes('d_route_rehire'));
});

test('minigames: viral, ledger, exam, interrogation, delivery produce effects', () => {
  let run = fresh();
  const viral = viralResult({ topicId: 'layoff', titleId: 't1', coverId: 'c3', timeId: 'n' }, run, 'content');
  assert.ok(viral.score >= 0);
  assert.ok(run.routes.content >= 1);

  run = fresh();
  const r1 = ledgerRound(run, 0, 12, 24);
  const r2 = ledgerRound(run, 1, 12, 24);
  const r3 = ledgerRound(run, 2, 12, 24);
  const ledger = ledgerResult(run, [r1, r2, r3], 'stall');
  assert.equal(ledger.totalSold >= 0, true);
  assert.ok(run.routes.stall >= 1);

  run = fresh();
  const exam = examResult(run, { xingce: 3, shenlun: 2, interview: 2 });
  assert.ok(exam.score > 0);
  assert.ok(run.routes.exam >= 1);

  run = fresh();
  const itr = interrogationResult(run, [0, 0, 0]);
  assert.ok(['信了', '半信半疑', '露馅'].includes(itr.tier));

  run = fresh();
  const delivery = deliveryResult(run, [
    { pay: 8 }, { pay: 12 }, { pay: 9 }, { pay: 15 }, { pay: 7 },
  ]);
  assert.equal(delivery.count, 5);
  assert.ok(run.routes.gig >= 2);
});

test('new day resets energy and keeps the deck usable', () => {
  const run = fresh();
  run.energy = 0;
  run.day = 2;
  startNewDay(run);
  assert.equal(run.day, 3);
  assert.ok(run.energy > 0);
  assert.ok(run.hand.length === 4);
});

test('personality scoring returns one of six archetypes', () => {
  const res = scorePersonality([0, 0, 0, 0, 0, 0]);
  assert.ok(res.result && res.result.id);
  assert.ok(res.scores[res.result.id] >= 0);
});

test('referral grants a one-time cash/clue bonus', () => {
  const run = createRun('lin', 'ref-test', 'standard', 'ABC123');
  assert.equal(run.stats.cash, 18000 + 500);
  assert.ok(run.clues.includes('witness'));
  assert.equal(run.flags.referral, true);
  assert.equal(run.referredBy, 'ABC123');
});
