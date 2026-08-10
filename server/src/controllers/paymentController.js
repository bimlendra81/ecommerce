import { pool } from '../config/db.js';
import { getPaymentAdapter, getPublicPaymentConfig } from '../services/payment/index.js';
import { createShippingLabelAfterPayment } from '../services/shipping/label.js';

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

    await adapter.verify(req.body);
    await markPaid(order.id, gateway);
    // AFTER payment success (server-side): create the shipping label.
    await createShippingLabelAfterPayment(order.id);
    res.json({ message: 'Payment verified', order_id: order.id });
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
