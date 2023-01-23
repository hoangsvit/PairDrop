const CACHE_NAME = 'pairdrop-cache-v4';
const urlsToCache = [
    'index.html',
    './',
    'styles.css',
    'scripts/network.js',
    'scripts/ui.js',
    'scripts/util.js',
    'scripts/qrcode.js',
    'scripts/zip.min.js',
    'scripts/NoSleep.min.js',
    'scripts/theme.js',
    'sounds/blop.mp3',
    'images/favicon-96x96.png',
    'images/favicon-96x96-notification.png',
    'images/android-chrome-192x192.png',
    'images/android-chrome-192x192-maskable.png',
    'images/android-chrome-512x512.png',
    'images/android-chrome-512x512-maskable.png',
    'images/apple-touch-icon.png',
];

self.addEventListener('install', function(event) {
  // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
        })
    );
});


self.addEventListener('fetch', function(event) {
    if (event.request.method === "POST") {
        // Requests related to Web Share Target.
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const title = formData.get("title");
                const text = formData.get("text");
                const url = formData.get("url");
                const files = formData.get("files");
                let share_url = "/";
                if (files.length > 0) {
                    share_url = "/?share-target=files";
                    const db = await window.indexedDB.open('pairdrop_store');
                    const tx = db.transaction('share_target_files', 'readwrite');
                    const store = tx.objectStore('share_target_files');
                    for (let i=0; i<files.length; i++) {
                        await store.add(files[i]);
                    }
                    await tx.complete
                    db.close()
                } else if (title.length > 0 || text.length > 0 || url.length) {
                    share_url = `/?share-target=text&title=${title}&text=${text}&url=${url}`;
                }
                return Response.redirect(encodeURI(share_url), 303);
            })()
        );
    } else {
        // Regular requests not related to Web Share Target.
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                        // Cache hit - return response
                        if (response) {
                            return response;
                        }
                        return fetch(event.request);
                    }
                )
        );
    }
});


self.addEventListener('activate', function(event) {
  console.log('Updating Service Worker...')
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
          return true
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
