// 一度開いたら、電波がなくても動くようにするための仕組み
// 電波があるときは新しい版を取りに行き（3秒で返事がなければ保存分を使う）、ないときは保存分を使う
const CACHE = "eibunpo-1min";
const FILES = ["./", "index.html", "units/bunkei.js", "units/kankei-fukushi.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    // 端末に残った古い版をつかまないよう、毎回サーバーに新しい版がないか確かめる
    const net = fetch(e.request.url, { cache: "no-cache" }).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    if (!cached) return net;
    const timeout = new Promise(res => setTimeout(() => res(cached), 3000));
    return Promise.race([net.catch(() => cached), timeout]);
  })());
});
