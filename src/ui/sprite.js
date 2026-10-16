// 把 sprites.js 的點陣圖畫出來（DESIGN.md §13.1）
// rasterize 只算像素、不碰 DOM，tools/make-icons.js 也用它產生 App 圖示
import { SPRITES, SEASON_COLORS } from '../data/sprites.js';

const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));

// overlays：[{ id, x, y }]，疊在上面的小圖（例如口罩）
export function rasterize(id, { season = 'summer', overlays = [] } = {}) {
  const sprite = SPRITES[id];
  const [w, h] = sprite.size ?? [sprite.pixels[0].length, sprite.pixels.length];
  const data = new Uint8ClampedArray(w * h * 4);
  const put = (x, y, color) => {
    if (!color || x < 0 || y < 0 || x >= w || y >= h) return;
    const c = color.startsWith('$') ? SEASON_COLORS[season][color.slice(1)] : color;
    data.set([...hex(c), 255], (y * w + x) * 4);
  };
  const drawPixels = (s, ox, oy) =>
    s.pixels.forEach((row, y) => [...row].forEach((ch, x) => put(ox + x, oy + y, s.palette[ch])));

  if (sprite.rects) {
    for (const [x, y, rw, rh, color] of sprite.rects) {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) put(x + i, y + j, color);
    }
  } else drawPixels(sprite, 0, 0);
  for (const o of overlays) drawPixels(SPRITES[o.id], o.x, o.y);
  return { w, h, data };
}

const cache = new Map();

// 同一張圖只畫一次，之後重複使用同一個網址
export function spriteUrl(id, options = {}) {
  const key = `${id}|${options.season ?? ''}|${(options.overlays ?? []).map(o => o.id).join(',')}`;
  if (!cache.has(key)) {
    const { w, h, data } = rasterize(id, options);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
    cache.set(key, { url: canvas.toDataURL(), w, h });
  }
  return cache.get(key);
}

// 寬高用 CSS 變數乘上原始尺寸，維持整數倍放大
export function spriteImg(id, options = {}, className = '') {
  const { url, w, h } = spriteUrl(id, options);
  return `<img class="px ${className}" src="${url}" style="--w:${w};--h:${h}" alt="" draggable="false">`;
}
