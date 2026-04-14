# Supabase Migrations

SQL files that define the database schema. Apply them in numeric order.

## How to run a migration

Supabase CLI is **not required** for this project. Apply each migration by
pasting its contents into the Supabase Dashboard:

1. Go to your project → **SQL Editor** → **New query**
2. Paste the full contents of the `.sql` file
3. Click **Run**
4. Run any verification query included at the bottom of the file (they're
   commented out — uncomment and run them separately)

## Current migrations

### `001_create_site_content.sql`
Creates the CMS `site_content` table used by `/admin/content` and seeds it
with the default homepage / about-page copy.

### `002_enable_rls_security.sql` **⚠️ URGENT — run this now**

Enables Row-Level Security on 5 tables flagged by Supabase's Security
Advisor (`reviews`, `orders`, `wishlist`, `profiles`,
`order_status_history`) and tightens the misconfigured write policy on
`site_content`.

**Before running** this, export your current state for peace of mind:

```sql
-- Copy this into a new query and hit Run. Screenshot the result.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Then apply** `002_enable_rls_security.sql` and run this verification:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'reviews', 'orders', 'wishlist', 'profiles',
    'order_status_history', 'site_content'
  )
ORDER BY tablename;
```

Expected: `rowsecurity = true` for all 6 rows.

**Then smoke-test the app** — everything should still work because all
app-side DB access goes through the service role (which bypasses RLS):

- [ ] Homepage loads, sections render with real content
- [ ] Admin CMS at `/admin/content` saves a test edit successfully
- [ ] `/admin/orders` lists orders
- [ ] Sign in to a test account, `/account/orders` lists your past orders
- [ ] Add a product to wishlist, navigate to `/account/wishlist`, see it there
- [ ] Leave a review on a product (signed in), reload, see the review

If any step fails with a permission error, the `lib/supabase/admin.ts`
client isn't using the service role key. Check `SUPABASE_SERVICE_ROLE_KEY`
is set in your env vars and redeploy.

## Rollback

Per-table:

```sql
ALTER TABLE public.<tablename> DISABLE ROW LEVEL SECURITY;
```

No data changes occur, so rollback is instant and lossless.
