/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
const payload = { email: 'buyer@example.com', orderId: 'cs_test_oneorder', items: [{ name: 'Camera', quantity: 1, priceInCents: 12000 }], totalInCents: 12000, shippingAddress: null }
test('missing order email configuration does not falsely acknowledge delivery', async () => {
  const load = makeLoader({ resend: { Resend: class {} } })
  await assert.rejects(load('lib/emails.ts').sendOrderConfirmationEmail(payload))
})
test('provider rejection cannot mark an order confirmation as accepted', async () => {
  const load = makeLoader({ resend: { Resend: class { emails = { send: async () => ({ data: null, error: { message: 'sender unverified' } }) } } } }, { RESEND_API_KEY: 're_mock_only' })
  await assert.rejects(load('lib/emails.ts').sendOrderConfirmationEmail(payload))
})
test('repeated order confirmation attempts use the same provider idempotency key', async () => {
  const attempts = []
  const load = makeLoader({ resend: { Resend: class { emails = { send: async (body, options) => { attempts.push({ body, options }); return { data: { id: 'email_one' }, error: null } } } } } }, { RESEND_API_KEY: 're_mock_only' })
  await load('lib/emails.ts').sendOrderConfirmationEmail(payload)
  await load('lib/emails.ts').sendOrderConfirmationEmail(payload)
  assert.equal(attempts[0].options?.idempotencyKey, 'order-confirmation/cs_test_oneorder')
  assert.equal(attempts[1].options?.idempotencyKey, 'order-confirmation/cs_test_oneorder')
})
