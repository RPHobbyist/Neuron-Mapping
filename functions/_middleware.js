export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 1. Block sensitive directories and files
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

  // 2. Block directory listings (paths ending in / inside asset folders)
  const assetFolders = ['/assets/', '/images/', '/css/', '/js/', '/public/'];
  if (path.endsWith('/') && assetFolders.some(f => path.startsWith(f))) {
    return new Response('Not Found', { status: 404 });
  }

  // 3. Process the request
  const response = await context.next();
  const newHeaders = new Headers(response.headers);

  // 4. Strip dashboard-injected CORS headers if any to ensure strictness
  newHeaders.delete('Access-Control-Allow-Origin');
  newHeaders.delete('access-control-allow-origin');

  // 5. Apply Security Headers (Sync with _headers)
  newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  newHeaders.set('Content-Security-Policy', "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self' 'sha256-uyHSLTF3+0mQXC7qJNwtcNvjw/F8Vq8xUYQ7jabjbpc=' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; require-trusted-types-for 'script';");
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 6. Turn the SPA fallback's blanket 200 into an honest 404 for unknown routes.
  // public/_redirects rewrites every unmatched path to /index.html so client-side
  // routing works, but Cloudflare Pages doesn't support a 404 status on that rewrite
  // rule (only 200/301/302/303/307/308 are valid there) — so it always reports 200,
  // even for dead links. Keep this list in sync with the <Route> paths in src/App.tsx.
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
