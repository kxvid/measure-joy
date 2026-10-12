import { after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { POST as contact } from '../app/api/contact/route.ts'
import { POST as repair } from '../app/api/repairs/route.ts'
import { POST as subscribe } from '../app/api/subscribe/route.ts'

const originalFetch = globalThis.fetch
const savedEnv = { ...process.env }
let sent, writes, deliveryError, databaseError
let identity = 0
beforeEach(() => {
  process.env.RESEND_API_KEY = 're_mock_only'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://database.invalid'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  process.env.VERCEL = '1'
  delete process.env.RESEND_FROM_EMAIL
  sent = []; writes = []; deliveryError = null; databaseError = false
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url === 'https://api.resend.com/emails') {
      const request = { body: JSON.parse(init.body), headers: new Headers(init.headers) }
      sent.push(request)
      if (deliveryError === 'network') throw new TypeError('simulated connection loss')
      if (deliveryError === 'malformed') return Response.json({})
      if (deliveryError) return Response.json({ name: 'validation_error', message: 'private provider details', statusCode: deliveryError }, { status: deliveryError })
      return Response.json({ id: 'email-test-id' })
    }
    if (url.startsWith('https://database.invalid/rest/v1/')) {
      writes.push({ url, body: init.body ? JSON.parse(init.body) : null })
      if (databaseError) return Response.json({ code: 'DB_ERROR', message: 'private database details', details: null, hint: null }, { status: 400 })
      return new Response(null, { status: 201 })
    }
    throw new Error(`Unexpected outbound request blocked: ${url}`)
  }
})
after(() => { globalThis.fetch = originalFetch; process.env = savedEnv })
function contactData(overrides = {}) {
  return { name: 'Alex Camera', email: `alex${++identity}@example.com`, topic: 'Camera advice', message: 'Can you help me choose a pocket camera?', requestToken: randomUUID(), website: '', ...overrides }
}
function repairData(overrides = {}) {
  return { ...contactData(), service: 'repair', brand: 'Canon', model: 'PowerShot SD1000', issues: ['Lens stuck/jammed'], description: 'The lens will not retract after switching off.', phone: '', preferredContact: 'email', consent: true, ...overrides }
}
function request(path, body, headers = {}) {
  return new Request(`https://measurejoy.org/api/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://measurejoy.org', 'x-vercel-forwarded-for': `203.0.${Math.floor(identity / 200)}.${identity % 200 + 1}`, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
}

test('contact success means the provider accepted a message to Christian with visitor reply-to', async () => {
  const payload = contactData({ name: ' <img src=x onerror=alert(1)> ', message: 'Hello <script>alert(1)</script> & goodbye.' })
  const response = await contact(request('contact', payload))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0].body.to, ['christianvelasquez363@gmail.com'])
  assert.equal(sent[0].body.reply_to, payload.email)
  assert.match(sent[0].body.html, /&lt;script&gt;/)
  assert.doesNotMatch(sent[0].body.html, /<script>|<img/)
  assert.match(sent[0].body.text, /Hello <script>/)
})

test('a browser cannot override the fixed recipient or sender', async () => {
  const response = await contact(request('contact', contactData({ to: 'attacker@example.com', from: 'attacker@example.com' })))
  assert.equal(response.status, 200)
  assert.deepEqual(sent[0].body.to, ['christianvelasquez363@gmail.com'])
  assert.equal(sent[0].body.from, 'Measure Joy <orders@measurejoy.org>')
})

test('contact input validation rejects invalid email, missing fields, header injection and missing retry token', async () => {
  for (const bad of [{ email: 'not-email' }, { name: '' }, { topic: 'Hello\r\nBcc: bad@example.com' }, { message: '' }, { requestToken: '' }]) {
    const response = await contact(request('contact', contactData(bad)))
    assert.equal(response.status, 400)
    assert.equal((await response.json()).success, false)
  }
  assert.equal(sent.length, 0)
})

test('cross-origin and missing-origin submissions are rejected before delivery', async () => {
  for (const origin of ['https://attacker.example', 'null', '']) {
    const response = await contact(request('contact', contactData(), { origin }))
    assert.equal(response.status, 403)
  }
  assert.equal(sent.length, 0)
})

test('request parsing rejects malformed JSON, unsupported media types and oversized streaming bodies', async () => {
  assert.equal((await contact(request('contact', '{'))).status, 400)
  assert.equal((await contact(request('contact', contactData(), { 'content-type': 'text/plain' }))).status, 415)
  assert.equal((await contact(request('contact', 'x'.repeat(17000)))).status, 413)
  assert.equal((await contact(request('contact', contactData(), { 'content-length': '17000' }))).status, 413)
  assert.equal(sent.length, 0)
})

test('a populated honeypot never sends or reports a delivered message', async () => {
  const response = await contact(request('contact', contactData({ website: 'spam.invalid' })))
  assert.equal(response.status, 400)
  assert.equal((await response.json()).success, false)
  assert.equal(sent.length, 0)
})

test('missing credentials cause a clear unavailable response without outbound delivery', async () => {
  delete process.env.RESEND_API_KEY
  const response = await contact(request('contact', contactData()))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).success, false)
  assert.equal(sent.length, 0)
})

for (const failure of [422, 429, 'network', 'malformed']) {
  test(`provider failure ${failure} cannot produce contact success or disclose provider details`, async () => {
    deliveryError = failure
    const response = await contact(request('contact', contactData()))
    assert.equal(response.status, 502)
    const body = await response.json()
    assert.equal(body.success, false)
    assert.doesNotMatch(body.error, /private provider details/)
  })
}

test('retries carry a stable provider idempotency key and identical content', async () => {
  const payload = contactData()
  await contact(request('contact', payload))
  await contact(request('contact', payload))
  assert.equal(sent.length, 2)
  assert.ok(sent[0].headers.get('idempotency-key'))
  assert.equal(sent[0].headers.get('idempotency-key'), sent[1].headers.get('idempotency-key'))
  assert.deepEqual(sent[0].body, sent[1].body)
})

test('reusing a retry token for a different payload returns a conflict when the provider rejects it', async () => {
  deliveryError = 409
  const response = await contact(request('contact', contactData()))
  assert.equal(response.status, 409)
  assert.equal((await response.json()).success, false)
})

test('repeated requests from one trusted IP are rate limited across form types', async () => {
  let last
  for (let i = 0; i < 7; i++) last = await contact(request('contact', contactData(), { 'x-vercel-forwarded-for': '198.51.100.42' }))
  assert.equal(last.status, 429)
  assert.ok(Number(last.headers.get('retry-after')) > 0)
  assert.ok(sent.length <= 5)
})

test('repair delivery includes every service detail and contact preference', async () => {
  const response = await repair(request('repairs', repairData({ phone: '+1 (555) 123-4567', preferredContact: 'phone' })))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  const email = sent[0].body
  for (const detail of ['PowerShot SD1000', 'Lens stuck/jammed', 'will not retract', '+1 (555) 123-4567', 'phone']) assert.ok(email.text.includes(detail))
  assert.deepEqual(email.to, ['christianvelasquez363@gmail.com'])
})

test('repair requires consent, a valid service and a phone when phone contact is selected', async () => {
  for (const bad of [{ consent: false }, { service: 'unknown' }, { preferredContact: 'phone', phone: '' }, { issues: ['x'.repeat(200)] }]) {
    const response = await repair(request('repairs', repairData(bad)))
    assert.equal(response.status, 400)
  }
  assert.equal(sent.length, 0)
})

test('newsletter stores subscription and notifies Christian before reporting success', async () => {
  const payload = { email: `news${++identity}@example.com`, source: 'newsletter', requestToken: randomUUID() }
  const response = await subscribe(request('subscribe', payload))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  assert.equal(writes.length, 1)
  assert.equal(writes[0].body.email, payload.email)
  assert.ok(sent.some(({ body }) => body.to.includes('christianvelasquez363@gmail.com')))
})

test('newsletter database errors never claim a successful subscription or send welcome mail', async () => {
  databaseError = true
  const response = await subscribe(request('subscribe', { email: `news${++identity}@example.com`, requestToken: randomUUID() }))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).success, false)
  assert.equal(sent.length, 0)
})

test('newsletter owner delivery failure is explicit even when the subscription is already saved', async () => {
  deliveryError = 422
  const response = await subscribe(request('subscribe', { email: `news${++identity}@example.com`, requestToken: randomUUID() }))
  assert.equal(response.status, 502)
  const body = await response.json()
  assert.equal(body.success, false)
  assert.equal(body.subscriptionSaved, true)
})

const { submitReviewAction } = await import('../app/actions/reviews.ts')
function signedInUser() {
  const address = `reviewer${++identity}@example.com`
  globalThis.formTestUser = { id: `user_test_${identity}`, firstName: 'Alex', lastName: 'Camera', emailAddresses: [{ emailAddress: address }], primaryEmailAddress: { emailAddress: address } }
}

test('anonymous review submissions cannot save or notify', async () => {
  globalThis.formTestUser = null
  const result = await submitReviewAction('prod_camera', 5, 'Lovely camera', 'This camera is a joy to use.')
  assert.equal(result.success, false)
  assert.equal(writes.length, 0)
  assert.equal(sent.length, 0)
})

test('authenticated review validation rejects invalid ratings and empty content before saving', async () => {
  signedInUser()
  for (const [rating, title, content] of [[6, 'Lovely', 'A great camera to use.'], [1.5, 'Lovely', 'A great camera to use.'], [5, '', 'A great camera to use.'], [5, 'Lovely', '']]) {
    const result = await submitReviewAction('prod_camera', rating, title, content)
    assert.equal(result.success, false)
  }
  assert.equal(writes.length, 0)
  assert.equal(sent.length, 0)
})

test('a saved review sends its content to Christian with the signed-in customer as reply-to', async () => {
  signedInUser()
  const result = await submitReviewAction('prod_camera', 5, 'Lovely <b>camera</b>', 'This camera is a joy to use.')
  assert.equal(result.success, true)
  assert.equal(result.notificationDelivered, true)
  assert.equal(writes[0].body.rating, 5)
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0].body.to, ['christianvelasquez363@gmail.com'])
  assert.equal(sent[0].body.reply_to, globalThis.formTestUser.primaryEmailAddress.emailAddress)
  assert.match(sent[0].body.html, /&lt;b&gt;camera&lt;\/b&gt;/)
})

test('a review delivery failure keeps the saved review successful and explicitly warns about notification', async (context) => {
  context.mock.method(console, 'error', () => {})
  signedInUser()
  deliveryError = 422
  const result = await submitReviewAction('prod_camera', 5, 'Lovely camera', 'This camera is a joy to use.')
  assert.equal(result.success, true)
  assert.equal(result.notificationDelivered, false)
  assert.match(result.warning, /saved/i)
  assert.equal(writes.filter(({url}) => url.includes('/reviews')).length, 1)
})

test('a review database error never sends mail or leaks database details', async () => {
  signedInUser()
  databaseError = true
  const result = await submitReviewAction('prod_camera', 5, 'Lovely camera', 'This camera is a joy to use.')
  assert.equal(result.success, false)
  assert.doesNotMatch(result.error, /private database details/)
  assert.equal(sent.length, 0)
})

test('per-email throttling still applies when a client rotates trusted addresses', async () => {
  const address = `repeated${++identity}@example.com`
  let last
  for (let i = 0; i < 7; i++) last = await contact(request('contact', contactData({ email: address })))
  assert.equal(last.status, 429)
  assert.ok(sent.length <= 5)
})

test('configured preview origins are accepted while cross-site fetches are rejected', async () => {
  process.env.VERCEL_URL = 'measurejoy-preview.vercel.app'
  const valid = await contact(request('contact', contactData(), { origin: 'https://measurejoy-preview.vercel.app', 'sec-fetch-site': 'same-origin' }))
  assert.equal(valid.status, 200)
  const blocked = await contact(request('contact', contactData(), { 'sec-fetch-site': 'cross-site' }))
  assert.equal(blocked.status, 403)
  delete process.env.VERCEL_URL
})

test('repair provider failures cannot produce a successful inquiry', async () => {
  deliveryError = 422
  const response = await repair(request('repairs', repairData()))
  assert.equal(response.status, 502)
  assert.equal((await response.json()).success, false)
})

test('newsletter rejects spam fields and invalid addresses before storing anything', async () => {
  for (const body of [{ email: 'not-email' }, { email: 'bot@example.com', website: 'spam.invalid' }, { email: 'new@example.com', source: 'untrusted' }]) {
    const response = await subscribe(request('subscribe', body, { 'x-vercel-forwarded-for': `192.0.2.${++identity % 200 + 1}` }))
    assert.equal(response.status, 400)
  }
  assert.equal(writes.length, 0)
  assert.equal(sent.length, 0)
})

test('legacy newsletter clients get a stable delivery key for duplicate-safe retries', async () => {
  const body = { email: `legacy${++identity}@example.com` }
  const first = await subscribe(request('subscribe', body))
  const second = await subscribe(request('subscribe', body))
  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal(sent[0].headers.get('idempotency-key'), sent[2].headers.get('idempotency-key'))
})


test('a cache refresh failure cannot invite another insert after a review is saved', async () => {
  signedInUser()
  globalThis.formTestCacheFailure = true
  try {
    const result = await submitReviewAction('prod_camera', 5, 'Lovely camera', 'This camera is a joy to use.')
    assert.equal(result.success, true)
    assert.equal(result.notificationDelivered, true)
  } finally { globalThis.formTestCacheFailure = false }
})

const { getWishlist } = await import('../app/actions/wishlist.ts')
test('a failed account wishlist read reports failure instead of an empty saved list', async (context) => {
  signedInUser()
  databaseError = true
  context.mock.method(console, 'error', () => {})
  await assert.rejects(getWishlist(), /wishlist/i)
})
