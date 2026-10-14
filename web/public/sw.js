// Keep the installable app online-first. Never cache game responses or tokens.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
