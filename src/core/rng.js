// mulberry32：狀態只有一個 32 位元整數，可以直接存進存檔
export function createRng(state) {
  let s = state >>> 0;

  function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: list => list[Math.floor(next() * list.length)],
    get state() {
      return s;
    },
  };
}

export function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
