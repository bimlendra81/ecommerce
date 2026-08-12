import Stripe from 'stripe';

export class StripeAdapter {
  constructor(settings) {
    this.secretKey = settings.stripe_secret_key || process.env.STRIPE_SECRET_KEY || '';
    this.publishableKey = settings.stripe_publishable_key || process.env.STRIPE_PUBLISHABLE_KEY || '';
    this.webhookSecret = settings.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '';
    this.currency = settings.payment_currency || 'INR';
    this.stripe = this.secretKey ? new Stripe(this.secretKey) : null;
  }

  async createOrder(order) {
    if (!this.stripe) {
      const err = new Error('Stripe is not configured');
      err.status = 400;
      throw err;
    }
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100),
      currency: this.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { order_id: String(order.id) },
    });
    return {
      gateway: 'stripe',
      order_id: order.id,
      amount: Number(order.total),
      currency: this.currency,
      publishable_key: this.publishableKey,
      client_secret: intent.client_secret,
      intent_id: intent.id,
    };
  }

  async verify({ payment_intent_id }) {
    if (!this.stripe) {
      const err = new Error('Stripe is not configured');
      err.status = 400;
      throw err;
    }
    const intent = await this.stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status !== 'succeeded') {
      const err = new Error('Payment has not succeeded');
      err.status = 400;
      throw err;
    }
    return true;
  }

  async refund({ txn_id, amount }) {
    if (!this.stripe) {
      const err = new Error('Stripe is not configured');
      err.status = 400;
      throw err;
    }
    if (!txn_id) {
      const err = new Error('Transaction ID is missing for Stripe refund');
      err.status = 400;
      throw err;
    }
    const params = { payment_intent: txn_id };
    if (amount) {
      params.amount = Math.round(Number(amount) * 100);
    }
    return await this.stripe.refunds.create(params);
  }

  async constructEvent(body, signature) {
    if (!this.stripe) {
      const err = new Error('Stripe is not configured');
      err.status = 400;
      throw err;
    }
    if (!this.webhookSecret) {
      const err = new Error('Stripe webhook secret is not configured');
      err.status = 400;
      throw err;
    }
    return this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
  }
}
