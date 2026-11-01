/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')

function stripeProduct(id, changes = {}) {
  return { id, name: 'Canon camera', description: '', metadata: { stockCount: '3', category: 'camera' }, images: [], active: true, created: 1, default_price: { active: true, type: 'one_time', currency: 'usd', unit_amount: 12000 }, ...changes }
}

function harness(items) {
  const calls = { list: [], retrieve: [] }, caches = []
  let failNextList = false
  const load = makeLoader({
    stripe: class {
      products = {
        async list(options) {
          calls.list.push(options)
          await new Promise(resolve => setTimeout(resolve, 5))
          if (failNextList) { failNextList = false; throw new Error('catalog unavailable') }
          const start = options.starting_after ? items.findIndex(item => item.id === options.starting_after) + 1 : 0
          return { data: structuredClone(items.slice(start, start + options.limit)), has_more: start + options.limit < items.length }
        },
        async retrieve(id) {
          calls.retrieve.push(id)
          const item = items.find(item => item.id === id)
          if (!item) throw Object.assign(new Error('not found'), { code: 'resource_missing' })
          return structuredClone(item)
        },
      }
    },
    'next/cache': {
      unstable_cache(fn, key, options) {
        caches.push({ key, options })
        let value
        return async (...args) => {
          assert.equal(args.length, 0, 'product IDs must not create per-ID cache keys')
          if (value === undefined) value = await fn()
          return value
        }
      },
    },
  }, { STRIPE_SECRET_KEY: 'mock' })
  return { catalog: load('lib/stripe-products.ts'), calls, caches, failNextList: () => { failNextList = true } }
}

test('public detail, metadata and sitemap reads share a paginated catalog under a varied-ID burst', async () => {
  const items = Array.from({ length: 101 }, (_, i) => stripeProduct(`prod_${i}`))
  const { catalog, calls, caches } = harness(items)
  assert.equal(typeof catalog.getCachedStripeProductById, 'function')
  const results = await Promise.all([
    ...items.map(item => catalog.getCachedStripeProductById(item.id)),
    catalog.getCachedStripeProductById('prod_0'),
    ...Array.from({ length: 100 }, (_, i) => catalog.getCachedStripeProductById(`prod_missing${i}`)),
    catalog.getAllStripeProducts(),
  ])
  assert.deepEqual(results.slice(0, 101).map(item => item.id), items.map(item => item.id))
  assert.equal(results[101].id, 'prod_0')
  assert.ok(results.slice(102, 202).every(item => item === null))
  assert.equal(results[202].length, 101)
  assert.equal(calls.list.length, 2, 'only the two catalog pages may reach Stripe')
  assert.equal(calls.retrieve.length, 0, 'public product paths must not fan out to product retrievals')
  assert.equal(calls.list[0].active, undefined, 'archived products must remain available')
  assert.equal(calls.list[1].starting_after, 'prod_99')
  await catalog.getCachedStripeProductById('prod_missingAfterBurst')
  assert.equal(calls.list.length, 2)
  const completeCache = caches.find(cache => cache.key[0].startsWith('stripe-complete-catalog'))
  assert.equal(completeCache.options.revalidate, 60)
  assert.ok(completeCache.options.tags.includes('stripe-catalog'))
})

test('cached public details retain archived products and current price while marking them unavailable', async () => {
  const { catalog, calls } = harness([stripeProduct('prod_archived', { active: false })])
  assert.equal(typeof catalog.getCachedStripeProductById, 'function')
  const item = await catalog.getCachedStripeProductById('prod_archived')
  assert.equal(item.id, 'prod_archived')
  assert.equal(item.priceInCents, 12000)
  assert.equal(item.inStock, false)
  assert.equal(calls.retrieve.length, 0)
})

test('fresh product and inventory reads observe stock changes after the public catalog was cached', async () => {
  const item = stripeProduct('prod_camera')
  const { catalog, calls } = harness([item])
  assert.equal(typeof catalog.getCachedStripeProductById, 'function')
  assert.equal((await catalog.getCachedStripeProductById(item.id)).stockCount, 3)
  item.metadata.stockCount = '0'
  assert.equal((await catalog.getCachedStripeProductById(item.id)).stockCount, 3)
  const fresh = await catalog.getStripeProductById(item.id)
  assert.equal(fresh.stockCount, 0)
  assert.equal(fresh.inStock, false)
  assert.equal(await catalog.getProductInventory(item.id), 0)
  assert.deepEqual(calls.retrieve, [item.id, item.id])
})

test('malformed public detail IDs do not reach Stripe', async () => {
  const { catalog, calls } = harness([])
  assert.equal(typeof catalog.getCachedStripeProductById, 'function')
  for (const id of ['', '../customers', 'prod_', `prod_${'x'.repeat(101)}`, 'prod_bad/path']) {
    assert.equal(await catalog.getCachedStripeProductById(id), null)
  }
  assert.equal(calls.list.length + calls.retrieve.length, 0)
})

test('failed shared catalog reads propagate the failure and allow a subsequent retry', async () => {
  const { catalog, calls, failNextList } = harness([stripeProduct('prod_camera')])
  assert.equal(typeof catalog.getCachedStripeProductById, 'function')
  failNextList()
  await assert.rejects(catalog.getCachedStripeProductById('prod_camera'), /catalog unavailable/)
  assert.equal((await catalog.getCachedStripeProductById('prod_camera')).id, 'prod_camera')
  assert.equal(calls.list.length, 2)
  assert.equal(calls.retrieve.length, 0)
})
