# Shipping Module — Plan & Progress

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress · `[!]` blocked

## Decisions (confirmed with user)

- **Scope:** full module (methods, quote, tracking, admin panel, address book)
- **Fees:** per-method config in a `shipping_methods` table
- **Carriers:** both Indian (Shiprocket, Delhivery) + international (Shippo), switchable from admin via a `shipping_provider` setting; `manual` mode as fallback
- **Weight:** per-product `weight_grams` with a `default_weight_grams` setting fallback
- **Address book:** reusable saved addresses via `/api/addresses`

## Data model

New tables: `shipping_methods`, `addresses`, `shipping_info`, `shipping_events`
Alters: `orders` (+subtotal, +shipping_fee, +address_id), `products` (+weight_grams)
New settings keys: `shipping_provider`, `default_weight_grams`, and per-provider credentials
`orders.total` stays subtotal + shipping_fee so payment flow is unchanged.

## Backend

- `services/shipping/` — carrier adapters (factory + Manual/Shiprocket/Delhivery/Shippo)
- `routes/addresses.js` → `/api/addresses` (user CRUD)
- `routes/shipping.js` → `/api/shipping/methods`, `/api/shipping/quote` (public)
- `routes/adminShipping.js` → `/api/admin/shipping-methods` CRUD
- `routes/admin.js` → order shipping actions: `PATCH .../shipping`, `POST .../shipping/ship`, `POST .../shipping/sync`, `POST .../shipping/events`
- `orderController.createOrder` — accepts `shipping_method_id` + `address_id | shipping_address`, computes fee vs free threshold, snapshots shipping_info
- `adminController` — adminGetOrder returns shipping + events; updateOrderStatus gains transition guard + shipped_at/delivered_at stamps
- `utils/schemas.js` — addressSchema, shippingMethodSchema, orderCreateSchema, updateShippingSchema

## Frontend (user)

- `features/shippingSlice.js` — methods, quote, addresses state
- `pages/Checkout.jsx` — address picker/new form, method radios, fee summary
- `pages/Addresses.jsx` (new) + `/account/addresses` route
- `pages/OrderDetail.jsx` — shipping block + tracking timeline + status progress
- `pages/Orders.jsx` — method + tracking shown per order

## Frontend (admin)

- `admin/AdminShipping.jsx` (new) — provider switcher (manual/shiprocket/delhivery/shippo), credential fields, pickup origin postcode, default weight, methods CRUD; linked from AdminLayout
- `admin/AdminProductForm.jsx` — weight_grams field
- `admin/AdminOrders.jsx` — shipping panel: create shipment / manual tracking / events / sync

## Progress

- [x] Decisions + plan written
- [x] DB: tables, alters, seed, settings keys (migration file + apply)
- [x] Backend: schemas + settings keys
- [x] Backend: carrier adapters
- [x] Backend: addresses API
- [x] Backend: shipping quote/methods API
- [x] Backend: order creation changes
- [x] Backend: admin shipping-methods CRUD
- [x] Backend: admin order shipping endpoints + status guard
- [x] Backend: mount routes
- [x] Backend: weight_grams in product schema + adminController
- [x] Frontend: shippingSlice
- [x] Frontend: Checkout
- [x] Frontend: Addresses page + route
- [x] Frontend: OrderDetail shipping block
- [x] Frontend: Orders list
- [x] Frontend: AdminShipping page + route
- [x] Frontend: AdminProductForm weight
- [x] Frontend: AdminOrders shipping panel
- [x] Apply DB migration to live MySQL
- [x] Verify: lint, build, restart, curl tests

## Verified (curl)

- GET /api/shipping/methods, POST /api/shipping/quote (weight from cart, free threshold)
- /api/addresses CRUD
- POST /api/orders with shipping_method_id + address_id (shipping_info snapshot)
- Admin shipping-methods CRUD + shipping-config PUT (provider switch)
- PATCH /api/admin/orders/:id/shipping, POST .../shipping/events
- POST .../shipping/ship (manual → LOC tracking + status shipped), status transition guard
- products.weight_grams round-trip (create/update/read) + quote weight 500g = 2×250g

## Open items

- [ ] Live carrier API testing blocked until provider credentials are provided
- [ ] Pickup address/postcode must be configured per provider before "Create shipment"
