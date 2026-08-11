import cron from 'node-cron';
import { pool } from '../config/db.js';
import { getShippingAdapter, loadSettings } from '../services/shipping/index.js';
import { sendMail } from '../services/email.js';
import { buildOrderDeliveredEmail, buildOutForDeliveryEmail } from '../services/emailTemplates.js';
import { getCachedSettings } from '../utils/settingsCache.js';

export function startShippingTrackingCron() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[shippingTrackingCron] Running tracking update job...');
    try {
      const [rows] = await pool.query(
        `SELECT si.id AS info_id, si.order_id, si.carrier, si.tracking_number, o.status AS current_order_status
         FROM shipping_info si
         JOIN orders o ON o.id = si.order_id
         WHERE si.tracking_number IS NOT NULL AND si.tracking_number != ''
           AND o.status NOT IN ('delivered', 'cancelled', 'returned', 'failed')
           AND o.deleted_at IS NULL`
      );

      const settings = await getCachedSettings();
      const shippingSettings = await loadSettings();

      for (const row of rows) {
        try {
          const adapter = getShippingAdapter(row.carrier, shippingSettings);
          const fresh = await adapter.track({
            carrier: row.carrier,
            tracking_number: row.tracking_number,
          });

          if (!fresh.events || fresh.events.length === 0) continue;

          await pool.query('UPDATE shipping_info SET last_polled_at = NOW() WHERE id = ?', [row.info_id]);

          // Fetch existing events to prevent duplicates
          const [existingEvents] = await pool.query(
            'SELECT event, created_at FROM shipping_events WHERE shipping_info_id = ?',
            [row.info_id]
          );
          const existingSet = new Set(existingEvents.map((e) => `${e.event}_${e.location || ''}`));

          let newDelivered = false;
          let newOutForDelivery = false;

          for (const ev of fresh.events) {
            const key = `${ev.event}_${ev.location || ''}`;
            if (!existingSet.has(key)) {
              await pool.query(
                'INSERT INTO shipping_events (shipping_info_id, event, location, notes) VALUES (?, ?, ?, ?)',
                [row.info_id, ev.event, ev.location || '', ev.notes || '']
              );

              const evLower = ev.event.toLowerCase();
              if (evLower.includes('delivered')) {
                newDelivered = true;
              } else if (evLower.includes('out for delivery')) {
                newOutForDelivery = true;
              }
            }
          }

          // Handle state updates and email notifications
          if (newDelivered && row.current_order_status !== 'delivered') {
            await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['delivered', row.order_id]);
            await pool.query('UPDATE shipping_info SET delivered_at = NOW() WHERE id = ?', [row.info_id]);

            if (String(settings.email_order_delivered ?? '1') === '1') {
              const [fullOrders] = await pool.query(
                'SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?',
                [row.order_id]
              );
              if (fullOrders.length > 0 && fullOrders[0].user_email) {
                const order = fullOrders[0];
                const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [row.order_id]);
                order.items = items;

                const { subject, title, bodyHtml } = buildOrderDeliveredEmail({
                  store_name: settings.site_title || settings.store_name || 'Acme Store',
                  customer_name: order.user_name || 'Customer',
                  order,
                });
                const sent = await sendMail({ to: order.user_email, subject, title, bodyHtml });
                await pool.query('INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)', [
                  row.order_id, 'order_delivered', order.user_email, subject, sent ? 'sent' : 'failed'
                ]);
              }
            }
          } else if (newOutForDelivery && row.current_order_status !== 'out_for_delivery' && row.current_order_status !== 'delivered') {
            await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['out_for_delivery', row.order_id]);

            if (String(settings.email_out_for_delivery ?? '1') === '1') {
              const [fullOrders] = await pool.query(
                'SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?',
                [row.order_id]
              );
              if (fullOrders.length > 0 && fullOrders[0].user_email) {
                const order = fullOrders[0];
                const [shipRows] = await pool.query('SELECT * FROM shipping_info WHERE order_id = ?', [row.order_id]);
                const shipment = shipRows[0] || {};

                const { subject, title, bodyHtml } = buildOutForDeliveryEmail({
                  store_name: settings.site_title || settings.store_name || 'Acme Store',
                  customer_name: order.user_name || 'Customer',
                  order,
                  shipment,
                });
                const sent = await sendMail({ to: order.user_email, subject, title, bodyHtml });
                await pool.query('INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)', [
                  row.order_id, 'out_for_delivery', order.user_email, subject, sent ? 'sent' : 'failed'
                ]);
              }
            }
          }
        } catch (err) {
          console.error(`[shippingTrackingCron] Error processing order #${row.order_id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[shippingTrackingCron] Job error:', err.message);
    }
  });
  console.log('[shippingTrackingCron] Scheduled node-cron tracking job (every 15 min)');
}