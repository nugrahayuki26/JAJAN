// JAJAN POS — service worker: simpan aplikasi di cache agar jalan offline
const CACHE = "jajan-v2";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(CACHE).then(c=> c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k!==CACHE).map(k=> caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e=>{
  if(e.request.method!=="GET") return;
  // jaringan dulu (agar update terbaru masuk), cache sebagai cadangan saat offline
  e.respondWith(fetch(e.request).then(r=>{ const cp = r.clone(); caches.open(CACHE).then(c=> c.put(e.request, cp)); return r; }).catch(()=> caches.match(e.request).then(r=> r || caches.match("./index.html"))));
});
