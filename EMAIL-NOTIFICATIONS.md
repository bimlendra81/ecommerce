# Email Notification System — Shipping & Payment

> **Status:** Plan — pending user approval
> **Owner:** Ecom backend
> **Scope:** Transactional order/shipping/payment emails + tracking cron

---

## 1. Why a Cron Is Required for Shipping Status

The current shipping architecture uses **pull-based tracking only**:

- All carriers (Shiprocket, Delhivery, Shippo) expose `adapter.track({ carrier, tracking_number })`
- There are **no shipping webhook endpoints** in the codebase (Stripe has a payment webhook, but no shipping webhook exists)
- Carrier tracking state changes over time: `dispatched → in transit → out for delivery → delivered → exception`
- Nothing **pushes** those state changes to our server

**Therefore a cron job must periodically poll** every active shipment, detect **new** tracking events, dedupe them against `shipping_events`, and email the customer.

A cron is also required even if webhooks are added later, as a **fallback / reconciliation** layer for missed or failed webhook deliveries (at-least-once delivery).

---

## 2. Shipping Email Notification Types

| # | Email | Trigger | Timing |
|---|-------|---------|--------|
| 1 | **Order Confirmation** | Order placed (`createOrder`) | Immediate (event-driven, not cron) |
| 2 | **Shipment Created / Tracking Assigned** | Label + tracking number from `createOrderShipment` | Immediate (event-driven) |
| 3 | **In-Transit Update** *(optional, batchable)* | New meaningful carrier scan events from `track()` | Cron poll (every 30–60 min) |
| 4 | **Out for Delivery** | Carrier event matches "out for delivery" | Cron poll |
| 5 | **Delivered + Review CTA** | Carrier reports delivered → order marked `delivered` | Cron poll |
| 6 | **Delivery Exception / Delay** | Delay / address issue / failed attempt, OR `estimated_delivery` passed without delivery | Cron poll |

---

## 3. Payment Email Notification Types

| # | Email | Trigger | Timing |
|---|-------|---------|--------|
| 1 | **Payment Pending / Awaiting Payment** *(optional)* | Payment created, user hasn't paid | Immediate or cron reminder |
| 2 | **Payment Success / Receipt (with invoice)** | `markPaid`, `testConfirm`, Stripe webhook `payment_intent.succeeded` | Immediate (event-driven) |
| 3 | **Payment Failed + Retry Link** | Gateway failure (Razorpay `payment.failed`, Stripe `payment_intent.payment_failed`) | Immediate (webhook / event) |
| 4 | **Refund Processed** | `refundOrder` admin action marks payment `refunded` | Immediate (event-driven) |
| 5 | **Order Cancelled + Refund Confirmation** | Admin status changed to `cancelled` after payment | Immediate (event-driven) |
| 6 | **Admin Alert: Payment Received** | Any successful payment | Immediate (event-driven) |

---

## 4. Cron Job Design

| Item | Decision |
|------|----------|
| Library | `node-cron` |
| File | `server/src/jobs/shippingTrackingCron.js` |
| Interval | `settings.tracking_cron_minutes` (default `30`) |
| Query | Orders `status='shipped'`, `deleted_at IS NULL`, joined `shipping_info` with `tracking_number` **plus** orders past `estimated_delivery` not yet delivered (delay detection) |
| Poll | `adapter.track()` per shipment |
| Dedupe | Match against existing `shipping_events` rows (same logic as existing `syncOrderTracking`) |
| Email rules | Only email on **meaningful transitions** (out-for-delivery, delivered, exception, delay) — NOT every generic scan, to avoid spam |
| Delivered | Set `orders.status='delivered'` + `shipping_info.delivered_at`, send review CTA |
| Concurrency | MySQL `GET_LOCK` guard so only one PM2 worker polls at a time |
| Retries | Non-fatal per-shipment error handling; job continues with next shipment |

### 4.1 Delay detection

For orders with `shipping_info.estimated_delivery` in the past and status still `shipped`, send a **Delivery Delay** email once per order (guard via `email_logs`).

---

## 5. Dedup / Audit Table

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NULL,
  shipping_event_id INT UNSIGNED NULL,
  type VARCHAR(50) NOT NULL,            -- e.g. order_confirmation, payment_receipt, shipped, out_for_delivery, delivered, delay, payment_failed, refund
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_logs_order (order_id),
  INDEX idx_email_logs_event (shipping_event_id),
  INDEX idx_email_logs_type (type, order_id)
) ENGINE=InnoDB;
```

- Prevents duplicate customer emails after crashes / retries
- Every email send is recorded; `shipping_event_id` guard ensures one email per event

---

## 6. Implementation Phases

### Phase 1 — Email template layer
- `server/src/services/emailTemplates.js` — builders for all templates
- Reuse existing `sendMail()` (Nodemailer) + brand layout in `server/src/services/email.js`

### Phase 2 — Event-driven hooks (no cron)
- `orderController.js` `createOrder` → **Order Confirmation**
- `paymentController.js`:
  - `markPaid`, `testConfirm`, Stripe webhook success → **Receipt**
  - Add failed-payment handling → **Payment Failed**
- `adminShippingController.js` `createOrderShipment` → **Shipment Tracking email**
- `adminController.js`:
  - `refundOrder` → **Refund Processed**
  - `updateOrderStatus` → `cancelled` → **Cancelled + Refund Confirmation**

### Phase 3 — Cron job
- `npm install node-cron` in `server/`
- `server/src/jobs/shippingTrackingCron.js`
- Bootstrap scheduler in `server/src/server.js`
- Settings keys: `tracking_cron_minutes` (default 30), `tracking_cron_enabled` (default 1)

### Phase 4 — Migration
- `email_logs` table added to `server/migrations/migrate.js`
- Seed notification settings

### Phase 5 (Optional, later) — Shipping webhooks
- Shiprocket / Delhivery webhook endpoints as a faster primary channel
- Cron retained as reconciliation fallback

---

## 7. Email Template Designs

All templates share the store-branded layout from `server/src/services/email.js`:

- Header bar: store title (brand color `#111827`)
- Body: 560px white card, `Segoe UI`, 15px text, gray `#374151`
- Footer: muted unsubscribe/ignore note
- All prices formatted with store currency
- All dates human-readable, timezone-adjusted
- Tracking links open `tracking_url`

### 7.1 Order Confirmation

```
SUBJECT: Order #1234 confirmed — {store_name}
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Hi {customer_name},                           │
│                                                │
│  Thank you for your order! We've received it   │
│  and will start preparing it right away.       │
│                                                │
│  ┌─ ORDER #1234 ─────────────────────────────┐ │
│  │  Qty  Item                    Price       │ │
│  │  ───────────────────────────────────────  │ │
│  │  2    Wireless Headphones      ₹7,998     │ │
│  │  1    USB-C Cable              ₹499       │ │
│  │  ───────────────────────────────────────  │ │
│  │  Subtotal                     ₹8,497      │ │
│  │  Shipping                      ₹99        │ │
│  │  Tax (18%)                    ₹1,547      │ │
│  │  Discount                     −₹500       │ │
│  │  TOTAL                        ₹9,643      │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  Shipping to:                                  │
│  {full_name}                                   │
│  {address_line1}, {city}, {state} {postal}     │
│                                                │
│  [  View Order  ]  [  Track Order  ]           │
│                                                │
│  Estimated delivery: {estimated_delivery}      │
└────────────────────────────────────────────────┘
```

### 7.2 Shipment Created / Tracking Assigned

```
SUBJECT: Your order #1234 has been shipped!
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Great news, {customer_name}!                  │
│                                                │
│  Your order #1234 is on its way.               │
│                                                │
│  ┌─ SHIPMENT ────────────────────────────────┐ │
│  │  Carrier:   {carrier}                     │ │
│  │  Tracking:  {tracking_number}             │ │
│  │  ETA:       {estimated_delivery}          │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  [  Track Your Package  ]                      │
│                                                │
│  Tip: You can also paste your tracking number  │
│  into {tracking_url}                           │
└────────────────────────────────────────────────┘
```

### 7.3 In-Transit Update (optional)

```
SUBJECT: Your order #1234 is on the move
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Hi {customer_name},                           │
│                                                │
│  Your package just reached a new checkpoint:   │
│                                                │
│  📦 {event}                                    │
│  📍 {location}                                 │
│  🕒 {timestamp}                                │
│                                                │
│  [  Track Your Package  ]                      │
└────────────────────────────────────────────────┘
```

### 7.4 Out for Delivery

```
SUBJECT: Out for delivery — order #1234 arrives today
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Your package is out for delivery,             │
│  {customer_name}! 🚚                           │
│                                                │
│  Order #1234                                   │
│  Carrier: {carrier}                            │
│  Tracking: {tracking_number}                   │
│                                                │
│  Please keep an eye out at:                    │
│  {address_line1}, {city}                       │
│                                                │
│  [  Track Live Status  ]                       │
└────────────────────────────────────────────────┘
```

### 7.5 Delivered + Review CTA

```
SUBJECT: Your order #1234 has been delivered 🎉
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Delivered!, {customer_name} 🎉                │
│                                                │
│  Your order #1234 arrived on {delivered_date}  │
│                                                │
│  ┌─ ITEMS DELIVERED ─────────────────────────┐ │
│  │  Wireless Headphones          [Review ⭐] │ │
│  │  USB-C Cable                  [Review ⭐] │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  Love your purchase? Share your experience     │
│  and help other shoppers!                      │
│                                                │
│  [  Write a Review  ]                          │
│                                                │
│  Need help? Contact support.                   │
└────────────────────────────────────────────────┘
```

### 7.6 Delivery Exception / Delay

```
SUBJECT: Update on your order #1234 — delayed
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Hi {customer_name},                           │
│                                                │
│  We wanted to let you know about a delay       │
│  with your order #1234.                        │
│                                                │
│  ┌─ STATUS ──────────────────────────────────┐ │
│  │  {exception_reason}                       │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  New estimated delivery: {new_eta}             │
│                                                │
│  We're sorry for the inconvenience. Your       │
│  package is still on its way and we're         │
│  monitoring it closely.                        │
│                                                │
│  [  Track Package  ]  [  Contact Support  ]    │
└────────────────────────────────────────────────┘
```

### 7.7 Payment Receipt (Success)

```
SUBJECT: Payment confirmed — order #1234
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Payment successful, {customer_name}!          │
│                                                │
│  ┌─ RECEIPT ─────────────────────────────────┐ │
│  │  Order #:     1234                        │ │
│  │  Date:        {paid_at}                   │ │
│  │  Gateway:     {gateway}  •••• {last4}     │ │
│  │  Txn ID:      {txn_id}                    │ │
│  │  Amount paid: ₹9,643                      │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  Your order is being prepared.                 │
│  [  View Order  ]                              │
└────────────────────────────────────────────────┘
```

### 7.8 Payment Failed + Retry

```
SUBJECT: Payment failed — order #1234
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Hi {customer_name},                           │
│                                                │
│  We couldn't process your payment for order    │
│  #1234.                                        │
│                                                │
│  ┌─ ERROR ───────────────────────────────────┐ │
│  │  {failure_reason}                         │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  Your order will be held for 24 hours.         │
│                                                │
│  [  Retry Payment  ]                           │
│                                                │
│  Questions? Contact support.                   │
└────────────────────────────────────────────────┘
```

### 7.9 Refund Processed

```
SUBJECT: Refund processed for order #1234
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Hi {customer_name},                           │
│                                                │
│  Your refund for order #1234 has been          │
│  processed. 💳                                 │
│                                                │
│  ┌─ REFUND DETAILS ──────────────────────────┐ │
│  │  Amount:     ₹9,643                       │ │
│  │  Gateway:    {gateway}                    │ │
│  │  Date:       {refund_date}                │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  Funds typically appear within 5–10 business   │
│  days depending on your bank.                  │
└────────────────────────────────────────────────┘
```

### 7.10 Order Cancelled

```
SUBJECT: Order #1234 cancelled
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name}                       [logo]     │
├────────────────────────────────────────────────┤
│  Hi {customer_name},                           │
│                                                │
│  Your order #1234 has been cancelled as        │
│  requested.                                    │
│                                                │
│  ┌─ CANCELLATION ────────────────────────────┐ │
│  │  Order #:    1234                         │ │
│  │  Amount:     ₹9,643                       │ │
│  │  Refund:     Processed via {gateway}      │ │
│  └───────────────────────────────────────────┘ │
│                                                │
│  We hope to see you again soon!                │
└────────────────────────────────────────────────┘
```

### 7.11 Admin Alert: Payment Received

```
SUBJECT: [Admin] Payment received — order #1234
--------------------------------------------------------------

┌────────────────────────────────────────────────┐
│  {store_name} — Admin                         │
├────────────────────────────────────────────────┤
│  A payment was received:                       │
│                                                │
│  Order #:     1234                             │
│  Customer:    {customer_name} ({email})        │
│  Amount:      ₹9,643                           │
│  Gateway:     {gateway}                        │
│  Txn ID:      {txn_id}                         │
│  Time:        {paid_at}                        │
│                                                │
│  Action required: Create shipment when ready.  │
└────────────────────────────────────────────────┘
```

---

## 8. Settings Keys Added

| Setting | Default | Purpose |
|---------|---------|---------|
| `tracking_cron_enabled` | `1` | Master toggle for the tracking cron |
| `tracking_cron_minutes` | `30` | Poll interval |
| `email_order_confirmation` | `1` | Toggle order confirmation email |
| `email_shipped` | `1` | Toggle shipped/tracking email |
| `email_delivered` | `1` | Toggle delivered email |
| `email_delay` | `1` | Toggle delay/exception email |
| `email_payment_receipt` | `1` | Toggle payment receipt email |
| `email_payment_failed` | `1` | Toggle payment failed email |
| `email_refund` | `1` | Toggle refund email |
| `email_admin_alert` | `1` | Toggle admin payment alert email |
| `admin_notification_email` | `contact_email` | Where admin alerts are sent |

---

## 9. Files Changed / Created

| File | Action |
|------|--------|
| `server/src/services/emailTemplates.js` | **Create** — template builders |
| `server/src/services/email.js` | Minor — export `layout()` / add helper for links |
| `server/src/jobs/shippingTrackingCron.js` | **Create** — poll + email + dedupe |
| `server/src/jobs/index.js` | **Create** — scheduler bootstrap |
| `server/src/server.js` | Edit — start scheduler on boot |
| `server/src/controllers/orderController.js` | Edit — order confirmation email |
| `server/src/controllers/paymentController.js` | Edit — receipt, failed, admin alert |
| `server/src/controllers/adminShippingController.js` | Edit — shipped email |
| `server/src/controllers/adminController.js` | Edit — refund + cancel emails |
| `server/migrations/migrate.js` | Edit — `email_logs` table + settings seeds |
| `server/package.json` | Edit — add `node-cron` |
| `EMAIL-NOTIFICATIONS.md` | This document |

---

## 10. Approval Gate

**Awaiting approval before implementation.**