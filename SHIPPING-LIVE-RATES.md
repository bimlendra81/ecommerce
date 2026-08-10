# Shippo Live Rates + Auto Label

Per-product weight+dims → smallest-fit box from catalog (per-box tare weight) → Shippo shipment (cm/kg) → all live rates with rate_id → customer picks → order saves rate_id + parcel snapshot → payment success (webhook/test/verify) → POST /transactions/ → label + tracking saved → order page shows Label Created.

## Data model

**products** add: `length_cm DECIMAL(8,2)`, `width_cm DECIMAL(8,2)`, `height_cm DECIMAL(8,2)`, `dimension_unit ENUM('cm','in') DEFAULT 'cm'`.

**shipping_info** add: `total_product_weight_grams`, `packaging_weight_grams`, `parcel_weight_grams`, `parcel_length_cm`, `parcel_width_cm`, `parcel_height_cm`, `box_name`, `shippo_rate_id`, `shippo_transaction_id`, `label_url`, `shipping_status` (rate_selected|label_created|error), `parcel_override JSON`.

**settings** seed:
- `shipping_boxes`: `[{"name":"S","length":30,"width":20,"height":10,"weight_grams":120},{"name":"M","length":40,"width":30,"height":15,"weight_grams":180},{"name":"L","length":50,"width":35,"height":25,"weight_grams":260},{"name":"XL","length":60,"width":45,"height":35,"weight_grams":380}]`
- `shipping_clearance_factor`: 1.15
- `shippo_label_file_type`: PDF

## computeParcel (quote.js)

1. Normalize dims to cm. 2. Per-line volume L×W×H×qty. 3. requiredVolume = total × clearance (1.15). 4. Smallest catalog box (by volume) where boxVol ≥ requiredVol, box dims ≥ largest item dim, box smallest face ≥ widest item's two smallest dims. 5. Fallback: bounding box (max dims, stacked), tare 0. 6. Return `{boxName, length_cm, width_cm, height_cm, totalProductWeightGrams, packagingWeightGrams, parcelWeightGrams}`.

Example: 2×T-Shirt(30×20×5)+1×Jeans(35×25×6) → vol 11,250×1.15≈12,938 → Box M(40×30×15=18,000) → parcel = 1.6+0.18 = 1.78→1.8kg.

## Shippo

- `listRates({parcel, destination, settings})` → POST /shipments cm/kg → all rates `{rate_id, provider, servicelevel_name, amount, currency, estimated_days, carrier, service}`.
- `buyLabel({rate_id, label_file_type})` → POST /transactions/ `{rate, label_file_type, async:false}` → `{object_id, tracking_number, tracking_url_provider, label_url, provider, servicelevel_name}`.

## Order creation

- `orderCreateSchema` += optional `shippo_rate_id`.
- `createOrder`: computeParcel; if shippo_rate_id → server re-fetch rate, set shippingFee; snapshot rate_id, carrier, service, parcel, box, `shipping_status='rate_selected'`.

## handlePaidOrder (label.js)

Triggered from verifyPayment, testConfirm, stripeWebhook. Idempotent: skip if provider≠shippo, no rate_id, or already shippo_transaction_id. Apply parcel_override. POST /transactions/. Save transaction_id, tracking_number, tracking_url, label_url, carrier, service, `shipping_status='label_created'` + event "Label created". On fail: `shipping_status='error'`, order stays paid, admin retries.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/shipping/quote | methods + all Shippo rates + parcel |
| POST | /api/payment/verify/test-confirm/webhook | success → auto label |
| POST | /api/admin/orders/:id/shipping/label | buy label / retry |
| PATCH | /api/admin/orders/:id/shipping/parcel | parcel override |

## Frontend

- Checkout: Shippo rates as radios (Carrier · Service, ETA, price+currency), parcel hint, sends shippo_rate_id.
- Order page: Label Created, Carrier, Service, Tracking, View Tracking, View Label.
- Admin: box catalog editor, parcel override, buy/retry, product L/W/H fields.

## Files

DB: `server/migrations/…_shippo_live_rates.sql`, `server/shipping-migration.sql`. Backend: `quote.js`, `shippo.js`, `label.js`(new), `shippingController.js`, `orderController.js`, `paymentController.js`, `adminShippingController.js`, `settingsController.js`, `schemas.js`. Frontend: `Checkout.jsx`, `CheckoutLayouts.jsx`, `OrderDetail.jsx`, `AdminShipping.jsx`, `AdminOrders.jsx`, `AdminProductForm.jsx`.

## Verify

Migration → lint/build → curl: quote rates, order with rate_id, test-confirm auto-label, idempotency.