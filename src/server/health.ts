const noStore = { 'Cache-Control': 'no-store' }

/** Liveness only. The body carries no environment or version data. */
export function healthGet(): Response {
  return Response.json({ status: 'ok' }, { headers: noStore })
}

/** Any method other than GET. */
export function healthMethodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { ...noStore, Allow: 'GET' },
  })
}
