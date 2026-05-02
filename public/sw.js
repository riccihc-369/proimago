const CACHE_NAME = 'proimago-cache-v0.1.9'
const ASSETS = ['/site.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirst(event.request))
    return
  }

  event.respondWith(cacheFirst(event.request))
})

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.headers.get('accept')?.includes('text/html')
  )
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    cacheResponse(request, response)
    return response
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    return caches.match('/')
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)
  cacheResponse(request, response)
  return response
}

function cacheResponse(request, response) {
  if (!response.ok || request.url.startsWith('chrome-extension://')) {
    return
  }

  caches.open(CACHE_NAME).then((cache) => {
    cache.put(request, response.clone())
  })
}
