-- Create wishlist table for storing user's saved products
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can only have one of each product in their wishlist
  UNIQUE(user_id, product_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS wishlist_user_id_idx ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS wishlist_product_id_idx ON wishlist(product_id);

-- Enable Row Level Security
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own wishlist items
CREATE POLICY wishlist_select_own ON wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert into their own wishlist
CREATE POLICY wishlist_insert_own ON wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete from their own wishlist
CREATE POLICY wishlist_delete_own ON wishlist
  FOR DELETE
  USING (auth.uid() = user_id);
