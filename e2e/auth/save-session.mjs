#!/usr/bin/env node
// One-time manual sign-in for signed-in specs. Opens a visible Chrome, you sign in yourself
// (Google, 2FA on your phone, ...), then the browser state is saved to e2e/.auth/<role>.json.
// Specs reuse it with test.use({ storageState: sessionFile(role) }), so they never touch Google.
//
// Usage: npm --prefix e2e run auth:save -- <start-url> [--role user|admin] [--until <url-substring>] [--out <file>] [--timeout <seconds>]
//   --role       which role's session this is (default user); saved to e2e/.auth/<role>.json
//   <start-url>  page to open first, e.g. $DEV_WEB_URL/ (or the sign-in page)
//   --until      finish automatically once the page URL contains this text (e.g. /dashboard);
//                without it, press Enter in this terminal when you are signed in
//   --out        overrides the default e2e/.auth/<role>.json (git-ignored)
//   --timeout    seconds to wait for --until, default 300
// The file holds live session cookies: treat it like a password, use a dedicated test account.
// Prints cookie names and counts only, never values. Exit 0 saved, 1 timeout/failure, 2 bad usage.
import { chromium } from '@playwright/test'
import { mkdirSync, chmodSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const startUrl = args[0]
if (!startUrl || !/^https?:\/\//.test(startUrl)) {
  console.error('usage: save-session.mjs <http(s)-start-url> [--until <url-substring>] [--out <file>] [--timeout <seconds>]')
  process.exit(2)
}
const until = opt('--until')
const timeoutS = Number(opt('--timeout') ?? 300)
if (!Number.isFinite(timeoutS) || timeoutS <= 0) {
  console.error('--timeout must be a positive number of seconds')
  process.exit(2)
}
const here = dirname(fileURLToPath(import.meta.url))
const role = opt('--role') ?? 'user'
if (!['user', 'admin'].includes(role)) {
  console.error('--role must be user or admin')
  process.exit(2)
}
const out = resolve(opt('--out') ?? resolve(here, `../.auth/${role}.json`))
const headless = process.env.SAVE_SESSION_HEADLESS === '1' // only for testing this script

let browser
try {
  browser = await chromium.launch({ channel: 'chrome', headless })
} catch (e) {
  console.error('cannot launch Chrome:', e.message.split('\n')[0])
  process.exit(1)
}
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(startUrl)
console.log(`Chrome is open at ${startUrl}. Sign in there.`)

try {
  if (until) {
    console.log(`Waiting up to ${timeoutS}s for a URL containing "${until}" ...`)
    await page.waitForURL((u) => u.toString().includes(until), { timeout: timeoutS * 1000 })
  } else {
    console.log('When you are signed in, come back here and press Enter.')
    await new Promise((res) => {
      const rl = createInterface({ input: process.stdin })
      rl.once('line', () => { rl.close(); res() })
    })
  }
} catch {
  console.error('timed out waiting for sign-in; nothing saved')
  await browser.close()
  process.exit(1)
}

mkdirSync(dirname(out), { recursive: true })
const state = await context.storageState({ path: out })
chmodSync(out, 0o600)
await browser.close()
console.log(`saved ${out}`)
console.log(`cookies: ${state.cookies.length} (${[...new Set(state.cookies.map((c) => c.name))].join(', ') || 'none'}); origins with storage: ${state.origins.length}`)
console.log(`Use it: one saved session per role; a spec opts in with test.use({ storageState: sessionFile('${role}') }) (support/session.ts), then run BASE_URL=... npm --prefix e2e test -- --grep <ticket-slug>`)
