import { PERSONALITY_QUESTIONS, PERSONALITY_RESULTS } from '../data/meta.js';

export function scorePersonality(answers = []) {
  const scores = Object.fromEntries(PERSONALITY_RESULTS.map((r) => [r.id, 0]));
  answers.forEach((optIndex, qIndex) => {
    const opt = PERSONALITY_QUESTIONS[qIndex]?.options?.[optIndex];
    if (!opt) return;
    Object.entries(opt.scores || {}).forEach(([k, v]) => {
      scores[k] = (scores[k] || 0) + v;
    });
  });
  let best = PERSONALITY_RESULTS[0];
  for (const r of PERSONALITY_RESULTS) {
    if ((scores[r.id] || 0) > (scores[best.id] || 0)) best = r;
  }
  return { result: best, scores };
}

export function personalityResult(id) {
  return PERSONALITY_RESULTS.find((r) => r.id === id) || PERSONALITY_RESULTS[0];
}
