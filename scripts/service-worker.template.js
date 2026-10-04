/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const BUILD_ID = '__BUILD_ID__';
const PRECACHE_URLS = __PRECACHE_URLS__;

const PRECACHE = `precache-${BUILD_ID}`;
const RUNTIME = 'runtime';
const APP_SHELL = '/workspace';
const WORKSPACE_PATH = /^\/workspace\/?$/;

const MATCH = { ignoreVary: true };

const isHashedAsset = (url) => new URL(url, self.location.origin).pathname.startsWith('/assets/');

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(PRECACHE);
        await Promise.all(PRECACHE_URLS.map(async (url) => {
            const cached = isHashedAsset(url) ? await caches.match(url, MATCH) : undefined;
            const response = cached || await fetch(url, { cache: 'reload' });
            if (!response.ok) throw new Error(`Precaching ${url} failed with status ${response.status}`);
            await cache.put(url, response.redirected ? new Response(await response.blob(), response) : response);
        }));
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names
            .filter((name) => name.startsWith('precache-') && name !== PRECACHE)
            .map((name) => caches.delete(name)));
    })());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const saveCopy = (request, response) => {
    const copy = response.clone();
    caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => {});
};

const networkFirst = async (request) => {
    try {
        const response = await fetch(request);
        if (response.ok) saveCopy(request, response);
        return response;
    } catch (error) {
        const cached = await caches.match(request, MATCH);
        if (cached) return cached;
        throw error;
    }
};

const precacheFirst = async (request) => {
    const precached = await caches.match(request, { ...MATCH, cacheName: PRECACHE });
    if (precached) return precached;
    try {
        const response = await fetch(request);
        if (response.ok && /\.(woff2|png|svg|ico|webp)$/.test(new URL(request.url).pathname)) saveCopy(request, response);
        return response;
    } catch (error) {
        const cached = await caches.match(request, MATCH);
        if (cached) return cached;
        throw error;
    }
};

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        if (WORKSPACE_PATH.test(url.pathname)) {
            event.respondWith(caches.match(APP_SHELL, { ...MATCH, cacheName: PRECACHE }).then((shell) => shell || networkFirst(request)));
        } else {
            event.respondWith(networkFirst(request));
        }
        return;
    }

    event.respondWith(precacheFirst(request));
});
