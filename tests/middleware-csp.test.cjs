/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const { NextRequest, NextResponse } = require('next/server')
const makeLoader = require('./helpers/load-typescript.cjs')
function loadMiddleware(mode) {
  return makeLoader({
    '@clerk/nextjs/server': {
      createRouteMatcher: patterns => req => patterns.some(pattern => req.nextUrl.pathname.startsWith(pattern.replace('(.*)', ''))),
      clerkMiddleware: callback => async (req, event) => {
        if (mode === 'handshake') return NextResponse.redirect('https://clerk.measurejoy.org/v1/client/handshake')
        try { return await callback({ protect: async () => { if (mode === 'signed-out') throw new Error('protect redirect') } }, req, event) }
        catch { const response = NextResponse.redirect('https://accounts.measurejoy.org/sign-in'); response.cookies.set('clerk-test', 'retained'); return response }
      },
    },
  }, { NODE_ENV: 'production' })('middleware.ts')
}
for (const mode of ['signed-out', 'handshake']) {
  test(`CSP covers Clerk ${mode} responses without changing their auth redirect`, async () => {
    const { default: middleware } = loadMiddleware(mode)
    const response = await middleware(new NextRequest('https://www.measurejoy.org/account'), {})
    assert.equal(response.status, 307)
    assert.match(response.headers.get('location'), /^https:\/\/(accounts|clerk)\.measurejoy\.org\//)
    assert.match(response.headers.get('content-security-policy'), /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/)
    assert.equal(response.headers.get('content-security-policy').includes('unsafe-eval'), false)
    if (mode === 'signed-out') assert.match(response.headers.get('set-cookie'), /clerk-test=retained/)
  })
}
test('normal documents retain the generated request nonce, reject a client nonce and use fresh policies', async () => {
  const { default: middleware } = loadMiddleware('signed-in')
  const req = () => new NextRequest('https://www.measurejoy.org/account', { headers: { 'x-nonce': 'attackerNonce' } })
  const a = await middleware(req(), {})
  const b = await middleware(req(), {})
  const nonce = a.headers.get('x-middleware-request-x-nonce')
  assert.ok(nonce)
  assert.notEqual(nonce, 'attackerNonce')
  assert.ok(a.headers.get('content-security-policy').includes(`'nonce-${nonce}'`))
  assert.notEqual(a.headers.get('content-security-policy'), b.headers.get('content-security-policy'))
})
test('HTML and malformed image-like paths remain covered while real static suffixes are excluded', () => {
  const { config } = loadMiddleware('signed-in')
  const included = path => config.matcher.some(pattern => new RegExp(`^${pattern}$`).test(path))
  for (const path of ['/foo.html', '/image.jpg%3C/p%3E', '/image.png/unknown', '/api/products']) assert.equal(included(path), true, path)
  for (const path of ['/_next/static/chunk.js', '/brand/logo.svg', '/editorial/hero.webp']) assert.equal(included(path), false, path)
})
