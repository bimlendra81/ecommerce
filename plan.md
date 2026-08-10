# E-Commerce Website Plan

React.js + Node.js + MySQL

## Requirements

1. Login with JWT token
2. React-Redux store
3. Admin panel
4. Payment gateway integration
5. Responsive CSS (can use a library)

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Redux Toolkit + React Router v6 |
| Backend | Node.js + Express + JWT (jsonwebtoken) + bcryptjs |
| Database | MySQL 8 (with `mysql2` driver) |
| State | Redux Toolkit (slices + RTK Query for API) |
| CSS | Tailwind CSS (responsive utility classes) + component lib: MUI or Ant Design for admin panel |
| Payment | Multi-gateway: Razorpay (India, incl. UPI), Stripe (international, embedded Payment Element with UPI where enabled), or test mode — admin selects the active gateway (`payment-gateway-plan.md`) |
| Extras | Multer (image upload), Joi (validation), dotenv |

## Project Structure

```
ecom/
├── server/                     # Node.js + Express
│   ├── src/
│   │   ├── config/            # db.js, jwt.js
│   │   ├── middleware/        # auth.js, adminAuth.js, errorHandler.js
│   │   ├── models/            # User, Product, Category, Order, OrderItem, Cart, Payment
│   │   ├── controllers/       # auth, product, cart, order, payment, admin
│   │   ├── routes/            # api routes
│   │   ├── utils/             # helpers
│   │   └── server.js
│   └── .env                   # PORT, DB creds, JWT_SECRET, RAZORPAY keys
├── client/                    # React app
│   ├── src/
│   │   ├── features/          # authSlice, cartSlice, productSlice, orderSlice
│   │   ├── pages/             # Login, Register, Shop, ProductDetail, Cart, Checkout, Orders
│   │   ├── components/        # Navbar, ProductCard, etc.
│   │   ├── admin/             # Dashboard, Products, Orders, Users, Categories
│   │   ├── api/               # RTK Query endpoints
│   │   ├── utils/             # axios instance with JWT interceptor
│   │   └── App.jsx
│   └── .env                   # REACT_APP_API_URL
└── README.md
```

## Database Schema (MySQL)

```
users          (id, name, email UNIQUE, phone, password_hash, role['user'|'admin'], active, avatar, deleted_at, created_at)
categories     (id, name, slug, image, featured TINYINT, featured_order INT, deleted_at)
brands         (id, name, slug, active, deleted_at, created_at)
products       (id, name, slug, description, price, stock, image, category_id FK, brand_id FK, active, return_days, deleted_at, created_at)
product_media  (id, product_id FK, type['image'|'video'], url, sort_order)
slides         (id, title, subtitle, image, link, sort_order, active, deleted_at, created_at)
settings       (name PK, value)
carts          (id, user_id FK, product_id FK, quantity)
wishlists      (id, user_id FK, product_id FK, UNIQUE(user_id, product_id))
reviews        (id, product_id FK, user_id FK, rating 1-5, title, comment, UNIQUE(product_id, user_id))
orders         (id, user_id FK, total, status['pending'|'paid'|'shipped'|'delivered'|'cancelled'], deleted_at, created_at)
order_items    (id, order_id FK, product_id FK, price, quantity)
payments       (id, order_id FK, gateway, txn_id, amount, currency, status, created_at)
```

Notes:
- Soft delete: `products`, `categories`, `brands`, `slides`, `orders`, `users` carry a `deleted_at` column. Carts/order_items/payments are child/transactional records and use hard delete.
- Product gallery: `product_media` stores multiple images + videos (uploaded files or pasted URLs). The first image is also mirrored to `products.image` for list thumbnails.
- Return policy: `products.return_days` per product; when NULL the global `settings.return_days` applies.
- Shipping: `products.weight_grams` per product (NULL → `settings.default_weight_grams`); `shipping_methods` (name/description/fee/ETA/active); `addresses` (user address book); `shipping_info` (per-order snapshot: method, address, carrier, tracking, timestamps); `shipping_events` (tracking timeline). `orders` carries `subtotal` + `shipping_fee` + `address_id`; `total = subtotal + shipping_fee`. Shipping provider (`settings.shipping_provider` = manual/shiprocket/delhivery/shippo) is switchable from admin.

## JWT Auth Flow (Req 1)

1. `POST /api/auth/register` - hash password with bcrypt, save user
2. `POST /api/auth/login` - verify password, sign JWT (`{ id, role }`, 24h expiry) - return token + user
3. Client stores token in `localStorage`; Axios interceptor attaches `Authorization: Bearer <token>` on every request
4. Middleware `auth.js` verifies token; `adminAuth.js` checks `role === 'admin'`
5. `GET /api/auth/me` - validate token on page reload

## Redux Store (Req 2)

```
store/
├── authSlice    - user, token, login/logout, isLoading
├── cartSlice    - items[], add/remove/updateQty, sync with backend
├── productSlice - products, filters, pagination
└── orderSlice   - place order, order history
```

Use **RTK Query** for all server data (auto-caching, loading states, invalidation after mutations).

## Admin Panel (Req 3)

Separate section under `/admin` guarded by `role === 'admin'`:

- **Dashboard** - sales stats, orders chart
- **Products** - CRUD with image upload (Multer)
- **Categories** - manage
- **Orders** - update status
- **Users** - list/block users

## Payment Gateway (Req 4)

Admin-selectable single active gateway (see Phase 19 + `payment-gateway-plan.md`):

1. Client hits `POST /api/payment/create-order` - server creates the payment with the active gateway (Razorpay order / Stripe PaymentIntent) and stores it in `payments`
2. Client completes payment - Razorpay modal, Stripe Payment Element, or test confirm
3. `POST /api/payment/verify` - server verifies (Razorpay HMAC signature / Stripe PaymentIntent status); Stripe `POST /api/payment/webhook` reconciles `payment_intent.succeeded` idempotently; order marked `paid`

Configure credentials + gateway in Admin → Payments (`/admin/payments`). UPI is included in Razorpay and in Stripe where enabled. Test mode works with no keys; sandbox setup steps are in `payment-gateway-plan.md`.

## Responsive CSS (Req 5)

- **Tailwind CSS** for the storefront (mobile-first, grid-based product cards)
- **MUI** or **Ant Design** for the admin panel (pre-built responsive tables/forms)
- Mobile drawer for navbar, hamburger menu, flexible `grid-cols-2 md:grid-cols-4`

## Build Phases

1. **Phase 1 - Setup**: server (Express + MySQL schema + auth), client (Vite + Tailwind + Router + Redux)
2. **Phase 2 - Auth**: JWT register/login, protected routes, `authSlice`
3. **Phase 3 - Storefront**: products, categories, product detail, cart
4. **Phase 4 - Checkout + Payment**: Razorpay integration
5. **Phase 5 - Admin panel**: all CRUD + dashboard
6. **Phase 6 - Polish**: validations, error handling, responsive pass, deploy
7. **Phase 7 - Home page**: admin-managed hero slider, popular products section, polished modern design
8. **Phase 8 - Soft delete**: `deleted_at` on all entity tables + restore endpoints + admin trash views
9. **Phase 9 - Filters + brands**: left sidebar filters (price range, category, brand), managed brands table
10. **Phase 10 - Product media**: multiple images + videos per product (upload or URL), image/video slider on listing + detail
11. **Phase 11 - Cart popup**: right-corner toast with product image, quantity, price after adding to cart
12. **Phase 12 - Smart features**: site settings (logo/title/favicon/socials/contact/shipping/returns), footer + static pages, full cart popup, per-product return policy
13. **Phase 13 - Header + sessions**: cart icon with badge, avatar user menu, profile page with phone/avatar, separate admin login + admin session (user and admin logged in simultaneously)
14. **Phase 14 - Amazon-style home + color themes**: navbar search bar, Amazon-style home restyle, admin-managed color theme templates (editable name/description/colors + add new)
15. **Phase 15 - Wishlist, reviews, media everywhere, recommendations**: wishlist + reviews/ratings (verified buyers), media slider/video playback in cart & home, Amazon-style product detail with "Frequently bought together", home recommendations from purchase history + cart
16. **Phase 16 - Shipping module**: shipping methods + real-time carrier quotes (manual/Shiprocket/Delhivery/Shippo), saved address book, per-product weight, tracking + events, admin provider switch + create shipment/sync. Details in `SHIPPING-MODULE.md`.
17. **Phase 17 - Switchable home templates**: admin can pick one of three home page layouts (`settings.home_template` = marketplace/minimal/editorial) that all render the same data (slides, popular products, categories, recommended, features). Backend stores one extra settings key; all rendering is client-side under `client/src/components/home/`.
18. **Phase 18 - Trending + Featured categories**: `trending` = categories computed backend-side by units sold (`ORDER BY sold DESC`, top 6) — no manual control; `featured` = categories admin marks via a new featured toggle + order field, shown in an admin-driven slider. `GET /api/home` returns `trendingCategories` + `featuredCategories`; all three home templates get Trending + Featured sections (new `CategoryCarousel`), and the marketplace hero rail uses the top trending + featured categories instead of random slides.
19. **Phase 19 - Multi-gateway payments**: admin-selectable single active gateway — Razorpay (India: cards/UPI/netbanking via modal), Stripe (international: embedded Payment Element, UPI where Stripe enables it), or test mode (no keys). Credentials + gateway stored in `settings`; Stripe reconciled via webhook + server-side PaymentIntent retrieve. Detail in `payment-gateway-plan.md`.
20. **Phase 20 - Tier 1 commerce**: sale pricing + coupons, tax settings, transactional email (SMTP), password reset, review moderation, refunds, newsletter. Detailed task log in `progress.md`.

## Extended API

```
GET  /api/home                    -> { slides, popularProducts, categories, trendingCategories, featuredCategories, recommended } (optionalAuth → recommended from cart + purchase history)
GET  /api/slides                  -> active slides
GET  /api/brands                  -> active brands
GET  /api/settings                -> public site settings
GET  /api/products                -> ?category &brand&minPrice&maxPrice&sort&search&page&limit
GET  /api/products/:slug          -> product incl. media[], reviews[], rating_avg/count, frequentlyBoughtTogether[] (+ canReview, myReview when authed)
GET  /api/products/:slug/reviews  -> public review list
POST /api/products/:slug/reviews  -> create/upsert own review (auth, verified buyers only)
PUT  /api/products/:slug/reviews  -> update own review (auth)
DELETE /api/products/:slug/reviews -> delete own review (auth)
GET  /api/wishlist                -> user wishlist items incl. media + ratings (auth)
POST /api/wishlist/:product_id    -> add to wishlist (auth, idempotent)
DELETE /api/wishlist/:product_id  -> remove from wishlist (auth)
GET  /api/admin/slides            -> CRUD (+ /:id/restore)
GET  /api/admin/brands            -> CRUD (+ /:id/restore)
GET  /api/admin/settings          -> admin settings (GET + PUT, logo/favicon upload)
POST /api/admin/products/:id/restore   | DELETE -> soft delete
POST /api/admin/categories/:id/restore | DELETE -> soft delete
PUT  /api/admin/categories/:id/feature -> set featured + featured_order (multipart)
POST /api/admin/orders/:id/restore     | DELETE -> soft delete
POST /api/admin/users/:id/restore      | DELETE -> soft delete
PUT  /api/auth/profile                 -> update name/phone + avatar upload (auth)
GET  /api/addresses                    -> user address book CRUD (auth) (+ POST/PATCH/DELETE)
GET  /api/shipping/methods             -> active shipping methods (public)
POST /api/shipping/quote               -> rate quote from cart (auth; address_id or shipping_address)
GET  /api/admin/shipping-methods       -> methods CRUD (admin)
PUT  /api/admin/shipping-config        -> provider switch + credentials + pickup origin + default weight (admin)
PATCH /api/admin/orders/:id/shipping   -> update carrier/tracking/notes/ETA (admin)
POST /api/admin/orders/:id/shipping/ship -> create shipment via active provider, sets order shipped (admin)
POST /api/admin/orders/:id/shipping/sync -> pull tracking events from carrier (admin)
POST /api/admin/orders/:id/shipping/events -> add manual tracking event (admin)
GET  /api/payment/config            -> active gateway + currency + public keys (sanitized, no secrets)
POST /api/payment/create-order      -> gateway-aware payment init (razorpay order / stripe PaymentIntent / test)
POST /api/payment/verify            -> razorpay HMAC or stripe intent retrieve, marks order paid
POST /api/payment/test-confirm      -> instant confirm (test mode or unconfigured gateway only)
POST /api/payment/webhook           -> Stripe signature-verified `payment_intent.succeeded` reconciliation
GET  /api/admin/payment-config      -> gateway switch + currency + per-gateway credentials (masked) (admin)
PUT  /api/admin/payment-config      -> save gateway config (blank secrets are preserved) (admin)
```

`settings.theme` (JSON) drives the storefront color scheme:
```json
{ "selected": "ocean", "primary": "", "accent": "",
  "templates": [ { "id": "ocean", "name": "...", "description": "...",
                   "headerBg": "#1e3a8a", "headerText": "#ffffff",
                   "primary": "#2563eb", "primaryDark": "#1d4ed8",
                   "primarySoft": "#eff6ff", "primaryLight": "#dbeafe",
                   "accent": "#0ea5e9", "accentDark": "#0284c7" } ] }
```
- Stored templates are the full editable list (built-ins plus admin-created). If `templates` is missing/empty the client falls back to built-ins in `theme/themes.js`.
- `selected` picks the active template; optional top-level `primary`/`accent` overrides it for quick tweaks (empty = use template colors).
- Client `applyTheme()` writes the resolved colors to CSS variables (`--primary`, `--accent`, `--header-bg`, ...); Tailwind v4 `@theme inline` maps them to `bg-primary`, `text-primary`, `hover:bg-primary-dark`, `bg-accent`, etc. across the whole storefront.

## Phase 7-11 Details

### Phase 7 - Home page
- `slides` table + admin CRUD (image upload) + public `GET /api/slides`.
- `GET /api/home` aggregates slides, popular products (by order_items quantity), categories.
- Client `homeSlice` + redesigned `Home.jsx`: autoplay hero slider (arrows/dots), Popular Products grid, category tiles, feature strip.

### Phase 8 - Soft delete
- `deleted_at` columns + idempotent `npm run migrate` script (`server/migrations/migrate.js`).
- All storefront/cart/order/auth queries filter `deleted_at IS NULL`; admin delete = set `deleted_at`; restore endpoints.
- Admin trash views: Products, Categories, Orders, Slides (Users delete permanently hides login).

### Phase 9 - Filters + brands
- `brands` table + `products.brand_id`; `GET /api/brands` + admin CRUD (`AdminBrands` page).
- Product list filters: `category`, comma-separated `brand`, `minPrice`, `maxPrice`, `sort`.
- `Shop.jsx` gets a sticky left sidebar (price min/max, category radios, brand checkboxes, clear all) and product cards show brand.

### Phase 10 - Product media
- `product_media` table; multer accepts images + videos (up to 25MB); admin form uploads multiple images/videos or pastes URLs.
- `listProducts`/`getProduct` return `media[]`; `ProductCard` shows a mini image slider; `ProductDetail` has a gallery slider (image/video, thumbnails, arrows).

### Phase 11 - Cart popup
- `cartSlice.toast` + `CartPopup.jsx` fixed bottom-right (image, qty, price, subtotal, View Cart / Checkout, auto-dismiss).
- Add-to-cart on ProductCard + ProductDetail opens the popup.

### Phase 12 - Smart features
- `settings` table + `settingsController` (public `GET /api/settings`, admin `GET`/`PUT /api/admin/settings` with logo + favicon upload via multer).
- `settingsSlice` + store wiring; `Navbar`/footer show `site_logo`/`site_title`; `App.jsx` applies `document.title` + favicon.
- `Footer.jsx` (link columns, contact, socials, free-shipping/returns highlights) + static pages About/Contact/FAQ/Terms/Privacy with routes.
- `AdminSettings` page (site title/logo/favicon, facebook/instagram, contact email/phone, free-shipping threshold, default return days).
- Full cart popup: all items, remove buttons, scrollable list, free-shipping progress bar.
- Per-product return policy: `products.return_days` column (falls back to global setting); admin product form + ProductDetail show it.

### Phase 13 - Header + sessions
- `users.phone` + `users.avatar` columns (migration + schema + seed); register/login/me return them; `PUT /api/auth/profile` updates name/phone + avatar file upload.
- Separate admin session: `adminClient.js` + `adminSlice.js` use their own `admin_token`/`admin_user` localStorage keys so an admin and a regular user can be signed in at the same time. Admin pages (`/admin/*`) use `adminClient` and the admin session.
- Admin login lives at `/admin/login` (`AdminLogin.jsx`); `RequireAdmin` guards `/admin` and redirects there; `AdminLayout` shows signed-in admin + Sign out.
- `Navbar` redesign: brand → Shop, `Shop` link, cart as SVG icon with count badge, avatar button + dropdown (name/email, My Profile, Orders, Logout). No admin links on the storefront.
- `Register.jsx` collects phone; new `Profile.jsx` page (name/phone edit + avatar upload with preview) wired to `/profile`.

### Phase 14 - Amazon-style home + color themes
- Navbar gains an Amazon-style search bar (desktop + mobile) that navigates to `/shop?search=...`; `Shop.jsx` initializes the search query from the `search` URL param.
- Home page restyled Amazon-like: hero gradient uses theme colors, Popular Products carousel (title + "See all" + arrows), category grid `md:grid-cols-6` tiles, feature strip tinted with the theme.
- Theme engine (`theme/themes.js`): built-in templates (amazon/ocean/emerald/violet/rose/dark) each define `headerBg/headerText/primary/primaryDark/primarySoft/primaryLight/accent/accentDark`. `applyTheme()` sets them as CSS variables on `:root`; `index.css` maps them via Tailwind v4 `@theme inline` to `bg-primary`, `text-primary`, `bg-accent`, `bg-header-bg`, etc.
- Storefront refactor: hardcoded `blue-600/700/50`, `indigo-700` in storefront components/pages replaced with theme tokens so the whole storefront follows the chosen pattern (admin panel stays blue).
- Admin `settings.theme` (JSON) stores `selected`, optional `primary`/`accent` overrides, and the full editable `templates` array. `AdminSettings` "Color themes" section lets the admin edit each template's name/description/colors, select which is active, add new themes (copy), and delete themes (keeps ≥ 1).

### Phase 18 - Trending + Featured categories
- **Trending** is backend-computed, admin-proof: `homeController.getHome` orders active categories by `sold` (sum of `order_items.quantity` across non-cancelled orders) descending, top 6 → `trendingCategories`. No manual control — it always reflects real sales.
- **Featured** is admin-controlled: `categories.featured` (TINYINT) + `categories.featured_order` (INT) columns (migration + schema + seed). Admin marks categories featured via `PUT /api/admin/categories/:id/feature` (multipart, uses `handleUpload` since `setCategoryFeatured` reads `req.body`), or via the featured checkbox/order fields in the add/edit form.
- `categories` (used on all templates) and `featuredCategories` order by `featured DESC, featured_order ASC, name`; the storefront homepage lists only featured=1.
- Frontend: `CategoryCarousel.jsx` — horizontally scrolling category rail with prev/next buttons (`CategoryTile` + `meta` override for "N sold" / "N items" labels, `scrollbar-none` + `edge-fade`). Home slice exposes `trendingCategories`/`featuredCategories`; `Home.jsx` passes them to every template.
- Templates: marketplace hero rail (2 stacked promo boxes) now uses top trending category ("Trending", "N sold") + top featured category ("Featured", "N items") with category images, falling back to other trending/categories/slides; hero slider gets a `stretch` prop so its height matches the `lg:h-[440px]` rail. Marketplace/Minimal/Editorial each get a Featured slider section + a Trending section (renumbered editorial eyebrows through 06).

### Phase 19 - Multi-gateway payments
- **Gateways**: `razorpay` (India — cards/UPI/netbanking/wallets via checkout modal), `stripe` (international — embedded Payment Element via `@stripe/react-stripe-js`, UPI shown where Stripe enables it), `test` (instant confirm, no keys). UPI is *not* a separate gateway — it is offered inside Razorpay and through Stripe's element.
- **Settings keys** (admin-managed): `payment_gateway`, `payment_currency` (3-letter ISO), `razorpay_key_id`, `razorpay_key_secret`, `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret`. Credentials resolve from settings, falling back to the old env vars.
- **DB**: `payments.currency VARCHAR(10)` (idempotent migration + `schema.sql`).
- **Backend**: `services/payment/` adapter factory (`index.js` + `razorpay.js` + `stripe.js`). `createPayment` returns `{ gateway, test, order_id, amount, currency, key_id | client_secret+intent_id, ... }`. `verifyPayment` verifies per active gateway (Razorpay HMAC / Stripe `paymentIntents.retrieve`). `POST /api/payment/webhook` is mounted with `express.raw()` **before** global `express.json()` and reconciles `payment_intent.succeeded` idempotently.
- **Admin**: `AdminPayments.jsx` at `/admin/payments` — gateway radio cards (test/razorpay/stripe), currency, per-gateway credential fields (secrets masked after save, blank = keep existing), `configured` badges; `GET/PUT /api/admin/payment-config` mirrors the shipping-config pattern.
- **Checkout**: `paymentSlice.fetchPaymentConfig`; `Checkout.jsx` branches by gateway — test-confirm, Razorpay modal (currency from config), or Stripe `PaymentElement` embedded in the themed summary panel (order snapshot shown while paying, webhook finalizes). `OrderDetail`/`Orders` surface the payment gateway.
- **Sandbox keys + webhook setup**: see `payment-gateway-plan.md` (Razorpay test keys; Stripe `pk_test_/sk_test_`; webhook via `stripe listen --forward-to localhost:5000/api/payment/webhook` or a Dashboard endpoint).

### Phase 20 - Tier 1 commerce (sale pricing, coupons, tax, email, refunds, newsletter, password reset, review moderation)
- **Sale pricing**: `products.sale_price` + `sale_start`/`sale_end`; active sale beats base price in all product queries (list, detail, cart, checkout) with `discount_percent`/`on_sale`; admin form edits sale price + schedule.
- **Coupons**: `coupons` table + admin CRUD (`/api/admin/coupons`, `AdminCoupons.jsx`); storefront apply/remove in cart; `orders.discount`/`coupon_id`/`coupon_code` snapshot; single coupon per cart, validated (type percent/fixed, min_subtotal/min_items/max_discount, uses/usage_limit, validity window).
- **Tax**: settings `tax_enabled`/`tax_rate`/`tax_inclusive`; tax on discounted subtotal → `orders.tax_fee`; inclusive mode shows the tax line without changing the total.
- **Email**: `services/email.js` `sendMail` (nodemailer; settings `smtp_*` with env fallback); order/refund emails; no-op when SMTP unconfigured. SMTP fields editable in `AdminSettings`.
- **Password reset**: `users.reset_token` + `reset_token_expires`; `POST /api/auth/forgot-password` (1h token, `{CLIENT_URL}/reset-password?token=…`, always-safe reply) + `POST /api/auth/reset-password`; client `ForgotPassword.jsx`/`ResetPassword.jsx` + link on `Login.jsx`.
- **Review moderation**: storefront shows only `approved = 1` reviews; new/edited reviews follow `settings.reviews_auto_approve`; `reportReview` (`POST /api/products/:slug/reviews/:id/report`) pulls reported reviews from the storefront; admin `AdminReviews.jsx` (tabs + search + approve/reject) via `GET/PATCH /api/admin/reviews/:id`.
- **Refunds**: `payments.refund_status`; `POST /api/admin/orders/:id/refund` (paid/shipped/delivered only, rejects cancelled/already-refunded); status surfaced in admin + user order views and `AdminOrders.jsx` (Refund button + badges).
- **Newsletter**: `subscribers` table; `POST/DELETE /api/newsletter` (validated); admin `AdminSubscribers.jsx` (search, show inactive, CSV export, delete) via `GET/DELETE /api/admin/subscribers(/:id)`; `NewsletterStrip.jsx` wired to the API.

### Phase 15 - Wishlist, reviews, media everywhere, recommendations
- **Wishlist**: `wishlists` table (UNIQUE per user+product); `GET/POST/DELETE /api/wishlist` (auth). Client `wishlistSlice`, heart icon + count badge in Navbar, `WishlistButton` toggle on ProductCard + ProductDetail, `/wishlist` page (RequireAuth) with ProductCards. Fetch on login, cleared on logout.
- **Reviews & ratings**: `reviews` table (UNIQUE per product+user, rating 1-5). Product queries include `rating_avg`/`rating_count` subqueries. `GET /:slug/reviews` public; `POST/PUT/DELETE /:slug/reviews` auth. **Verified buyers only**: POST/PUT require the user to have the product in a non-cancelled order (`order_items` JOIN `orders`). `GET /:slug` uses `optionalAuth` to return `canReview` + `myReview`. ProductDetail has an Amazon-style reviews section (avg, count, 1-5 distribution bars, review list, write/edit/delete form).
- **Amazon-style product detail**: breadcrumb, left gallery (MediaSlider with thumbnails + video), title/brand/rating link, price block, description, sticky buy box (qty, Add to Cart, Buy Now → cart + checkout, wishlist toggle), **Frequently bought together** (co-purchase ranking across `order_items`, fallback same-category; checkboxes + combined total + "Add all to cart"), customer reviews.
- **Media slider + video everywhere**: reusable `MediaSlider.jsx` (arrows/dots, autoplay-muted videos, optional thumbnails). Cart API now returns `media[]` per item; `CartPopup`, `Cart` page, and `ProductCard` (→ home carousels) use it so videos play inline anywhere products show.
- **Home recommendations**: `GET /api/home` accepts optional auth; when logged in returns `recommended` — products in categories the user has purchased or has in cart, excluding owned/in-cart, ordered by sales. `Home.jsx` shows an "Inspired by your activity" carousel only when non-empty.

## Deploy Notes

- Run `npm run migrate` after `schema.sql` on existing installs (idempotent).
- Seed now also inserts demo brands.
- Payment gateway + credentials are configured from Admin → Payments (stored in `settings`, secrets masked). For Stripe, add the webhook endpoint `POST /api/payment/webhook` in the Stripe dashboard (production) or run `stripe listen --forward-to localhost:5000/api/payment/webhook` (dev) and paste the `whsec_...` signing secret.
