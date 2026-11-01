import assert from "node:assert/strict"
import { createRequire } from "node:module"
import path from "node:path"
import { test } from "node:test"
import { ESLint, Linter } from "eslint"

// Exercise the plugins bundled by Next rather than adding duplicate dependencies.
const nextRequire = createRequire(import.meta.resolve("eslint-config-next"))
const plugins = {
  import: nextRequire("eslint-plugin-import"),
  react: nextRequire("eslint-plugin-react"),
  "jsx-a11y": nextRequire("eslint-plugin-jsx-a11y"),
}

function lintRule(rule, options, code) {
  const messages = new Linter().verify(code, {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "19.3" } },
    plugins,
    rules: { [rule]: ["error", options] },
  })
  assert.ok(messages.every((message) => !message.fatal), JSON.stringify(messages))
  return messages.map((message) => message.ruleId)
}

test("ESLint glob selection preserves nested files, dotfiles and exclusions", async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      { ignores: ["build/**", "**/*.generated.js", "!src/keep.generated.js"] },
      { files: ["src/**/*.{js,jsx}"], rules: { "no-debugger": "error" } },
    ],
  })
  for (const filePath of ["src/index.js", "src/deep/component.jsx", "src/.hidden.js", "src/keep.generated.js"]) {
    const [result] = await eslint.lintText("debugger", { filePath })
    assert.deepEqual(result.messages.map((message) => message.ruleId), ["no-debugger"], filePath)
  }
  for (const filePath of ["build/index.js", "src/skip.generated.js"]) {
    assert.equal(await eslint.isPathIgnored(filePath), true, filePath)
  }
})

test("React component-name glob exceptions do not hide other violations", () => {
  const rule = "react/jsx-pascal-case"
  assert.deepEqual(lintRule(rule, { ignore: ["Allowed_*"] }, "const x = <Allowed_widget />"), [])
  assert.deepEqual(lintRule(rule, { ignore: ["Allowed_*"] }, "const x = <Other_widget />"), [rule])
})

test("React render-prop globs preserve nested-component enforcement", () => {
  const rule = "react/no-unstable-nested-components"
  const options = { propNamePattern: "render*" }
  assert.deepEqual(lintRule(rule, options, "function App() { return <List renderItem={() => <div />} /> }"), [])
  assert.deepEqual(lintRule(rule, options, "function App() { return <List item={() => <div />} /> }"), [rule])
})

test("Accessibility control globs require both a control and accessible text", () => {
  const rule = "jsx-a11y/label-has-associated-control"
  const options = { assert: "nesting", controlComponents: ["Form*Control"] }
  assert.deepEqual(lintRule(rule, options, "const x = <label>Name<FormTextControl /></label>"), [])
  assert.deepEqual(lintRule(rule, options, "const x = <label>Name<Other /></label>"), [rule])
  assert.deepEqual(lintRule(rule, options, "const x = <label><FormTextControl /></label>"), [rule])
})

test("Import side-effect glob allowances still report forbidden imports", () => {
  const rule = "import/no-unassigned-import"
  const options = { allow: ["**/*.css"] }
  assert.deepEqual(lintRule(rule, options, 'import "./styles/site.css"'), [])
  assert.deepEqual(lintRule(rule, options, 'import "./scripts/init.js"'), [rule])
})

test("Import internal-module globs enforce allow and forbid paths", () => {
  const rule = "import/no-internal-modules"
  assert.deepEqual(lintRule(rule, { forbid: ["react/**"] }, 'import x from "react/jsx-runtime"'), [rule])
  assert.deepEqual(lintRule(rule, { forbid: ["react/**"] }, 'import x from "react"'), [])
  assert.deepEqual(lintRule(rule, { allow: ["react/**"] }, 'import x from "react/jsx-runtime"'), [])
  assert.deepEqual(lintRule(rule, { allow: ["other/**"] }, 'import x from "react/jsx-runtime"'), [rule])
})

test("Import internal-module matching uses explicit dotfile and negative-extglob semantics", () => {
  const rule = "import/no-internal-modules"
  // minimatch 11 matches globs directly; it does not retain v3 makeRe edge-case bugs.
  assert.deepEqual(lintRule(rule, { forbid: ["react/**"] }, 'import x from "react/.hidden"'), [])
  assert.deepEqual(lintRule(rule, { forbid: ["react/**/.*"] }, 'import x from "react/.hidden"'), [rule])
  assert.deepEqual(lintRule(rule, { forbid: ["react/!(private)/**"] }, 'import x from "react/private/a"'), [])
  assert.deepEqual(lintRule(rule, { forbid: ["react/!(private)/**"] }, 'import x from "react/public/a"'), [rule])
})

test("ESLint ESM entry points load and legacy override globs still match", async () => {
  const eslintRequire = createRequire(import.meta.resolve("eslint"))
  // Resolve the ESM entries explicitly so CommonJS loading cannot mask a broken import.
  const configArrayEntry = eslintRequire.resolve("@eslint/config-array")
  const { ConfigArray } = await import(path.join(path.dirname(configArrayEntry), "../esm/index.js"))
  const configs = new ConfigArray([{ files: ["**/*.js"] }], { basePath: process.cwd() })
  await configs.normalize()
  assert.equal(configs.isFileIgnored(path.join(process.cwd(), "src/index.js")), false)

  const eslintrcEntry = eslintRequire.resolve("@eslint/eslintrc")
  const { OverrideTester } = await import(path.join(path.dirname(eslintrcEntry), "../lib/config-array/override-tester.js"))
  const tester = OverrideTester.create(["src/**/*.js"], ["**/*.test.js"], process.cwd())
  assert.equal(tester.test(path.join(process.cwd(), "src/deep/index.js")), true)
  assert.equal(tester.test(path.join(process.cwd(), "src/deep/index.test.js")), false)

  const basename = OverrideTester.create(["*.js"], [], process.cwd())
  assert.equal(basename.test(path.join(process.cwd(), "src/deep/index.js")), true)
  assert.equal(basename.test(path.join(process.cwd(), "src/.hidden.js")), true)
  const rootOnly = OverrideTester.create(["./*.js"], [], process.cwd())
  assert.equal(rootOnly.test(path.join(process.cwd(), "index.js")), true)
  assert.equal(rootOnly.test(path.join(process.cwd(), "src/index.js")), false)
  const route = OverrideTester.create(["app/product/\\[id\\]/*.js"], [], process.cwd())
  assert.equal(route.test(path.join(process.cwd(), "app/product/[id]/page.js")), true)
  assert.equal(route.test(path.join(process.cwd(), "app/product/i/page.js")), false)
})
