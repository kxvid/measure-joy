import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSavedFindsStore } from '../lib/saved-finds-store.ts'

test('Clerk loading cannot read, overwrite or toggle guest saves', async () => {
  let reads = 0, writes = 0
  const store = createSavedFindsStore(null, { read:async()=>{reads++;return ['prod_guest']}, write:async()=>{writes++;return true} })
  await store.load()
  assert.equal((await store.toggle('prod_camera')).success,false)
  assert.equal(reads,0)
  assert.equal(writes,0)
  assert.equal(store.getSnapshot().ready,false)
})

test('a confirmed guest save preserves its other local IDs', async () => {
  let saved
  const store = createSavedFindsStore('guest',{read:async()=>['prod_guest'],write:async(id,added,ids)=>{saved=ids;return true}})
  await store.load()
  const result = await store.toggle('prod_camera')
  assert.deepEqual(result,{success:true,added:true})
  assert.deepEqual(saved,['prod_guest','prod_camera'])
  assert.deepEqual(store.getSnapshot().ids,saved)
})

test('a failed account write does not remove an existing saved camera', async () => {
  const store = createSavedFindsStore('user_one',{read:async()=>['prod_camera'],write:async()=>false})
  await store.load()
  const result = await store.toggle('prod_camera')
  assert.equal(result.success,false)
  assert.deepEqual(store.getSnapshot().ids,['prod_camera'])
  assert.ok(store.getSnapshot().error)
})

test('a failed account read remains an error rather than an empty successfully loaded list', async () => {
  let writes=0
  const store=createSavedFindsStore('user_one',{read:async()=>{throw new Error('unavailable')},write:async()=>{writes++;return true}})
  await store.load()
  assert.equal(store.getSnapshot().ready,false)
  assert.ok(store.getSnapshot().error)
  assert.equal((await store.toggle('prod_camera')).success,false)
  assert.equal(writes,0)
})

test('concurrent toggles cannot overwrite an in-flight saved list', async () => {
  let finish
  const pending = new Promise(resolve=>{finish=resolve})
  const store=createSavedFindsStore('guest',{read:async()=>[],write:async()=>await pending})
  await store.load()
  const first=store.toggle('prod_first')
  assert.equal((await store.toggle('prod_second')).success,false)
  finish(true)
  assert.equal((await first).success,true)
  assert.deepEqual(store.getSnapshot().ids,['prod_first'])
})

test('account and guest lists stay separate without an implicit merge', async () => {
  const guest=createSavedFindsStore('guest',{read:async()=>['prod_guest'],write:async()=>true})
  const account=createSavedFindsStore('user_one',{read:async()=>['prod_account'],write:async()=>true})
  await Promise.all([guest.load(),account.load()])
  assert.deepEqual(guest.getSnapshot().ids,['prod_guest'])
  assert.deepEqual(account.getSnapshot().ids,['prod_account'])
})
