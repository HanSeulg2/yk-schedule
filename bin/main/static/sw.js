const CACHE_NAME = 'yk-schedule-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icon.svg'
];

// 설치 시 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 시 캐시 먼저 확인 (오프라인 지원) -> Network First 로 변경 (항상 최신본 보장)
self.addEventListener('fetch', event => {
  // Firestore API 요청은 캐시하지 않고 통과
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 네트워크가 성공하면 캐시 업데이트 후 반환
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 네트워크가 실패하면(오프라인) 캐시에서 찾기
        return caches.match(event.request).then(response => {
          return response || caches.match('/index.html');
        });
      })
  );
});
