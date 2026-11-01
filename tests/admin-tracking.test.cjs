/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
function harness() {
  const writes = [], notices = []
  const load = makeLoader({
    '@/app/actions/auth-admin': { checkAdminAccess: async () => true },
    '@/lib/stripe': { stripe: { checkout: { sessions: { update: async (id, data) => writes.push({ id, data }), retrieve: async () => ({ customer_details: { email: 'buyer@example.com' }, line_items: { data: [] } }) } } } },
    '@/lib/inventory': { setCoordinatedStock: async () => {} },
    '@/lib/emails': { sendShippingUpdateEmail: async data => notices.push(data) },
    'next/cache': { revalidatePath() {}, updateTag() {} },
  })
  return { action: load('app/actions/admin.ts').updateOrderTracking, writes, notices }
}
test('shipping mutations reject markup, unsupported carriers and wrong types before Stripe writes', async () => {
  const h = harness()
  for (const [tracking, carrier] of [['1234<script>', 'USPS'], ['    ', 'USPS'], ['123456', '<b>UPS</b>'], [null, 'USPS'], ['123456', null]]) {
    assert.equal((await h.action('cs_test_order', tracking, carrier)).success, false)
  }
  assert.equal(h.writes.length, 0)
  assert.equal(h.notices.length, 0)
})
test('valid shipping updates preserve configured carrier labels and trim tracking values', async () => {
  const h = harness()
  assert.equal((await h.action('cs_test_order', '  12345678  ', 'FedEx')).success, true)
  assert.equal(h.writes[0].data.metadata.carrier, 'FedEx')
  assert.equal(h.writes[0].data.metadata.tracking_number, '12345678')
  assert.equal(h.notices[0].trackingNumber, '12345678')
  assert.equal((await h.action('cs_test_order', 'ABCD1234', 'Other')).success, true)
})
