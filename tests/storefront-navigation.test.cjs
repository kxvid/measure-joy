/* eslint-disable @typescript-eslint/no-require-imports -- Isolated storefront effects; no catalog or browser requests. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const product = (id, name, category) => ({
  id,
  name,
  category,
  description: "",
  images: [],
  priceInCents: 10000,
  stockCount: 1,
  inStock: true,
  condition: "Good",
  specs: {},
});
function fixture() {
  const url = new URL("https://www.measurejoy.org/shop?utm_source=club"),
    hooks = [],
    pending = [],
    writes = [];
  let cursor = 0,
    tree;
  const equal = (a, b) =>
    a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    Suspense: Symbol("Suspense"),
    useState(initial) {
      const i = cursor++;
      hooks[i] ||= { value: initial };
      return [
        hooks[i].value,
        (next) => {
          hooks[i].value =
            typeof next === "function" ? next(hooks[i].value) : next;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (hooks[i] ||= { current: initial });
    },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!hooks[i] || !equal(hooks[i].deps, deps))
        hooks[i] = { value: fn(), deps };
      return hooks[i].value;
    },
    useCallback(fn, deps) {
      return react.useMemo(() => fn, deps);
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!hooks[i] || !equal(hooks[i].deps, deps)) {
        const old = hooks[i];
        hooks[i] = { deps };
        pending.push(() => {
          old?.cleanup?.();
          hooks[i].cleanup = fn();
        });
      }
    },
  };
  const imports = {
    react,
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "next/link": { __esModule: true, default: function Link() {} },
    "next/navigation": { useSearchParams: () => url.searchParams },
    "@/lib/cart-context": { useCart: () => ({ items: [], itemCount: 0 }) },
    "./use-saved-finds": {
      useSavedFinds: () => ({ savedIds: [], ready: true }),
    },
    "./copy-provider": { useStorefrontCopy: () => ({}) },
    "@/components/newsletter": {},
    "@/components/product-reviews": {},
    "./site-chrome": {},
    "lucide-react": {},
  };
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const loaded = { exports: {} };
    cache.set(absolute, loaded);
    const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(
      code,
      {
        module: loaded,
        exports: loaded.exports,
        process: { env: {} },
        URL,
        URLSearchParams,
        AbortController,
        setTimeout,
        clearTimeout,
        fetch: () => new Promise(() => {}),
        window: {
          location: url,
          addEventListener() {},
          removeEventListener() {},
          history: {
            state: null,
            replaceState(_, __, next) {
              writes.push(next);
              url.href = next;
            },
          },
        },
        localStorage: { getItem: () => null, setItem() {} },
        document: { body: { style: {} } },
        require(id) {
          if (Object.hasOwn(imports, id)) return imports[id];
          const next = id.startsWith("@/")
            ? path.join(root, id.slice(2))
            : path.resolve(path.dirname(absolute), id);
          return load(next + ".ts");
        },
      },
      { filename: file },
    );
    return loaded.exports;
  }
  const Storefront = load("components/storefront/storefront.tsx").default;
  const products = [
    product("prod_Digital", "Canon PowerShot digital camera", "digital"),
    product("prod_Film", "Canon AE-1 film camera", "film"),
  ];
  function nodes(node, result = []) {
    if (!node || typeof node !== "object") return result;
    if (Array.isArray(node)) {
      node.forEach((child) => nodes(child, result));
      return result;
    }
    result.push(node);
    nodes(node.props?.children, result);
    return result;
  }
  function render() {
    cursor = 0;
    tree = Storefront({ mode: "shop", initialProducts: products });
    for (const node of nodes(tree))
      if (node.type?.name === "StorefrontFilterSync") node.type(node.props);
  }
  function flush() {
    for (let i = 0; i < 4; i++) {
      render();
      while (pending.length) pending.shift()();
    }
  }
  flush();
  return {
    url,
    writes,
    flush,
    navigate(query) {
      url.search = query;
      flush();
    },
    cards: () =>
      nodes(tree)
        .filter((node) => node.type?.name === "ProductCard")
        .map((node) => node.props.product.id),
    button(text) {
      return nodes(tree).find(
        (node) =>
          node.type === "button" &&
          (node.props.children === text || node.props.children?.[0] === text),
      );
    },
  };
}

test("same-path client navigation restores category, search and saved filters without rewriting the destination", () => {
  const h = fixture();
  h.navigate("?category=film&utm_source=club");
  assert.deepEqual(h.cards(), ["prod_Film"]);
  assert.equal(h.button("Film cameras").props["aria-pressed"], true);
  assert.equal(h.writes.length, 0);
  h.navigate("?search=PowerShot&utm_source=club");
  assert.deepEqual(h.cards(), ["prod_Digital"]);
  h.navigate("?saved=1&utm_source=club");
  assert.deepEqual(h.cards(), []);
  assert.equal(h.url.searchParams.get("saved"), "1");
  assert.equal(h.writes.length, 0);
});

test("manual filtering and empty-result reset update URL once while preserving campaign tags", () => {
  const h = fixture();
  h.button("Film cameras").props.onClick();
  h.flush();
  assert.equal(h.url.searchParams.get("category"), "film");
  assert.equal(h.url.searchParams.get("utm_source"), "club");
  assert.deepEqual(h.cards(), ["prod_Film"]);
  h.navigate("?saved=1&utm_source=club");
  h.button("See all finds ").props.onClick();
  h.flush();
  assert.equal(h.url.searchParams.has("saved"), false);
  assert.equal(h.url.searchParams.get("stock"), "all");
  assert.equal(h.url.searchParams.get("utm_source"), "club");
  assert.equal(h.writes.length, 2);
  assert.deepEqual(h.cards(), ["prod_Digital", "prod_Film"]);
});
