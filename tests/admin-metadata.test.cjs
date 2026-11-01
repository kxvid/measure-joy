/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')

for (const [name, method, payload] of [
  ['generate-copy', 'POST', { generateAll: true }],
  ['generate-copy', 'PUT', { productId: 'prod_camera', copy: { description: 'Updated copy', longDescription: 'Long copy', features: [], sellingPoints: [] } }],
  ['rationalizer', 'POST', { productId: 'prod_camera', force: true }],
]) {
  test(`${name} ${method} does not overwrite concurrent inventory from a stale product snapshot`, async () => {
    const stale = { id: 'prod_camera', name: 'Canon camera', description: 'Old copy', images: [], metadata: { stockCount: '1', inStock: 'true', commerce_operation: 'old-operation', brand: 'Canon' } }
    const current = { stockCount: '0', inStock: 'false', commerce_operation: 'new-operation', brand: 'Canon' }
    const writes = []
    const stripe = { products: {
      list: async () => ({ data: [stale] }), retrieve: async () => stale,
      update: async (_, data) => { writes.push(data); Object.assign(current, data.metadata) },
    } }
    const copy = { description: 'Updated copy', longDescription: 'Long copy', features: [], sellingPoints: [], brand: 'Canon', year: '2005', category: 'camera', condition: 'Good' }
    const load = makeLoader({
      '@/app/actions/auth-admin': { getAdminStatus: async () => ({ isSignedIn: true, isAdmin: true }) },
      '@/lib/stripe': { stripe }, stripe: class { constructor() { return stripe } },
      '@/lib/ai-copywriter': { generateProductCopy: async () => copy },
      '@google/generative-ai': { GoogleGenerativeAI: class { getGenerativeModel() { return { generateContent: async () => ({ response: { text: () => JSON.stringify(copy) } }) } } } },
      'next/server': { NextResponse: Response },
    }, { GOOGLE_AI_API_KEY: 'mock', STRIPE_SECRET_KEY: 'mock' })
    const response = await load(`app/api/admin/${name}/route.ts`)[method](new Request('https://measurejoy.org/api/admin/operation', { method, headers: { origin: 'https://measurejoy.org', 'content-type': 'application/json' }, body: JSON.stringify(payload) }))
    assert.equal(response.status, 200)
    assert.equal(writes.length, 1)
    for (const field of ['stockCount', 'inStock', 'commerce_operation']) assert.equal(Object.hasOwn(writes[0].metadata, field), false)
    assert.equal(current.stockCount, '0'); assert.equal(current.inStock, 'false'); assert.equal(current.commerce_operation, 'new-operation')
    assert.equal(current.longDescription, 'Long copy')
  })
}
