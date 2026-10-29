/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')

test('JSON-LD serialization cannot terminate a script element and preserves data', () => {
  const { serializeJsonLd } = makeLoader()('lib/output-encoding.ts')
  const value = { name: '</script><img src=x onerror=alert(1)> & "quote"\u2028\u2029' }
  const result = serializeJsonLd(value)
  assert.equal(result.includes('<'), false)
  assert.deepEqual(JSON.parse(result), value)
})

test('order emails encode catalog names and all customer address fields as text', async () => {
  const sent = []
  const load = makeLoader({ resend: { Resend: class { emails = { send: async (body) => { sent.push(body); return { data: { id: 'email_test' }, error: null } } } } } }, { RESEND_API_KEY: 'mock' })
  const attack = '<a href="https://attacker.example">Click & pay</a>'
  await load('lib/emails.ts').sendOrderConfirmationEmail({ email: 'buyer@example.com', orderId: 'cs_test_order', items: [{ name: attack, quantity: 1, priceInCents: 500 }], totalInCents: 500, shippingAddress: Object.fromEntries(['line1','line2','city','state','postal_code','country'].map(k => [k, attack])) })
  assert.equal(sent[0].html.includes(attack), false)
  assert.equal(sent[0].html.match(/&lt;a href=&quot;https:\/\/attacker.example&quot;&gt;Click &amp; pay&lt;\/a&gt;/g)?.length, 7)
})

test('shipping and delivery email names stay text; tracking URL values cannot inject attributes', async () => {
  const sent = []
  const load = makeLoader({ resend: { Resend: class { emails = { send: async (body) => { sent.push(body); return { data: { id: 'email_test' }, error: null } } } } } }, { RESEND_API_KEY: 'mock' })
  const emails = load('lib/emails.ts')
  const payload = { email: 'buyer@example.com', orderId: 'cs_test_order', items: [{ name: '<img src=x onerror=alert(1)>', quantity: 1 }] }
  await emails.sendShippingUpdateEmail({ ...payload, carrier: 'usps', trackingNumber: '123" onclick="alert(1)&x=2' })
  await emails.sendDeliveryConfirmationEmail(payload)
  for (const item of sent) assert.equal(item.html.includes('<img src=x'), false)
  const link = sent[0].html.match(/href="(https:\/\/tools.usps.com[^\"]+)"/)[1]
  assert.equal(new URL(link).searchParams.get('tLabels'), '123" onclick="alert(1)&x=2')
})
