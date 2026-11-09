/* eslint-disable @typescript-eslint/no-require-imports -- Isolated browser shim, no network. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function setup({
  consent = null,
  gpc = false,
  href = "https://www.measurejoy.org/product/prod_Camera?email=private%40example.com",
  ga4 = "G-TEST123",
  meta = "",
} = {}) {
  const events = [],
    pixels = [],
    storage = new Map(),
    session = new Map();
  if (consent) storage.set("measurejoy-privacy-v1", JSON.stringify(consent));
  const testModule = { exports: {} };
  const sandbox = {
    module: testModule,
    exports: testModule.exports,
    URL,
    process: {
      env: {
        NEXT_PUBLIC_GA4_MEASUREMENT_ID: ga4,
        NEXT_PUBLIC_META_PIXEL_ID: meta,
      },
    },
    window: {
      gtag: (...args) => events.push(args),
      fbq: (...args) => pixels.push(args),
    },
    navigator: { globalPrivacyControl: gpc },
    localStorage: { getItem: (k) => storage.get(k) || null },
    sessionStorage: {
      getItem: (k) => session.get(k) || null,
      setItem: (k, v) => session.set(k, v),
    },
    location: new URL(href),
    document: { referrer: "https://example.com/?email=private%40example.com" },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync("lib/analytics.ts", "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    sandbox,
  );
  return { ...testModule.exports, events, pixels };
}
const granted = { version: 1, analytics: true, marketing: false };
const item = {
  product: { id: "prod_Camera", priceInCents: 12999 },
  quantity: 2,
};
test("optional measurement defaults to denied and respects Global Privacy Control", () => {
  for (const options of [
    {},
    { consent: { version: 0, analytics: true } },
    { consent: granted, gpc: true },
    { consent: granted, ga4: "" },
  ]) {
    const a = setup(options);
    assert.equal(
      a.trackCommerce("add_to_cart", a.commerceEvent([item])),
      false,
    );
    assert.equal(a.events.length, 0);
  }
});
test("commerce measurement contains only product IDs, quantities, values and sanitized context", () => {
  const a = setup({ consent: granted });
  assert.equal(a.trackCommerce("add_to_cart", a.commerceEvent([item])), true);
  const payload = a.events[0][2];
  assert.equal(payload.value, 259.98);
  assert.equal(payload.items[0].item_id, "prod_Camera");
  assert.equal(
    payload.page_location,
    "https://www.measurejoy.org/product/prod_Camera",
  );
  assert.equal(payload.page_referrer, "https://example.com");
  assert.equal(JSON.stringify(a.events).includes("private"), false);
});
test("contact, repair and account paths cannot emit optional commerce events", () => {
  for (const path of ["/contact", "/repair", "/account/orders", "/admin"]) {
    const a = setup({
      consent: granted,
      href: `https://www.measurejoy.org${path}`,
    });
    assert.equal(
      a.trackCommerce("add_to_cart", a.commerceEvent([item])),
      false,
    );
    assert.equal(a.events.length, 0);
  }
});
test("purchase requires an opaque transaction ID and is deduplicated per browser session", () => {
  const a = setup({
    consent: granted,
    href: "https://www.measurejoy.org/checkout/return?session_id=cs_live_private",
  });
  const event = a.commerceEvent([item]);
  assert.equal(
    a.trackCommerce("purchase", {
      ...event,
      transaction_id: "cs_live_private",
    }),
    false,
  );
  const paid = { ...event, transaction_id: `mj_${"a".repeat(32)}` };
  assert.equal(a.trackCommerce("purchase", paid), true);
  assert.equal(a.trackCommerce("purchase", paid), false);
  assert.equal(a.events.length, 1);
  assert.equal(JSON.stringify(a.events).includes("cs_live_private"), false);
});
test("only bounded campaign labels are forwarded; private query values are dropped", () => {
  const a = setup();
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        a.campaignParameters(
          "https://www.measurejoy.org/?utm_source=instagram&utm_medium=social&utm_campaign=weekly_drop&email=private",
        ),
      ),
    ),
    {
      campaign_source: "instagram",
      campaign_medium: "social",
      campaign_name: "weekly_drop",
    },
  );
  assert.equal(
    Object.keys(
      a.campaignParameters(
        "https://www.measurejoy.org/?utm_source=person%40example.com&utm_campaign=long%20free%20text",
      ),
    ).length,
    0,
  );
});
test("campaign content, term and ID are bounded while non-web referrers are discarded", () => {
  const a = setup();
  assert.deepEqual(
    JSON.parse(JSON.stringify(a.campaignParameters(
      "https://www.measurejoy.org/shop?utm_source=instagram&utm_content=bio_link&utm_term=compact_camera&utm_id=drop_20261109",
    ))),
    {
      campaign_source: "instagram",
      campaign_content: "bio_link",
      campaign_term: "compact_camera",
      campaign_id: "drop_20261109",
    },
  );
  for (const field of ["utm_content", "utm_term", "utm_id"]) {
    for (const value of ["person%40example.invalid", "free%20text", "a".repeat(61)]) {
      assert.equal(Object.keys(a.campaignParameters(`https://www.measurejoy.org/?${field}=${value}`)).length, 0);
    }
  }
  assert.equal(a.safeReferrer("android-app://com.example/"), "");
  assert.equal(a.safeReferrer("javascript:alert(1)"), "");
});
test("Meta stays off without marketing consent and never receives URLs with query strings", () => {
  const a = setup({ consent: granted, meta: "123456789" });
  a.trackCommerce("add_to_cart", a.commerceEvent([item]));
  assert.equal(a.pixels.length, 0);
  assert.equal(
    a.safeMetaPage(
      "https://www.measurejoy.org/checkout/return?session_id=cs_live_private",
    ),
    false,
  );
  assert.equal(
    a.safeMetaPage("https://www.measurejoy.org/shop?email=private"),
    false,
  );
  assert.equal(a.safeMetaPage("https://www.measurejoy.org/shop"), true);
});
