/* eslint-disable @typescript-eslint/no-require-imports -- Isolated client-hook harness; no browser or live checkout. */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const makeLoader = require('./helpers/load-typescript.cjs')
const root = path.resolve(__dirname, '..')
const product = (changes = {}) => ({ id: 'prod_Camera', name: 'Canon camera', description: 'Camera', priceInCents: 12000, images: [], category: 'camera', condition: 'Good', specs: {}, inStock: true, stockCount: 3, ...changes })
const plain = (value) => JSON.parse(JSON.stringify(value))

// Preserve hook state between renders and replay effects/updaters like development
// StrictMode so an event added inside a functional setter would be duplicated.
function clientHarness(file, overrides = {}, globals = {}) {
  const hooks = [], pending = []
  let cursor = 0
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState(initial) {
      const index = cursor++
      hooks[index] ||= { value: typeof initial === 'function' ? initial() : initial }
      return [hooks[index].value, (update) => {
        if (typeof update === 'function') update(hooks[index].value)
        hooks[index].value = typeof update === 'function' ? update(hooks[index].value) : update
      }]
    },
    useRef(initial) { const index = cursor++; return hooks[index] ||= { current: initial } },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps) },
    useMemo(fn, deps) {
      const index = cursor++
      if (!hooks[index] || !equal(hooks[index].deps, deps)) hooks[index] = { value: fn(), deps }
      return hooks[index].value
    },
    useEffect(fn, deps) {
      const index = cursor++
      if (!hooks[index] || !equal(hooks[index].deps, deps)) {
        const effect = { fn, deps, cleanup: hooks[index]?.cleanup }
        hooks[index] = effect
        pending.push(() => { effect.cleanup?.(); effect.cleanup = fn() })
      }
    },
  }
  const load = makeLoader()
  const analytics = load('lib/analytics.ts'), events = []
  const imports = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'next/link': { default: 'a' },
    'lucide-react': {},
    './analytics': { ...analytics, trackCommerce: (name, event) => { if (event) events.push({ name, event: plain(event) }) } },
    '@/lib/analytics': { ...analytics, trackCommerce: (name, event) => { if (event) events.push({ name, event: plain(event) }) } },
    ...overrides,
  }
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const loaded = { exports: {} }
  vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, URL, console, ...globals, require(id) {
    if (Object.hasOwn(imports, id)) return imports[id]
    if (id.startsWith('@/')) return load(`${id.slice(2)}.ts`)
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(root, path.dirname(file), `${id}.ts`)))
    return require(id)
  } }, { filename: file })
  return {
    events,
    render(name, props = {}) { cursor = 0; return loaded.exports[name](props) },
    effects(replay = false) {
      while (pending.length) pending.shift()()
      if (replay) {
        for (const hook of hooks) if (hook?.fn) hook.cleanup?.()
        for (const hook of hooks) if (hook?.fn) hook.cleanup = hook.fn()
      }
    },
  }
}

function cartHarness(stored = [], catalog = [product()]) {
  const storage = new Map([['measurejoy-cart', JSON.stringify(stored)]])
  const h = clientHarness('lib/cart-context.tsx', {}, {
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    fetch: async () => ({ ok: true, json: async () => catalog }),
  })
  h.cart = () => h.render('CartProvider').props.value
  h.cart(); h.effects(true)
  return h
}

test('cart tracking emits actual bounded deltas exactly once across rapid changes', () => {
  const h = cartHarness(), cart = h.cart()
  cart.addItem(product(), 2)
  cart.addItem(product(), 2)
  cart.addItem(product(), 1) // Already at stock limit: no event.
  cart.updateQuantity('prod_Camera', 2)
  cart.removeItem('prod_Camera')
  cart.removeItem('prod_Camera') // Already absent: no event.
  assert.equal(h.cart().items.length, 0)
  assert.deepEqual(h.events.map(({ name, event }) => [name, event.items[0].quantity, event.value]), [
    ['add_to_cart', 2, 240], ['add_to_cart', 1, 120], ['remove_from_cart', 1, 120], ['remove_from_cart', 2, 240],
  ])
})

test('hydration, reconciliation, invalid changes, and purchase clearing do not emit cart actions', async () => {
  const h = cartHarness([{ product: product(), quantity: 1 }], [product({ priceInCents: 13000 })])
  const cart = h.cart()
  assert.equal(cart.items[0].quantity, 1)
  cart.addItem(product({ inStock: false }))
  cart.addItem(product(), 1.5)
  cart.updateQuantity('prod_Camera', NaN)
  await cart.refreshCart()
  assert.equal(h.cart().items[0].product.priceInCents, 13000)
  cart.clearCart()
  assert.equal(h.cart().items.length, 0)
  assert.deepEqual(h.events, [])
})

function checkoutHarness({ url = 'https://checkout.stripe.com/c/pay/cs_test_example', issues = [], actionError, single = false } = {}) {
  const freshProduct = product({ priceInCents: 13500 }), calls = [], navigations = []
  const start = async (...args) => { calls.push(args); if (actionError) throw actionError; return url }
  const h = clientHarness('components/checkout.tsx', {
    '@/lib/cart-context': { useCart: () => ({ items: [{ product: product(), quantity: 1 }], isHydrated: true, refreshCart: async () => ({ items: [{ product: freshProduct, quantity: 2 }], issues }) }) },
    '@/app/actions/stripe': { startCheckoutSession: start, startSingleProductCheckout: start },
  }, { window: { location: { origin: 'https://www.measurejoy.org', assign: destination => navigations.push(destination) } } })
  h.render('default', single ? { productId: freshProduct.id, product: freshProduct, quantity: 2 } : {})
  h.effects(true)
  return { ...h, calls, navigations }
}
const settle = () => new Promise(resolve => setImmediate(resolve))

test('begin checkout follows a validated server response and uses fresh bag prices once under effect replay', async () => {
  const h = checkoutHarness()
  assert.deepEqual(h.events, [])
  await settle()
  assert.equal(h.calls.length, 1)
  assert.equal(h.navigations.length, 1)
  assert.deepEqual(h.events.map(({ name, event }) => [name, event.value, event.items[0].quantity]), [['begin_checkout', 270, 2]])
})

test('begin checkout is silent for invalid links, failed actions, stock issues, or resumed status pages', async () => {
  for (const options of [
    { url: null },
    { url: 'https://untrusted.example/pay' },
    { actionError: new Error('provider failure') },
    { issues: ['Only one available.'] },
    { url: 'https://www.measurejoy.org/checkout/return?session_id=cs_test_example' },
  ]) {
    const h = checkoutHarness(options)
    await settle()
    assert.deepEqual(h.events, [])
    if (options.issues) assert.equal(h.calls.length, 0)
  }
})

test('single-product checkout reuses its already-validated product without another session', async () => {
  const h = checkoutHarness({ single: true })
  await settle()
  assert.equal(h.calls.length, 1)
  assert.deepEqual(plain(h.calls[0]), ['prod_Camera', null, 2])
  assert.equal(h.events[0].event.value, 270)
})
