import { loadSettings, saveSetting } from '../services/shipping/index.js';
import { GATEWAY_LABELS, gatewayIsConfigured } from '../services/payment/index.js';

const SECRET_KEYS = ['razorpay_key_secret', 'stripe_secret_key', 'stripe_webhook_secret'];

const ALLOWED = [
  'payment_gateway',
  'payment_currency',
  'razorpay_key_id',
  'razorpay_key_secret',
  'stripe_secret_key',
  'stripe_publishable_key',
  'stripe_webhook_secret',
];

export async function getPaymentConfig(req, res, next) {
  try {
    const settings = await loadSettings();
    res.json({
      gateway: settings.payment_gateway || 'test',
      currency: settings.payment_currency || 'INR',
      gateways: GATEWAY_LABELS,
      configured: {
        razorpay: gatewayIsConfigured('razorpay', settings),
        stripe: gatewayIsConfigured('stripe', settings),
      },
      razorpay: {
        key_id: settings.razorpay_key_id || '',
        key_secret: settings.razorpay_key_secret ? '••••••••' : '',
      },
      stripe: {
        secret_key: settings.stripe_secret_key ? '••••••••' : '',
        publishable_key: settings.stripe_publishable_key || '',
        webhook_secret: settings.stripe_webhook_secret ? '••••••••' : '',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentConfig(req, res, next) {
  try {
    for (const key of Object.keys(req.body)) {
      if (!ALLOWED.includes(key)) continue;
      const value = req.body[key];
      if (SECRET_KEYS.includes(key) && (value === '' || value === null)) continue;
      await saveSetting(key, value ?? '');
    }
    const settings = await loadSettings();
    res.json({
      message: 'Payment configuration saved',
      gateway: settings.payment_gateway || 'test',
      configured: {
        razorpay: gatewayIsConfigured('razorpay', settings),
        stripe: gatewayIsConfigured('stripe', settings),
      },
    });
  } catch (err) {
    next(err);
  }
}
