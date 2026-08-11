# ecom

A full-featured e-commerce platform with a React storefront, a Node.js/Express REST API, and an admin dashboard. Built for real-world stores: multi-gateway payments, live shipping rates with label printing, order tracking, coupons, reviews, and transactional email.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Redux Toolkit, React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5, JWT auth, Joi validation |
| Database | MySQL 8 (`mysql2`) |
| Payments | Stripe (Embedded Payment Element) + Razorpay (UPI/INR) — switchable from admin |
| Shipping | Manual, Shiprocket, Delhivery, Shippo (live rates, labels, tracking) |
| Email | Nodemailer (SMTP) — order, shipping, and account notifications |
| Assets | Multer file uploads (products, slides, settings) |
| Process manager | PM2 (`ecosystem.config.js`) |

## Features

- **Storefront** — home, shop/search with filters, product detail with image/video gallery, reviews
- **Accounts** — register/login, JWT auth, profile, addresses, password reset by email
- **Shopping** — cart, wishlist, coupons/discount codes, checkout
- **Payments** — Stripe and Razorpay with webhook verification; admin picks the active gateway
- **Shipping** — manual flat rates or live rates from Shiprocket/Delhivery/Shippo; parcel size estimation; label generation; tracking number + automatic tracking sync cron
- **Orders** — full order lifecycle, status updates, transactional emails
- **Admin panel** — dashboard, products, categories, brands, slides, orders, users, coupons, reviews, subscribers, shipping, payments, and site settings
- **Content** — home page slides/banners, contact form, newsletter, FAQ/Terms/Privacy pages
- **Extras** — dynamic site title/favicon/theme from settings, image caching, SPA redirects

## Project Structure

```
ecom/
├── client/                 # React storefront + admin (Vite)
│   ├── src/
│   │   ├── pages/          # Home, Shop, Cart, Checkout, Orders, Profile, ...
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── components/     # Navbar, Footer, ProductCard, ...
│   │   ├── features/       # Redux Toolkit slices (auth, cart, settings, ...)
│   │   ├── api/            # Axios API layer
│   │   └── theme/          # Site theming
│   └── public/             # Static assets, _redirects (Netlify SPA fallback)
├── server/                 # Express REST API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # auth, adminAuth, errorHandler, validate
│   │   ├── services/       # payment adapters, shipping providers, email
│   │   ├── config/         # db pool, jwt
│   │   └── utils/          # upload, coupons, price, settings cache
│   ├── migrations/         # SQL migrations (run via npm run migrate)
│   ├── schema.sql          # Full database schema
│   ├── seed.js             # Seed admin, demo user, catalog, settings
│   └── uploads/            # Uploaded media (gitignored)
├── ecosystem.config.js     # PM2 config (frontend + backend)
└── logs/                   # PM2 logs
```

## Database

All tables are defined in `server/schema.sql`. A `migrate` script applies incremental schema changes idempotently.

Main tables: `users`, `categories`, `brands`, `products`, `product_media`, `slides`, `settings`, `carts`, `orders`, `order_items`, `wishlists`, `reviews`, `payments`, `shipping_methods`, `addresses`, `shipping_info`, `shipping_events`, `contact_messages`, plus coupons and newsletter subscribers (via migrations).

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8

### 1. Database

Create the database and tables:

```bash
cd server
mysql -u root -p < schema.sql
```

### 2. Server

```bash
cd server
cp .env.example .env        # edit DB creds, JWT_SECRET, keys
npm install
npm run migrate             # apply any incremental migrations
npm run seed                # admin user, demo user, sample catalog, default settings
npm run dev                 # nodemon, http://localhost:5000
```

Environment variables (`server/.env`):

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `5000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth signing |
| `CLIENT_URL` | Comma-separated allowed CORS origins |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay fallback credentials |

Stripe, SMTP, and shipping provider credentials are configured at runtime from the **admin panel → Settings** (falling back to env vars).

### 3. Client

```bash
cd client
cp .env.example .env        # set API URL (see below)
npm install
npm run dev                 # http://localhost:5173
```

Environment variables (`client/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api` |
| `VITE_UPLOAD_URL` | Base URL for uploaded media, e.g. `http://localhost:5000` |

During development Vite proxies `/uploads` to the API server, so uploaded images work without extra config.

### 4. Verify

- Open the storefront at http://localhost:5173
- Health check: `GET http://localhost:5000/api/health`
- Log in at http://localhost:5173/admin/login with the seeded admin:
  - Email: `admin@example.com`
  - Password: `admin123`

> Change these credentials in production.

## Production

Build the client, then serve it (or deploy to a static host):

```bash
cd client
npm run build               # outputs to client/dist
```

Run both apps with PM2:

```bash
npm i -g pm2
pm2 start ecosystem.config.js   # frontend on :4173, backend on :5000
pm2 logs
```

The client build includes a `_redirects` file for SPA routing on Netlify (or the equivalent rewrite on your host).

## Useful Commands

```bash
# API
cd server
npm run seed                 # (re)seed demo data
npm run migrate              # apply incremental DB migrations

# Client
cd client
npm run lint                 # oxlint
npm run build                # production build
```

