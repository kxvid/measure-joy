/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS security tests. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const loader = require('./helpers/load-typescript.cjs')
function subject(result) {
  const calls = []
  const consumeRateLimit = loader({
    '@/lib/supabase/admin': { createAdminClient: () => ({ rpc(name, params) {
      calls.push({ name, params })
      return { abortSignal(signal) { assert.ok(signal); return Promise.resolve(result) } }
    } }) },
  })('lib/rate-limit.ts').consumeRateLimit
  return { consumeRateLimit, calls }
}
test('quota consumes a shared RPC bucket without exposing identity', async () => {
  const { consumeRateLimit, calls } = subject({ data: [{ allowed: true, retry_after: 0 }], error: null })
  assert.equal((await consumeRateLimit('forms:email:person@example.invalid', 5)).allowed, true)
  assert.match(calls[0].params.p_key, /^[a-f0-9]{64}$/)
  assert.equal(calls[0].name, 'consume_rate_limit')
  assert.equal(calls[0].params.p_limit, 5)
  assert.equal(calls[0].params.p_window_seconds, 600)
  assert.doesNotMatch(JSON.stringify(calls), /person@/)
})
test('quota returns authoritative rejection and retry interval', async () => {
  const { consumeRateLimit } = subject({ data: [{ allowed: false, retry_after: 347 }], error: null })
  const result = await consumeRateLimit('forms:ip:127.0.0.1', 5)
  assert.equal(result.allowed, false)
  assert.equal(result.retryAfter, 347)
})
test('quota rejects database errors and malformed responses', async () => {
  for (const response of [
    { error: { message: 'private SQL details' }, data: null },
    { error: null, data: null },
    { error: null, data: [{ allowed: 'true', retry_after: 0 }] },
    { error: null, data: [{ allowed: true, retry_after: -1 }] },
  ]) {
    await assert.rejects(subject(response).consumeRateLimit('form:user', 5), /Request quota is unavailable/)
  }
})
