# Development Progress

Track progress through the build phases defined in `plan.md`.

Legend: `[x]` done | `[ ]` pending | `[~]` in progress

## Phases

- [x] **Phase 1 - Setup**: server (Express + MySQL schema + auth), client (Vite + Tailwind + Router + Redux)
- [x] **Phase 2 - Auth**: JWT register/login, protected routes, `authSlice`
- [x] **Phase 3 - Storefront**: products, categories, product detail, cart
- [x] **Phase 4 - Checkout + Payment**: Razorpay integration
- [x] **Phase 5 - Admin panel**: all CRUD + dashboard
- [x] **Phase 6 - Polish**: validations, error handling, responsive pass, deploy
- [x] **Phase 7 - Home page**: hero slider (admin-managed), popular products, modern design
- [x] **Phase 8 - Soft delete**: `deleted_at` on all entity tables + restore + trash views
- [x] **Phase 9 - Filters + brands**: left sidebar filters, managed brands table
- [x] **Phase 10 - Product media**: multiple images/videos per product, image/video sliders
- [x] **Phase 11 - Cart popup**: right-corner toast after adding to cart
- [x] **Phase 12 - Smart features**: site settings (logo/title/favicon/socials/contact/shipping/returns), footer + static pages, full cart popup, per-product return policy
- [x] **Phase 13 - Header + sessions**: cart icon with badge, avatar user menu, profile page with phone/avatar, separate admin login + admin session
- [x] **Phase 14 - Amazon-style home + color themes**: navbar search bar, Amazon-style home restyle, admin-managed color themes (editable name/description/colors + add new)
- [x] **Phase 15 - Wishlist, reviews, media everywhere, recommendations**: wishlist + reviews/ratings (verified buyers), media slider/video in cart & home, Amazon-style product detail with "Frequently bought together", home recommendations from history + cart
- [x] **Phase 16 - Shipping module**: shipping methods, carrier quotes (manual/Shiprocket/Delhivery/Shippo), saved address book, per-product weight, tracking + events, admin provider switch + create shipment/sync
- [x] **Phase 17 - Switchable home templates**: admin picks one of three home layouts (marketplace/minimal/editorial) via `settings.home_template`; all render the same home data
- [x] **Phase 18 - Trending + Featured categories**: trending = backend-computed most-sold categories; featured = admin-marked categories in an ordered slider; shown in all three home templates + marketplace hero rail
- [x] **Phase 19 - Multi-gateway payments**: admin-selectable single active gateway (Razorpay/Stripe/test), embedded Stripe Payment Element, UPI inside Razorpay + Stripe, webhook reconciliation, admin Payments page, order payment info
- [x] **Phase 20 - Tier 1 commerce**: sale pricing + coupons, tax settings, transactional email (SMTP), password reset, review moderation, refunds, newsletter

## Detailed Task Log

### Phase 1 - Setup

- [x] Initialize `server/` Express project
- [x] DB config (`src/config/db.js`) + connection pool
- [x] MySQL schema (`schema.sql`) - users, categories, products, carts, orders, order_items, payments
- [x] JWT config (`src/config/jwt.js`)
- [x] Express entry point (`src/server.js`) with routes, CORS, JSON middleware
- [x] Placeholder auth routes/controllers wired
- [x] `.env.example` for environment variables
- [x] Initialize `client/` Vite React app
- [x] Install Redux Toolkit + React Router
- [x] Configure Tailwind CSS
- [x] Set up Redux store with slices
- [x] Base `App.jsx` with router skeleton
- [x] Both server and client start successfully

### Phase 2 - Auth

- [x] User model + register/login controllers (bcrypt, JWT)
- [x] `authSlice` + login/register pages
- [x] Protected routes + auth middleware
- [x] Token validated on reload via `GET /api/auth/me` (`checkAuth` thunk)
- [x] Logout redirects to home
- [x] Admin + demo user seed script (`npm run seed`)
- [x] CORS allows dev (5173) and preview (4173) origins

### Phase 3 - Storefront

- [x] Product & category models/controllers
- [x] Storefront pages (Shop, ProductDetail)
- [x] Cart slice + cart API
- [x] Product API: list with category/search/pagination, detail by slug
- [x] Cart API: get/add/update/remove (auth protected)
- [x] Seed data: 4 categories, 10 products
- [x] Shop page (category filter, search, pagination), ProductCard, ProductDetail
- [x] Cart page with qty controls/remove, synced to backend, fetched on login

### Phase 4 - Checkout + Payment

- [x] Order model/controllers
- [x] Razorpay/Stripe integration
- [x] Checkout page
- [x] `POST /api/orders` - creates order + items from cart (transactional, stock decrement, cart cleared)
- [x] `GET /api/orders`, `GET /api/orders/:id` - order history + detail
- [x] `POST /api/payment/create-order` - Razorpay order (falls back to test mode when keys absent)
- [x] `POST /api/payment/verify` - signature verification, marks order paid
- [x] `POST /api/payment/test-confirm` - dev-only instant confirm (disabled when Razorpay configured)
- [x] Checkout page with Razorpay checkout JS + Orders list/detail pages

### Phase 5 - Admin panel

- [x] Admin guard + layout
- [x] Dashboard, Products, Orders, Users, Categories CRUD
- [x] Dashboard: revenue/order/product/user/low-stock stats, 7-day sales chart, recent orders
- [x] Products: search + pagination, add/edit with image upload (Multer), activate/deactivate, delete
- [x] Categories: add/edit/delete with product counts
- [x] Orders: status filter + search, detail expand, status update
- [x] Users: block/unblock (login rejects blocked users), role change (can't modify self)
- [x] `users.active` column migration; uploaded images served at `/uploads`

### Phase 6 - Polish

- [x] Validation (Joi)
- [x] Error handling
- [x] Responsive pass
- [x] Deploy
- [x] Joi schemas + `validate` middleware on auth, cart, payment, orders, admin routes
- [x] Error handler covers DB duplicate key, bad JSON, multer, JWT, 404s
- [x] Mobile menu in navbar; admin layout becomes top bar on mobile; tables/cart scroll on small screens

### Phase 7 - Home page

- [x] `slides` table + admin CRUD with image upload (`AdminSlides`) + `GET /api/slides`
- [x] `GET /api/home` aggregates slides + popular products (by sales) + categories
- [x] `homeSlice` + redesigned Home: autoplay hero slider (arrows/dots), Popular Products grid, category tiles, feature strip
- [x] ProductCard add-to-cart button (also used on Home)

### Phase 8 - Soft delete

- [x] `deleted_at` on products, categories, brands, slides, orders, users
- [x] `server/migrations/migrate.js` idempotent migration + `npm run migrate`
- [x] All storefront/cart/order/auth/admin queries filter deleted rows
- [x] Restore endpoints for products/categories/brands/slides/orders/users
- [x] Admin trash views: Products, Categories, Orders, Slides; Users get delete
- [x] Login rejects deleted users

### Phase 9 - Filters + brands

- [x] `brands` table + `products.brand_id`; `GET /api/brands` + admin CRUD (`AdminBrands`)
- [x] Product list filters: `category`, comma-separated `brand`, `minPrice`, `maxPrice`, `sort` (popular/price/newest)
- [x] `Shop.jsx` sticky left sidebar: search, price range, category radios, brand checkboxes, clear-all
- [x] Product cards + admin product form show brand
- [x] Seed inserts demo brands and assigns `brand_id`

### Phase 10 - Product media

- [x] `product_media` table (image/video, sort_order)
- [x] Multer accepts images + videos (25MB cap); admin form uploads multiple images/videos or pastes URLs
- [x] `listProducts`/`getProduct` return `media[]`; `products.image` keeps the primary thumbnail
- [x] `ProductCard` mini image slider + video badge
- [x] `ProductDetail` gallery slider (image/video, thumbnails, arrows) + styled layout

### Phase 11 - Cart popup

- [x] `cartSlice.toast` (`openCartToast`/`closeCartToast`) + `CartPopup.jsx`
- [x] Popup shows product image, quantity, price, line total, cart subtotal, View Cart / Checkout, auto-dismiss 4.5s
- [x] Triggered from ProductCard and ProductDetail add-to-cart

### Phase 12 - Smart features

- [x] `settings` table + migration + seed defaults
- [x] `settingsController` + routes: public `GET /api/settings`, admin `GET`/`PUT /api/admin/settings` (logo + favicon upload)
- [x] `settingsSlice` + store wiring; Navbar logo/title + document title/favicon from settings
- [x] `AdminSettings` page (site title/logo/favicon, facebook/instagram, contact, free-shipping threshold, default return days)
- [x] `Footer.jsx` (link columns, contact, socials, dynamic shipping/returns) on all storefront pages
- [x] Static pages: About, Contact, FAQ, Terms, Privacy + routes
- [x] Home/ProductDetail feature text uses dynamic settings values
- [x] Full cart popup: all items with remove buttons, scrollable list (2 visible), free-shipping progress bar
- [x] Per-product return policy: `products.return_days` (NULL falls back to global), admin form field + ProductDetail display
- [x] Product add/edit on dedicated routes (`/admin/products/new`, `/admin/products/:id/edit`) with full-page form
- [x] Footer tagline + separate footer logo admin-managed (`site_tagline`, `footer_logo` upload)
- [x] Home feature strip (icon/title/text) admin-managed via `home_features` JSON, center-aligned, `{threshold}` placeholder
- [x] Popular Products rendered as one-line horizontal slider with scroll arrows
- [x] Categories: `categories.image` column, image upload in admin, full-page grid listing + add/edit popup, home tiles show images

### Phase 13 - Header + sessions

- [x] `users.phone` + `users.avatar` columns (migrate + schema + seed); register/login/me return phone + avatar
- [x] `PUT /api/auth/profile` (auth) updates name/phone + avatar file upload; verified register/login/profile via API
- [x] `adminClient.js` + `adminSlice.js`: separate `admin_token`/`admin_user` localStorage keys → user + admin sessions coexist
- [x] All `/admin/*` pages switched to `adminClient`; admin boot check via `GET /admin/stats`
- [x] `AdminLogin.jsx` at `/admin/login` (rejects non-admin), `RequireAdmin` redirects there, `AdminLayout` shows admin email + Sign out
- [x] `Navbar` redesign: Shop link, cart SVG icon with count badge, avatar dropdown (name/email, My Profile, Orders, Logout), no admin links in storefront header
- [x] `Register.jsx` phone field; new `Profile.jsx` page (`/profile`, RequireAuth) with name/phone edit + avatar upload/preview, updates `authSlice.user` via `setUser`
- [x] Client `npm run build` + `npm run lint` pass

### Phase 14 - Amazon-style home + color themes

- [x] `settings.theme` key (JSON: `selected`, `primary`/`accent` overrides, `templates` array) in `settingsController` PUBLIC_KEYS/DEFAULTS + seed + settingsSlice defaults; admin settings PUT persists it (verified via API)
- [x] `theme/themes.js`: 6 built-in templates (amazon/ocean/emerald/violet/rose/dark) with full color fields; `parseThemeSetting`/`resolveTheme`/`applyTheme` (handles old `{template}` shape + missing templates fallback)
- [x] `index.css` `@theme inline` maps CSS vars to `bg-primary`/`text-primary`/`bg-accent`/`bg-header-bg` etc.; `App.jsx` applies theme on settings load
- [x] Storefront refactor: `blue-600/700/50`, `indigo-700`, `blue-100` → theme tokens across Navbar, Footer, ProductCard, CartPopup and all storefront pages (admin stays blue)
- [x] Navbar: Amazon-style search bar (desktop + mobile) → `/shop?search=...`; `Shop.jsx` reads the `search` URL param; header uses `bg-header-bg`/`text-header-text`
- [x] Home restyle: hero gradient uses theme colors, Popular Products carousel ("See all" + arrows), category grid `md:grid-cols-6` tiles, feature strip themed
- [x] `AdminSettings` "Color themes": edit each template's name/description/primary/accent/header colors, select active, add new theme (copy), delete (min 1)
- [x] Client `npm run build` + `npm run lint` pass

### Phase 15 - Wishlist, reviews, media everywhere, recommendations

- [x] `wishlists` table (migrate + schema): UNIQUE(user_id, product_id), FK cascade both ways
- [x] `GET/POST/DELETE /api/wishlist` (auth); items return product fields + `media[]` + rating aggregates; POST idempotent (ON DUPLICATE KEY)
- [x] `reviews` table (migrate + schema): UNIQUE(product_id, user_id), rating 1-5, title, comment
- [x] `rating_avg`/`rating_count` subqueries in product list/detail/home/popular queries; `GET /:slug/reviews` public
- [x] `POST/PUT/DELETE /:slug/reviews` (auth); **verified-buyer gate**: order_items JOIN orders, status <> cancelled; non-buyer gets 403 (verified via API)
- [x] `optionalAuth` middleware; `GET /:slug` returns `canReview` + `myReview` when authed; productSlice stores them
- [x] ProductDetail Amazon-style rewrite: breadcrumb, gallery (MediaSlider + thumbnails + video), rating summary, sticky buy box (qty / Add to Cart / Buy Now / wishlist), customer reviews (avg, 1-5 distribution bars, list, write/edit/delete)
- [x] **Frequently bought together**: co-purchase ranking across order_items (verified 3↔7 mutual), checkboxes, combined total, "Add all to cart"; embedded in product detail
- [x] Reusable `MediaSlider.jsx` (arrows/dots, autoplay-muted-loop video, optional thumbnails); cart API returns `media[]` per item
- [x] `CartPopup` + `Cart` page use MediaSlider; `ProductCard` migrated to MediaSlider (video plays on Home carousels + wishlist + shop)
- [x] `GET /api/home` optionalAuth → `recommended` from cart categories + purchase history (excludes owned/in-cart); anonymous gets empty array (verified: demo → Atomic Habits, anon → 0)
- [x] `Home.jsx` "Inspired by your activity" carousel (rendered only when non-empty); homeSlice stores `recommended`
- [x] Wishlist client: `wishlistSlice`, Navbar heart + count badge (desktop + mobile), `WishlistButton` toggle, `/wishlist` page (RequireAuth), fetched on login / cleared on logout
- [x] `reviewSlice` (submit/update/delete) + form wired into ProductDetail; product refetched after mutations
- [x] Client `npm run build` + `npm run lint` pass; `npm run migrate`; backend restarted via PM2; end-to-end API verified (wishlist add/list/remove, cart media, order→review flow, 403 for non-buyer, FBT, recommended)

### Phase 16 - Shipping module

- [x] DB: `shipping_methods`, `addresses`, `shipping_info`, `shipping_events` tables; `orders.subtotal/shipping_fee/address_id`, `products.weight_grams`; settings keys `shipping_provider`, `default_weight_grams` + per-provider creds; `schema.sql` + `seed.js` updated; `npm run migrate` applied
- [x] Backend: `services/shipping/` adapter factory + Manual/Shiprocket/Delhivery/Shippo + `quote.js` (weight from items, free threshold, provider rate fallback)
- [x] Backend: `addressController` (/api/addresses CRUD), `shippingController` (methods + quote), `adminShippingController` (methods CRUD, config, order ship/sync/events)
- [x] Backend: `orderController` shipping-aware creation (shipping_method_id + address_id | shipping_address, fee vs free threshold, shipping_info snapshot); `adminController` adminGetOrder shipping+events, status transition guard + shipped_at/delivered_at stamps
- [x] Backend: `weight_grams` in productSchema + adminController create/update/list/get (round-trip verified: quote weight 500g = 2×250g)
- [x] Backend: routes mounted (addresses, shipping, adminShipping, order-shipping actions in admin.js); verified via curl
- [x] Frontend: `shippingSlice` (methods, quote, addresses thunks) + store registration
- [x] Frontend: `Checkout.jsx` (saved address picker + new address form, method radios with ETA/fee, subtotal/shipping/total, place order sends shipping fields)
- [x] Frontend: `Addresses.jsx` page + `/account/addresses` route (RequireAuth); Navbar Addresses links (desktop + mobile)
- [x] Frontend: `OrderDetail.jsx` status progress + shipping block + tracking timeline; `Orders.jsx` shows method
- [x] Frontend: `AdminShipping.jsx` page + `/admin/shipping` route + AdminLayout link (provider switcher, credential fields, pickup origin, default weight, methods CRUD)
- [x] Frontend: `AdminProductForm.jsx` weight_grams field (emptyForm/prefill/submit)
- [x] Frontend: `AdminOrders.jsx` shipping panel (totals + ship-to, create shipment, sync tracking, update tracking form, add event, events timeline)
- [x] Verify: client lint + build clean, PM2 restart both apps, curl tests (methods, quote, addresses, order w/ shipping, admin methods/config, ship/events/sync, status guard, weight round-trip)
- [ ] Live carrier API testing blocked until provider credentials are provided

### Phase 17 - Switchable home templates

- [x] Backend: `home_template` added to settings `DEFAULTS` + `PUBLIC_KEYS` (`settingsController.js`), seeded in `schema.sql` + `seed.js` (default `marketplace`)
- [x] Frontend: `settingsSlice` initial state includes `home_template: 'marketplace'` (merged from public settings)
- [x] Frontend: shared home components under `components/home/` — `HeroSlider` (fade-up re-trigger, hover-pause autoplay, gradient fallback hero), `ProductGrid`, `CategoryTile`, `TrustBand` (cards/center/dark), `NewsletterStrip` (gradient/minimal/solid)
- [x] Frontend: `MarketplaceTemplate.jsx` (category chips, hero slider + promo rail, popular grid, asymmetric category showcase, promo banners, recommended carousel, trust band + newsletter)
- [x] Frontend: `MinimalTemplate.jsx` (editorial 2-col hero with tilted image + free-shipping badge, numbered sections, category tiles, editorial split, centered values, underline newsletter)
- [x] Frontend: `EditorialTemplate.jsx` (full-bleed black hero + giant type, marquee strip from home features, essentials grid, full-width quote banner, staggered categories, dark values band, solid-color newsletter)
- [x] Frontend: `Home.jsx` rewritten as a switcher reading `settings.home_template` (fallback `marketplace`); `index.css` gains marquee/edge-fade/stagger utilities
- [x] Frontend: `AdminSettings.jsx` home-page-template picker (3 selectable cards with mini previews) saved via existing settings PUT
- [x] Fallbacks: 0 slides → gradient hero with `site_tagline`; <2 slides → no promo rail (fills from category images); category without image → placeholder; empty recommended → section hidden
- [x] Verify: client lint + build clean, PM2 restart, settings round-trip via curl (marketplace → minimal → editorial, persisted)

### Phase 18 - Trending + Featured categories

- [x] DB: `categories.featured` TINYINT(1) DEFAULT 0 + `categories.featured_order` INT DEFAULT 0 (idempotent `migrate.js`, `schema.sql`, `seed.js`; `npm run migrate` clean)
- [x] Backend: `homeController.getHome` returns `trendingCategories` (ORDER BY sold DESC LIMIT 6) + `featuredCategories` (featured=1 ORDER BY featured_order ASC); `categories` query returns `featured`/`featured_order`/`sold`, ordered featured-first
- [x] Backend: `adminController` category CRUD accepts featured fields; `listAdminCategories` includes them; new `setCategoryFeatured` via `PUT /admin/categories/:id/feature` (multipart `handleUpload` required — `setCategoryFeatured` reads `req.body.featured`)
- [x] Seed marks Electronics/Clothing/Home & Kitchen featured (orders 1/2/3), Books not; live DB updated via API to match (verified `/api/home` featured order = Electronics → Clothing → Home & Kitchen)
- [x] Frontend: `homeSlice` stores `trendingCategories`/`featuredCategories` + selectors; `Home.jsx` passes them to all templates
- [x] Frontend: new `CategoryCarousel.jsx` (scroll rail, prev/next, `CategoryTile` + `meta` override for "N sold"/"N items", `scrollbar-none` + `edge-fade`)
- [x] Frontend: `AdminCategories.jsx` featured toggle in card actions + ★ badge + featured checkbox/order field in edit form (multipart save)
- [x] Marketplace: hero rail now uses top trending ("Trending", "N sold") + top featured ("Featured", "N items") categories with fallbacks; rail column `lg:h-[440px]`; `HeroSlider` `stretch` prop so slider fills the same height (tops aligned); Featured Collections `CategoryCarousel` section added
- [x] Minimal: Trending (02) + Featured (03) carousel sections added, Collections renumbered to 04
- [x] Editorial: Trending (02) + Featured (03) carousel sections added, quote banner → 04 / Featured story, Categories → 05, Newsletter eyebrow override (06)
- [x] Verify: client `npm run lint` + `npm run build` clean, PM2 frontend restart, `/api/home` payload confirmed (trending by sold: Electronics=6, Books=3; 3 featured marked), featured order round-trip via API

### Phase 19 - Multi-gateway payments

- [x] DB: `payments.currency VARCHAR(10)` (idempotent `migrate.js` + `schema.sql`; `npm run migrate` added column)
- [x] Backend: settings keys `payment_gateway` (default `test`), `payment_currency`, `razorpay_key_id/secret`, `stripe_secret_key/publishable_key/webhook_secret` in `settingsController` DEFAULTS; credentials resolve from settings with env fallback
- [x] Backend: `services/payment/` adapter factory — `index.js` (gateway labels, `gatewayIsConfigured`, `getPaymentAdapter`, `getPublicPaymentConfig`), `razorpay.js` (order create + HMAC verify), `stripe.js` (PaymentIntent create with `automatic_payment_methods`, retrieve verify, `constructEvent`)
- [x] Backend: `paymentController` rewrite — `createPayment` gateway-aware (test/razorpay/stripe), `verifyPayment` per active gateway (idempotent when already paid), `testConfirm` gated to test mode, `paymentConfig` (sanitized public), `stripeWebhook` (`payment_intent.succeeded` → mark paid, idempotent, 400 on bad signature)
- [x] Backend: routes — `payment.js` public `GET /config` before auth; new `adminPayment.js` `GET/PUT /api/admin/payment-config` (mirrors shipping-config, secrets masked, blank secrets preserved); `server.js` mounts `POST /api/payment/webhook` with `express.raw()` before global JSON + mounts adminPayment
- [x] Backend: `paymentVerifySchema` gateway-aware (razorpay fields XOR `payment_intent_id`), `paymentConfigSchema` for admin PUT; `orderController` `getOrderById` returns `payment`, `listOrders` returns `payment_gateway`
- [x] Frontend: installed `@stripe/stripe-js` + `@stripe/react-stripe-js` (client), `stripe` (server); `paymentSlice` (`fetchPaymentConfig` + selectors) registered in store
- [x] Frontend: `Checkout.jsx` branches by gateway — test-confirm, Razorpay modal (currency from config), Stripe (`loadStripe` + `client_secret`, `confirmStripePayment` → `/verify`, cancel → `/orders`); empty-cart guard relaxed while a Stripe payment is active
- [x] Frontend: `CheckoutLayouts.jsx` — `PaymentProgress` (order snapshot recap), `StripePaymentSection`/`StripePaymentForm` (PaymentElement + Pay/Cancel), summary shows gateway label + swaps button for the element; used in all 3 templates
- [x] Frontend: `AdminPayments.jsx` + `/admin/payments` route + AdminLayout link (gateway radio cards, currency, masked credentials, configured badges); `Orders.jsx` shows payment gateway
- [x] Verify: server `node --check` clean; client lint + build clean (156 modules); PM2 backend restart; API verified — `GET /api/payment/config` (test/INR), admin config GET/PUT round-trip (stripe w/ dummy keys → configured true, secrets masked, blank-secret PUT preserved), reset to test, webhook 400 when Stripe unconfigured

### Phase 20 - Tier 1 commerce (sale pricing, coupons, tax, email, refunds, newsletter, password reset, review moderation)

- [x] **Sale pricing**: `products.sale_price` + `sale_start`/`sale_end` columns; active sale wins over base price everywhere (lists, detail, cart, checkout), `discount_percent`/`on_sale` computed in product queries; admin product form edits sale price + schedule
- [x] **Coupons**: `coupons` table (code, type `percent`/`fixed`, value, min_subtotal, min_items, max_discount, uses, usage_limit, active, valid_from/until); admin CRUD (`AdminCoupons` + `/api/admin/coupons`); storefront apply/remove in cart; `orders.discount` + `orders.coupon_id` + `orders.coupon_code` snapshot; single coupon per cart with validation + stock check
- [x] **Tax settings**: settings keys `tax_enabled`, `tax_rate`, `tax_inclusive`; tax computed on discounted subtotal in checkout (`orders.tax_fee`); `prices include tax` mode shows tax line without changing total
- [x] **Transactional email**: `services/email.js` `sendMail` (nodemailer, settings-backed `smtp_host/port/secure/user/password/from` with env fallback), order confirmation + refund emails; email log table; no-op when SMTP unconfigured
- [x] **Password reset**: `users.reset_token` + `reset_token_expires`; `POST /api/auth/forgot-password` (1h token email link `{CLIENT_URL}/reset-password?token=…`, always-safe message) + `POST /api/auth/reset-password` (validates token, hashes + updates); client `ForgotPassword.jsx` + `ResetPassword.jsx` routes, "Forgot password?" link on `Login.jsx`
- [x] **Review moderation**: storefront reviews filtered to `approved = 1` (lists, product detail, home, wishlist); new/edited reviews set `approved` from `settings.reviews_auto_approve`; `reportReview` (`POST /api/products/:slug/reviews/:id/report` sets `reported=1`, pulls from storefront); admin `AdminReviews.jsx` (tabs All/Pending/Approved/Reported, search, approve/reject) + `GET/PATCH /api/admin/reviews/:id`; `reviews_auto_approve` toggle in `AdminSettings`
- [x] **Refunds**: `payments.refund_status` (default `none`); admin `POST /api/admin/orders/:id/refund` (paid/shipped/delivered only, rejects cancelled/already-refunded, sets payment `refund_status='refunded'`); `refund_status` surfaced in admin order list + detail, user order detail, and `AdminOrders.jsx` expansion (Refund button + badges)
- [x] **Newsletter**: `subscribers` table (email UNIQUE, active, subscribed_at); `POST /api/newsletter` subscribe + `DELETE /api/newsletter` unsubscribe (validated); admin `AdminSubscribers.jsx` (search, show inactive, CSV export, delete) + `GET /api/admin/subscribers` + `DELETE /api/admin/subscribers/:id`; storefront `NewsletterStrip.jsx` wired to real API
- [x] **AdminSettings**: SMTP section (host/port/secure/user/password/from) + Reviews section (`reviews_auto_approve` toggle); all keys already whitelisted in settings DEFAULTS
- [x] Verify: server `node --check` clean for all modified files; `npm run migrate` idempotent; client `vite build` clean (163 modules); PM2 backend + frontend restarted; API smoke tests — newsletter subscribe + invalid 400, forgot-password always-safe message, reset-password invalid-token 400, admin reviews pending list + approve → storefront shows approved-only review + rating, admin orders `refund_status` present, refund OK + double-refund rejected, demo data reverted after tests

### Phase 21 - Validation across all forms + contact form

- [x] **Server Joi schemas**: added `couponSchema` (code 1–50 trim/uppercase applied in controller, type percent/fixed, value ≥0, percent ≤100, expiry after start), `couponValidateSchema` (code + optional subtotal ≥0), `reviewSchema` (rating 1–5 required, title ≤200/comment ≤5000 optional), `categoryFeaturedSchema` (featured required 0/1/bool), `settingsSchema` (types/ranges only + `.unknown(true)` so theme/home_features JSON pass through), `shippingConfigSchema` (`.unknown(true)`, credentials optional), `contactSchema` (name 1–100, email, message 1–2000) — all in `server/src/utils/schemas.js`
- [x] **Route wiring**: `validate()` now guards `POST /api/coupons/validate`, admin `POST/PUT /api/admin/coupons`, `PUT /api/admin/categories/:id/feature` (after multipart upload), `PUT /api/admin/settings`, `PUT /api/admin/shipping-config`, `POST /api/products/:slug/reviews`; new `paramInt()` middleware guards wishlist `:product_id` (400 on non-integer)
- [x] **Contact form**: `contact_messages` table (idempotent in `migrate.js` + `schema.sql`); `contactController.createMessage` (insert + optional email to `settings.contact_email` via `sendMail`); `routes/contact.js` mounted at `/api/contact`; `Contact.jsx` rewritten from dead form to controlled form (name/email/message, loading/success/error states, inline validation)
- [x] **Client validation**: new `client/src/utils/validation.js` (`field.*` validators, `validateFields`, `useFormErrors`) + `components/FieldError.jsx`; applied inline validation to `Addresses.jsx`, checkout `NewAddressForm` (CheckoutLayouts/Checkout), `AdminSlides` (title + image required), `AdminSettings` (numeric/email ranges), `AdminPayments` (currency 3-letter), `AdminShipping` (config + method fee/name); review form `maxLength` guards (title 200 / comment 5000) — title/comment stay optional
- [x] Verify: server `node --check` clean; `npm run migrate` created `contact_messages`; client `vite build` clean (165 modules); PM2 backend + frontend restarted; 10/10 API smoke tests — empty coupon body 400, negative subtotal 400, review rating 6/missing 400, category feature empty body 400, settings `tax_rate=abc` 400, shipping-config bad weight 400, contact valid 201 + invalid 400, wishlist `product_id=abc` 400; positive paths — category feature JSON toggle 200, valid review reaches "verified buyers" guard (403, schema passed), coupon validate reaches coupon logic; test users + contact messages cleaned up; no new PM2 error-log entries

## Deployment

### Server (with PM2)

```bash
cd server
npm install
# set production values in .env: DB creds, JWT_SECRET, CLIENT_URL
# payment gateway + credentials are configured in Admin → Payments (settings), not .env
cd ..
pm2 start ecosystem.config.js
pm2 save            # persist process list
pm2 startup         # auto-start on boot
```

### Client

```bash
cd client
npm run build       # outputs static site to client/dist
```

- `ecosystem.config.js` serves `dist` via `vite preview` (port 4173) and the API on 5000.
- For a static host (Vercel/Netlify/Nginx), upload `client/dist` and add an SPA fallback to `index.html`.
- Set `VITE_API_URL` in `client/.env` to the production API URL, and `CLIENT_URL` in `server/.env` to the frontend origin (comma-separated list allowed).
- MySQL: run `schema.sql`, then `npm run seed` for the admin (`admin@example.com` / `admin123`). Change that password immediately.

## Decisions / Notes

- Payment gateway: admin-selectable single active gateway — Razorpay (India), Stripe (international, embedded Payment Element with UPI where enabled), or test mode. UPI is offered inside Razorpay and via Stripe, not as a separate gateway. Credentials + gateway live in `settings` (Admin → Payments); test-mode fallback when none configured.
- Data fetching: plain axios + Redux slices (not RTK Query).
- Soft delete uses `deleted_at` on entity tables; child tables (carts, order_items, payments) stay hard-delete.
- Product gallery: `product_media` supports uploaded files and pasted URLs; first image is mirrored to `products.image`.
- Return policy is per-product (`products.return_days`); NULL means the store default from `settings.return_days`.
- Site branding (logo/title/favicon/socials/contact/shipping threshold) is admin-managed via `settings` and read once at app boot into Redux.
- Sessions: storefront users use `token`/`user` in localStorage; admins use `admin_token`/`admin_user` so a shopper and an admin can both be signed in. Admin login is `/admin/login`.
- Color themes: `settings.theme` holds the selected template id + full editable template list; client maps resolved colors to CSS variables consumed by Tailwind v4 `@theme inline` tokens across the storefront. Admin panel is intentionally fixed blue.
- On existing installs run `npm run migrate` (idempotent) before restarting the API.
- Reviews are restricted to verified buyers (product present in a non-cancelled order); `GET /:slug` uses `optionalAuth` to expose `canReview`/`myReview`.
- Wishlist uses a dedicated slice fetched on login; the Navbar heart badge reflects its count.
- Home recommendations require login (they derive from the user's cart + purchase history); the section is hidden when empty.
- Shipping: provider switchable from admin (`settings.shipping_provider` = manual/shiprocket/delhivery/shippo); manual mode always works, live carriers need credentials + pickup origin set. Per-product `weight_grams` (NULL → `settings.default_weight_grams`). Orders snapshot `shipping_info` (method + address + carrier/tracking); `total = subtotal + shipping_fee`. Admin order status guard prevents illegal transitions (e.g. delivered → paid) and stamps shipped_at/delivered_at.
- Trending vs Featured: trending is backend-computed by units sold (no manual control); featured is admin-marked with a sort order and drives the Featured slider + marketplace hero rail. Admin featured toggle endpoint is multipart (`handleUpload`) because the controller reads `req.body`.
- Next steps beyond plan: image storage (cloud), live carrier credentials for Shiprocket/Delhivery/Shippo, live payment keys + Stripe webhook signing secret for Razorpay/Stripe (setup steps in `payment-gateway-plan.md`).

## How to Run

### Server

```bash
cd server
npm install
# create .env from .env.example and set DB credentials
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```
