/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')

test('checkout hides React production wrappers, provider internals and arbitrary thrown messages', () => {
  const { checkoutErrorMessage } = makeLoader()('lib/checkout-errors.ts')
  const failures = [
    new Error('Minified React error #441; visit https://react.dev/errors/441 for the full message.'),
    Object.assign(new Error('Private provider details sk_live_secret'), { digest: '3259094540' }),
    new Error('connect ECONNRESET private.database.internal'),
    { message: 'Untrusted error text', name: 'CheckoutPublicError' },
    'raw exception string', null,
  ]
  for (const failure of failures) {
    assert.equal(checkoutErrorMessage(failure), 'Checkout is temporarily unavailable. Please try again shortly.')
  }
})

test('deliberate client validation messages remain actionable', () => {
  const { CheckoutPublicError, checkoutErrorMessage } = makeLoader()('lib/checkout-errors.ts')
  for (const message of ['Your bag is empty. Choose a find before checking out.', 'This camera is sold out. Remove it from your bag.', 'We couldn’t find this camera. Explore the collection for another good find.', 'Only 2 of this find available. Please update your quantity.']) {
    assert.equal(checkoutErrorMessage(new CheckoutPublicError(message)), message)
  }
})


test('malformed successful product responses cannot display response excerpts or parser diagnostics', async () => {
  const load = makeLoader()
  const { checkoutErrorMessage } = load('lib/checkout-errors.ts')
  const { parseCatalog } = load('lib/storefront-catalog.ts')
  for (const body of ['<html>private upstream diagnostic</html>', '{"internal":"provider debug detail"}']) {
    const response = new Response(body, { status: 200 })
    let rejected
    try {
      parseCatalog([await response.json()])
    } catch (cause) {
      rejected = cause
    }
    assert.ok(rejected, 'The malformed catalog response must be rejected')
    const displayed = checkoutErrorMessage(rejected)
    assert.equal(displayed, 'Checkout is temporarily unavailable. Please try again shortly.')
    assert.doesNotMatch(displayed, /private|upstream|diagnostic|provider|debug|JSON|Unexpected/)
  }
})
