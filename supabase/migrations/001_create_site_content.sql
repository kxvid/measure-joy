-- Create the site_content table for CMS content management
CREATE TABLE IF NOT EXISTS site_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'system',
    UNIQUE(section, key)
);

-- Create index for fast lookups by section
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);

-- Enable Row Level Security
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Allow public reads (content is displayed on the public site)
CREATE POLICY "Allow public read access" ON site_content
    FOR SELECT USING (true);

-- Allow authenticated inserts/updates (admin uses service role key)
CREATE POLICY "Allow service role full access" ON site_content
    FOR ALL USING (true) WITH CHECK (true);

-- Seed with default content from the current hardcoded values

-- Hero Section
INSERT INTO site_content (section, key, value) VALUES
('hero', 'badge', '"New drops weekly"'),
('hero', 'heading_line1', '"Reviving"'),
('hero', 'heading_line2', '"Y2K Tech"'),
('hero', 'heading_line3', '"For You"'),
('hero', 'subtitle', '"Curated vintage digital cameras tested, cleaned, and ready to shoot. Experience the magic of early digital photography."'),
('hero', 'cta_primary', '"Shop All Cameras"'),
('hero', 'cta_secondary', '"Our Story"'),
('hero', 'marquee_items', '["TESTED & WORKING", "90-DAY WARRANTY", "FREE RETURNS", "AUTHENTIC Y2K", "EXPERT CURATED", "WORLDWIDE SHIPPING"]')
ON CONFLICT (section, key) DO NOTHING;

-- Promo Banner
INSERT INTO site_content (section, key, value) VALUES
('promo_banner', 'items', '[{"text": "FREE SHIPPING ON $75+", "href": "/shop"}, {"text": "NEW ARRIVALS WEEKLY", "href": "/shop?sort=newest"}, {"text": "90-DAY WARRANTY", "href": "/returns"}, {"text": "TESTED & WORKING", "href": "/about"}]')
ON CONFLICT (section, key) DO NOTHING;

-- Trust Badges
INSERT INTO site_content (section, key, value) VALUES
('trust_badges', 'items', '[{"icon": "Shield", "text": "Secure Checkout"}, {"icon": "Truck", "text": "Free Shipping $75+"}, {"icon": "RefreshCw", "text": "14-Day Returns"}, {"icon": "CreditCard", "text": "Stripe Protected"}]')
ON CONFLICT (section, key) DO NOTHING;

-- Trust Banner
INSERT INTO site_content (section, key, value) VALUES
('trust_banner', 'items', '[{"icon": "Truck", "title": "FREE SHIPPING", "description": "On orders over $75", "color": "bg-pop-yellow"}, {"icon": "RotateCcw", "title": "EASY RETURNS", "description": "30-day return policy", "color": "bg-pop-pink"}, {"icon": "Shield", "title": "90-DAY WARRANTY", "description": "Tested & guaranteed", "color": "bg-pop-teal"}, {"icon": "Package", "title": "SECURE PACKAGING", "description": "Safe delivery always", "color": "bg-pop-yellow"}]')
ON CONFLICT (section, key) DO NOTHING;

-- Trust Story
INSERT INTO site_content (section, key, value) VALUES
('trust_story', 'badge', '"Why Choose Us"'),
('trust_story', 'heading', '"Trusted by Thousands"'),
('trust_story', 'subtitle', '"We''re not just reselling old cameras. We''re curators, technicians, and fellow Y2K enthusiasts dedicated to bringing vintage tech back to life."'),
('trust_story', 'points', '[{"title": "12-Point Inspection", "description": "Every camera is thoroughly tested for sensor quality, lens clarity, battery health, and more."}, {"title": "90-Day Guarantee", "description": "Not happy? Full refund within 90 days, no questions asked. We stand behind every camera."}, {"title": "Professionally Restored", "description": "Cleaned, calibrated, and restored to peak performance by our Y2K tech specialists."}]'),
('trust_story', 'stats', '[{"value": "2,500+", "label": "Happy Customers"}, {"value": "99%", "label": "Positive Reviews"}, {"value": "5,000+", "label": "Cameras Sold"}]'),
('trust_story', 'quote', '"The camera arrived in better condition than described. You can tell they actually test and care for these vintage gems. Will definitely buy again!"'),
('trust_story', 'quote_attribution', '"— Verified Buyer, via email"')
ON CONFLICT (section, key) DO NOTHING;

-- Testimonials
INSERT INTO site_content (section, key, value) VALUES
('testimonials', 'heading', '"Loved by Y2K Camera Enthusiasts"'),
('testimonials', 'subtitle', '"Join thousands of happy customers who''ve discovered the joy of vintage digital photography"'),
('testimonials', 'items', '[{"name": "Sarah Chen", "location": "Los Angeles, CA", "text": "Bought a Sony Cybershot and it brought back so many memories! The quality is amazing and customer service was super helpful.", "rating": 5, "product": "Sony Cybershot DSC-P200"}, {"name": "Marcus Rodriguez", "location": "Brooklyn, NY", "text": "Perfect Y2K aesthetic for my photography project. Fast shipping and the camera works flawlessly. Highly recommend!", "rating": 5, "product": "Canon PowerShot A520"}, {"name": "Emma Thompson", "location": "Portland, OR", "text": "I love the nostalgic feel of these cameras. Measure Joy has an amazing selection and everything arrived perfectly packaged.", "rating": 5, "product": "Fujifilm FinePix Z5fd"}]')
ON CONFLICT (section, key) DO NOTHING;

-- Newsletter
INSERT INTO site_content (section, key, value) VALUES
('newsletter', 'badge', '"Join The List"'),
('newsletter', 'heading', '"Get First Access"'),
('newsletter', 'subtitle', '"New finds drop almost daily. Don''t miss out on rare cameras and exclusive deals."'),
('newsletter', 'disclaimer', '"No spam, ever. Unsubscribe anytime."')
ON CONFLICT (section, key) DO NOTHING;

-- Footer
INSERT INTO site_content (section, key, value) VALUES
('footer', 'tagline', '"Reviving Y2K digital cameras for a new generation. Experience the magic of early digital photography."'),
('footer', 'bottom_text', '"Made for Y2K lovers"')
ON CONFLICT (section, key) DO NOTHING;

-- About Page
INSERT INTO site_content (section, key, value) VALUES
('about', 'hero_heading', '"Preserving the magic of Y2K photography"'),
('about', 'hero_subtitle', '"Measure Joy started from a simple love for the unique aesthetic of early digital cameras. We believe these devices capture something special—a warmth and authenticity that modern smartphones just can''t replicate."'),
('about', 'story_p1', '"It all began in 2019 when our founder discovered their grandmother''s old Sony Cybershot in a dusty drawer. The photos it produced—slightly soft, beautifully saturated—sparked a deep appreciation for the era."'),
('about', 'story_p2', '"What started as a personal collection quickly grew into a mission: to rescue these forgotten gems and share them with a new generation who crave authenticity in an age of AI filters and computational photography."'),
('about', 'story_p3', '"Today, Measure Joy is home to hundreds of carefully tested and refurbished cameras from the golden era of digital photography (2003-2010). Each camera tells a story, and we''re here to help you write yours."'),
('about', 'values', '[{"title": "Quality First", "description": "Every camera is thoroughly tested and comes with a 90-day warranty."}, {"title": "Passion Driven", "description": "We''re collectors ourselves—we only sell cameras we''d proudly own."}, {"title": "Authentic Experience", "description": "Embrace imperfection. The quirks are what make these cameras special."}, {"title": "Community", "description": "Join thousands of Y2K photography enthusiasts sharing their captures."}]'),
('about', 'stats', '[{"value": "2,500+", "label": "Happy Customers"}, {"value": "50+", "label": "Camera Models"}, {"value": "4.9", "label": "Average Rating"}, {"value": "2019", "label": "Est."}]')
ON CONFLICT (section, key) DO NOTHING;
