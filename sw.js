// service worker（DESIGN.md §14.5）：先拿快取（cache-first），沒有才上網抓，加入主畫面後可以離線玩
// 下面這段由 tools/update-sw.js 產生；改了任何遊戲檔案後重跑，版本號會跟著內容變，玩家才會拿到新版
// <generated>
const VERSION = 'de3c48c8';
const ASSETS = [
  './',
  'fonts/Cubic_11.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'index.html',
  'manifest.webmanifest',
  'src/core/advance.js',
  'src/core/calendar.js',
  'src/core/loop.js',
  'src/core/rng.js',
  'src/core/save.js',
  'src/core/state.js',
  'src/data/balance.js',
  'src/data/cast.js',
  'src/data/courses.js',
  'src/data/events-first-year.js',
  'src/data/events.js',
  'src/data/jobs.js',
  'src/data/milestones.js',
  'src/data/names.js',
  'src/data/notices.js',
  'src/data/reviews.js',
  'src/data/schedule.js',
  'src/data/seasons.js',
  'src/data/skills.js',
  'src/data/sprites.js',
  'src/data/thoughts.js',
  'src/data/tutorial.js',
  'src/main.js',
  'src/systems/annual.js',
  'src/systems/auto.js',
  'src/systems/cards.js',
  'src/systems/effects.js',
  'src/systems/events.js',
  'src/systems/finance.js',
  'src/systems/health.js',
  'src/systems/milestones.js',
  'src/systems/offline.js',
  'src/systems/review.js',
  'src/systems/schedule.js',
  'src/systems/statuses.js',
  'src/systems/study.js',
  'src/systems/work.js',
  'src/ui/app.js',
  'src/ui/cards.js',
  'src/ui/debug.js',
  'src/ui/format.js',
  'src/ui/header.js',
  'src/ui/review.js',
  'src/ui/sprite.js',
  'src/ui/start.js',
  'src/ui/tabs/career.js',
  'src/ui/tabs/home.js',
  'src/ui/tabs/menu.js',
  'src/ui/text.js',
  'src/ui/tutorial.js',
  'src/ui/upcoming.js',
  'styles/main.css',
];
// </generated>

const PREFIX = 'life-simulate-'; // github.io 底下的專案共用同一個網域，快取名稱要分開
const CACHE = PREFIX + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 網址後面的 ?debug 之類不影響檔案內容，比對快取時忽略
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true })).then(hit => hit ?? fetch(e.request)));
});
