import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const source = await readFile(new URL('../components/storefront/catalog-filters.ts', import.meta.url), 'utf8');
const { categoryMatch, classifyProduct, DEFAULT_FILTERS, filtersUrl, readFilters, readSavedIds, missingSavedIds } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);

test('presentation groups override inconsistent broad categories without changing Stripe records', () => {
  const lens = Object.freeze({ name: 'Sony FE 50mm f/1.8 Prime Lens - Black', category: 'camera' });
  const film = Object.freeze({ name: 'Zeiss Ikon Contaflex Super B 35mm Film Camera - Silver', category: 'accessory' });
  assert.equal(classifyProduct(lens), 'lens');
  assert.equal(categoryMatch(lens, 'accessory'), true);
  assert.equal(categoryMatch(lens, 'camera'), false);
  assert.equal(categoryMatch(lens, 'lens'), true);
  assert.equal(classifyProduct(film), 'film');
  assert.equal(categoryMatch(film, 'camera'), true);
  assert.equal(lens.category, 'camera');
  assert.equal(film.category, 'accessory');
});

test('focal length and brand alone do not turn accessories or digital cameras into film cameras', () => {
  assert.equal(classifyProduct({ name: 'Canon EF 35mm f/2 Prime Lens - Black', category: 'camera' }), 'lens');
  assert.equal(classifyProduct({ name: 'Polaroid OneStep Original Instruction Manual', category: 'accessory' }), 'accessory');
  assert.equal(classifyProduct({ name: 'Polaroid iS048 Digital Camera', category: 'camera' }), 'digital');
  assert.equal(classifyProduct({ name: 'Digital Camera with 35mm Lens and Battery', category: 'camera' }), 'digital');
  assert.equal(classifyProduct({ name: 'Fujifilm Instax Square SQ6 Analog Instant Film Camera', category: 'camera' }), 'film');
});

test('accessory categories include chargers, memory and camera-compatible accessories', () => {
  for (const name of ['Canon Battery Charger CB-2LX', 'Sony Charger', 'Camera Battery for Canon A70']) {
    assert.equal(classifyProduct({ name, category: 'camera' }), 'power');
  }
  for (const name of ['NEW 1GB SD Card', 'SanDisk Memory Stick PRO Duo 4GB MagicGate Memory Card']) {
    assert.equal(classifyProduct({ name, category: 'accessory' }), 'memory');
  }
  assert.equal(classifyProduct({ name: 'Camera Lens for Sony', category: 'camera' }), 'lens');
  assert.equal(classifyProduct({ name: 'Camera Case for Polaroid Instax', category: 'camera' }), 'accessory');
  assert.equal(classifyProduct({ name: 'A classic find', category: 'camera' }), 'digital');
  assert.equal(classifyProduct({ name: 'A useful extra', category: 'accessory', subcategory: 'memory' }), 'memory');
});

test('all filter settings round trip through URLs for refresh and browser history', () => {
  const filters = { category: 'lens', year: 'all', query: 'Sony FE', brand: 'Sony', sort: 'price-low', onlyAvailable: false, savedOnly: true };
  const next = filtersUrl('https://preview.example/shop?campaign=autumn#collection-search', filters);
  const url = new URL(next);
  assert.equal(url.searchParams.get('campaign'), 'autumn');
  assert.equal(url.hash, '#collection-search');
  assert.deepEqual(readFilters(url.search), filters);
  assert.deepEqual(readFilters('?category=film'), { ...DEFAULT_FILTERS, category: 'film' });
});

test('reset removes stale owned URL filters while preserving unrelated state', () => {
  const next = new URL(filtersUrl('https://preview.example/shop?category=accessory&search=lens&brand=Sony&saved=1&sort=price-high&campaign=autumn#collection-search', { ...DEFAULT_FILTERS, onlyAvailable: false }));
  assert.equal(next.searchParams.has('category'), false);
  assert.equal(next.searchParams.has('search'), false);
  assert.equal(next.searchParams.has('brand'), false);
  assert.equal(next.searchParams.has('saved'), false);
  assert.equal(next.searchParams.has('sort'), false);
  assert.equal(next.searchParams.get('stock'), 'all');
  assert.equal(next.searchParams.get('campaign'), 'autumn');
  assert.deepEqual(readFilters(next.search), { ...DEFAULT_FILTERS, onlyAvailable: false });
});

test('invalid filter URL choices safely fall back to defaults', () => {
  assert.deepEqual(readFilters('?category=unknown&sort=expensive&stock=invalid&saved=no'), DEFAULT_FILTERS);
});

test('saved IDs remain removable when their products are absent without inventing product data', () => {
  const ids = readSavedIds(['prod_A', 'prod_B', 'prod_A', null, 'https://example.com', '']);
  assert.deepEqual(ids, ['prod_A', 'prod_B']);
  assert.deepEqual(missingSavedIds(ids, [{ id: 'prod_A' }]), ['prod_B']);
  assert.deepEqual(missingSavedIds(ids, []), ids);
  assert.deepEqual(readSavedIds({}), []);
});

test('legacy category and year links retain their meaning', () => {
  assert.equal(readFilters('?category=accessory&sub=memory-card').category, 'memory');
  assert.equal(readFilters('?year=2005').year, '2005');
  assert.equal(readFilters('?year=not-a-year').year, 'all');
  const filters = {...DEFAULT_FILTERS, year:'2005'};
  assert.equal(new URL(filtersUrl('https://www.measurejoy.org/shop?utm_source=club',filters)).searchParams.get('year'),'2005');
});

test('legacy q search links remain searchable and can be cleared', () => {
  const filters = readFilters('?q=canon');
  assert.equal(filters.query, 'canon');
  assert.equal(new URL(filtersUrl('https://www.measurejoy.org/shop?q=canon', DEFAULT_FILTERS)).searchParams.has('q'), false);
});

test('film packs remain accessories while actual film cameras remain cameras', () => {
  for (const name of ['Kodak Gold 200 35mm Film 3 Pack', 'Fujifilm Instax Mini Instant Film Twin Pack']) {
    const product = {name, category:'accessory', subcategory:'film'};
    assert.equal(categoryMatch(product,'accessory'), true);
    assert.equal(categoryMatch(product,'camera'), false);
  }
  assert.equal(categoryMatch({name:'Olympus Trip 35 Film Camera',category:'camera',subcategory:'film'},'film'),true);
});
