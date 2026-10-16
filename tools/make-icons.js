// 用主角點陣圖產生 App 圖示（PWA、iOS 主畫面），改了 sprites.js 的主角後重跑一次
//   node tools/make-icons.js            → 寫入 icons/
//   node tools/make-icons.js --preview 資料夾 → 把所有點陣圖放大輸出，方便檢查
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { SPRITES, SEASON_COLORS } from '../src/data/sprites.js';
import { rasterize } from '../src/ui/sprite.js';

const ICON_BG = [207, 227, 242]; // 夏天的天空色，和主角的白襯衫、藍領帶對比清楚
const ICONS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0);
  header.writeUInt32BE(h, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// 整數倍放大後置中；bg 有值時先鋪底色（iOS 圖示不能透明）
function compose(img, size, scale, bg) {
  const out = new Uint8ClampedArray(size * size * 4);
  if (bg) for (let i = 0; i < size * size; i++) out.set([...bg, 255], i * 4);
  const ox = Math.floor((size - img.w * scale) / 2);
  const oy = Math.floor((size - img.h * scale) / 2);
  for (let y = 0; y < img.h * scale; y++) {
    for (let x = 0; x < img.w * scale; x++) {
      const i = (Math.floor(y / scale) * img.w + Math.floor(x / scale)) * 4;
      if (img.data[i + 3]) out.set(img.data.subarray(i, i + 4), ((oy + y) * size + ox + x) * 4);
    }
  }
  return out;
}

const previewAt = process.argv.indexOf('--preview');
if (previewAt >= 0) {
  const dir = process.argv[previewAt + 1];
  mkdirSync(dir, { recursive: true });
  for (const id of Object.keys(SPRITES)) {
    const seasons = SPRITES[id].rects ? Object.keys(SEASON_COLORS) : [null];
    for (const season of seasons) {
      const img = rasterize(id, season ? { season } : {});
      const scale = Math.max(1, Math.floor(320 / img.w));
      const size = Math.max(img.w, img.h) * scale;
      writeFileSync(join(dir, `${id}${season ? `-${season}` : ''}.png`), png(size, size, compose(img, size, scale)));
    }
  }
  console.log(`已輸出到 ${dir}`);
} else {
  mkdirSync('icons', { recursive: true });
  const player = rasterize('player');
  for (const { file, size } of ICONS) {
    const scale = Math.floor((size * 0.8) / player.w);
    writeFileSync(join('icons', file), png(size, size, compose(player, size, scale, ICON_BG)));
    console.log(`icons/${file}（${size}×${size}，放大 ${scale} 倍）`);
  }
}
