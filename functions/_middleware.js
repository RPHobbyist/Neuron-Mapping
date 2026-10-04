/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const blockedPaths = [
    '/.git',
    '/.github',
    '/.vscode',
    '/.env',
    '/env',
    '/package.json',
    '/package-lock.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/docker-compose',
    '/profiler',
    '/actuator',
    '/heapdump',
    '/configprops'
  ];

  if (blockedPaths.some(p => path.startsWith(p))) {
    return new Response('Not Found', { status: 404 });
  }

  const assetFolders = ['/assets/', '/images/', '/css/', '/js/', '/public/'];
  if (path.endsWith('/') && assetFolders.some(f => path.startsWith(f))) {
    return new Response('Not Found', { status: 404 });
  }

  const response = await context.next();
  const newHeaders = new Headers(response.headers);

  newHeaders.delete('Access-Control-Allow-Origin');
  newHeaders.delete('access-control-allow-origin');

  newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  newHeaders.set('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self' 'sha256-uyHSLTF3+0mQXC7qJNwtcNvjw/F8Vq8xUYQ7jabjbpc=' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; trusted-types node-editor-html xml-import seo-jsonld service-worker-url dompurify 'allow-duplicates'; require-trusted-types-for 'script';");
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  if (url.hostname !== 'neuron-mapping.rphobbyist.com') {
    newHeaders.set('X-Robots-Tag', 'noindex');
  }

  const knownRoutes = [
    /^\/$/,
    /^\/templates\/?$/,
    /^\/templates\/[^/]+\/?$/,
    /^\/workspace\/?$/,
  ];
  const isHtml = (newHeaders.get('content-type') || '').includes('text/html');
  const isKnownRoute = knownRoutes.some((re) => re.test(path));
  const status = isHtml && response.status === 200 && !isKnownRoute ? 404 : response.status;

  return new Response(response.body, {
    status,
    statusText: status === 404 ? 'Not Found' : response.statusText,
    headers: newHeaders,
  });
}
 