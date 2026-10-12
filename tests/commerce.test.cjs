/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
const plain = (value) => JSON.parse(JSON.stringify(value))
const product = (changes = {}) => ({ id: 'prod_Camera', object: 'product', active: true, name: 'Canon camera', description: 'Tested camera', images: ['https://example.com/camera.jpg'], created: 1700000000, metadata: { stockCount: '3', category: 'camera' }, default_price: { id: 'price_Camera', object: 'price', product: 'prod_Camera', active: true, type: 'one_time', currency: 'usd', unit_amount: 12000 }, ...changes })
function setup({ item = product(), pages, sessions = [], session, authUserId = "user_real" } = {}) {
  const writes = [], emails = [], updates = []
  const stripe = {
    products: { retrieve: async () => item, list: async ({ starting_after }) => pages ? pages[starting_after ? 1 : 0] : { data: [item], has_more: false }, update: async (id, data, options) => { updates.push({ id, data, options }); Object.assign(item.metadata, data.metadata); return item } },
    prices: { retrieve: async () => item.default_price },
    checkout: { sessions: {
      create: async (data) => { writes.push(data); return { url: 'https://checkout.stripe.com/session' } },
      retrieve: async () => session,
      list: async ({ starting_after }) => ({ data: starting_after ? sessions.slice(1) : sessions.slice(0, 1), has_more: !starting_after && sessions.length > 1 }),
      listLineItems: async () => ({ data: session.line_items.data, has_more: false }),
      update: async (_, data) => { Object.assign(session.metadata, data.metadata); return session },
    } },
    webhooks: { constructEvent: () => ({ id: 'evt_Test', type: 'checkout.session.completed', data: { object: session } }) },
  }
  const load = makeLoader({ stripe: class { constructor() { return stripe } }, '@/lib/stripe': { stripe }, '@clerk/nextjs/server': { auth: async () => ({ userId: authUserId }) }, 'next/headers': { headers: async () => new Headers({ origin: 'https://preview.vercel.app', host: 'preview.vercel.app', 'stripe-signature': 'mock-signature' }) }, 'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } }, '@/lib/emails': { sendOrderConfirmationEmail: async (data) => { emails.push(data) } } }, { STRIPE_SECRET_KEY: 'sk_test_mock_only', STRIPE_WEBHOOK_SECRET: 'whsec_mock_only', NEXT_PUBLIC_APP_URL: 'https://www.measurejoy.org', NODE_ENV: 'test' })
  return { load, writes, updates, emails, stripe }
}
test('checkout uses the live native Stripe price and verified user identity on the preview origin', async () => {
  const { load, writes } = setup()
  await load('app/actions/stripe.ts').startCheckoutSession([{ productId: 'prod_Camera', quantity: 2 }], 'user_forged')
  assert.deepEqual(plain(writes[0].line_items), [{ price: 'price_Camera', quantity: 2 }])
  assert.equal(writes[0].metadata.user_id, 'user_real')
  assert.equal(writes[0].metadata.items, 'prod_Camera:2')
  assert.equal(writes[0].success_url, 'https://preview.vercel.app/checkout/return?session_id={CHECKOUT_SESSION_ID}')
})
test('invalid quantities and combined quantities beyond stock cannot create payment sessions', async () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    const { load, writes } = setup()
    await assert.rejects(load('app/actions/stripe.ts').startCheckoutSession([{ productId: 'prod_Camera', quantity }]))
    assert.equal(writes.length, 0)
  }
  const { load, writes } = setup()
  await assert.rejects(load('app/actions/stripe.ts').startCheckoutSession([{ productId: 'prod_Camera', quantity: 2 }, { productId: 'prod_Camera', quantity: 2 }]))
  assert.equal(writes.length, 0)
})
test('missing prices and depleted stock cannot be purchased', async () => {
  for (const item of [product({ default_price: null }), product({ metadata: { stockCount: '0' } }), product({ default_price: { ...product().default_price, active: false } })]) {
    const { load, writes } = setup({ item })
    await assert.rejects(load('app/actions/stripe.ts').startSingleProductCheckout('prod_Camera'))
    assert.equal(writes.length, 0)
  }
})
test('catalog paginates Stripe and excludes missing prices while exposing sold-out stock truthfully', async () => {
  const second = product({ id: 'prod_Second', metadata: { stockCount: '0' } })
  const { load } = setup({ pages: [{ data: [product(), product({ id: 'prod_Missing', default_price: null })], has_more: true }, { data: [second], has_more: false }] })
  const products = await load('lib/stripe-products.ts').getStripeProducts()
  assert.deepEqual(products.map((p) => p.id).join(','), 'prod_Camera,prod_Second')
  assert.equal(products.find((p) => p.id === 'prod_Second').inStock, false)
})
test('catalog outages return an actionable 503 rather than a successful empty shop', async () => {
  const { load, stripe } = setup()
  stripe.products.list = async () => { throw new Error('Stripe unavailable') }
  const response = await load('app/api/products/route.ts').GET(new Request('https://measurejoy.org/api/products'))
  assert.equal(response.status, 503)
  assert.ok((await response.json()).error)
})
function paidSession(changes = {}) {
  return { id: 'cs_test_order', object: 'checkout.session', created: 1700000000, status: 'complete', payment_status: 'paid', amount_total: 22000, metadata: { user_id: 'user_real', items: 'prod_Camera:2' }, customer_details: { email: 'buyer@example.com' }, collected_information: { shipping_details: { name: 'Buyer', address: { line1: '1 Main St', line2: null, city: 'Covina', state: 'CA', postal_code: '91722', country: 'US' } } }, line_items: { data: [{ id: 'li_Test', quantity: 2, amount_total: 22000, amount_subtotal: 24000, description: 'Canon camera', price: { unit_amount: 12000, product: product({ id: 'prod_Synthetic' }) } }], has_more: false }, ...changes }
}
test('order history lists owned completed sessions and preserves unit prices and current shipping fields', async () => {
  const session = paidSession()
  const { load } = setup({ sessions: [paidSession({ id: 'cs_other', metadata: { user_id: 'user_other' } }), session], session })
  const orders = await load('app/actions/orders.ts').getOrders()
  assert.equal(orders.length, 1)
  assert.equal(orders[0].id, 'cs_test_order')
  assert.equal(orders[0].items[0].productId, 'prod_Camera')
  assert.equal(orders[0].items[0].priceInCents, 12000)
  assert.equal(orders[0].shipping_address.city, 'Covina')
})
test('paid legacy sessions decrement original catalog stock and repeated deliveries do not repeat fulfillment', async () => {
  const { load, updates, emails } = setup({ session: paidSession() })
  const route = load('app/api/stripe/webhook/route.ts')
  assert.equal((await route.POST(new Request('https://measurejoy.org/api/stripe/webhook', { method: 'POST', body: '{}' }))).status, 200)
  assert.equal(updates[0].id, 'prod_Camera')
  assert.equal(updates[0].data.metadata.stockCount, '1')
  assert.equal(emails[0].totalInCents, 22000)
  assert.equal(emails[0].shippingAddress.city, 'Covina')
  await route.POST(new Request('https://measurejoy.org/api/stripe/webhook', { method: 'POST', body: '{}' }))
  assert.equal(updates.length, 1)
  assert.equal(emails.length, 1)
})
test('completed but unpaid sessions do not fulfill or claim a completed payment', async () => {
  const { load, updates, emails } = setup({ session: paidSession({ payment_status: 'unpaid' }) })
  await load('app/api/stripe/webhook/route.ts').POST(new Request('https://measurejoy.org/api/stripe/webhook', { method: 'POST', body: '{}' }))
  assert.equal(updates.length, 0)
  assert.equal(emails.length, 0)
  assert.equal((await load('app/actions/stripe.ts').getCheckoutSessionStatus('cs_test_order')).status, 'pending')
})
test('a lost inventory response retries the persisted stock target without subtracting twice', async () => {
  const item = product()
  const { load, stripe } = setup({ item, session: paidSession() })
  const originalUpdate = stripe.products.update
  let loseResponse = true
  stripe.products.update = async (...args) => {
    const result = await originalUpdate(...args)
    if (loseResponse) { loseResponse = false; throw new Error('Connection lost after update') }
    return result
  }
  const route = load('app/api/stripe/webhook/route.ts')
  const request = () => new Request('https://measurejoy.org/api/stripe/webhook', { method: 'POST', body: '{}' })
  assert.equal((await route.POST(request())).status, 500)
  assert.equal(item.metadata.stockCount, '1')
  assert.equal((await route.POST(request())).status, 200)
  assert.equal(item.metadata.stockCount, '1')
})
test('unowned order IDs do not disclose customer details', async () => {
  const { load } = setup({ session: paidSession({ metadata: { user_id: 'user_other' } }) })
  assert.equal(await load('app/actions/orders.ts').getOrderById('cs_test_other'), null)
})
test('archived products retain their detail page while remaining unavailable to buy', async () => {
  const { load } = setup({ item: product({ active: false }) })
  const item = await load('lib/stripe-products.ts').getStripeProductById('prod_Camera')
  assert.equal(item.id, 'prod_Camera')
  assert.equal(item.priceInCents, 12000)
  assert.equal(item.inStock, false)
})
test('mismatched request origins are rejected before creating a checkout', () => {
  const { load } = setup()
  assert.throws(() => load('lib/commerce.ts').checkoutOrigin(new Headers({ origin: 'https://unrelated.example', host: 'measurejoy.org' })))
})

test('guest checkout uses server identity even when a client supplies a stale signed-in identity', async () => {
  const { load, writes } = setup({ authUserId: null })
  await load('app/actions/stripe.ts').startCheckoutSession([{ productId: 'prod_Camera', quantity: 1 }], 'stale_client_user')
  assert.equal(writes[0].metadata.user_id, '')
  assert.deepEqual(plain(writes[0].line_items), [{ price: 'price_Camera', quantity: 1 }])
})
