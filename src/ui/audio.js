let ctx = null;
let master = null;
let bgmTimer = null;
let currentMood = null;
let muted = false;
let unlocked = false;
let pendingMood = null;

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.16;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(v) {
  muted = !!v;
  if (master) master.gain.value = muted ? 0 : 0.16;
}

export function isMuted() { return muted; }

export function unlockAudio() {
  unlocked = true;
  ensure();
  if (pendingMood) { const m = pendingMood; pendingMood = null; startBgm(m); }
}

function tone(freq, duration = 0.08, type = 'square', gain = 0.18, delay = 0) {
  if (!unlocked) return;
  const c = ensure();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + delay);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + delay + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
  o.connect(g);
  g.connect(master);
  o.start(c.currentTime + delay);
  o.stop(c.currentTime + delay + duration + 0.02);
}

export function sfx(name = 'click') {
  if (muted) return;
  if (name === 'click') tone(420, 0.045, 'square', 0.12);
  else if (name === 'card') { tone(330, 0.05, 'triangle', 0.12); tone(440, 0.06, 'triangle', 0.1, 0.04); }
  else if (name === 'success') { tone(520, 0.08, 'square', 0.12); tone(660, 0.1, 'square', 0.12, 0.07); tone(880, 0.14, 'triangle', 0.12, 0.15); }
  else if (name === 'fail') { tone(220, 0.12, 'sawtooth', 0.1); tone(160, 0.16, 'sawtooth', 0.08, 0.1); }
  else if (name === 'cash') { tone(880, 0.05, 'square', 0.1); tone(1200, 0.08, 'square', 0.1, 0.05); }
  else if (name === 'alarm') { tone(740, 0.1, 'square', 0.1); tone(600, 0.1, 'square', 0.1, 0.13); }
  else if (name === 'page') { tone(280, 0.04, 'triangle', 0.08); }
  else if (name === 'heart') { tone(520, 0.09, 'sine', 0.1); tone(780, 0.12, 'sine', 0.08, 0.2); }
}

const MOODS = {
  title: [196, 246, 294, 246, 220, 262, 330, 262],
  day: [330, 392, 440, 392, 330, 294, 262, 294],
  night: [220, 262, 330, 294, 220, 196, 175, 196],
};

export function startBgm(mood = 'day') {
  if (currentMood === mood) return;
  currentMood = mood;
  if (!unlocked) { pendingMood = mood; return; }
  stopBgm(false);
  if (muted) return;
  const c = ensure();
  if (!c) return;
  let i = 0;
  const seq = MOODS[mood] || MOODS.day;
  bgmTimer = setInterval(() => {
    if (muted || !ctx) return;
    const f = seq[i % seq.length];
    tone(f, 0.22, 'triangle', 0.035);
    if (i % 4 === 0) tone(f / 2, 0.35, 'sine', 0.03);
    i++;
  }, 520);
}

export function stopBgm(reset = true) {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
  if (reset) currentMood = null;
}
