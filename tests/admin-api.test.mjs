import { after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import Stripe from 'stripe'

const originalFetch = globalThis.fetch
const environment = { ...process.env }
let updates = [], listed = 0
beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_only'
  process.env.ADMIN_EMAILS = 'owner@example.com'
  delete process.env.GOOGLE_AI_API_KEY
  globalThis.formTestUser = null
  updates = []; listed = 0
})
after(() => { globalThis.fetch = originalFetch; process.env = environment })
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_only'
globalThis.fetch = async () => { throw new Error('External HTTP disabled in admin tests') }
const ProductResource = Stripe.resources.Products
const originalUpdate = ProductResource.prototype.update
const originalList = ProductResource.prototype.list
ProductResource.prototype.update = async function (id, data) { updates.push({id,data}); return {id,object:'product'} }
ProductResource.prototype.list = async function () { listed++; return {object:'list',has_more:false,data:[]} }
after(() => { ProductResource.prototype.update = originalUpdate; ProductResource.prototype.list = originalList })
const { POST: category } = await import('../app/api/products/category/route.ts')
const { POST: categorize, GET: bulkGet } = await import('../app/api/categorize/route.ts')
function login(email = 'owner@example.com') {
  globalThis.formTestUser = { id: 'user_owner', primaryEmailAddressId: 'email_owner', emailAddresses: [{ id: 'email_owner', emailAddress: email, verification: { status: 'verified' } }] }
}
function request(path, body, origin = 'https://measurejoy.org') {
  return new Request(`https://measurejoy.org/api/${path}`, { method: 'POST', headers: { 'content-type':'application/json', origin }, body: typeof body === 'string' ? body : JSON.stringify(body) })
}

test('anonymous category update never mutates Stripe', async () => {
  const response = await category(request('products/category', {productId:'prod_camera',category:'camera'}))
  assert.equal(response.status, 401)
  assert.equal(updates.length, 0)
})
test('signed-in users outside the owner allowlist cannot mutate or categorize', async () => {
  login('customer@example.com')
  for (const handler of [category,categorize]) {
    const response = await handler(request('products/category', {productId:'prod_camera',category:'camera',name:'Camera'}))
    assert.equal(response.status, 403)
  }
  assert.equal(updates.length, 0)
})
test('admin mutations reject cross-site origins', async () => {
  login()
  const response = await category(request('products/category', {productId:'prod_camera',category:'camera'}, 'https://attacker.example'))
  assert.equal(response.status, 403)
  assert.equal(updates.length, 0)
})
test('authorized category editor preserves real Stripe metadata updates', async () => {
  login()
  const response = await category(request('products/category', {productId:'prod_camera',category:'camera'}))
  assert.equal(response.status, 200)
  assert.equal(updates.length, 1)
  assert.equal(updates[0].data.metadata.category, 'camera')
  assert.equal(updates[0].data.metadata.subcategory, '')
  assert.equal(updates[0].data.metadata.categorized_by_llm, 'false')
})
test('category inputs reject arbitrary metadata and malformed product identifiers', async () => {
  login()
  for (const payload of [{ productId:'../customers',category:'camera' }, { productId:'prod_camera',category:'unknown' }, { productId:'prod_camera',category:'accessory',subcategory:'x'.repeat(600) }]) {
    assert.equal((await category(request('products/category',payload))).status,400)
  }
  assert.equal(updates.length,0)
})
test('GET categorization cannot write catalog data even for a logged-in owner', async () => {
  login()
  const response = await bulkGet(new Request('https://measurejoy.org/api/categorize?force=true'))
  assert.equal(response.status, 405)
  assert.equal(updates.length,0)
  assert.equal(listed,0)
})
test('authorized bulk categorization moves to explicit JSON POST', async () => {
  login()
  const response = await categorize(request('categorize',{bulk:true,force:false}))
  assert.equal(response.status,200)
  assert.equal((await response.json()).summary.total,0)
  assert.equal(listed,1)
})
test('authorized single categorization keeps its rules fallback when AI is not configured', async () => {
  login()
  const response = await categorize(request('categorize',{name:'SD card 32GB',description:'Memory storage'}))
  assert.equal(response.status,200)
  const result = await response.json()
  assert.equal(result.category,'accessory')
  assert.equal(result.method,'rules')
  assert.equal(updates.length,0)
})

test('an unverified allowlisted email is not sufficient for catalog administration', async () => {
  login()
  globalThis.formTestUser.emailAddresses[0].verification.status = 'unverified'
  const response = await category(request('products/category',{productId:'prod_camera',category:'camera'}))
  assert.equal(response.status,403)
  assert.equal(updates.length,0)
})

test('admin JSON validation rejects malformed and oversized bodies before writes', async () => {
  login()
  assert.equal((await category(request('products/category','{'))).status,400)
  assert.equal((await category(request('products/category','x'.repeat(17000)))).status,413)
  assert.equal(updates.length,0)
})
