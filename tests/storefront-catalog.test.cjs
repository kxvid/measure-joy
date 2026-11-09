/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')

test('server-rendered storefront receives the authoritative catalog, including a genuinely empty catalog', async () => {
  for (const products of [[{ id: 'prod_camera', priceInCents: 19900, inStock: true }], []]) {
    let reads = 0
    const load = makeLoader({
      '@/lib/stripe-products': { getStripeProducts: async () => { reads++; return products } },
      '@/lib/security-logging': { logServerError() { assert.fail('Successful catalog should not log an error') } },
    })
    const state = await load('lib/storefront-page-data.ts').loadStorefrontCatalog()
    assert.equal(reads, 1)
    assert.equal(state.initialProducts, products)
    assert.equal(state.initialError, undefined)
  }
})

test('an upstream failure is unavailable rather than an empty catalog and hides provider details', async () => {
  const providerError = new Error('private provider diagnostic')
  let logged
  const load = makeLoader({
    '@/lib/stripe-products': { getStripeProducts: async () => { throw providerError } },
    '@/lib/security-logging': { logServerError(message, error) { logged = { message, error } } },
  })
  const state = await load('lib/storefront-page-data.ts').loadStorefrontCatalog()
  assert.equal(state.initialProducts, undefined)
  assert.match(state.initialError, /temporarily unavailable/)
  assert.equal(JSON.stringify(state).includes('private provider'), false)
  assert.equal(logged.error, providerError)
})

test('a tested badge requires an explicit verified camera flag', () => {
  const { isTestedCamera } = makeLoader()('components/storefront/catalog-filters.ts')
  assert.equal(isTestedCamera({ name: 'Canon camera', category: 'camera', tested: true }), true)
  assert.equal(isTestedCamera({ name: 'Olympus film camera', category: 'accessory', tested: true }), true)
  for (const product of [
    { name: 'Camera case', category: 'accessory', tested: true },
    { name: 'Camera Battery for Canon A70', category: 'camera', tested: true },
    { name: 'Sony FE 50mm Prime Lens', category: 'camera', tested: true },
    { name: 'Canon camera', category: 'camera', tested: false },
    { name: 'Canon camera', category: 'camera', condition: 'Good' },
    { name: 'Canon camera', category: 'camera', condition: 'Tested' },
    { name: 'Canon camera', category: 'camera', tested: 'true' },
  ]) assert.equal(isTestedCamera(product), false)
})

test('Stripe testing metadata is explicit and does not inherit the default condition', async () => {
  const flags = [undefined, 'true', 'false', 'yes', 'TRUE']
  const load = makeLoader({
    stripe: class {
      products = {
        list: async () => ({
          data: flags.map((tested, index) => ({
            id: `prod_camera${index}`, name: 'Canon camera', description: '',
            metadata: { category: 'camera', ...(tested === undefined ? {} : { tested }) },
            images: [], active: true, created: 1,
            default_price: { active: true, type: 'one_time', currency: 'usd', unit_amount: 19900 },
          })),
          has_more: false,
        }),
      }
    },
    'next/cache': { unstable_cache: (fn) => fn },
  }, { STRIPE_SECRET_KEY: 'mock' })
  const products = await load('lib/stripe-products.ts').getStripeProducts()
  assert.deepEqual(Array.from(products, (product) => product.tested), [undefined, true, false, undefined, undefined])
})
