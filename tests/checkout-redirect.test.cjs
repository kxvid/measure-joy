/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
const origin = 'https://www.measurejoy.org'

test('checkout redirects accept Stripe HTTPS checkout and exact same-origin session status URLs', () => {
  const { checkoutRedirectUrl } = makeLoader()('lib/checkout-redirect.ts')
  for (const url of ['https://checkout.stripe.com/c/pay/cs_live_ABC123#provider-token', `${origin}/checkout/return?session_id=cs_live_ABC123`, `${origin}/checkout/return?session_id=cs_test_1`]) {
    assert.equal(checkoutRedirectUrl(url, origin), url)
  }
  assert.equal(checkoutRedirectUrl('http://localhost:3000/checkout/return?session_id=cs_test_123', 'http://localhost:3000'), 'http://localhost:3000/checkout/return?session_id=cs_test_123')
})

test('checkout redirects reject external status, relative, protocol, credentials, port, path and script alternatives', () => {
  const { checkoutRedirectUrl } = makeLoader()('lib/checkout-redirect.ts')
  for (const url of [
    'https://evil.example/checkout/return?session_id=cs_test_1',
    'https://measurejoy.org/checkout/return?session_id=cs_test_1',
    '/checkout/return?session_id=cs_test_1', '//checkout.stripe.com/c/pay/cs_test_1',
    'javascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
    'https:checkout.stripe.com/c/pay/cs_test_1', 'http://checkout.stripe.com/c/pay/cs_test_1',
    'https://checkout.stripe.com.evil.example/c/pay/cs_test_1',
    'https://checkout.stripe.com:444/c/pay/cs_test_1', 'https://user:pass@checkout.stripe.com/c/pay/cs_test_1',
    'https://checkout.stripe.com\\@evil.example/c/pay/cs_test_1',
    'https://checkout.stripe.com\n/c/pay/cs_test_1',
    `${origin}/admin?session_id=cs_test_1`, `${origin}/checkout/return/extra?session_id=cs_test_1`,
    `${origin}/checkout/return`, `${origin}/checkout/return?session_id=`,
    `${origin}/checkout/return?session_id=javascript:alert(1)`,
    `${origin}/checkout/return?session_id=cs_test_1&next=https://evil.example`,
    `${origin}/checkout/return?session_id=cs_test_1&session_id=cs_test_2`,
    `${origin}/checkout/return?session_id=cs_test_1#unsafe`,
  ]) assert.equal(checkoutRedirectUrl(url, origin), null, url)
})
