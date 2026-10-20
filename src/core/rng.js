export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let state = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  if (state === 0) state = 0x9e3779b9;
  return {
    get state() { return state >>> 0; },
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    weighted(items, weightFn = (x) => x.weight || 1) {
      const total = items.reduce((s, x) => s + weightFn(x), 0);
      let r = this.next() * total;
      for (const item of items) {
        r -= weightFn(item);
        if (r <= 0) return item;
      }
      return items[items.length - 1];
    },
  };
}

export function seededRandom(seed, index = 0) {
  const r = createRng(seed + index * 7919);
  return r.next();
}
