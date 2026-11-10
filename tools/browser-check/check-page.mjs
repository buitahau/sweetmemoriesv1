#!/usr/bin/env node
// Opens a URL in a fresh headless Chrome profile and prints one JSON report.
// Usage: node tools/browser-check/check-page.mjs <url> [--expect-title <text>] [--expect-lang <code>]
// Exit 0 if every expectation holds, 1 if one fails, 2 on bad usage or no browser.
// Checks (web-skeleton E2E-1/E2E-2, dev-deploy-verification E2E-8): rendered title, html lang,
// number of h1 and whether the first is non-empty, cookies for the origin, requests to other
// origins, failed requests, console errors, uncaught page errors.
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const url = args[0]
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
if (!url || !/^https?:\/\//.test(url)) {
  console.error('usage: check-page.mjs <http(s)-url> [--expect-title <text>] [--expect-lang <code>]')
  process.exit(2)
}
const expectTitle = opt('--expect-title') ?? 'SweetMemories'
const expectLang = opt('--expect-lang') ?? 'en'
const origin = new URL(url).origin

let browser
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true })
} catch (e) {
  console.error('cannot launch Chrome (install google-chrome, or run: npx playwright-core install chromium and drop channel):', e.message.split('\n')[0])
  process.exit(2)
}
const context = await browser.newContext()
const page = await context.newPage()
const requests = []
const failed = []
const consoleErrors = []
const pageErrors = []
page.on('request', (r) => requests.push(r.url()))
page.on('requestfailed', (r) => failed.push(r.url()))
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
page.on('pageerror', (e) => pageErrors.push(e.message))

const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
const dom = await page.evaluate(() => ({
  title: document.title,
  lang: document.documentElement.lang,
  h1Count: document.querySelectorAll('h1').length,
  h1NonEmpty: (document.querySelector('h1')?.textContent ?? '').trim().length > 0,
  h1Text: (document.querySelector('h1')?.textContent ?? '').trim(),
}))
const cookies = await context.cookies()
const otherOrigin = requests.filter((u) => !u.startsWith(origin + '/') && u !== origin && !u.startsWith('data:'))
await browser.close()

const checks = {
  status200: response?.status() === 200,
  title: dom.title === expectTitle,
  lang: dom.lang === expectLang,
  oneH1: dom.h1Count === 1,
  h1NonEmpty: dom.h1NonEmpty,
  noCookies: cookies.length === 0,
  sameOriginOnly: otherOrigin.length === 0,
  noFailedRequests: failed.length === 0,
  noConsoleErrors: consoleErrors.length === 0 && pageErrors.length === 0,
}
const ok = Object.values(checks).every(Boolean)
console.log(JSON.stringify({
  url, ok, checks, dom,
  cookieNames: cookies.map((c) => c.name),
  otherOriginRequests: otherOrigin,
  failedRequests: failed,
  consoleErrors, pageErrors,
  requestCount: requests.length,
}, null, 2))
process.exit(ok ? 0 : 1)
