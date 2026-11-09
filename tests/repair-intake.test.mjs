import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { validateRepairInput, REPAIR_SERVICES, repairServiceLabel } from '../lib/repair-intake.ts'
import { repairPhotoType } from '../lib/repair-photos.ts'

const input = (changes = {}) => ({
  requestToken: randomUUID(), website: '', service: 'repair', brand: 'Canon', model: 'Unknown',
  issues: [], description: 'Please help with this camera.', name: 'Alex Camera', email: 'alex@example.com',
  phone: '', preferredContact: 'email', consent: true, ...changes,
})

test('all displayed repair choices validate and older service labels remain readable', () => {
  for (const { value } of REPAIR_SERVICES) assert.equal(validateRepairInput(input({ service: value })).success, true)
  for (const service of ['restoration', 'cleaning', 'film-dev', 'quote']) {
    assert.equal(validateRepairInput(input({ service })).success, true)
    assert.notEqual(repairServiceLabel(service), service)
  }
})

test('rental and referral requests do not require owning a camera', () => {
  for (const service of ['rental-enquiry', 'referral']) assert.equal(validateRepairInput(input({ service, brand: '', model: '' })).success, true)
  for (const service of ['repair', 'trade-in', 'photo-recovery']) assert.equal(validateRepairInput(input({ service, brand: '', model: '' })).success, false)
})

test('image sniffing rejects renamed text, truncated headers and excessive image dimensions', () => {
  assert.equal(repairPhotoType(new TextEncoder().encode('<svg>not a PNG</svg>')), null)
  assert.equal(repairPhotoType(new Uint8Array([255, 216, 255, 217])), null)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
  assert.equal(repairPhotoType(png), 'image/png')
  assert.equal(repairPhotoType(png.subarray(0, 24)), null)
  png.writeUInt32BE(100_000, 16)
  png.writeUInt32BE(100_000, 20)
  assert.equal(repairPhotoType(png), null)
})
