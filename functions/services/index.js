const QUARANTINE_MESSAGE = 'This page has been removed pending security review.\n';

const QUARANTINE_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'Content-Type': 'text/plain; charset=utf-8',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

export function onRequest() {
  return new Response(QUARANTINE_MESSAGE, {
    status: 410,
    headers: QUARANTINE_HEADERS,
  });
}
