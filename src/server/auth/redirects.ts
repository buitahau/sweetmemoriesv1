/**
 * True only for a relative app path such as `/dashboard` or `/a?b=1`.
 * Rejects absolute URLs, protocol-relative `//host`, backslash tricks and
 * control characters (open-redirect guard, ADR 0008).
 */
export function isRelativePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
    return false
  }
  if (!value.startsWith('/') || value.startsWith('//')) return false
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return false
  return true
}

const REDIRECT_FIELDS = [
  'callbackURL',
  'errorCallbackURL',
  'newUserCallbackURL',
]

/**
 * Checks a sign-in request body. Redirect fields must be relative paths, and
 * `scopes` is refused so a caller cannot widen the Google scopes.
 */
export function isSafeSignInBody(body: unknown): boolean {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return false
  }
  const record = body as Record<string, unknown>
  if ('scopes' in record) return false
  for (const field of REDIRECT_FIELDS) {
    if (field in record && !isRelativePath(record[field])) return false
  }
  return true
}
