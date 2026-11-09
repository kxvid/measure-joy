/* eslint-disable @typescript-eslint/no-require-imports -- Isolated hook lifecycle; no tag or network is loaded. */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const granted = { version: 1, analytics: true, marketing: false }
const tagged = 'https://www.measurejoy.org/shop?utm_source=instagram&utm_medium=social&utm_campaign=weekly_drop&utm_content=bio_link&utm_term=compact&utm_id=drop_1'

function setup({ href = tagged, referrer = 'https://l.instagram.com/?private=omitted', consent, gpc = false } = {}) {
  let cursor = 0, current = new URL(href)
  const hooks = [], pending = [], scripts = [], writes = [], listeners = new Map(), storage = new Map()
  if (consent) storage.set('measurejoy-privacy-v1', JSON.stringify(consent))
  const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
  const react = {
    Suspense: Symbol('Suspense'),
    useState(initial) { const i = cursor++; hooks[i] ||= { value: initial }; return [hooks[i].value, value => { hooks[i].value = typeof value === 'function' ? value(hooks[i].value) : value }] },
    useRef(initial) { const i = cursor++; return hooks[i] ||= { current: initial } },
    useEffect(fn, deps) { const i = cursor++; if (!hooks[i] || !equal(hooks[i].deps, deps)) { const previous = hooks[i]; hooks[i] = { deps, fn }; pending.push(() => { previous?.cleanup?.(); hooks[i].cleanup = fn() }) } },
  }
  const browser = {
    URL, Date, Event: class { constructor(type) { this.type = type } },
    process: { env: { NEXT_PUBLIC_GA4_MEASUREMENT_ID: 'G-TEST123' } },
    location: current,
    navigator: { globalPrivacyControl: gpc },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => { writes.push(key); storage.set(key, value) } },
    sessionStorage: { getItem: () => null, setItem: key => writes.push(key) },
    document: { referrer, getElementById: id => scripts.find(s => s.id === id), createElement: () => ({}), head: { append: script => scripts.push(script) } },
    window: { addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn) }, removeEventListener(type, fn) { listeners.get(type)?.delete(fn) }, dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event) } },
  }
  function load(file, imports = {}) {
    const loaded = { exports: {} }
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    vm.runInNewContext(code, { ...browser, module: loaded, exports: loaded.exports, require: id => imports[id] || {} }, { filename: file })
    return loaded.exports
  }
  const analytics = load('lib/analytics.ts')
  const app = load('components/analytics/commerce-analytics.tsx', {
    react,
    'next/navigation': { usePathname: () => current.pathname, useSearchParams: () => current.searchParams },
    '@/lib/analytics': analytics,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  })
  function renderTree(node) {
    if (typeof node?.type === 'function') return renderTree(node.type(node.props))
    if (node?.type === react.Suspense) return renderTree(node.props.children)
    return node
  }
  const flush = () => { for (let i = 0; i < 3; i++) { cursor = 0; renderTree(app.CommerceAnalytics({ nonce: 'test-nonce' })); while (pending.length) pending.shift()() } }
  flush()
  return {
    scripts, writes, analytics,
    commands: () => Array.from(browser.window.dataLayer || [], args => Array.from(args)),
    navigate(href) { current.href = href; flush() },
    consent(value) { storage.set('measurejoy-privacy-v1', JSON.stringify(value)); browser.window.dispatchEvent(new browser.Event('measurejoy:privacy')); flush() },
    replay() { for (const hook of hooks) if (hook?.fn) { hook.cleanup?.(); hook.cleanup = hook.fn() } flush() },
  }
}
const pages = h => h.commands().filter(c => c[0] === 'event' && c[1] === 'page_view')
const latestContext = h => h.commands().filter(c => c[0] === 'set').at(-1)[1]
const mergedContext = h => Object.assign({}, ...h.commands().filter(c => c[0] === 'set').map(c => c[1]))

test('consent after SPA navigation retains the sanitized landing campaign before tag initialization', () => {
  const h = setup()
  h.navigate('https://www.measurejoy.org/product/prod_Camera?private=omitted#private')
  assert.deepEqual(h.commands(), [])
  assert.deepEqual(h.scripts, [])
  assert.deepEqual(h.writes, [])
  h.consent(granted)
  const commands = h.commands(), initial = commands.find(c => c[0] === 'set')[1]
  assert.equal(initial.campaign_source, 'instagram')
  assert.equal(initial.campaign_medium, 'social')
  assert.equal(initial.campaign_name, 'weekly_drop')
  assert.equal(initial.campaign_content, 'bio_link')
  assert.equal(initial.campaign_term, 'compact')
  assert.equal(initial.campaign_id, 'drop_1')
  assert.equal(initial.page_referrer, 'https://l.instagram.com')
  assert.equal(initial.page_location, 'https://www.measurejoy.org/product/prod_Camera')
  assert.ok(commands.findIndex(c => c[0] === 'set') < commands.findIndex(c => c[0] === 'js'))
  assert.equal(pages(h).length, 1)
  assert.equal(JSON.stringify(commands).includes('private'), false)
  assert.deepEqual(h.writes, [])
  h.replay()
  assert.equal(pages(h).length, 1)
})

test('same-path campaign changes update attribution while private/filter query edits stay silent', () => {
  const h = setup({ consent: granted })
  h.navigate(tagged + '&search=private&sort=price')
  assert.equal(pages(h).length, 1)
  h.navigate('https://www.measurejoy.org/shop?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_drop')
  assert.equal(pages(h).length, 2)
  assert.equal(mergedContext(h).campaign_source, 'newsletter')
  assert.equal(mergedContext(h).campaign_content, undefined)
  assert.equal(mergedContext(h).campaign_term, undefined)
  assert.equal(mergedContext(h).campaign_id, undefined)
  h.navigate('https://www.measurejoy.org/shop?search=private')
  assert.equal(pages(h).length, 2)
})

test('direct visits have no fabricated referral or campaign and public navigation stays sanitized', () => {
  const h = setup({ href: 'https://www.measurejoy.org/shop', referrer: '', consent: granted })
  assert.equal(latestContext(h).page_referrer, '')
  assert.equal(latestContext(h).campaign_source, undefined)
  h.navigate('https://www.measurejoy.org/product/prod_Camera?private=omitted')
  assert.equal(pages(h).length, 2)
  assert.equal(pages(h)[1][2].page_location, 'https://www.measurejoy.org/product/prod_Camera')
  assert.equal(JSON.stringify(h.commands()).includes('private'), false)
})

test('GPC and denied consent stay silent; private-page campaigns never become shopping attribution', () => {
  for (const options of [{ gpc: true, consent: granted }, { consent: { ...granted, analytics: false } }]) {
    const h = setup(options)
    h.navigate('https://www.measurejoy.org/product/prod_Camera')
    assert.equal(h.scripts.length, 0)
    assert.deepEqual(h.commands(), [])
    assert.deepEqual(h.writes, [])
  }
  const h = setup({ href: 'https://www.measurejoy.org/admin?utm_source=private_campaign', consent: granted })
  assert.equal(h.scripts.length, 0)
  h.navigate('https://www.measurejoy.org/shop')
  assert.equal(latestContext(h).campaign_source, undefined)
  assert.equal(pages(h).length, 1)
})

test('revoking analytics drops retained campaign before a later consent choice', () => {
  const h = setup({ consent: granted })
  h.consent({ ...granted, analytics: false })
  h.navigate('https://www.measurejoy.org/product/prod_Camera')
  h.consent(granted)
  assert.equal(latestContext(h).campaign_source, undefined)
  assert.equal(pages(h).length, 2)
})
