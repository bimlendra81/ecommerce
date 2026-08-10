import { saveSetting } from './index.js';

const BASE = 'https://apiv2.shiprocket.in/v1/external';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export class ShiprocketAdapter {
  constructor(settings = {}) {
    this.settings = settings;
  }

  get name() {
    return 'shiprocket';
  }

  isConfigured() {
    return Boolean(
      this.settings.shiprocket_token ||
        (this.settings.shiprocket_email && this.settings.shiprocket_password)
    );
  }

  async getToken() {
    if (this.settings.shiprocket_token) return this.settings.shiprocket_token;
    if (!this.settings.shiprocket_email || !this.settings.shiprocket_password) {
      throw new Error('Shiprocket credentials are not configured');
    }
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.settings.shiprocket_email,
        password: this.settings.shiprocket_password,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Shiprocket login failed');
    }
    const data = await res.json();
    this.settings.shiprocket_token = data.token;
    await saveSetting('shiprocket_token', data.token);
    return data.token;
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (path !== '/auth/login') {
      headers.Authorization = `Bearer ${await this.getToken()}`;
    }
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Shiprocket request failed (${res.status})`);
    }
    return res.json();
  }

  isExpress(methodName) {
    return /express|priority|fast/i.test(methodName || '');
  }

  async rateFor({ weight, destination, method, settings }) {
    if (!this.isConfigured()) return null;
    const body = {
      delivery_postcode: destination.postal_code,
      pickup_postcode: settings.shipping_origin_postcode || '',
      cod: 0,
      declared_value: Number(method.price) || 0,
      weight: String(round2(weight)),
      mode: 'Surface',
    };
    const data = await this.request('/courier/tariff/calculate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const companies = data?.data?.available_courier_companies || [];
    if (companies.length === 0) return null;

    const usable = companies.filter((c) => Number(c.rate) > 0 && !/not available/i.test(c.courier_name || ''));
    if (usable.length === 0) return null;

    let chosen;
    if (this.isExpress(method.name)) {
      chosen = [...usable].sort((a, b) => (a.estimated_delivery_days || 99) - (b.estimated_delivery_days || 99))[0];
    } else {
      chosen = [...usable].sort((a, b) => Number(a.rate) - Number(b.rate))[0];
    }

    return {
      fee: round2(chosen.rate),
      estimated_days_min: Math.max(Number(chosen.estimated_delivery_days) || 3, 1),
      estimated_days_max: Math.max(Number(chosen.estimated_delivery_days) || 5, Number(chosen.estimated_delivery_days) || 5),
      carrier: chosen.courier_name || 'shiprocket',
    };
  }

  async createShipment({ order, info, items, settings }) {
    if (!this.isConfigured()) {
      throw new Error('Shiprocket is not configured. Add credentials in Admin > Shipping.');
    }
    const orderItems = (items || []).map((i) => ({
      name: i.name,
      sku: `SKU-${i.product_id || i.id}`,
      units: Number(i.quantity),
      selling_price: Number(i.price),
      discount: 0,
      tax: 0,
      hsn: 0,
    }));
    const payload = {
      order_id: String(order.id),
      order_date: new Date(order.created_at).toISOString().slice(0, 10),
      pickup_location: 'primary',
      channel_id: String(order.id),
      comment: 'Shipment created from admin panel',
      reseller_name: info.full_name,
      billing_customer_name: info.full_name.split(' ')[0],
      billing_last_name: info.full_name.split(' ').slice(1).join(' ') || '',
      billing_address: `${info.address_line1} ${info.address_line2 || ''}`.trim(),
      billing_city: info.city,
      billing_pincode: info.postal_code,
      billing_state: info.state,
      billing_country: info.country,
      billing_email: order.user_email || '',
      billing_phone: info.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.status === 'paid' ? 'Prepaid' : 'COD',
      sub_total: Number(order.subtotal || order.total),
      length: 10,
      breadth: 10,
      height: 10,
      weight: String(round2(order.weight || 0)),
    };
    const created = await this.request('/shipments/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const shipmentId = created?.shipment_id;
    if (!shipmentId) {
      throw new Error('Shiprocket could not create the shipment');
    }
    return {
      carrier: 'shiprocket',
      tracking_number: String(shipmentId),
      tracking_url: `https://shiprocket.co/tracking/${shipmentId}`,
      events: [
        {
          event: 'Shipment created',
          location: settings.shipping_origin_postcode || '',
          notes: `Shiprocket shipment ${shipmentId} created`,
        },
      ],
    };
  }

  async track({ tracking_number }) {
    if (!this.isConfigured()) return { events: [] };
    const data = await this.request(`/couriers/track?awb=${encodeURIComponent(tracking_number)}`);
    const trail = data?.tracking_data?.shipment_track || [];
    const events = trail.map((t) => ({
      event: t.status || t.activity || 'In transit',
      location: t.location || '',
      notes: t.activity || '',
      created_at: t.date || null,
    }));
    return { events };
  }
}
