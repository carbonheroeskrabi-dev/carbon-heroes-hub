const CACHE_NAME = 'carbon-heroes-hub-v9'; /* เปลี่ยนเลขเวอร์ชันทุกครั้งที่แก้โค้ด เพื่อบังคับล้างแคชเก่า */
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Network-first: พยายามโหลดไฟล์ล่าสุดจากเซิร์ฟเวอร์ก่อนเสมอ ใช้แคชเป็นสำรอง
   เฉพาะตอนออฟไลน์/เน็ตล่มเท่านั้น — ป้องกันปัญหาแอปค้างเวอร์ชันเก่าหลังอัปเดตไฟล์ */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;
  if (!isSameOrigin) return; /* คำขอไป Apps Script API ให้ผ่าน network ตรงเสมอ ไม่ cache ข้อมูลค้าง */
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
