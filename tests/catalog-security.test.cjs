/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')

test('search and category variants share a fixed bounded server catalog cache and coalesce misses', async () => {
  let lists = 0, registered
  const stripeProduct = { id: 'prod_camera', name: 'Canon camera', description: '', metadata: { category: 'camera' }, images: [], active: true, created: 1, default_price: { active: true, type: 'one_time', currency: 'usd', unit_amount: 100 } }
  const load = makeLoader({
    stripe: class { products = { list: async () => { lists++; await new Promise(resolve => setTimeout(resolve, 10)); return { data: [stripeProduct], has_more: false } } } },
    'next/cache': { unstable_cache(fn, key, options) { if (key[0] === "stripe-active-catalog-v1") registered = { key, options }; let value; return async (...args) => { assert.equal(args.length, 0); if (!value) value = await fn(); return value } } },
  }, { STRIPE_SECRET_KEY: 'mock' })
  const catalog = load('lib/stripe-products.ts')
  const results = await Promise.all([catalog.getStripeProducts(), catalog.searchStripeProducts('Canon'), catalog.getStripeProducts({ category: 'camera' })])
  assert.equal(results.every(items => items.length === 1), true)
  assert.equal(lists, 1)
  await catalog.searchStripeProducts('unrelated')
  assert.equal(lists, 1)
  assert.equal(registered.key[0], 'stripe-active-catalog-v1')
  assert.equal(registered.options.revalidate, 60)
})

function routeHarness(quota = async () => ({ allowed: true, retryAfter: 0 })) {
  let catalogs = 0, products = 0, budgets = 0
  const load = makeLoader({
    '@/lib/stripe-products': { getStripeProducts: async () => { catalogs++; return [] }, searchStripeProducts: async () => { catalogs++; return [] }, getStripeProductById: async () => { products++; return { id: 'prod_camera' } } },
    '@/lib/rate-limit': { consumeRateLimit: async (...args) => { budgets++; return quota(...args) } },
    'next/server': { NextResponse: Response },
  }, { VERCEL: '1' })
  return { GET: load('app/api/products/route.ts').GET, counts: () => ({ catalogs, products, budgets }) }
}

test('fresh is unable to disable caching on a full public catalog request', async () => {
  const h = routeHarness()
  const response = await h.GET(new Request('https://measurejoy.org/api/products?fresh=true'))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('cache-control'), /s-maxage=60/)
})

test('malformed IDs, filters and oversized searches never reach Stripe or the quota database', async () => {
  const h = routeHarness()
  for (const query of ['id=../customers', 'id=', 'category=unknown', `search=${'x'.repeat(121)}`, 'search=%00']) {
    assert.equal((await h.GET(new Request(`https://measurejoy.org/api/products?${query}`))).status, 400)
  }
  assert.deepEqual(h.counts(), { catalogs: 0, products: 0, budgets: 0 })
})

test('catalog throttling is independent of query and untrusted forwarded-for headers', async () => {
  const identities = []
  const h = routeHarness(async (identity, maximum, window) => { identities.push(identity); assert.equal(maximum, 120); assert.equal(window, 60); return { allowed: false, retryAfter: 40 } })
  for (const query of ['fresh=true', 'search=camera', 'id=prod_camera']) {
    const response = await h.GET(new Request(`https://measurejoy.org/api/products?${query}`, { headers: { 'x-forwarded-for': 'attacker-controlled', 'x-vercel-forwarded-for': '192.0.2.1' } }))
    assert.equal(response.status, 429)
    assert.equal(response.headers.get('retry-after'), '40')
  }
  assert.deepEqual(identities, ['catalog:192.0.2.1', 'catalog:192.0.2.1', 'catalog:192.0.2.1'])
  assert.equal(h.counts().catalogs + h.counts().products, 0)
})

test('quota outages fail closed and do not expose infrastructure error details', async () => {
  const h = routeHarness(async () => { throw new Error('internal provider secret') })
  const response = await h.GET(new Request('https://measurejoy.org/api/products?id=prod_camera'))
  assert.equal(response.status, 503)
  assert.equal((await response.text()).includes('secret'), false)
  assert.equal(h.counts().products, 0)
})
