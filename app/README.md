# Measure Joy - E-Commerce Storefront

Y2K vintage camera e-commerce site with Stripe integration.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Payments**: Stripe
- **Auth**: Supabase Auth

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## Stripe Product Integration

Products are fetched directly from your Stripe account. This enables:
- **Real-time inventory sync** - Stock updates automatically
- **Centralized POS** - Manage products in Stripe Dashboard
- **Price sync** - Price changes reflect instantly

### Setting Up Products in Stripe

Create products in [Stripe Dashboard](https://dashboard.stripe.com/products) with these metadata fields:

| Metadata Key | Description | Example |
|--------------|-------------|---------|
| `brand` | Manufacturer | Sony |
| `year` | Release year | 2005 |
| `category` | `camera` or `accessory` | camera |
| `subcategory` | Sub-type | memory |
| `condition` | Item condition | Excellent |
| `megapixels` | Camera resolution | 7.2 MP |
| `zoom` | Zoom capability | 3x Optical |
| `display` | Screen size | 2.5" LCD |
| `storage` | Storage type | SD Card |
| `stockCount` | Inventory quantity | 5 |
| `isTrending` | Show in trending | true |
| `isBestseller` | Show as bestseller | true |

### Webhook Events

The webhook handler at `/api/stripe/webhook` processes:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates order in database |
| `product.created/updated` | Syncs product changes |
| `product.deleted` | Removes product |
| `price.created/updated` | Syncs price changes |

### Setting Up Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `product.*`, `price.*`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Local Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test events
stripe trigger product.created
stripe trigger checkout.session.completed
```

---

## API Endpoints

### Products API

```
GET /api/products
GET /api/products?category=camera
GET /api/products?featured=true
GET /api/products?id=product-id
GET /api/products?search=sony
```

Query params:
- `category` - Filter by `camera` or `accessory`
- `featured` - Only trending/bestseller items
- `id` - Fetch single product
- `search` - Search products (Stripe only)
- `source=static` - Force static products

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── products/        # Products REST API
│   │   └── stripe/webhook/  # Stripe webhooks
│   ├── shop/                # Shop page
│   ├── product/             # Product detail pages
│   ├── checkout/            # Checkout flow
│   └── account/             # User account pages
├── components/              # React components
├── lib/
│   ├── products.ts          # Static products & utilities
│   ├── stripe-products.ts   # Stripe product fetching
│   ├── stripe.ts            # Stripe client
│   └── supabase/            # Supabase clients
└── scripts/                 # Database migrations
```

---

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  stripe_session_id TEXT,
  items JSONB,
  total_cents INTEGER,
  status TEXT,
  customer_email TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ
);
```

---

## Deployment

Deploy to Vercel:

```bash
vercel
```

Remember to:
1. Add environment variables in Vercel dashboard
2. Update Stripe webhook URL to production domain
3. Switch to live Stripe keys

---

## License

Private - Measure Joy © 2026
