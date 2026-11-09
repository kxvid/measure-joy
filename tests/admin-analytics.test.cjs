/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server/Google transport harness. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const privateKey = '-----BEGIN PRIVATE KEY-----\nmock-private-key-never-serialize\n-----END PRIVATE KEY-----\n';
const credentials = {
  type: 'service_account', client_email: 'reports@measurejoy-reports.iam.gserviceaccount.com', private_key: privateKey,
  token_uri: 'https://attacker.invalid/token', project_id: 'private-project-never-serialize',
};
const configured = { GA4_PROPERTY_ID: '123456789', GA4_SERVICE_ACCOUNT_JSON: JSON.stringify(credentials) };
const values = {
  activeUsers: '10', sessions: '12', screenPageViews: '40', ecommercePurchases: '2', purchaseRevenue: '250.5',
  itemsViewed: '5', itemsAddedToCart: '3', itemsPurchased: '2', itemRevenue: '50',
};

function reportFor(request, transform) {
  const dimensions = request.dimensions || [];
  const metrics = request.metrics || [];
  const report = {
    dimensionHeaders: dimensions.map(({ name }) => ({ name })),
    metricHeaders: metrics.map(({ name }) => ({ name, type: /Revenue$/.test(name) ? 'TYPE_FLOAT' : 'TYPE_INTEGER' })),
    rows: [{
      dimensionValues: dimensions.map(({ name }) => ({ value: name === 'date' ? request.dateRanges[0].startDate.replaceAll('-', '') : name === 'pagePath' ? '/shop' : name === 'itemId' ? 'prod_Camera1' : 'google / organic' })),
      metricValues: metrics.map(({ name }) => ({ value: values[name] || '1' })),
    }],
    rowCount: 1,
    metadata: { currencyCode: 'USD', timeZone: 'America/Los_Angeles' },
  };
  return transform ? transform(report, request) : report;
}

// Exact no-dimension empty response shape verified against the live GA4 property.
function headerlessEmptyReport() {
  return {
    metadata: { schemaRestrictionResponse: {}, currencyCode: 'USD', timeZone: 'America/Los_Angeles' },
    propertyQuota: {},
    kind: 'analyticsData#runReport',
  };
}

function harness(options = {}) {
  let now = Date.parse(options.now || '2026-11-09T20:00:00Z');
  let status = options.status || { isSignedIn: true, isAdmin: true, email: 'owner@example.com' };
  let authChecks = 0, tokenCalls = 0;
  const calls = [], authOptions = [], logs = [], modules = new Map();
  const env = { ...configured, ...options.env };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  class JWT {
    constructor(config) { authOptions.push(config); }
    async getAccessToken() {
      tokenCalls++;
      if (options.token) return options.token();
      return { token: 'mock-access-token-never-serialize' };
    }
  }
  async function transport(url, init = {}) {
    const call = { url: String(url), init, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    if (options.transport) return options.transport(call, calls.length);
    assert.match(call.url, /^https:\/\/analyticsdata\.googleapis\.com\/v1beta\/properties\/123456789:batchRunReports$/);
    return Response.json({ reports: call.body.requests.map((request) => reportFor(request, options.report)) });
  }
  function load(file) {
    const absolute = path.resolve(root, file);
    if (modules.has(absolute)) return modules.get(absolute).exports;
    const loadedModule = { exports: {} };
    modules.set(absolute, loadedModule);
    const sandbox = {
      module: loadedModule, exports: loadedModule.exports, URL, URLSearchParams, Headers, Request, Response, AbortSignal, AbortController,
      Date: Clock, Intl, Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout, fetch: transport,
      console: { error: (...args) => logs.push(args), warn: (...args) => logs.push(args), log: (...args) => logs.push(args) },
      process: { env },
      require(id) {
        if (id === 'server-only') return {};
        if (id === 'google-auth-library') return { JWT };
        if (id === '@/app/actions/auth-admin') return { getAdminStatus: async () => { authChecks++; return status; } };
        if (id.startsWith('@/')) return load(`${id.slice(2)}.ts`);
        if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(absolute), id.endsWith('.ts') ? id : `${id}.ts`)));
        return require(id);
      },
    };
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(source, sandbox, { filename: absolute });
    return loadedModule.exports;
  }
  return { load, calls, authOptions, logs, env, advance: (ms) => { now += ms; }, setStatus: (next) => { status = next; }, authChecks: () => authChecks, tokenCalls: () => tokenCalls };
}

test('report dates use complete Los Angeles days across UTC, DST and leap-day boundaries', () => {
  const { reportingPeriod } = harness().load('lib/ga4-reporting.ts');
  const period = reportingPeriod(7, new Date('2026-11-09T02:00:00Z'));
  assert.deepEqual(JSON.parse(JSON.stringify(period)), { days: 7, startDate: '2026-11-01', endDate: '2026-11-07', previousStartDate: '2026-10-25', previousEndDate: '2026-10-31', timeZone: 'America/Los_Angeles' });
  const leap = reportingPeriod(7, new Date('2028-03-01T20:00:00Z'));
  assert.equal(leap.startDate, '2028-02-23');
  assert.equal(leap.endDate, '2028-02-29');
  assert.equal(leap.previousStartDate, '2028-02-16');
  assert.equal(leap.previousEndDate, '2028-02-22');
});

test('only supported report ranges are accepted', () => {
  const { parseReportDays } = harness().load('lib/ga4-reporting.ts');
  for (const days of [7, 30, 90]) {
    assert.equal(parseReportDays(days), days);
    assert.equal(parseReportDays(String(days)), days);
  }
  for (const days of [0, 1, 8, 365, -7, 7.1, Infinity, NaN, '7.0', '07', '7junk', {}, [], null])
    assert.equal(parseReportDays(days), null);
});

test('report wrapper denies anonymous and nonadmin requests before OAuth or Google reporting', async () => {
  for (const status of [{ isSignedIn: false, isAdmin: false }, { isSignedIn: true, isAdmin: false }]) {
    const h = harness({ status });
    await assert.rejects(h.load('lib/admin-analytics.ts').getAdminAnalytics(30), (error) => error.status === (status.isSignedIn ? 403 : 401));
    assert.equal(h.calls.length, 0);
    assert.equal(h.tokenCalls(), 0);
    assert.equal(h.authOptions.length, 0);
  }
});

test('invalid ranges are rejected before configured credentials are used', async () => {
  const h = harness();
  for (const days of [0, 365, '30x', '90&property=9999']) {
    await assert.rejects(h.load('lib/admin-analytics.ts').getAdminAnalytics(days), (error) => error.status === 400);
  }
  assert.equal(h.calls.length, 0);
  assert.equal(h.tokenCalls(), 0);
});

test('missing and malformed reporting credentials produce an explicit setup state without any Google call', async () => {
  for (const env of [
    { GA4_PROPERTY_ID: undefined }, { GA4_PROPERTY_ID: 'G-PUBLICID' }, { GA4_PROPERTY_ID: '123/../../admin' },
    { GA4_SERVICE_ACCOUNT_JSON: undefined }, { GA4_SERVICE_ACCOUNT_JSON: '{' },
    { GA4_SERVICE_ACCOUNT_JSON: JSON.stringify({ ...credentials, type: 'external_account' }) },
    { GA4_SERVICE_ACCOUNT_JSON: JSON.stringify({ ...credentials, private_key: '' }) },
  ]) {
    const h = harness({ env });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
    assert.equal(result.status, 'not_configured');
    assert.equal(h.calls.length, 0);
    assert.equal(h.authOptions.length, 0);
    assert.doesNotMatch(JSON.stringify(result), /mock-private|private-project|attacker\.invalid/);
  }
});

test('configured reports use read-only scopes, fixed endpoints, bounded presets and sanitized results', async () => {
  const h = harness();
  const result = await h.load('lib/admin-analytics.ts').getAdminAnalytics(30);
  assert.equal(result.status, 'ready');
  assert.equal(result.report.current.revenue, 250.5);
  assert.equal(result.report.current.users, 10);
  assert.equal(result.report.currency, 'USD');
  assert.equal(h.calls.length, 2);
  assert.equal(h.tokenCalls(), 1);
  assert.equal(h.authOptions.length, 1);
  assert.deepEqual(Array.from(h.authOptions[0].scopes), ['https://www.googleapis.com/auth/analytics.readonly']);
  assert.equal(h.authOptions[0].email, credentials.client_email);
  assert.equal(h.authOptions[0].key, privateKey);
  assert.equal(h.authOptions[0].token_uri, undefined);
  assert.equal(h.authOptions[0].project_id, undefined);
  assert.equal(h.authOptions[0].transporterOptions.timeout, 8000);
  assert.equal(h.authOptions[0].transporterOptions.retry, false);
  const requests = h.calls.flatMap(({ body }) => body.requests);
  assert.equal(requests.length, 6);
  for (const call of h.calls) {
    assert.equal(call.init.method, 'POST');
    assert.equal(call.init.cache, 'no-store');
    assert.ok(call.init.signal instanceof AbortSignal);
    assert.equal(new Headers(call.init.headers).get('authorization'), 'Bearer mock-access-token-never-serialize');
    assert.ok(call.body.requests.length <= 5);
  }
  for (const request of requests) {
    assert.ok(Number(request.limit) > 0 && Number(request.limit) <= 100);
    assert.match(JSON.stringify(request.dimensionFilter), /hostName/);
    assert.match(JSON.stringify(request.dimensionFilter), /measurejoy\.org/);
    assert.doesNotMatch(JSON.stringify(request), /pagePathPlusQueryString|pageLocation|userId|userPseudoId/);
  }
  const items = requests.find(({ dimensions }) => dimensions?.some(({ name }) => name === 'itemId'));
  assert.deepEqual(Array.from(items.metrics, ({ name }) => name), ['itemsViewed', 'itemsAddedToCart', 'itemsPurchased', 'itemRevenue']);
  assert.doesNotMatch(JSON.stringify(result), /mock-access-token|mock-private-key|private-project|client_email|private_key|token_uri/);
});

test('cached reports still require authorization and expire after five minutes', async () => {
  const h = harness();
  const { getAdminAnalytics } = h.load('lib/admin-analytics.ts');
  const first = await getAdminAnalytics(30);
  assert.equal(first.status, 'ready');
  const cached = await getAdminAnalytics(30);
  assert.equal(cached.report.fetchedAt, first.report.fetchedAt);
  assert.equal(h.calls.length, 2);
  h.setStatus({ isSignedIn: true, isAdmin: false });
  await assert.rejects(getAdminAnalytics(30), (error) => error.status === 403);
  assert.equal(h.calls.length, 2);
  h.setStatus({ isSignedIn: true, isAdmin: true });
  h.advance(5 * 60_000 + 1);
  const refreshed = await getAdminAnalytics(30);
  assert.equal(refreshed.status, 'ready');
  assert.notEqual(refreshed.report.fetchedAt, first.report.fetchedAt);
  assert.equal(h.calls.length, 4);
  assert.equal(h.authChecks(), 4);
});

test('simultaneous requests for one reporting period share one bounded provider read', async () => {
  let release;
  const pendingToken = new Promise((resolve) => { release = resolve; });
  const h = harness({ token: () => pendingToken });
  const { getAdminAnalytics } = h.load('lib/admin-analytics.ts');
  const pending = Array.from({ length: 5 }, () => getAdminAnalytics(7));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.tokenCalls(), 1);
  assert.equal(h.calls.length, 0);
  release({ token: 'mock-access-token-never-serialize' });
  const results = await Promise.all(pending);
  assert.ok(results.every(({ status }) => status === 'ready'));
  assert.equal(h.calls.length, 2);
  assert.equal(h.authChecks(), 5);
});

test('empty reports are honest zero-data results rather than connection failures', async () => {
  const h = harness({ report: (report) => ({ ...report, rows: [], rowCount: 0 }) });
  const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(7);
  assert.equal(result.status, 'empty');
  assert.deepEqual(JSON.parse(JSON.stringify(result.report.current)), { users: 0, sessions: 0, views: 0, purchases: 0, revenue: 0 });
  assert.equal(result.report.daily.length, 7);
  assert.equal(result.report.daily.at(0).date, result.report.period.startDate);
  assert.equal(result.report.daily.at(-1).date, result.report.period.endDate);
  assert.ok(result.report.daily.every(({ users, sessions, views }) => users === 0 && sessions === 0 && views === 0));
  assert.equal(result.report.products.length, 0);
});

test('verified headerless empty totals coexist with normal empty dimensional reports', async () => {
  for (const explicitZero of [false, true]) {
    const h = harness({ report: (report, request) => request.dimensions.length
      ? { ...report, rows: [], rowCount: 0 }
      : { ...headerlessEmptyReport(), ...(explicitZero ? { rows: [], rowCount: 0 } : {}) } });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(7);
    assert.equal(result.status, 'empty');
    for (const totals of [result.report.current, result.report.previous])
      assert.deepEqual(JSON.parse(JSON.stringify(totals)), { users: 0, sessions: 0, views: 0, purchases: 0, revenue: 0 });
    assert.equal(result.report.daily.length, 7);
    assert.ok(result.report.daily.every(({ users, sessions, views }) => users === 0 && sessions === 0 && views === 0));
    assert.equal(result.report.products.length, 0);
    assert.equal(h.calls.length, 2);
  }
});

test('headerless empty totals still validate metadata and preserve safe warnings', async () => {
  for (const [metadata, expectedMessage] of [
    [{ currencyCode: 'EUR' }, /currency/],
    [{ timeZone: 'Europe/London' }, /time zone/],
    [{ schemaRestrictionResponse: { activeMetricRestrictions: [{ metricName: 'purchaseRevenue', restrictedMetricTypes: ['REVENUE_DATA'] }] } }, /restricted/],
  ]) {
    const h = harness({ report: (report, request) => request.dimensions.length ? report : {
      ...headerlessEmptyReport(), metadata: { ...headerlessEmptyReport().metadata, ...metadata },
    } });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(7);
    assert.equal(result.status, 'error');
    assert.match(result.message, expectedMessage);
    assert.equal(result.report, undefined);
  }
  const h = harness({ report: (report, request) => request.dimensions.length ? { ...report, rows: [] } : {
    ...headerlessEmptyReport(), metadata: { ...headerlessEmptyReport().metadata, subjectToThresholding: true, emptyReason: 'private provider reason' },
  } });
  const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(7);
  assert.equal(result.status, 'empty');
  assert.ok(result.report.warnings.some((message) => /privacy/.test(message)));
  assert.ok(result.report.warnings.some((message) => /empty/.test(message)));
  assert.doesNotMatch(JSON.stringify(result), /private provider reason/);
});

test('empty-total exception never accepts missing dimensional headers or malformed/nonempty totals', async () => {
  const dimensional = harness({ report: (report, request) => request.dimensions.length ? headerlessEmptyReport() : report });
  assert.equal((await dimensional.load('lib/ga4-reporting.ts').loadGa4Report(7)).status, 'error');
  for (const invalid of [
    { kind: undefined }, { kind: 'unrelated#response' }, { metadata: undefined }, { metadata: {} },
    { metricHeaders: [] }, { metricHeaders: [{ name: 'unexpectedMetric' }] }, { dimensionHeaders: [] },
    { rows: [{}] }, { rows: null }, { rowCount: 1 }, { rowCount: '0' },
  ]) {
    const h = harness({ report: (report, request) => request.dimensions.length ? report : { ...headerlessEmptyReport(), ...invalid } });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(7);
    assert.equal(result.status, 'error');
    assert.equal(result.report, undefined);
  }
});

test('net refund revenue remains negative while count metrics stay nonnegative', async () => {
  const h = harness({ report: (report, request) => ({
    ...report, rows: report.rows.map((row) => ({ ...row, metricValues: row.metricValues.map((value, i) => /Revenue$/.test(request.metrics[i].name) ? { value: '-12.50' } : value) })),
  }) });
  const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
  assert.equal(result.status, 'ready');
  assert.equal(result.report.current.revenue, -12.5);
  assert.equal(result.report.products[0].revenue, -12.5);
});

test('report metadata warnings are retained without returning raw provider details', async () => {
  const h = harness({ report: (report) => ({ ...report, metadata: {
    ...report.metadata, subjectToThresholding: true, dataLossFromOtherRow: true,
    samplingMetadatas: [{ samplesReadCount: '10', samplingSpaceSize: '100' }],
    dataTruncationReasons: [{ description: 'private provider warning never serialize' }],
    emptyReason: 'private provider reason never serialize',
  } }) });
  const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
  assert.equal(result.status, 'ready');
  assert.ok(result.report.warnings.some((message) => /withhold|privacy/i.test(message)));
  assert.ok(result.report.warnings.some((message) => /sampled/i.test(message)));
  assert.ok(result.report.warnings.some((message) => /truncated/i.test(message)));
  assert.ok(result.report.warnings.some((message) => /empty/i.test(message)));
  assert.doesNotMatch(JSON.stringify(result), /private provider/);
});

test('restricted metrics and mismatched property timezone/currency never masquerade as store totals', async () => {
  for (const metadata of [
    { currencyCode: 'EUR' }, { timeZone: 'Europe/London' },
    { schemaRestrictionResponse: { activeMetricRestrictions: [{ metricName: 'purchaseRevenue', restrictedMetricTypes: ['REVENUE_DATA'] }] } },
  ]) {
    const h = harness({ report: (report) => ({ ...report, metadata: { ...report.metadata, ...metadata } }) });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
    assert.equal(result.status, 'error');
    assert.equal(result.report, undefined);
  }
});

test('page results discard query/fragment values and labels are bounded and stripped of controls', async () => {
  const h = harness({ report: (report, request) => {
    const dimension = request.dimensions?.[0]?.name;
    if (dimension === 'pagePath') report.rows[0].dimensionValues[0].value = '/shop?email=private@example.com#session_secret';
    if (dimension === 'sessionSourceMedium') report.rows[0].dimensionValues[0].value = `google\n\u0000 / ${'a'.repeat(250)}`;
    return report;
  } });
  const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
  assert.equal(result.status, 'ready');
  assert.equal(result.report.pages[0].path, '/shop');
  assert.ok(result.report.channels[0].channel.length <= 180);
  assert.doesNotMatch(result.report.channels[0].channel, /[\x00-\x1f\x7f]/);
  assert.doesNotMatch(JSON.stringify(result), /private@example|session_secret/);
});

test('unexpected schemas, excess rows and invalid report dates fail without invented data', async () => {
  for (const transform of [
    (report) => ({ ...report, metricHeaders: [{ name: 'unexpectedMetric' }] }),
    (report, request) => ({ ...report, rows: Array.from({ length: request.limit + 1 }, () => report.rows[0]) }),
    ...['20261199', '20261031', 'not-a-date'].map((date) => (report, request) => {
      if (request.dimensions?.[0]?.name === 'date') report.rows[0].dimensionValues[0].value = date;
      return report;
    }),
  ]) {
    const h = harness({ report: transform });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(7);
    assert.equal(result.status, 'error');
    assert.equal(result.report, undefined);
  }
});

for (const malformed of ['NaN', 'Infinity', '1e999', '9007199254740992', '-1', '1.5']) {
  test(`malformed count metric ${malformed} produces an explicit error`, async () => {
    const h = harness({ report: (report) => {
      report.rows[0].metricValues[0].value = malformed;
      return report;
    } });
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
    assert.equal(result.status, 'error');
    assert.equal(result.report, undefined);
  });
}

for (const status of [401, 403, 429, 500]) {
  test(`Google status ${status} is sanitized, cached briefly and never retried in a loop`, async () => {
    const h = harness({ transport: () => Response.json({ error: { message: 'private provider bearer mock-access-token-never-serialize' } }, { status }) });
    const { loadGa4Report } = h.load('lib/ga4-reporting.ts');
    const first = await loadGa4Report(30);
    assert.equal(first.status, 'error');
    assert.equal(first.report, undefined);
    assert.doesNotMatch(first.message, /private provider|mock-access-token/);
    if (status === 429) assert.match(first.message, /limit|quota|few minutes/i);
    await loadGa4Report(30);
    assert.equal(h.calls.length, 1);
    h.advance(30_001);
    await loadGa4Report(30);
    assert.equal(h.calls.length, 2);
    assert.equal(h.logs.length, 0);
  });
}

test('OAuth and request timeout failures do not leak credential or response details', async () => {
  for (const options of [
    { token: () => { throw new Error(`provider credential ${privateKey}`); } },
    { token: () => ({ token: null }) },
    { transport: () => { const error = new Error('private timeout content'); error.name = 'AbortError'; throw error; } },
    { transport: () => new Response('not JSON private provider body') },
    { transport: () => Response.json({ reports: [] }) },
    { transport: () => new Response('x'.repeat(1_000_001)) },
  ]) {
    const h = harness(options);
    const result = await h.load('lib/ga4-reporting.ts').loadGa4Report(30);
    assert.equal(result.status, 'error');
    assert.equal(result.report, undefined);
    assert.doesNotMatch(JSON.stringify(result), /private|provider credential|mock-access-token/i);
    assert.ok(h.calls.length <= 1);
    assert.equal(h.logs.length, 0);
  }
});

test('refresh failure after cache expiry returns an error instead of stale or invented values', async () => {
  let fail = false;
  const h = harness({ transport: (call) => fail
    ? new Response('private provider failure', { status: 500 })
    : Response.json({ reports: call.body.requests.map((request) => reportFor(request)) }) });
  const { loadGa4Report } = h.load('lib/ga4-reporting.ts');
  assert.equal((await loadGa4Report(30)).status, 'ready');
  fail = true;
  h.advance(300_001);
  const failed = await loadGa4Report(30);
  assert.equal(failed.status, 'error');
  assert.equal(failed.report, undefined);
  assert.equal(h.calls.length, 3);
});

test('GET API defaults to 30 days, rejects duplicate ranges and stays private with errors', async () => {
  const h = harness();
  const { GET } = h.load('app/api/admin/analytics/route.ts');
  const response = await GET(new Request('https://measurejoy.org/api/admin/analytics?property=attacker'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await response.json()).report.period.days, 30);
  const before = h.calls.length;
  const invalid = await GET(new Request('https://measurejoy.org/api/admin/analytics?days=7&days=90'));
  assert.equal(invalid.status, 400);
  assert.match(invalid.headers.get('cache-control'), /no-store/);
  assert.equal(h.calls.length, before);
  h.setStatus({ isSignedIn: false, isAdmin: false });
  const anonymous = await GET(new Request('https://measurejoy.org/api/admin/analytics?days=7'));
  assert.equal(anonymous.status, 401);
  assert.match(anonymous.headers.get('cache-control'), /no-store/);
  assert.equal(h.calls.length, before);
});
