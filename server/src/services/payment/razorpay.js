import crypto from 'crypto';
import Razorpay from 'razorpay';

export class RazorpayAdapter {
  constructor(settings) {
    this.keyId = settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = settings.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || '';
    this.currency = settings.payment_currency || 'INR';
    this.razorpay = this.keyId && this.keySecret ? new Razorpay({ key_id: this.keyId, key_secret: this.keySecret }) : null;
  }

  async createOrder(order) {
    if (!this.razorpay) {
      const err = new Error('Razorpay is not configured');
      err.status = 400;
      throw err;
    }
    const rzpOrder = await this.razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100),
      currency: this.currency,
      receipt: `order_${order.id}`,
    });
    return {
      gateway: 'razorpay',
      order_id: order.id,
      amount: Number(order.total),
      currency: this.currency,
      key_id: this.keyId,
      razorpay_order_id: rzpOrder.id,
    };
  }

  async verify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!this.razorpay) {
      const err = new Error('Razorpay is not configured');
      err.status = 400;
      throw err;
    }
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      const err = new Error('Invalid payment signature');
      err.status = 400;
      throw err;
    }
    return true;
  }
}
