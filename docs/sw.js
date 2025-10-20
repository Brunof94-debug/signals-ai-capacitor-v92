
const SCOPE = '/signals-ai-capacitor-v92/';
const CACHE = 'signals-ai-v92';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    SCOPE, SCOPE+'index.html', SCOPE+'assets/style.css', SCOPE+'assets/icon-192.png',
    SCOPE+'assets/icon-512.png', SCOPE+'app.js', SCOPE+'lib/ta.js', SCOPE+'manifest.webmanifest'
  ])));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE?null:caches.delete(k))))); });
self.addEventListener('fetch', e => {
  e.respondWith((async()=>{ try { return await fetch(e.request); } catch { const r = await caches.match(e.request); return r || Response.error(); } })());
});
