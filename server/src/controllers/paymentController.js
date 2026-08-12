import { pool } from '../config/db.js';
import { getPaymentAdapter, getPublicPaymentConfig } from '../services/payment/index.js';
import { createShippingLabelAfterPayment } from '../services/shipping/label.js';
import { sendMail } from '../services/email.js';
import { buildPaymentReceiptEmail, buildPaymentFailedEmail, buildAdminPaymentAlertEmail } from '../services/emailTemplates.js';
import { getCachedSettings } from '../utils/settingsCache.js';

async function sendPaymentNotificationEmails(orderId, isSuccess, errorReason = null) {
  try {
    const settings = await getCachedSettings();
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return;
    const order = orders[0];

    const [users] = await pool.query('SELECT email, name FROM users WHERE id = ?', [order.user_id]);
    if (users.length === 0 || !users[0].email) return;
    const customerEmail = users[0].email;
    const customerName = users[0].name || 'Customer';

    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [orderId]);
    const payment = payments[0] || {};

    const storeName = settings.site_title || settings.store_name || 'Acme Store';

    if (isSuccess) {
      if (String(settings.email_payment_receipt ?? '1') === '1') {
        const { subject, title, bodyHtml } = buildPaymentReceiptEmail({
          store_name: storeName,
          customer_name: customerName,
          order,
          payment,
        });
        const sent = await sendMail({ to: customerEmail, subject, title, bodyHtml });
        await pool.query('INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)', [
          orderId, 'payment_receipt', customerEmail, subject, sent ? 'sent' : 'failed'
        ]);
      }

      if (String(settings.email_admin_payment_alert ?? '1') === '1') {
        const adminEmail = settings.contact_email || settings.admin_email || process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const { subject, title, bodyHtml } = buildAdminPaymentAlertEmail({
            store_name: storeName,
            customer_name: customerName,
            email: customerEmail,
            order,
            payment,
          });
          const sent = await sendMail({ to: adminEmail, subject, title, bodyHtml });
          await pool.query('INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)', [
            orderId, 'admin_payment_alert', adminEmail, subject, sent ? 'sent' : 'failed'
          ]);
        }
      }
    } else {
      if (String(settings.email_payment_failed ?? '1') === '1') {
        const { subject, title, bodyHtml } = buildPaymentFailedEmail({
          store_name: storeName,
          customer_name: customerName,
          order,
          failure_reason: errorReason,
        });
        const sent = await sendMail({ to: customerEmail, subject, title, bodyHtml });
        await pool.query('INSERT INTO email_logs (order_id, type, email, subject, status) VALUES (?, ?, ?, ?, ?)', [
          orderId, 'payment_failed', customerEmail, subject, sent ? 'sent' : 'failed'
        ]);
      }
    }
  } catch (err) {
    console.error('[paymentController] Email trigger error:', err.message);
  }
}

export async function paymentConfig(req, res, next) {
  try {
    const info = await getPaymentAdapter();
    res.json({ config: getPublicPaymentConfig(info) });
  } catch (err) {
    next(err);
  }
}

async function findOrder(orderId, userId) {
  const [orderRows] = await pool.query(
    'SELECT id, user_id, total, status FROM orders WHERE id = ? AND user_id = ?',
    [orderId, userId]
  );
  return orderRows[0] || null;
}

async function upsertPayment(orderId, payload) {
  const txnId = payload.razorpay_order_id || payload.intent_id || null;
  const [existing] = await pool.query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
  if (existing.length > 0) {
    await pool.query(
      "UPDATE payments SET gateway = ?, txn_id = ?, amount = ?, currency = ?, status = 'created' WHERE id = ?",
      [payload.gateway, txnId, payload.amount, payload.currency, existing[0].id]
    );
  } else {
    await pool.query(
      "INSERT INTO payments (order_id, gateway, txn_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, 'created')",
      [orderId, payload.gateway, txnId, payload.amount, payload.currency]
    );
  }
}

async function markPaid(orderId, gateway) {
  await pool.query("UPDATE payments SET status = 'paid' WHERE order_id = ? AND gateway = ?", [orderId, gateway]);
  await pool.query("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
}

export async function createPayment(req, res, next) {
  try {
    const orderId = parseInt(req.body.order_id, 10);
    const order = await findOrder(orderId, req.user.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is already paid or closed' });
    }

    const { gateway, currency, configured, adapter } = await getPaymentAdapter();

    if (gateway === 'test' || !configured || !adapter) {
      return res.json({
        test: true,
        gateway: 'test',
        order_id: order.id,
        amount: order.total,
        currency,
      });
    }

    order.user_email = req.user.email;
    order.user_name = req.user.name;
    const payload = await adapter.createOrder(order);
    await upsertPayment(order.id, payload);
    res.json({ test: false, ...payload });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const order = await findOrder(parseInt(req.body.order_id, 10), req.user.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status === 'paid') {
      return res.json({ message: 'Payment verified', order_id: order.id });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is already paid or closed' });
    }

    const { gateway, configured, adapter } = await getPaymentAdapter();
    if (!configured || !adapter) {
      return res.status(400).json({ message: 'Payment gateway is not configured' });
    }

    try {
      const verifyRes = await adapter.verify(req.body);
      if (req.body.payment_intent_id || verifyRes?.payment_intent_id) {
        const pIntentId = req.body.payment_intent_id || verifyRes.payment_intent_id;
        await pool.query("UPDATE payments SET txn_id = ? WHERE order_id = ? AND gateway = 'stripe'", [pIntentId, order.id]);
      }
      await markPaid(order.id, gateway);
      // AFTER payment success (server-side): create the shipping label.
      await createShippingLabelAfterPayment(order.id);
      sendPaymentNotificationEmails(order.id, true);
      res.json({ message: 'Payment verified', order_id: order.id });
    } catch (verifyErr) {
      sendPaymentNotificationEmails(order.id, false, verifyErr.message);
      throw verifyErr;
    }
  } catch (err) {
    next(err);
  }
}

export async function testConfirm(req, res, next) {
  try {
    const orderId = parseInt(req.body.order_id, 10);
    const order = await findOrder(orderId, req.user.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is already paid or closed' });
    }

    const { gateway, configured } = await getPaymentAdapter();
    if (gateway !== 'test' && configured) {
      return res.status(400).json({ message: 'Test confirmation is disabled when a gateway is configured' });
    }

    const { currency } = await getPaymentAdapter();
    await pool.query(
      "INSERT INTO payments (order_id, gateway, txn_id, amount, currency, status) VALUES (?, 'test', ?, ?, ?, 'paid')",
      [orderId, `test_${Date.now()}`, order.total, currency]
    );
    await pool.query("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
    // Test mode: still create the label for the selected Shippo rate.
    await createShippingLabelAfterPayment(orderId);
    sendPaymentNotificationEmails(orderId, true);

    res.json({ message: 'Order placed (test mode)', order_id: orderId });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const { gateway, configured, adapter } = await getPaymentAdapter();
    if (gateway !== 'stripe' || !configured || !adapter) {
      return res.status(400).json({ message: 'Stripe is not configured' });
    }

    const event = await adapter.constructEvent(req.body, signature);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const [rows] = await pool.query('SELECT id, order_id FROM payments WHERE txn_id = ?', [intent.id]);
      if (rows.length > 0) {
        await pool.query("UPDATE payments SET status = 'paid' WHERE id = ?", [rows[0].id]);
        await pool.query("UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'", [
          rows[0].order_id,
        ]);
        // Server-side payment confirmed: create the shipping label now.
        await createShippingLabelAfterPayment(rows[0].order_id);
        sendPaymentNotificationEmails(rows[0].order_id, true);
      }
    }

    res.json({ received: true });
  } catch (err) {
    if (err.type === 'StripeSignatureVerificationError') {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    next(err);
  }
}
