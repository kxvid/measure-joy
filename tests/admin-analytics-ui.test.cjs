/* eslint-disable @typescript-eslint/no-require-imports -- Server rendering with isolated providers, no live data. */
const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const makeLoader = require('./helpers/load-tsx.cjs')

const report = () => ({
  period: { days: 30, startDate: '2026-10-10', endDate: '2026-11-08', previousStartDate: '2026-09-10', previousEndDate: '2026-10-09', timeZone: 'America/Los_Angeles' },
  fetchedAt: '2026-11-09T18:00:00Z', currency: 'USD',
  current: { users: 3, sessions: 4, views: 8, purchases: 0, revenue: 0 },
  previous: { users: 0, sessions: 2, views: 4, purchases: 0, revenue: 0 },
  daily: [{ date: '2026-11-08', users: 3, sessions: 4, views: 8 }],
  channels: [{ channel: 'instagram / social', users: 3, sessions: 4, purchases: 0, revenue: 0 }],
  pages: [{ path: '/shop', views: 8, users: 3 }],
  products: [{ itemId: 'prod_Camera', views: 5, addToCarts: 1, purchases: 0, revenue: 0 }],
  warnings: [],
})

function pageHarness({ allowed = true, result = { status: 'ready', report: report() }, catalogError = false } = {}) {
  const calls = []
  class AdminRequestError extends Error {}
  const load = makeLoader({
    'next/navigation': { redirect: (path) => { throw new Error(`redirect:${path}`) } },
    '@/app/actions/auth-admin': { checkAdminAccess: async () => { calls.push('auth'); return allowed } },
    '@/lib/admin-auth': { AdminRequestError },
    '@/lib/admin-analytics': { getAdminAnalytics: async (days) => { calls.push(['report', days]); return result } },
    '@/lib/stripe-products': { getStripeProducts: async () => { calls.push('catalog'); if (catalogError) throw new Error('private provider diagnostic'); return [{ id: 'prod_Camera', name: 'Canon camera' }, { id: 'prod_NotReported', name: 'Other camera' }] } },
  })
  return { page: load('app/admin/analytics/page.tsx').default, calls }
}

test('admin report page authorizes before any reporting or catalog access', async () => {
  const h = pageHarness({ allowed: false })
  await assert.rejects(() => h.page({ searchParams: Promise.resolve({ days: '7' }) }), /redirect:\//)
  assert.deepEqual(h.calls, ['auth'])
})

test('invalid report periods fall back to thirty days with an explanation', async () => {
  for (const days of ['365', ['7', '90']]) {
    const h = pageHarness()
    const markup = renderToStaticMarkup(await h.page({ searchParams: Promise.resolve({ days }) }))
    assert.deepEqual(h.calls.slice(0, 2), ['auth', ['report', 30]])
    assert.match(markup, /reporting period wasn’t recognized/)
    assert.match(markup, /Canon camera/)
    assert.doesNotMatch(markup, /Other camera/)
  }
})

test('optional catalog failure leaves report values available and uses product IDs', async () => {
  const h = pageHarness({ catalogError: true })
  const markup = renderToStaticMarkup(await h.page({ searchParams: Promise.resolve({}) }))
  assert.match(markup, /prod_Camera/)
  assert.match(markup, /Consented visitors/)
  assert.doesNotMatch(markup, /private provider diagnostic/)
})

test('not configured or failed reports have no invented zero totals or catalog queries', async () => {
  for (const status of ['not_configured', 'error']) {
    const h = pageHarness({ result: { status, period: report().period, message: 'Reporting is unavailable.' } })
    const markup = renderToStaticMarkup(await h.page({ searchParams: Promise.resolve({ days: '30' }) }))
    assert.deepEqual(h.calls, ['auth', ['report', 30]])
    assert.match(markup, /Reporting is unavailable/)
    assert.doesNotMatch(markup, /\$0\.00|Consented visitors/)
  }
})

test('report renders calendar dates, finite comparisons, accessible chart data, and only read filters', () => {
  const { AnalyticsDashboard } = makeLoader()('app/admin/analytics/analytics-dashboard.tsx')
  const markup = renderToStaticMarkup(React.createElement(AnalyticsDashboard, { report: report() }))
  assert.match(markup, /Oct 10, 2026/)
  assert.match(markup, /Nov 8, 2026/)
  assert.match(markup, /No activity in previous period/)
  assert.match(markup, /\+100% from previous period/)
  assert.match(markup, /View daily data/)
  assert.match(markup, /role="img"/)
  assert.match(markup, /method="get"/)
  assert.match(markup, /View Stripe orders for sales totals/)
  assert.doesNotMatch(markup, /NaN|Infinity|method="post"|API key|Deploy|Publish/)
})

test('negative observed revenue uses a signed dollar change without reversing the comparison', () => {
  const { AnalyticsDashboard } = makeLoader()('app/admin/analytics/analytics-dashboard.tsx')
  for (const [current, previous, expected] of [
    [-25, -50, '+$25.00 vs previous -$50.00'],
    [-25, 50, '-$75.00 vs previous $50.00'],
    [0, -50, '+$50.00 vs previous -$50.00'],
    [-10, 0, '-$10.00 vs previous $0.00'],
  ]) {
    const value = report()
    value.current.revenue = current
    value.previous.revenue = previous
    const markup = renderToStaticMarkup(React.createElement(AnalyticsDashboard, { report: value }))
    const revenueMetric = markup.split('Observed revenue</dt>')[1].split('</dd>')[0]
    assert.ok(revenueMetric.includes(expected), expected)
    assert.doesNotMatch(revenueMetric, /%/)
  }
})

test('external GA product IDs cannot render inherited or non-string dictionary properties', () => {
  const { AnalyticsDashboard } = makeLoader()('app/admin/analytics/analytics-dashboard.tsx')
  const value = report()
  value.products = ['__proto__', 'constructor', 'toString', 'prod_Camera'].map(itemId => ({ itemId, views: 1, addToCarts: 0, purchases: 0, revenue: 0 }))
  for (const productNames of [
    {},
    Object.assign(Object.create({ constructor: 'Inherited name', toString: 'Inherited label' }), { prod_Camera: 'Canon camera' }),
    { constructor: { private: 'not a label' }, toString: () => 'not a label', prod_Camera: 'Canon camera' },
  ]) {
    const markup = renderToStaticMarkup(React.createElement(AnalyticsDashboard, { report: value, productNames }))
    for (const id of ['__proto__', 'constructor', 'toString']) assert.ok(markup.includes(`>${id}</td>`), id)
    assert.doesNotMatch(markup, /Inherited name|Inherited label|not a label/)
    if (Object.hasOwn(productNames, 'prod_Camera')) assert.match(markup, /Canon camera/)
  }
})

test('share links use fixed canonical destinations and bounded platform campaign tags', () => {
  const { CAMPAIGN_LINKS } = makeLoader()('lib/campaign-links.ts')
  const expected = [
    ['Instagram', 'instagram', 'social', 'profile', 'bio'],
    ['TikTok', 'tiktok', 'social', 'profile', 'bio'],
    ['Facebook', 'facebook', 'social', 'profile', 'bio'],
    ['YouTube', 'youtube', 'social', 'profile', 'description'],
    ['Newsletter', 'newsletter', 'email', 'weekly_drop', 'email_link'],
  ]
  assert.equal(CAMPAIGN_LINKS.length, expected.length)
  for (const [index, [label, source, medium, campaign, content]] of expected.entries()) {
    const link = CAMPAIGN_LINKS[index]
    assert.equal(link.label, label)
    assert.equal(link.source, source)
    const url = new URL(link.url)
    assert.equal(url.origin + url.pathname, 'https://www.measurejoy.org/shop')
    assert.equal(url.hash, '')
    assert.deepEqual(Object.fromEntries(url.searchParams), { utm_source: source, utm_medium: medium, utm_campaign: campaign, utm_content: content })
    for (const value of url.searchParams.values()) assert.match(value, /^[a-z_]{1,32}$/)
  }
})

test('share links render labeled copyable read-only inputs without outbound or write controls', () => {
  const load = makeLoader()
  const { CAMPAIGN_LINKS } = load('lib/campaign-links.ts')
  const { AnalyticsDashboard } = load('app/admin/analytics/analytics-dashboard.tsx')
  const markup = renderToStaticMarkup(React.createElement(AnalyticsDashboard, { report: report() }))
  const section = markup.split('aria-labelledby="share-links"')[1].split('</section>')[0]
  const inputs = [...section.matchAll(/<input\b[^>]*>/g)].map(([input]) => input)
  assert.equal(inputs.length, 5)
  for (const { label, source, url } of CAMPAIGN_LINKS) {
    assert.ok(section.includes(`for="share-link-${source}">${label}`))
    const input = inputs.find(value => value.includes(`id="share-link-${source}"`))
    assert.ok(input)
    assert.match(input, /readOnly=""|readonly=""/)
    assert.match(input, /type="url"/)
    assert.match(input, /aria-describedby="share-links-help"/)
    assert.ok(input.replaceAll('&amp;', '&').includes(`value="${url}"`))
  }
  assert.match(section, /Direct \/ none can include visits from apps that hide/)
  assert.match(section, /Visitors must allow analytics/)
  assert.doesNotMatch(section, /<a\b|<button\b|<form\b|<script\b|formaction=|onClick=|onChange=/i)
})
