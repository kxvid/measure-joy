/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
const { contentSecurityPolicy } = makeLoader()('lib/content-security-policy.ts')

test('production CSP only allows nonce-bearing or trusted descendant scripts and disallows eval', () => {
  const policy = contentSecurityPolicy('aFreshNonce123=')
  const script = policy.split('; ').find(value => value.startsWith('script-src '))
  assert.match(script, /'nonce-aFreshNonce123='/)
  assert.match(script, /'strict-dynamic'/)
  assert.equal(script.includes('unsafe-inline'), false)
  assert.equal(script.includes('unsafe-eval'), false)
  for (const origin of ['https://clerk.measurejoy.org', 'https://accounts.measurejoy.org', 'https://challenges.cloudflare.com', 'https://checkout.stripe.com', 'https://*.js.stripe.com']) assert.equal(policy.includes(origin), true)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /base-uri 'none'/)
})
test('only development permits eval and an invalid nonce cannot inject a CSP directive', () => {
  assert.match(contentSecurityPolicy('anotherNonce', true), /'unsafe-eval'/)
  assert.throws(() => contentSecurityPolicy("nonce'; script-src *;"))
})
