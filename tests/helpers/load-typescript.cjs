/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS test harness. */
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '../..')
module.exports = function loader(overrides = {}, env = {}) {
  const cache = new Map()
  function load(file) {
    const absolute = path.resolve(root, file)
    if (cache.has(absolute)) return cache.get(absolute).exports
    const loadedModule = { exports: {} }
    cache.set(absolute, loadedModule)
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText
    const sandbox = { module: loadedModule, exports: loadedModule.exports, console: { log() {}, warn() {}, error() {} }, URL, Headers, Request, Response, AbortSignal, setTimeout, clearTimeout, process: { env }, require(id) {
      if (Object.hasOwn(overrides, id)) return overrides[id]
      if (id === 'server-only') return {}
      if (id.startsWith('@/')) return load(`${id.slice(2)}.ts`)
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(absolute), `${id}.ts`)))
      return require(id)
    } }
    vm.runInNewContext(source, sandbox, { filename: absolute })
    return loadedModule.exports
  }
  return load
}
