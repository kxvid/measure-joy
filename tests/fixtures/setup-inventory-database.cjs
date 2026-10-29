/* eslint-disable @typescript-eslint/no-require-imports -- Disposable PostgreSQL CI fixture. */
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { resolve } = require('node:path')

const url = process.env.COMMERCE_TEST_DATABASE_URL
assert.ok(url, 'COMMERCE_TEST_DATABASE_URL is required')
const parsed = new URL(url)
assert.ok(['postgres:', 'postgresql:'].includes(parsed.protocol), 'Expected a PostgreSQL URL')
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname), 'Only a local disposable database may be initialized')
assert.ok(parsed.pathname.endsWith('_test'), 'Database name must end in _test; never initialize production')

const args = [url, '-X', '-v', 'ON_ERROR_STOP=1']
const psql = process.env.PSQL || 'psql'
execFileSync(psql, args, {
  input: `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
    END $$;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  `,
  stdio: ['pipe', 'inherit', 'inherit'],
})
execFileSync(psql, [...args, '-f', resolve(__dirname, '../../supabase/migrations/20261024053622_durable_commerce_inventory.sql')], {
  stdio: 'inherit',
})
