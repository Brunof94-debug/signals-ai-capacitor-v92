
const REPO_BASE = self.registration.scope;
const CACHE = 'btc-signals-v93';
self.addEventListener('install', (e)=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll([ REPO_BASE, REPO_BASE+'index.html', REPO_BASE+'assets/style.css', REPO_BASE+'assets/icon-192.png', REPO_BASE+'app.js', REPO_BASE+'lib/ta.js', REPO_BASE+'manifest.webmanifest' ]))); });
self.addEventListener('activate', (e)=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k))))); });
self.addEventListener('fetch', (e)=>{ e.respondWith((async()=>{ try{ return await fetch(e.request); }catch{ const r = await caches.match(e.request); return r || Response.error(); } })()); });
self.addEventListener('message', (e)=>{ const d=e.data||{}; if(d.type==='LOCAL_NOTIFY'){ self.registration.showNotification(d.title||'Sinal', { body:d.body||'', icon:REPO_BASE+'assets/icon-192.png', badge:REPO_BASE+'assets/icon-192.png' }); } });
self.addEventListener('notificationclick', (event)=>{ event.notification.close(); event.waitUntil(clients.openWindow(REPO_BASE)); });
