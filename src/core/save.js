const RUN_KEY = 'pretendWork.save.v1';
const META_KEY = 'pretendWork.meta.v1';
const SETTINGS_KEY = 'pretendWork.settings.v1';

function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readJSON(key, fallback) {
  const s = storage();
  if (!s) return fallback;
  try {
    const raw = s.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadRun() {
  const run = readJSON(RUN_KEY, null);
  if (!run || run.v !== 1 || !run.personaId) return null;
  return run;
}

export function saveRun(run) {
  if (!run) return false;
  return writeJSON(RUN_KEY, run);
}

export function clearRun() {
  const s = storage();
  if (!s) return;
  try { s.removeItem(RUN_KEY); } catch {}
}

export function defaultMeta() {
  return {
    v: 1,
    runs: 0,
    endings: [],
    checklist: [],
    memories: [],
    personality: null,
    referrals: 0,
    bestDay: 0,
    titles: [],
    firstSeen: Date.now(),
    lastPlayed: null,
  };
}

export function loadMeta() {
  const meta = readJSON(META_KEY, null);
  if (!meta || meta.v !== 1) return defaultMeta();
  return { ...defaultMeta(), ...meta };
}

export function saveMeta(meta) {
  return writeJSON(META_KEY, meta);
}

export function recordRunEnd(meta, run, endingId) {
  const next = { ...meta };
  next.runs = (next.runs || 0) + 1;
  if (!next.endings.includes(endingId)) next.endings.push(endingId);
  for (const c of run.clues || []) {
    if (!next.checklist.includes(`clue:${c}`)) next.checklist.push(`clue:${c}`);
  }
  next.bestDay = Math.max(next.bestDay || 0, run.day || 0);
  next.lastPlayed = Date.now();
  return next;
}

export function unlockMetaFlags(meta, run) {
  const next = { ...meta };
  next.checklist = Array.from(new Set([...(next.checklist || []), ...Object.keys(run.flags || {}).filter((k) => run.flags[k])]));
  next.memories = Array.from(new Set([...(next.memories || []), ...(run.memories || [])]));
  return next;
}

export function loadSettings() {
  return {
    muted: false,
    reducedMotion: false,
    textSize: 'normal',
    difficulty: 'standard',
    ...readJSON(SETTINGS_KEY, {}),
  };
}

export function saveSettings(settings) {
  return writeJSON(SETTINGS_KEY, settings);
}

export function resetAll() {
  const s = storage();
  if (!s) return;
  [RUN_KEY, META_KEY, SETTINGS_KEY].forEach((k) => { try { s.removeItem(k); } catch {} });
}
