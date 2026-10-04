const CACHE_NAME = 'petid-v1'

const PRECACHE_URLS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/petid-logo-color.png',
  '/petid-icon-color.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Network-first strategy for API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets
  if (
    event.request.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/) ||
    event.request.url.includes('fonts.googleapis.com') ||
    event.request.url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        }).catch(() => new Response('', { status: 408 }))
      })
    )
    return
  }

  // Network-first for pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
