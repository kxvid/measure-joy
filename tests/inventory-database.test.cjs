/* eslint-disable @typescript-eslint/no-require-imports -- Optional real PostgreSQL transaction/concurrency regression. */
const test = require('node:test')
const assert = require('node:assert/strict')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const run = promisify(execFile)
const url = process.env.COMMERCE_TEST_DATABASE_URL
const adminRole = process.env.TEST_DATABASE_ADMIN_ROLE || (url && decodeURIComponent(new URL(url).username)) || 'postgres'
const sqlIdentifier = value => `"${String(value).replaceAll('"', '""')}"`
const sqlString = value => `'${String(value).replaceAll("'", "''")}'`
const json = value => `${sqlString(JSON.stringify(value))}::jsonb`
async function sql(text, role = 'service_role') {
  const { stdout } = await run(process.env.PSQL || 'psql', [url, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', `set role ${sqlIdentifier(role)}; ${text}`])
  return stdout.trim()
}
const params = { expires_at: Math.floor(Date.now() / 1000) + 1860 }
const reservation = (id, items) => sql(`select public.commerce_reserve_checkout(${sqlString(id)}, ${json(items)}, ${json(params)})`)

test('real PostgreSQL serializes reservations, fences Stripe writes, and denies browser roles', { skip: !url }, async () => {
  const parsed = new URL(url)
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname), 'Database regression must use a local disposable database')
  assert.ok(parsed.pathname.endsWith('_test'), 'Database name must end in _test; never run against production')
  await sql('truncate public.commerce_stock_operations, public.commerce_checkout_items, public.commerce_checkouts, public.commerce_inventory cascade', adminRole)
  await sql("select public.commerce_inventory_snapshot(array['prod_One','prod_Two'])")
  await sql('update public.commerce_control set checkout_enabled=false')
  await assert.rejects(reservation('cutover-blocked', [{ productId: 'prod_One', quantity: 1, stock: 1, revision: 0 }]))
  await sql('update public.commerce_control set checkout_enabled=true')
  const attempts = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => reservation(`race-${index}`, [{ productId: 'prod_One', quantity: 1, stock: 1, revision: 0 }])))
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1, 'Exactly one last-item reservation commits')
  const winner = attempts.findIndex(result => result.status === 'fulfilled')
  assert.equal(await sql("select sum(quantity) from public.commerce_checkout_items where state='held'"), '1')
  await assert.rejects(reservation('atomic-failure', [{ productId: 'prod_Two', quantity: 1, stock: 1, revision: 0 }, { productId: 'prod_One', quantity: 1, stock: 1, revision: 0 }]))
  assert.equal(await sql("select count(*) from public.commerce_checkout_items where product_id='prod_Two'"), '0', 'Multi-product failure creates no partial holds')
  await sql(`select public.commerce_release_checkout('race-${winner}')`)
  await reservation('paid', [{ productId: 'prod_One', quantity: 1, stock: 1, revision: 0 }])
  const operation = JSON.parse(await sql("select public.commerce_begin_stock_operation('op-paid','prod_One','paid',0,1,'{}')"))
  assert.deepEqual(operation.metadata, { stockCount: '0', inStock: 'false' })
  await assert.rejects(reservation('during-write', [{ productId: 'prod_One', quantity: 1, stock: 10, revision: 0 }]))
  await assert.rejects(sql("select public.commerce_begin_stock_operation('admin-race','prod_One',null,0,null,'{\"stockCount\":\"10\"}')"))
  await assert.rejects(sql("select public.commerce_release_checkout('paid')"))
  await sql("update public.commerce_stock_operations set created_at=now()-interval '30 days' where id='op-paid'", adminRole)
  await assert.rejects(reservation('expired-lock', [{ productId: 'prod_One', quantity: 1, stock: 10, revision: 0 }]), 'An old ambiguous write never unlocks on elapsed time')
  await Promise.all([sql("select public.commerce_complete_stock_operation('op-paid')"), sql("select public.commerce_complete_stock_operation('op-paid')")])
  assert.equal(await sql("select revision from public.commerce_inventory where product_id='prod_One'"), '1', 'Duplicate completion increments revision only once')
  await assert.rejects(reservation('stale-snapshot', [{ productId: 'prod_One', quantity: 1, stock: 1, revision: 0 }]))
  await assert.rejects(reservation('sold-out', [{ productId: 'prod_One', quantity: 1, stock: 0, revision: 1 }]))
  await sql("select public.commerce_finish_checkout('paid')")
  assert.equal(await sql("select state from public.commerce_checkouts where id='paid'"), 'fulfilled')
  await reservation('admin-hold', [{ productId: 'prod_Two', quantity: 1, stock: 2, revision: 0 }])
  await assert.rejects(sql("select public.commerce_begin_stock_operation('admin-held','prod_Two',null,0,null,'{\"stockCount\":\"10\"}')"), 'Admin mutation cannot invalidate a customer hold')
  await sql("select public.commerce_release_checkout('admin-hold')")
  const admin = JSON.parse(await sql("select public.commerce_begin_stock_operation('admin-safe','prod_Two',null,0,null,'{\"stockCount\":\"10\"}')"))
  assert.deepEqual(admin.metadata, { stockCount: '10' })
  await sql("select public.commerce_complete_stock_operation('admin-safe')")
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(sql("select public.commerce_inventory_snapshot(array['prod_One'])", role))
    await assert.rejects(sql('select * from public.commerce_checkouts', role))
    await assert.rejects(sql("update public.commerce_inventory set pending_operation=null", role))
  }
})
