-- Client roles use Clerk-backed server routes for private data and all writes.
-- Public catalog/copy reads retain their existing SELECT policies.
DROP POLICY IF EXISTS subscribers_public_insert ON public.subscribers;
REVOKE ALL ON TABLE public.subscribers, public.orders, public.profiles,
  public.reviews, public.wishlist, public.order_status_history FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.site_content, public.prospects FROM anon, authenticated;
GRANT SELECT ON TABLE public.site_content, public.prospects TO anon, authenticated;
GRANT ALL ON TABLE public.subscribers, public.orders, public.profiles,
  public.reviews, public.wishlist, public.order_status_history,
  public.site_content, public.prospects TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
-- NOT VALID preserves old records without weakening checks on future writes.
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_email_length
  CHECK (char_length(email) BETWEEN 3 AND 254) NOT VALID;
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_source_length
  CHECK (source IS NULL OR char_length(source) <= 100) NOT VALID;
ALTER FUNCTION public.update_reviews_updated_at() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.update_reviews_updated_at(), public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

CREATE TABLE public.request_rate_limits (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  attempts integer NOT NULL CHECK (attempts > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX request_rate_limits_expiry ON public.request_rate_limits (expires_at);
ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.request_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.request_rate_limits TO service_role;

CREATE FUNCTION public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS TABLE (allowed boolean, retry_after integer)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
  v_expires timestamptz;
BEGIN
  IF p_key IS NULL OR p_key !~ '^[0-9a-f]{64}$' OR
     p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100000 OR
     p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters' USING ERRCODE='22023';
  END IF;
  -- Bounded cleanup keeps work and retained digests small. SKIP LOCKED avoids
  -- cleanup blocking concurrent callers that are updating another bucket.
  DELETE FROM public.request_rate_limits WHERE key_hash IN (
    SELECT r.key_hash FROM public.request_rate_limits r
    WHERE r.expires_at <= v_now ORDER BY r.expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
  );
  INSERT INTO public.request_rate_limits AS r (key_hash, attempts, expires_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (key_hash) DO UPDATE SET
    attempts = CASE WHEN r.expires_at <= v_now THEN 1 ELSE LEAST(r.attempts + 1, p_limit + 1) END,
    expires_at = CASE WHEN r.expires_at <= v_now
      THEN v_now + make_interval(secs => p_window_seconds) ELSE r.expires_at END
  RETURNING r.attempts, r.expires_at INTO v_attempts, v_expires;
  RETURN QUERY SELECT v_attempts <= p_limit,
    CASE WHEN v_attempts <= p_limit THEN 0 ELSE GREATEST(1, ceil(extract(epoch FROM v_expires - v_now))::integer) END;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
