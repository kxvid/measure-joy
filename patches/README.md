# ESLint minimatch compatibility patches

[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
affects minimatch versions below 11.0.1. The development dependency graph is
overridden to 11.0.3, whose matching engine fixes the advisory. No vulnerable
minimatch version or old regular-expression implementation is retained.

The currently released ESLint consumers still request minimatch 3 or 10.
These patches adapt only the APIs they use:

- `@eslint/config-array` and `@eslint/eslintrc`: import the ESM namespace instead
  of the removed default export.
- `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-import`:
  obtain the callable `minimatch` named export.
- `import/no-internal-modules`: compile `Minimatch` objects and call `match`
  instead of the removed `makeRe`/`RegExp.test` API. Allow/forbid enforcement
  stays enabled.

`tests/lint-glob-compatibility.test.mjs` exercises inclusion/exclusion globs,
ESM loading, React and accessibility exceptions, and permitted/forbidden
imports. The initial compatibility checks passed on the old graph, and six of
those seven checks failed with an unpatched minimatch 11 override.

The `import/no-internal-modules` rule is not enabled in the storefront config.
If enabled later, it uses minimatch 11's direct matcher semantics: `react/**`
does not include `react/.hidden` unless a dotfile pattern is explicit, and
`react/!(private)/**` correctly excludes `react/private/a`. The old `makeRe`
implementation incorrectly matched those paths. Regression tests cover these
intentional differences rather than preserving the old regex bugs.

Remove each version-specific patch when its upstream consumer supports
minimatch 11. Remove the override only once the entire lockfile is patched and
both dependency audits and these regression checks pass. Do not replace this
with an audit exception. See the [ESLint upstream tracking issue](https://github.com/eslint/eslint/issues/21463).
