self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('echo-talk-v1').then(cache=> cache.addAll([
    './','./index.html','./style.css','./app.js','./manifest.json',
    './assets/logo.svg','./assets/icon-192.png','./assets/icon-512.png'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(resp=> resp || fetch(e.request)));
});
