export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 1. Block sensitive directories and files
  const blockedPaths = [
    '/.git',
    '/.github',
    '/.vscode',
    '/.env',
    '/package.json',
    '/package-lock.json',
    '/tsconfig.json',
    '/vite.config.ts'
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
  newHeaders.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: *; connect-src 'self' *; frame-ancestors 'self'; require-trusted-types-for 'script';"
  );
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
