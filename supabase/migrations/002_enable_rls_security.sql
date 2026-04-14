-- SECURITY: Enable Row-Level Security on all public tables.
--
-- Context:
--   Supabase Security Advisor flagged 5 tables with RLS completely disabled,
--   meaning anyone with the public URL + anon key could read/write them:
--     - public.reviews
--     - public.orders
--     - public.wishlist
--     - public.profiles
--     - public.order_status_history
--
--   Additionally, public.site_content had a misconfigured policy
--   ("Allow service role full access" with USING (true)) that permitted
--   anon writes despite the name.
--
-- App architecture:
--   This app uses Clerk for auth (NOT Supabase Auth). All legitimate DB
--   access flows through the service role admin client at
--   lib/supabase/admin.ts via server actions. The service role bypasses
--   RLS by design, so enabling RLS with NO anon policies locks out anon
--   traffic completely while leaving every app feature functional.
--
--   Pre-existing policies referencing auth.uid() assume Supabase Auth.
--   With Clerk, auth.uid() is always NULL for app users, so those
--   policies never evaluated to true anyway. Dropping them is a no-op
--   for the running app.

-- ============================================================================
-- 1. reviews
-- ============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select_all"   ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own"   ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own"   ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own"   ON public.reviews;

-- ============================================================================
-- 2. orders
-- ============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select_own"    ON public.orders;
DROP POLICY IF EXISTS "orders_insert_any"    ON public.orders;

-- ============================================================================
-- 3. wishlist
-- ============================================================================
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. profiles
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"  ON public.profiles;

-- ============================================================================
-- 5. order_status_history
-- ============================================================================
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. site_content — replace broken write policy with public-read-only.
--    site_content contains public marketing copy rendered on every page.
--    Reads are allowed for anon (future-proofing; app currently reads via
--    admin client). Writes only via service role (bypasses RLS).
-- ============================================================================
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access"        ON public.site_content;
DROP POLICY IF EXISTS "Allow service role full access"  ON public.site_content;
CREATE POLICY "site_content_public_read" ON public.site_content
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ============================================================================
-- Verification query — run this after the migration.
-- Expected: rowsecurity = true for all 6 tables above.
-- ============================================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'reviews', 'orders', 'wishlist', 'profiles',
--     'order_status_history', 'site_content'
--   )
-- ORDER BY tablename;
