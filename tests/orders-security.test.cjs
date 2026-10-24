/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
function harness() {
  let userId = 'user_one', allowed = true, lists = 0, retrieves = 0, lines = 0
  const budgets = [], cacheKeys = []
  const sessions = Array.from({ length: 12 }, (_, i) => ({ id: `cs_test_one${i}`, created: 1, status: 'complete', metadata: { user_id: 'user_one' } })).concat([{ id: 'cs_test_two', created: 1, status: 'complete', metadata: { user_id: 'user_two' } }])
  const load = makeLoader({
    '@clerk/nextjs/server': { auth: async () => ({ userId }) },
    '@/lib/stripe': { stripe: { checkout: { sessions: {
      list: async ({ starting_after }) => { lists++; return starting_after ? { data: sessions.slice(8), has_more: false } : { data: sessions.slice(0, 8), has_more: true } },
      retrieve: async id => { retrieves++; return sessions.find(s => s.id === id) },
      listLineItems: async () => { lines++; return { data: [], has_more: false } },
    } } } },
    '@/lib/rate-limit': { consumeRateLimit: async (identity, maximum, window) => { budgets.push({ identity, maximum, window }); return { allowed, retryAfter: 20 } } },
    'next/cache': { unstable_cache(fn, key, options) { assert.equal(options.revalidate, 60); const cache = new Map(); return async (...args) => { const cacheKey = JSON.stringify([key, args]); cacheKeys.push(cacheKey); if (!cache.has(cacheKey)) cache.set(cacheKey, await fn(...args)); return cache.get(cacheKey) } } },
  })
  return { actions: load('app/actions/orders.ts'), setUser: id => { userId = id }, deny: () => { allowed = false }, counts: () => ({ lists, retrieves, lines }), budgets, cacheKeys }
}
test('anonymous order requests never touch Stripe, cache or the quota database', async () => {
  const h = harness(); h.setUser(null)
  assert.equal((await h.actions.getOrders()).length, 0)
  assert.equal(await h.actions.getOrderById('cs_test_one0'), null)
  assert.deepEqual(h.counts(), { lists: 0, retrieves: 0, lines: 0 })
  assert.equal(h.budgets.length, 0); assert.equal(h.cacheKeys.length, 0)
})
test('owned history is cached by authenticated user and preserves every order beyond the old first-ten cap', async () => {
  const h = harness()
  assert.equal((await h.actions.getOrders()).length, 12)
  assert.equal((await h.actions.getOrders()).length, 12)
  assert.deepEqual(h.counts(), { lists: 2, retrieves: 0, lines: 12 })
  h.setUser('user_two')
  const other = await h.actions.getOrders()
  assert.equal(other.length, 1); assert.equal(other[0].user_id, 'user_two')
  assert.equal(h.counts().lists, 4)
  assert.notEqual(h.cacheKeys[0], h.cacheKeys[2])
  assert.equal(h.budgets.every(b => b.maximum === 30 && b.window === 60), true)
  assert.equal(h.budgets[2].identity, 'order-reads:user_two')
})
test('order quota rejection blocks list scans and single-order reads before Stripe', async () => {
  const h = harness(); h.deny()
  await assert.rejects(h.actions.getOrders(), /Please wait/)
  await assert.rejects(h.actions.getOrderById('cs_test_one0'), /Please wait/)
  assert.deepEqual(h.counts(), { lists: 0, retrieves: 0, lines: 0 })
})
test('single-order reads preserve ownership checks and reject malformed IDs without a provider call', async () => {
  const h = harness()
  assert.equal(await h.actions.getOrderById('cs_test_two'), null)
  assert.equal(h.counts().lines, 0)
  assert.equal(await h.actions.getOrderById('cs_../../customers'), null)
  assert.equal(h.counts().retrieves, 1)
})
