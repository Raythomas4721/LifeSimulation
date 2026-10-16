// 更新 sw.js 的快取清單與版本號（DESIGN.md §14.5）：node tools/update-sw.js
// 版本號是所有檔案內容的雜湊，內容沒變就不會變，發版前跑一次即可
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['index.html', 'manifest.webmanifest', 'styles', 'src', 'fonts', 'icons'];
const SKIP = /\.(txt|md)$/; // 授權文字不用快取

const walk = path => {
  try {
    return readdirSync(path, { withFileTypes: true }).flatMap(d => walk(join(path, d.name)));
  } catch {
    return [path.replaceAll('\\', '/')];
  }
};

const files = ROOTS.flatMap(walk).filter(f => !SKIP.test(f)).sort();
const hash = createHash('sha256');
// 文字檔先統一換行，Windows 的 CRLF 才不會讓版本號和 GitHub 上的不同
const content = f => (/\.(png|woff2)$/.test(f) ? readFileSync(f) : readFileSync(f, 'utf8').replaceAll('\r\n', '\n'));
for (const f of files) hash.update(f).update(content(f));
const version = hash.digest('hex').slice(0, 8);
const assets = ['./', ...files];

const sw = readFileSync('sw.js', 'utf8');
const block = `// <generated>\nconst VERSION = '${version}';\nconst ASSETS = [\n${assets.map(a => `  '${a}',`).join('\n')}\n];\n// </generated>`;
const next = sw.replace(/\/\/ <generated>[\s\S]*?\/\/ <\/generated>/, block);
writeFileSync('sw.js', next);
console.log(`sw.js：${assets.length} 個檔案，版本 ${version}${next === sw ? '（沒有變化）' : ''}`);
