// Isolated mocked coordination store; no external connections.
const copy = value => JSON.parse(JSON.stringify(value))
module.exports = function inventoryStore() {
  const tables = { commerce_control: [{ id: true, checkout_enabled: true }], commerce_inventory: [], commerce_checkouts: [], commerce_checkout_items: [], commerce_stock_operations: [] }
  const inventory = id => {
    let row = tables.commerce_inventory.find(row => row.product_id === id)
    if (!row) tables.commerce_inventory.push(row = { product_id: id, revision: 0, pending_operation: null })
    return row
  }
  const record = id => tables.commerce_checkouts.find(row => row.id === id)
  const items = id => tables.commerce_checkout_items.filter(row => row.checkout_id === id)
  const held = productId => tables.commerce_checkout_items.filter(row => row.product_id === productId && row.state === 'held')
  const fail = message => { throw new Error(message) }
  const calls = []
  async function rpc(name, p) {
    calls.push({ name, params: copy(p) })
    try {
      let data = null
      switch (name) {
        case 'commerce_inventory_snapshot':
          data = p.p_products.map(id => { const row = inventory(id); return { productId: id, revision: row.revision, operation: tables.commerce_stock_operations.find(op => op.id === row.pending_operation) || null } }); break
        case 'commerce_reserve_checkout': {
          if (!tables.commerce_control[0].checkout_enabled) fail('Checkout is temporarily paused. Please try again shortly.')
          for (const item of p.p_items) {
            const row = inventory(item.productId)
            if (row.pending_operation || row.revision !== item.revision) fail('Inventory changed')
            if (item.stock !== null && held(item.productId).reduce((n, item) => n + item.quantity, 0) + item.quantity > item.stock) fail('This item is reserved or out of stock')
          }
          tables.commerce_checkouts.push({ id: p.p_id, session_id: null, state: 'reserved', session_params: p.p_params, capability_hash: p.p_capability_hash, expires_at: new Date(p.p_params.expires_at * 1000).toISOString(), created_at: new Date().toISOString(), confirmation_sent: false })
          tables.commerce_checkout_items.push(...p.p_items.map(item => ({ checkout_id: p.p_id, product_id: item.productId, quantity: item.quantity, state: 'held' })))
          break
        }
        case 'commerce_adopt_checkout':
          if (!record(p.p_id)) {
            tables.commerce_checkouts.push({ id: p.p_id, session_id: p.p_session_id, state: 'pending', created_at: new Date().toISOString(), confirmation_sent: false })
            tables.commerce_checkout_items.push(...p.p_items.map(item => ({ checkout_id: p.p_id, product_id: item.productId, quantity: item.quantity, state: item.applied ? 'applied' : 'held' })))
          }
          break
        case 'commerce_bind_checkout': {
          const row = record(p.p_id)
          if (!row || row.session_id && row.session_id !== p.p_session_id) fail('Reservation missing or mismatched')
          row.session_id = p.p_session_id
          if (!['released', 'fulfilled'].includes(row.state)) row.state = p.p_state
          break
        }
        case 'commerce_begin_stock_operation': {
          const inv = inventory(p.p_product_id), existing = tables.commerce_stock_operations.find(row => row.id === p.p_id)
          if (existing) { data = existing; break }
          if (inv.pending_operation || inv.revision !== p.p_revision) fail('Inventory changed')
          let metadata = p.p_metadata
          if (p.p_checkout_id) {
            const item = items(p.p_checkout_id).find(row => row.product_id === p.p_product_id)
            if (!item || item.state === 'released') fail('Reservation missing or released')
            if (item.state === 'applied') { data = { state: 'applied' }; break }
            if (p.p_stock !== null && p.p_stock < item.quantity) fail('Stock shortage requires manual reconciliation')
            metadata = p.p_stock === null ? {} : { stockCount: String(p.p_stock - item.quantity), ...(p.p_stock === item.quantity ? { inStock: 'false' } : {}) }
          } else if (held(p.p_product_id).length) fail('Product has checkout reservations')
          data = { id: p.p_id, product_id: p.p_product_id, checkout_id: p.p_checkout_id, metadata, state: 'pending', created_at: new Date().toISOString() }
          tables.commerce_stock_operations.push(data)
          inv.pending_operation = p.p_id
          break
        }
        case 'commerce_complete_stock_operation': {
          const op = tables.commerce_stock_operations.find(row => row.id === p.p_id)
          if (!op) fail('Missing stock operation')
          if (op.state === 'applied') break
          const inv = inventory(op.product_id)
          if (inv.pending_operation !== op.id) fail('Pending operation mismatch')
          op.state = 'applied'; inv.pending_operation = null; inv.revision++
          const item = items(op.checkout_id).find(row => row.product_id === op.product_id)
          if (item) item.state = 'applied'
          break
        }
        case 'commerce_release_checkout':
          if (tables.commerce_stock_operations.some(op => op.checkout_id === p.p_id && op.state === 'pending')) fail('Uncertain stock write')
          for (const item of items(p.p_id)) if (item.state === 'held') item.state = 'released'
          if (record(p.p_id).state !== 'fulfilled') record(p.p_id).state = 'released'
          break
        case 'commerce_finish_checkout':
          if (items(p.p_id).some(item => item.state !== 'applied')) fail('Inventory incomplete')
          if (record(p.p_id).state === 'released') fail('Checkout released')
          record(p.p_id).state = 'fulfilled'
          break
        case 'commerce_confirmation': {
          const row = record(p.p_id)
          if (row.state !== 'fulfilled') fail('Inventory incomplete')
          if (p.p_sent) row.confirmation_sent = true
          if (!row.confirmation_sent && row.confirmation_started_at && Date.now() - Date.parse(row.confirmation_started_at) > 23 * 3600e3) fail('Email needs reconciliation')
          row.confirmation_started_at ||= new Date().toISOString()
          data = { action: row.confirmation_sent ? 'done' : 'send' }
          break
        }
        default: fail(`Unexpected RPC ${name}`)
      }
      return { data: copy(data), error: null }
    } catch (error) { return { data: null, error: { message: error.message } } }
  }
  function from(name) {
    let rows = [...tables[name]], one = false
    const builder = {
      select() { return builder },
      eq(key, value) { rows = rows.filter(row => row[key] === value); return builder },
      in(key, values) { rows = rows.filter(row => values.includes(row[key])); return builder },
      order(key) { rows.sort((a, b) => String(a[key]).localeCompare(String(b[key]))); return builder },
      limit(n) { rows = rows.slice(0, n); return builder },
      maybeSingle() { one = true; return builder },
      then(resolve) { return Promise.resolve({ data: copy(one ? rows[0] || null : rows), error: null }).then(resolve) },
    }
    return builder
  }
  return { tables, calls, client: { rpc, from } }
}
