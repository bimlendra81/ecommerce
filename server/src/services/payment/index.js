import { RazorpayAdapter } from './razorpay.js';
import { StripeAdapter } from './stripe.js';
import { loadSettings } from '../shipping/index.js';

export const GATEWAY_LABELS = {
  test: 'Test mode',
  razorpay: 'Razorpay (India)',
  stripe: 'Stripe (International)',
};

export function gatewayIsConfigured(gateway, settings) {
  if (gateway === 'razorpay') {
    return Boolean((settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID) && (settings.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET));
  }
  if (gateway === 'stripe') {
    return Boolean((settings.stripe_secret_key || process.env.STRIPE_SECRET_KEY) && (settings.stripe_publishable_key || process.env.STRIPE_PUBLISHABLE_KEY));
  }
  return true;
}

export async function getPaymentAdapter() {
  const settings = await loadSettings();
  const gateway = settings.payment_gateway || 'test';
  const currency = settings.payment_currency || 'INR';
  const configured = gatewayIsConfigured(gateway, settings);

  let adapter = null;
  if (gateway === 'razorpay') adapter = new RazorpayAdapter(settings);
  else if (gateway === 'stripe') adapter = new StripeAdapter(settings);

  return { gateway, currency, configured, settings, adapter };
}

export function getPublicPaymentConfig({ gateway, currency, configured, settings }) {
  const config = { gateway, currency, configured };
  if (gateway === 'razorpay') {
    config.key_id = settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID || null;
  }
  if (gateway === 'stripe') {
    config.publishable_key = settings.stripe_publishable_key || process.env.STRIPE_PUBLISHABLE_KEY || null;
  }
  return config;
}
