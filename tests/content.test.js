import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAS } from '../src/data/personas.js';
import { ROUTES, ROUTE_BY_ID } from '../src/data/routes.js';
import { ENDINGS, ENDING_BY_ID } from '../src/data/endings.js';
import { CARDS, STARTING_DECK, CARD_BY_ID } from '../src/data/cards.js';
import { CLUES } from '../src/data/clues.js';
import { DIALOGUES, MAIN_DIALOGUES, ROUTE_DIALOGUES } from '../src/data/dialogues.js';
import { EVENTS } from '../src/data/events.js';
import { PHONE_POSTS } from '../src/data/phone.js';
import { CHECKLIST, MEMORIES, PERSONALITY_QUESTIONS, NAMING_MOMENTS } from '../src/data/meta.js';

test('roster: 9 playable personas with valid cards/routes/endings', () => {
  assert.equal(PERSONAS.length, 9);
  assert.equal(new Set(PERSONAS.map((p) => p.id)).size, 9);
  for (const p of PERSONAS) {
    assert.ok(p.name && p.age && p.job);
    assert.ok(CARD_BY_ID[p.cardId], `${p.name} unique card`);
    assert.ok(p.affinity.length >= 2);
    for (const r of p.affinity) assert.ok(ROUTE_BY_ID[r], `${p.name} affinity ${r}`);
    assert.ok(ENDING_BY_ID[p.endingId]);
  }
});

test('routes: 12 routes, 36 stages, every route has dialogue + ending + engine', () => {
  assert.equal(ROUTES.length, 12);
  assert.equal(ROUTE_DIALOGUES.length, 12);
  const engines = new Set(['dialogue', 'viral', 'ledger', 'delivery', 'exam', 'interrogation']);
  for (const r of ROUTES) {
    assert.equal(r.stages.length, 3);
    assert.ok(engines.has(r.engine));
    assert.ok(r.endingId && ENDING_BY_ID[r.endingId]);
    assert.ok(r.dialogueId && DIALOGUES.some((d) => d.id === r.dialogueId));
  }
  assert.equal(ROUTES.reduce((s, r) => s + r.stages.length, 0), 36);
});

test('endings: 16 distinct endings = 12 route + 4 universal', () => {
  assert.equal(ENDINGS.length, 16);
  assert.equal(new Set(ENDINGS.map((e) => e.id)).size, 16);
  assert.equal(ENDINGS.filter((e) => e.kind === 'route').length, 12);
  assert.equal(ENDINGS.filter((e) => e.kind === 'universal').length, 4);
  for (const r of ROUTES) assert.ok(ENDINGS.some((e) => e.id === r.endingId));
});

test('cards: exactly 40 = 10 starting + 21 common + 9 persona', () => {
  assert.equal(CARDS.length, 40);
  assert.equal(STARTING_DECK.length, 10);
  assert.equal(CARDS.filter((c) => c.personaId).length, 9);
  assert.equal(new Set(CARDS.map((c) => c.id)).size, 40);
  for (const id of STARTING_DECK) assert.ok(CARD_BY_ID[id], id);
  for (const c of CARDS) {
    if (c.route) for (const rid of Object.keys(c.route)) assert.ok(ROUTE_BY_ID[rid], `${c.id} route ${rid}`);
  }
});

test('supporting content quotas', () => {
  assert.equal(CLUES.length, 16);
  assert.equal(DIALOGUES.length, 17);
  assert.equal(MAIN_DIALOGUES.length, 5);
  assert.equal(EVENTS.length, 30);
  assert.equal(PHONE_POSTS.length, 40);
  assert.equal(CHECKLIST.length, 24);
  assert.equal(MEMORIES.length, 12);
  assert.equal(PERSONALITY_QUESTIONS.length, 6);
  assert.equal(Object.keys(NAMING_MOMENTS).length, 4);
});
