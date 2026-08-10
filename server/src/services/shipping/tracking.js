import { pool } from '../../config/db.js';
import { getShippingAdapter } from './index.js';

// Poll cadence for the background cron and the on-view pull.
const SYNC_THROTTLE_MS = 15 * 60 * 1000;
// Cron interval: how often the background scan runs.
const CRON_INTERVAL_MS = 15 * 60 * 1000;
// Max orders scanned per cron tick.
const CRON_BATCH = 20;

const TERMINAL_EVENTS = ['delivered', 'returned', 'failure', 'failed', 'error', 'exception'];

// Map a raw carrier/manual event string to an order status. Tolerant keyword
// match so both Shippo statuses (TRANSIT, OUT_FOR_DELIVERY, ...) and manual
// events ("Label created via USPS", "Order shipped") map correctly.
export function mapEventToStatus(event) {
  // Normalize separators so Shippo raw statuses (OUT_FOR_DELIVERY, PRE_TRANSIT,
  // AWAITING_PICKUP) match the same keyword rules as free-text manual events.
  const e = String(event || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
  if (e.includes('delivered')) return 'delivered';
  if (e.includes('return')) return 'returned';
  if (e.includes('failure') || e.includes('failed') || e.includes('error') || e.includes('exception')) return 'failed';
  if (e.includes('out for delivery')) return 'out_for_delivery';
  // pre-transit must be checked before generic "transit" — it means label
  // created but the carrier has not accepted the parcel yet.
  if (e.includes('pre transit')) return 'shipped';
  if (e.includes('transit')) return 'in_transit';
  if (e.includes('awaiting pickup') || e.includes('label created') || e.includes('order shipped')) return 'shipped';
  return null;
}

// Pull fresh tracking from the shipping provider into shipping_events, then
// reconcile the order status with the shipping lifecycle. Throttled via
// shipping_info.last_polled_at and it NEVER throws so order page GETs cannot break.
export async function syncTrackingIfStale({ infoId, carrier, trackingNumber, force = false }) {
  try {
    const [infoRows] = await pool.query(
      'SELECT order_id, tracking_number, carrier, last_polled_at FROM shipping_info WHERE id = ?',
      [infoId]
    );
    const info = infoRows[0];
    const tracking = trackingNumber || info?.tracking_number;
    if (!infoId || !info || !tracking) return { synced: false, reason: 'no-tracking' };

    const lastPolled = info.last_polled_at ? new Date(info.last_polled_at).getTime() : 0;
    const fresh = force || Date.now() - lastPolled >= SYNC_THROTTLE_MS;
    if (fresh) {
      const { adapter } = await getShippingAdapter();
      if (adapter?.track && adapter?.isConfigured?.()) {
        const { events } = await adapter.track({
          carrier: carrier || info.carrier,
          tracking_number: tracking,
        });
        for (const ev of events) {
          const [existing] = await pool.query(
            'SELECT id FROM shipping_events WHERE shipping_info_id = ? AND event = ? AND notes = ?',
            [infoId, ev.event, ev.notes || '']
          );
          if (existing.length > 0) continue;
          await pool.query(
            'INSERT INTO shipping_events (shipping_info_id, event, location, notes, created_at) VALUES (?, ?, ?, ?, ?)',
            [infoId, ev.event, ev.location || '', ev.notes || '', ev.created_at ? new Date(ev.created_at) : new Date()]
          );
        }
      }
      await pool.query('UPDATE shipping_info SET last_polled_at = NOW() WHERE id = ?', [infoId]);
    }

    const status = await reconcileOrderStatus(infoId, info.order_id, tracking);
    return { synced: fresh, status };
  } catch {
    return { synced: false, reason: 'error' };
  }
}

async function reconcileOrderStatus(infoId, orderId, tracking) {
  const [evRows] = await pool.query(
    `SELECT LOWER(event) AS event FROM shipping_events
     WHERE shipping_info_id = ? ORDER BY created_at DESC, id DESC LIMIT 10`,
    [infoId]
  );
  const events = evRows.map((r) => String(r.event || '').trim());

  // Latest mapped status first; terminal states are sticky (never downgrade).
  let mapped = null;
  for (const e of events) {
    const s = mapEventToStatus(e);
    if (s) {
      mapped = s;
      break;
    }
  }
  if (!mapped && tracking) mapped = 'shipped';
  if (!mapped) return 'unchanged';

  if (mapped === 'delivered') {
    await pool.query(
      "UPDATE orders SET status = 'delivered' WHERE id = ? AND status NOT IN ('delivered','returned','failed','cancelled')",
      [orderId]
    );
    await pool.query(
      'UPDATE shipping_info SET delivered_at = IFNULL(delivered_at, NOW()) WHERE id = ?',
      [infoId]
    );
    return 'delivered';
  }

  // Returned/failed are terminal branches off shipped/delivered.
  if (mapped === 'returned' || mapped === 'failed') {
    await pool.query(
      "UPDATE orders SET status = ? WHERE id = ? AND status NOT IN ('delivered','returned','failed','cancelled')",
      [mapped, orderId]
    );
    return mapped;
  }

  // In-progress statuses only move the order forward, never backwards.
  const [orderRows] = await pool.query('SELECT status FROM orders WHERE id = ?', [orderId]);
  const current = orderRows[0]?.status;
  const RANK = { pending: 0, paid: 1, shipped: 2, in_transit: 3, out_for_delivery: 4, delivered: 5 };
  const newRank = RANK[mapped] ?? 2;
  const curRank = RANK[current] ?? 0;
  if (newRank > curRank) {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [mapped, orderId]);
    if (mapped === 'shipped') {
      await pool.query(
        'UPDATE shipping_info SET shipped_at = IFNULL(shipped_at, NOW()) WHERE id = ?',
        [infoId]
      );
    }
    return mapped;
  }
  return 'unchanged';
}

async function isTerminal(infoId) {
  const [rows] = await pool.query(
    'SELECT id FROM shipping_events WHERE shipping_info_id = ? AND LOWER(event) IN (?, ?, ?, ?, ?, ?) LIMIT 1',
    [infoId, ...TERMINAL_EVENTS]
  );
  return rows.length > 0;
}

// Background poller: keeps tracking fresh without waiting for a page view.
// Safe as a single pm2 instance; if the app ever scales to multiple workers,
// guard this behind a DB advisory lock or cluster.isPrimary.
export function startTrackingSyncCron(intervalMs = CRON_INTERVAL_MS) {
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try {
      const [rows] = await pool.query(
        `SELECT si.id, si.carrier, si.tracking_number
         FROM shipping_info si
         WHERE si.tracking_number IS NOT NULL AND si.tracking_number != ''
           AND (si.last_polled_at IS NULL OR si.last_polled_at < NOW() - INTERVAL 15 MINUTE)
         ORDER BY si.last_polled_at IS NULL DESC, si.last_polled_at ASC
         LIMIT ${CRON_BATCH}`
      );
      for (const r of rows) {
        if (await isTerminal(r.id)) continue;
        await syncTrackingIfStale({
          infoId: r.id,
          carrier: r.carrier,
          trackingNumber: r.tracking_number,
        });
      }
      if (rows.length > 0) {
        console.log(`[tracking-cron] synced ${rows.length} order(s)`);
      }
    } catch (err) {
      console.error('[tracking-cron] error:', err.message);
    } finally {
      running = false;
    }
  }
  setInterval(tick, intervalMs);
  tick();
  console.log(`[tracking-cron] started, interval ${intervalMs / 60000} min`);
}
