const CACHE_NAME = "sprout-bank-v43";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/app.js",
  "./src/styles.css",
  "./assets/mascot.png",
  "./assets/mascot-celebrate.png",
  "./assets/mascot-deposit.png",
  "./assets/mascot-grumpy.png",
  "./assets/mascot-friend-yellow.png",
  "./assets/mascot-friend-red.png",
  "./assets/mascot-laugh.png",
  "./assets/mascot-laugh-back.png",
  "./assets/mascot-hotdog.png",
  "./assets/mascot-princess.png",
  "./assets/mascot-space.png",
  "./assets/mascot-wizard.png",
  "./assets/storybook-background.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});





