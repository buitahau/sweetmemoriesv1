import { createAuthClient } from 'better-auth/react'

/** Better Auth React client. Same-origin, so no baseURL is needed. */
export const authClient = createAuthClient()
