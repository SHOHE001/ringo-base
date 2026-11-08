// キホンのキ Service Worker：一度開いたらオフラインでも使えるようにする。
// 画面（HTML）はネット優先で最新を取り、失敗したらキャッシュを返す。
// JS/CSS/フォント/画像はファイル名にハッシュが付くので、キャッシュ優先。
const CACHE = 'kihon-no-ki-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['./', './manifest.webmanifest'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});

// 学習リマインド通知：GitHub Actions から届いたプッシュを通知として出す。
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'キホンのキ', {
      body: data.body || '今日の 1 レッスン、やってみよう！',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'study-reminder',
    }),
  );
});

// 通知をタップしたら、開いているアプリに戻るか、新しく開く。
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => client.url.startsWith(self.registration.scope));
      if (open) return open.focus();
      return self.clients.openWindow(self.registration.scope);
    }),
  );
});
