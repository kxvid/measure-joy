/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server-rendering test harness. */
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const root = path.resolve(__dirname, '../..')

module.exports = function makeLoader(overrides = {}) {
  const cache = new Map()
  function load(file) {
    const absolute = path.resolve(root, file)
    if (cache.has(absolute)) return cache.get(absolute).exports
    const loaded = { exports: {} }
    cache.set(absolute, loaded)
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      fileName: absolute,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText
    vm.runInNewContext(source, { module: loaded, exports: loaded.exports, console, URL, process, require(id) {
      if (Object.hasOwn(overrides, id)) return overrides[id]
      if (id === 'server-only') return {}
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }
      if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }
      if (id.startsWith('@/') || id.startsWith('.')) {
        const resolved = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(absolute), id)
        return load(fs.existsSync(`${resolved}.tsx`) ? `${resolved}.tsx` : `${resolved}.ts`)
      }
      return require(id)
    } }, { filename: absolute })
    return loaded.exports
  }
  return load
}
