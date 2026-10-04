/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { serviceWorkerScriptUrl } from './trustedTypes';

const SCRIPT_URL = '/sw.js';

export const registerServiceWorker = (onUpdateReady: (activate: () => void) => void): void => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;

    const container = navigator.serviceWorker;

    const offerUpdate = (worker: ServiceWorker) => onUpdateReady(() => {
        let reloading = false;
        container.addEventListener('controllerchange', () => {
            if (reloading) return;
            reloading = true;
            window.location.reload();
        });
        worker.postMessage({ type: 'SKIP_WAITING' });
    });

    container.register(serviceWorkerScriptUrl(SCRIPT_URL), { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
            if (registration.waiting && container.controller) offerUpdate(registration.waiting);
            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                installing?.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && container.controller) offerUpdate(installing);
                });
            });
        })
        .catch((error) => console.error('Service worker registration failed:', error));
};
