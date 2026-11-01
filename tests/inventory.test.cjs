/* eslint-disable @typescript-eslint/no-require-imports -- No network: executes real checkout/fulfillment with in-memory providers. */
const test = require('node:test')
const assert = require('node:assert/strict')
const makeLoader = require('./helpers/load-typescript.cjs')
const makeStore = require('./helpers/inventory-store.cjs')
const copy = value => JSON.parse(JSON.stringify(value))
function setup(stock = 2, options = {}) {
  const cookieValues = new Map(), cookieWrites = []
  const cookieStore = { get: name => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined, set: (name, value, options) => { cookieValues.set(name, value); cookieWrites.push({ name, value, options }) }, delete: name => cookieValues.delete(name) }
  const store = makeStore(), sessions = new Map(), sessionKeys = new Map(), stockKeys = new Map()
  const product = { id: 'prod_Camera', active: true, name: 'Camera', metadata: { stockCount: String(stock) }, default_price: { id: 'price_Camera', active: true, type: 'one_time', currency: 'usd', unit_amount: 100 } }
  let stockWrites = 0, sessionCreates = 0, loseCreate = false, loseStock = false, rejectStock = false
  const stripe = {
    products: {
      retrieve: async () => copy(product),
      update: async (_, data, options) => {
        if (rejectStock) throw new Error('Stripe request outcome unknown')
        if (stockKeys.has(options.idempotencyKey)) return copy(stockKeys.get(options.idempotencyKey))
        Object.assign(product.metadata, data.metadata); stockWrites++
        stockKeys.set(options.idempotencyKey, copy(product))
        if (loseStock) { loseStock = false; throw new Error('Lost successful stock response') }
        return copy(product)
      },
    },
    checkout: { sessions: {
      create: async (params, options) => {
        if (sessionKeys.has(options.idempotencyKey)) return copy(sessionKeys.get(options.idempotencyKey))
        const session = { id: `cs_test_${++sessionCreates}`, status: 'open', payment_status: 'unpaid', metadata: params.metadata, expires_at: params.expires_at, url: `https://checkout.stripe.com/${sessionCreates}` }
        sessions.set(session.id, session); sessionKeys.set(options.idempotencyKey, session)
        if (loseCreate) { loseCreate = false; throw new Error('Lost successful checkout response') }
        return copy(session)
      },
      retrieve: async id => copy(sessions.get(id)),
      expire: async id => { const session = sessions.get(id); session.status = 'expired'; return copy(session) },
    } },
    paymentIntents: { retrieve: async () => ({ status: 'processing' }) },
  }
  const load = makeLoader({
    '@/lib/supabase/admin': { createAdminClient: () => store.client }, '@/lib/stripe': { stripe },
    '@/lib/rate-limit': { consumeRateLimit: options.quota || (async () => ({ allowed: true, retryAfter: 0 })) },
    '@clerk/nextjs/server': { auth: async () => ({ userId: options.userId || null }) },
    'next/headers': { cookies: async () => cookieStore, headers: async () => new Headers({ host: 'measurejoy.org', origin: 'https://measurejoy.org', ...(options.headers || {}) }) },
  }, options.env || {})
  const inventory = load('lib/inventory.ts'), checkout = load('app/actions/stripe.ts').startCheckoutSession
  const buy = () => checkout([{ productId: product.id, quantity: 1 }])
  const pay = id => { const session = sessions.get(id); session.status = 'complete'; session.payment_status = 'paid'; return copy(session) }
  return { store, stripe, product, inventory, sessions, buy, pay, checkout, getStatus: load('app/actions/stripe.ts').getCheckoutSessionStatus, cookieValues, cookieWrites, options, writes: () => stockWrites, creates: () => sessionCreates,
    loseCreate: () => { loseCreate = true }, loseStock: () => { loseStock = true }, rejectStock: value => { rejectStock = value } }
}

test('two concurrent last-item checkouts create only one Stripe session', async () => {
  const h = setup(1)
  const results = await Promise.allSettled([h.buy(), h.buy()])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(h.creates(), 1)
  assert.equal(h.store.tables.commerce_checkout_items.filter(item => item.state === 'held').length, 1)
})

test('two paid sessions serialize absolute Stripe updates without losing a decrement', async () => {
  const h = setup(2)
  await Promise.all([h.buy(), h.buy()])
  const sessions = [...h.sessions.keys()].map(h.pay)
  const results = await Promise.allSettled(sessions.map(session => h.inventory.fulfillInventory(h.stripe, session, [])))
  for (let i = 0; i < results.length; i++) if (results[i].status === 'rejected') await h.inventory.fulfillInventory(h.stripe, sessions[i], [])
  assert.equal(h.product.metadata.stockCount, '0')
  assert.equal(h.writes(), 2)
  assert.ok(h.store.tables.commerce_checkouts.every(row => row.state === 'fulfilled'))
  assert.ok(h.store.tables.commerce_inventory.every(row => !row.pending_operation))
})

test('a lost checkout-create response retains its hold and recovers the same session', async () => {
  const h = setup(1)
  h.loseCreate()
  await assert.rejects(h.buy(), /Lost successful checkout/)
  assert.equal(h.store.tables.commerce_checkouts[0].session_id, null)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
  assert.equal(await h.buy(), 'https://checkout.stripe.com/1')
  assert.equal(h.creates(), 1)
  assert.equal(h.store.tables.commerce_checkouts[0].session_id, 'cs_test_1')
  h.sessions.get('cs_test_1').status = 'expired'
  const result = await h.inventory.reconcileInventory(h.stripe)
  assert.equal(result.recovered, 1)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'released')
  await h.buy()
  assert.equal(h.creates(), 2)
})

test('lost Stripe stock responses preserve the barrier and marker recovery avoids another decrement', async () => {
  const h = setup(2)
  await h.buy(); const session = h.pay('cs_test_1')
  h.loseStock()
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []), /Lost successful stock/)
  assert.ok(h.store.tables.commerce_inventory[0].pending_operation)
  assert.equal(h.product.metadata.stockCount, '1')
  await h.inventory.fulfillInventory(h.stripe, session, [])
  await h.inventory.fulfillInventory(h.stripe, session, [])
  assert.equal(h.product.metadata.stockCount, '1')
  assert.equal(h.writes(), 1)
  assert.equal(h.store.tables.commerce_checkouts[0].state, 'fulfilled')
})

test('an ambiguous operation never expires into an unlock or stale write after idempotency retention', async () => {
  const h = setup(2)
  await h.buy(); const session = h.pay('cs_test_1')
  h.rejectStock(true)
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []))
  const operation = h.store.tables.commerce_stock_operations[0]
  operation.created_at = new Date(Date.now() - 25 * 3600e3).toISOString()
  h.rejectStock(false)
  h.cookieValues.clear()
  await assert.rejects(h.buy(), /manual reconciliation/)
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []), /manual reconciliation/)
  assert.equal(h.writes(), 0)
  assert.equal(h.store.tables.commerce_inventory[0].pending_operation, operation.id)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
})

test('positive Stripe operation marker can recover a lost response after 24 hours without replay', async () => {
  const h = setup(1)
  await h.buy(); const session = h.pay('cs_test_1')
  h.loseStock()
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []))
  h.store.tables.commerce_stock_operations[0].created_at = new Date(Date.now() - 48 * 3600e3).toISOString()
  await h.inventory.fulfillInventory(h.stripe, session, [])
  assert.equal(h.writes(), 1)
  assert.equal(h.product.metadata.stockCount, '0')
})

test('delayed and retryable failed payment intents keep stock; only canceled or expired releases it', async () => {
  const h = setup(1)
  await h.buy()
  const session = h.sessions.get('cs_test_1')
  session.status = 'complete'; session.payment_intent = 'pi_test'
  assert.equal(await h.inventory.releaseExpiredCheckout(h.stripe, copy(session), true), false)
  h.stripe.paymentIntents.retrieve = async () => ({ status: 'requires_payment_method' })
  assert.equal(await h.inventory.releaseExpiredCheckout(h.stripe, copy(session), true), false)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
  h.stripe.paymentIntents.retrieve = async () => ({ status: 'canceled' })
  assert.equal(await h.inventory.releaseExpiredCheckout(h.stripe, copy(session), true), true)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'released')
})

test('an elapsed local session deadline alone cannot release stock and delayed success still fulfills', async () => {
  const h = setup(1)
  await h.buy()
  const record = h.store.tables.commerce_checkouts[0], session = h.sessions.get('cs_test_1')
  record.expires_at = new Date(0).toISOString()
  session.status = 'complete'
  await h.inventory.reconcileInventory(h.stripe)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
  await h.inventory.fulfillInventory(h.stripe, h.pay('cs_test_1'), [])
  assert.equal(h.product.metadata.stockCount, '0')
})

test('orphan session creates beyond safe retry window remain held for manual reconciliation', async () => {
  const h = setup(1)
  h.loseCreate(); await assert.rejects(h.buy())
  const row = h.store.tables.commerce_checkouts[0]
  row.created_at = new Date(Date.now() - 25 * 3600e3).toISOString()
  assert.equal((await h.inventory.reconcileInventory(h.stripe)).needsReview, 1)
  assert.equal(row.state, 'reserved')
  assert.equal(h.creates(), 1)
})

test('admin stock writes share the barrier and cannot replace stock backing an open checkout', async () => {
  const h = setup(2)
  await h.buy()
  await assert.rejects(h.inventory.setCoordinatedStock('prod_Camera', 10), /reservations/)
  assert.equal(h.writes(), 0)
  h.sessions.get('cs_test_1').status = 'expired'
  await h.inventory.reconcileInventory(h.stripe)
  await h.inventory.setCoordinatedStock('prod_Camera', 10, true)
  assert.equal(h.product.metadata.stockCount, '10')
  assert.equal(h.product.metadata.inStock, 'true')
})

test('legacy partial targets fail closed instead of overwriting later Stripe stock', async () => {
  const h = setup(2)
  const session = { id: 'cs_test_legacy', payment_status: 'paid', metadata: { items: 'prod_Camera:1', stock_target_prod_Camera: '9' } }
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []), /Legacy partial/)
  assert.equal(h.writes(), 0)
  assert.equal(h.product.metadata.stockCount, '2')
})

test('completed historical sessions import their ledger without decrementing stock again', async () => {
  const h = setup(2)
  const session = { id: 'cs_test_legacy', payment_status: 'paid', metadata: { items: 'prod_Camera:1', inventory_processed: 'true' } }
  await h.inventory.fulfillInventory(h.stripe, session, [])
  assert.equal(h.writes(), 0)
  assert.equal(h.store.tables.commerce_checkouts[0].state, 'fulfilled')
})

test('markerless paid legacy replays cannot adopt holds or decrement current stock', async () => {
  for (const useFallback of [false, true]) {
    const h = setup(9)
    const session = { id: 'cs_test_historical', payment_status: 'paid', metadata: useFallback ? {} : { items: 'prod_Camera:1' } }
    await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, useFallback ? [{ productId: 'prod_Camera', quantity: 1 }] : []), /Legacy inventory history requires manual reconciliation/)
    assert.equal(h.writes(), 0)
    assert.equal(h.product.metadata.stockCount, '9')
    assert.equal(h.store.tables.commerce_checkouts.length, 0)
    assert.equal(h.store.tables.commerce_checkout_items.length, 0)
    assert.equal(h.store.calls.length, 0)
  }
})

test('one completed legacy item does not authorize deduction of unmarked historical items', async () => {
  const h = setup(9)
  const session = { id: 'cs_test_historical_mixed', payment_status: 'paid', metadata: { items: 'prod_Camera:1,prod_Lens:1', stock_done_prod_Camera: 'true' } }
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []), /Legacy inventory history requires manual reconciliation/)
  assert.equal(h.writes(), 0)
  assert.equal(h.store.tables.commerce_checkouts.length, 0)
})

test('fully marked legacy items import as applied even after catalog products are removed', async () => {
  const h = setup(9)
  h.stripe.products.retrieve = async () => { throw new Error('Historical products need not still exist') }
  const session = { id: 'cs_test_historical_done', payment_status: 'paid', metadata: { items: 'prod_Camera:1,prod_Lens:1', stock_done_prod_Camera: 'true', stock_done_prod_Lens: 'true' } }
  await h.inventory.fulfillInventory(h.stripe, session, [])
  assert.equal(h.writes(), 0)
  assert.equal(h.store.tables.commerce_checkouts[0].state, 'fulfilled')
  assert.ok(h.store.tables.commerce_checkout_items.every(item => item.state === 'applied'))
})

test('explicitly adopted pending legacy sessions still fulfill delayed payment exactly once', async () => {
  const h = setup(9)
  const session = { id: 'cs_test_adopted_pending', status: 'complete', payment_status: 'unpaid', metadata: { items: 'prod_Camera:1' } }
  await h.store.client.rpc('commerce_adopt_checkout', { p_id: session.id, p_session_id: session.id, p_items: [{ productId: 'prod_Camera', quantity: 1, applied: false }] })
  session.payment_status = 'paid'
  await h.inventory.fulfillInventory(h.stripe, session, [])
  await h.inventory.fulfillInventory(h.stripe, session, [])
  assert.equal(h.writes(), 1)
  assert.equal(h.product.metadata.stockCount, '8')
})

test('a mismatched legacy ledger does not authorize historical inventory writes', async () => {
  const h = setup(9)
  const session = { id: 'cs_test_mismatched', payment_status: 'paid', metadata: { items: 'prod_Camera:1' } }
  await h.store.client.rpc('commerce_adopt_checkout', { p_id: session.id, p_session_id: 'cs_test_other', p_items: [{ productId: 'prod_Camera', quantity: 1, applied: false }] })
  await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []), /identity mismatch/)
  assert.equal(h.writes(), 0)
  assert.equal(h.product.metadata.stockCount, '9')
})

test('existing legacy adoptions cannot authorize extra products or changed quantities', async () => {
  for (const items of ['prod_Camera:1,prod_Lens:1', 'prod_Camera:2']) {
    const h = setup(9)
    const session = { id: 'cs_test_adopted_scope', payment_status: 'paid', metadata: { items } }
    await h.store.client.rpc('commerce_adopt_checkout', { p_id: session.id, p_session_id: session.id, p_items: [{ productId: 'prod_Camera', quantity: 1, applied: false }] })
    h.store.calls.length = 0
    await assert.rejects(h.inventory.fulfillInventory(h.stripe, session, []), /items differ from the verified adoption/)
    assert.equal(h.writes(), 0)
    assert.equal(h.store.tables.commerce_checkout_items.length, 1)
    assert.equal(h.store.tables.commerce_checkout_items[0].quantity, 1)
    assert.equal(h.store.calls.length, 0)
  }
})

test('verified legacy ledger products take priority over synthetic line-item fallbacks', async () => {
  const h = setup(9)
  const session = { id: 'cs_test_adopted_fallback', payment_status: 'paid', metadata: {} }
  await h.store.client.rpc('commerce_adopt_checkout', { p_id: session.id, p_session_id: session.id, p_items: [{ productId: 'prod_Camera', quantity: 1, applied: false }] })
  h.store.calls.length = 0
  await h.inventory.fulfillInventory(h.stripe, session, [{ productId: 'prod_Synthetic', quantity: 2 }])
  assert.equal(h.writes(), 1)
  assert.equal(h.product.metadata.stockCount, '8')
  assert.equal(h.store.tables.commerce_checkout_items.length, 1)
  assert.equal(h.store.tables.commerce_checkout_items[0].product_id, 'prod_Camera')
  assert.equal(h.store.calls.some(call => call.name === 'commerce_adopt_checkout'), false)
})


test('checkout independently limits trusted IP and signed-in identity before stock reads', async () => {
  const calls = []
  const h = setup(1, { userId: 'user_actual', env: { VERCEL: '1', NODE_ENV: 'production' }, headers: { 'x-vercel-forwarded-for': '192.0.2.1' }, quota: async (...args) => { calls.push(args); return { allowed: !args[0].startsWith('checkout:user:'), retryAfter: 600 } } })
  let reads = 0
  h.stripe.products.retrieve = async () => { reads++; throw new Error('Must not read Stripe after quota denial') }
  await assert.rejects(h.buy(), /wait a few minutes/)
  assert.deepEqual(calls, [['checkout:ip:192.0.2.1', 5, 600], ['checkout:user:user_actual', 5, 600]])
  assert.equal(reads, 0)
  assert.equal(h.creates(), 0)
  assert.equal(h.store.tables.commerce_checkouts.length, 0)
})

test('guest checkout cannot bypass a denied IP quota', async () => {
  const h = setup(1, { quota: async () => ({ allowed: false, retryAfter: 600 }) })
  await assert.rejects(h.buy(), /wait a few minutes/)
  assert.equal(h.creates(), 0)
  assert.equal(h.store.calls.length, 0)
})

test('missing trusted production IP and quota outages fail closed before reserving inventory', async () => {
  for (const options of [
    { env: { VERCEL: '1', NODE_ENV: 'production' } },
    { env: { NODE_ENV: 'production' }, headers: { 'x-forwarded-for': '192.0.2.1' } },
    { env: { VERCEL: '1', NODE_ENV: 'production' }, headers: { 'x-vercel-forwarded-for': 'not-an-ip' } },
    { quota: async () => { throw new Error('Database unavailable') } },
  ]) {
    const h = setup(1, options)
    await assert.rejects(h.buy(), /temporarily unavailable/)
    assert.equal(h.creates(), 0)
    assert.equal(h.store.calls.length, 0)
  }
})


test('the cutover gate blocks payment session creation until legacy inventory is reconciled', async () => {
  const h = setup(1)
  h.store.tables.commerce_control[0].checkout_enabled = false
  await assert.rejects(h.buy(), /temporarily paused/)
  assert.equal(h.creates(), 0)
  assert.equal(h.store.tables.commerce_checkouts.length, 0)
})

test('legacy unpaid sessions imported at cutover can expire and release their holds', async () => {
  const h = setup(1)
  const session = { id: 'cs_test_legacy_pending', status: 'expired', payment_status: 'unpaid', metadata: { items: 'prod_Camera:1' } }
  h.sessions.set(session.id, session)
  await h.store.client.rpc('commerce_adopt_checkout', { p_id: session.id, p_session_id: session.id, p_items: [{ productId: 'prod_Camera', quantity: 1, applied: false }] })
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
  await h.inventory.reconcileInventory(h.stripe)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'released')
  await h.buy()
  assert.equal(h.creates(), 1)
})

test('canceling Stripe checkout and retrying the same cart resumes the browser-owned session', async () => {
  const h = setup(1)
  const first = await h.buy()
  assert.equal(await h.buy(), first)
  assert.equal(h.creates(), 1)
  assert.equal(h.cookieWrites.length, 1)
  const cookie = h.cookieWrites[0]
  assert.equal(cookie.options.httpOnly, true)
  assert.equal(cookie.options.secure, true)
  assert.equal(cookie.options.sameSite, 'lax')
  assert.equal(cookie.options.maxAge, 3600)
  const token = cookie.value.split('.')[1]
  assert.ok(!JSON.stringify([...h.sessions.values()]).includes(token), 'Capability never enters Stripe metadata')
  assert.ok(!JSON.stringify(h.store.tables).includes(token), 'Only the capability hash is persisted')
})

test('a changed cart expires and confirms the old session before transferring its reservation', async () => {
  const h = setup(3)
  await h.buy()
  await h.checkout([{ productId: 'prod_Camera', quantity: 2 }])
  assert.equal(h.sessions.get('cs_test_1').status, 'expired')
  assert.equal(h.creates(), 2)
  assert.deepEqual(h.store.tables.commerce_checkout_items.map(row => [row.quantity, row.state]), [[1, 'released'], [2, 'held']])
})

test('a lost expiry response keeps the hold until a fresh Stripe read proves expiration', async () => {
  const h = setup(3)
  await h.buy()
  const expire = h.stripe.checkout.sessions.expire
  h.stripe.checkout.sessions.expire = async (...args) => { await expire(...args); throw new Error('Lost expiration response') }
  await assert.rejects(h.checkout([{ productId: 'prod_Camera', quantity: 2 }]), /Lost expiration/)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
  assert.equal(h.creates(), 1)
  h.stripe.checkout.sessions.expire = expire
  await h.checkout([{ productId: 'prod_Camera', quantity: 2 }])
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'released')
  assert.equal(h.creates(), 2)
})

test('tampered capabilities or a different signed-in identity cannot resume or expire another checkout', async () => {
  for (const changeIdentity of [false, true]) {
    const h = setup(1, { userId: 'user_owner' })
    await h.buy()
    if (changeIdentity) h.options.userId = 'user_other'
    else {
      const cookie = h.cookieValues.get('mj_checkout')
      h.cookieValues.set('mj_checkout', `${cookie.split('.')[0]}.${'0'.repeat(64)}`)
    }
    h.stripe.checkout.sessions.expire = async () => { throw new Error('Unauthorized session expiration attempted') }
    await assert.rejects(h.buy(), /reserved or out of stock/)
    assert.equal(h.creates(), 1)
    assert.equal(h.sessions.get('cs_test_1').status, 'open')
    assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
  }
})

test('completed and delayed-payment sessions return their status without releasing the hold or charging again', async () => {
  for (const paymentStatus of ['paid', 'unpaid']) {
    const h = setup(1)
    await h.buy()
    const session = h.sessions.get('cs_test_1')
    session.status = 'complete'; session.payment_status = paymentStatus
    assert.equal(await h.buy(), 'https://measurejoy.org/checkout/return?session_id=cs_test_1')
    assert.equal(h.creates(), 1)
    assert.equal(h.store.tables.commerce_checkout_items[0].state, 'held')
    assert.equal(h.cookieValues.has('mj_checkout'), true)
    assert.equal(await h.buy(), 'https://measurejoy.org/checkout/return?session_id=cs_test_1')
    assert.equal(h.creates(), 1)
  }
})

test('a rejected concurrent last-item reservation cannot overwrite the successful browser capability', async () => {
  const h = setup(1)
  await Promise.allSettled([h.buy(), h.buy()])
  assert.equal(h.cookieWrites.length, 1)
  assert.equal(await h.buy(), 'https://checkout.stripe.com/1')
  assert.equal(h.creates(), 1)
})

test('oversized quantities and native-price totals fail before any reservation or Stripe session', async () => {
  const h = setup(1)
  await assert.rejects(h.checkout([{ productId: 'prod_Camera', quantity: 1 }, { productId: 'prod_Accessory', quantity: Number.MAX_SAFE_INTEGER }]), /no more than/)
  assert.equal(h.store.calls.length, 0)
  h.product.default_price.unit_amount = 100_000_000
  await assert.rejects(h.buy(), /reduce the order total/)
  assert.equal(h.store.tables.commerce_checkouts.length, 0)
  assert.equal(h.creates(), 0)
  assert.equal(h.cookieWrites.length, 0)
})


test('acknowledging the owned paid return clears its capability and permits a new purchase', async () => {
  const h = setup(3)
  await h.buy(); h.pay('cs_test_1')
  assert.equal((await h.getStatus('cs_test_1')).status, 'complete')
  assert.equal(h.cookieValues.has('mj_checkout'), false)
  await h.buy()
  assert.equal(h.creates(), 2)
})

test('a new cart after a paid session starts a new order instead of sending it to the old return page', async () => {
  const h = setup(3)
  await h.buy(); h.pay('cs_test_1')
  assert.equal(await h.checkout([{ productId: 'prod_Camera', quantity: 2 }]), 'https://checkout.stripe.com/2')
  assert.equal(h.creates(), 2)
})

test('an unrelated paid session status cannot clear the current checkout capability', async () => {
  const h = setup(3)
  await h.buy()
  const capability = h.cookieValues.get('mj_checkout')
  h.sessions.set('cs_test_other', { id: 'cs_test_other', status: 'complete', payment_status: 'paid', metadata: {} })
  await h.getStatus('cs_test_other')
  assert.equal(h.cookieValues.get('mj_checkout'), capability)
})

test('failed concurrent replacement reservations do not erase the successful replacement capability', async () => {
  const h = setup(2)
  await h.buy()
  await Promise.allSettled([h.checkout([{ productId: 'prod_Camera', quantity: 2 }]), h.checkout([{ productId: 'prod_Camera', quantity: 2 }])])
  assert.equal(h.creates(), 2)
  assert.equal(await h.checkout([{ productId: 'prod_Camera', quantity: 2 }]), 'https://checkout.stripe.com/2')
})

test('operator reconciliation releases a completed unpaid session only after current intent cancellation', async () => {
  const h = setup(1)
  await h.buy()
  const session = h.sessions.get('cs_test_1')
  session.status = 'complete'; session.payment_intent = 'pi_canceled'
  h.stripe.paymentIntents.retrieve = async () => ({ status: 'canceled' })
  assert.equal((await h.inventory.reconcileInventory(h.stripe)).recovered, 1)
  assert.equal(h.store.tables.commerce_checkout_items[0].state, 'released')
})

test('an imported legacy session without original metadata fulfills from its verified ledger items', async () => {
  const h = setup(1)
  const session = { id: 'cs_test_legacy_nometa', status: 'complete', payment_status: 'paid', metadata: {} }
  h.sessions.set(session.id, session)
  await h.store.client.rpc('commerce_adopt_checkout', { p_id: session.id, p_session_id: session.id, p_items: [{ productId: 'prod_Camera', quantity: 1, applied: false }] })
  assert.equal((await h.inventory.reconcileInventory(h.stripe)).recovered, 1)
  assert.equal(h.product.metadata.stockCount, '0')
  assert.equal(h.store.tables.commerce_checkouts[0].state, 'fulfilled')
})
