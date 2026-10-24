/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
const routes = [['generate-copy','POST'], ['generate-copy','PUT'], ['rationalizer','POST'], ['preview','POST'], ['content','PUT'], ['setup-cms','POST'], ['setup-promo','POST'], ['generate-email-copy','POST']]
function harness(status = { isSignedIn: true, isAdmin: true }) {
  let sideEffects = 0
  const blocked = () => { sideEffects++; throw new Error('Provider details including secret must not be returned') }
  const load = makeLoader({
    '@/app/actions/auth-admin': { getAdminStatus: async () => status, checkAdminAccess: async () => status.isAdmin },
    '@/lib/stripe': { stripe: { products: { list: blocked, retrieve: blocked, update: blocked }, coupons: { retrieve: blocked, create: blocked } } },
    '@/lib/supabase/admin': { createAdminClient: blocked },
    '@/lib/content': { invalidateContentCache: blocked },
    '@/lib/ai-copywriter': {},
    stripe: class { products = { list: blocked, retrieve: blocked, update: blocked } },
    '@google/generative-ai': { GoogleGenerativeAI: class { getGenerativeModel() { return { generateContent: blocked } } } },
    'next/server': { NextResponse: Response }, 'next/cache': { revalidatePath: blocked },
    'next/headers': { cookies: blocked },
  }, { GOOGLE_AI_API_KEY: 'mock' })
  return { load, sideEffects: () => sideEffects }
}
function request(method, options = {}) {
  return new Request('https://measurejoy.org/api/admin/operation', { method, headers: { origin: 'https://measurejoy.org', 'content-type': 'application/json', ...options.headers }, ...(method === 'DELETE' ? {} : { body: options.body ?? '{}' }) })
}
for (const [name, method] of routes) {
  test(`${name} ${method} rejects unauthorized, cross-origin and invalid JSON before any provider work`, async () => {
    for (const status of [{ isSignedIn: false, isAdmin: false }, { isSignedIn: true, isAdmin: false }]) {
      const h = harness(status)
      assert.equal((await h.load(`app/api/admin/${name}/route.ts`)[method](request(method))).status, status.isSignedIn ? 403 : 401)
      assert.equal(h.sideEffects(), 0)
    }
    for (const [options, expected] of [
      [{ headers: { origin: 'https://other.measurejoy.org' } }, 403],
      [{ headers: { 'sec-fetch-site': 'cross-site' } }, 403],
      [{ headers: { 'content-type': 'text/plain' } }, 415],
      [{ body: '{' }, 400],
      [{ body: 'null' }, 400],
      [{ body: '[]' }, 400],
      [{ body: JSON.stringify({ data: 'x'.repeat(17000) }) }, 413],
    ]) {
      const h = harness()
      assert.equal((await h.load(`app/api/admin/${name}/route.ts`)[method](request(method, options))).status, expected)
      assert.equal(h.sideEffects(), 0)
    }
  })
}
test('draft deletion requires the same origin and does not modify cookies when rejected', async () => {
  const h = harness()
  assert.equal((await h.load('app/api/admin/preview/route.ts').DELETE(request('DELETE', { headers: { origin: 'https://other.measurejoy.org' } }))).status, 403)
  assert.equal(h.sideEffects(), 0)
})
test('admin provider failures expose a generic error', async () => {
  const h = harness()
  const response = await h.load('app/api/admin/content/route.ts').PUT(request('PUT', { body: JSON.stringify({ section: 'hero', entries: { title: 'New title' } }) }))
  assert.equal(response.status, 502)
  assert.equal((await response.text()).includes('secret'), false)
  assert.equal(h.sideEffects(), 1)
})
