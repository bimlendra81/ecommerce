const BASE = 'https://track.delhivery.com';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export class DelhiveryAdapter {
  constructor(settings = {}) {
    this.settings = settings;
  }

  get name() {
    return 'delhivery';
  }

  isConfigured() {
    return Boolean(this.settings.delhivery_api_token);
  }

  headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Token ${this.settings.delhivery_api_token}`,
      ...extra,
    };
  }

  isExpress(methodName) {
    return /express|priority|fast/i.test(methodName || '');
  }

  async rateFor({ weight, destination, method, settings }) {
    if (!this.isConfigured()) return null;
    const params = new URLSearchParams({
      md: this.isExpress(method.name) ? 'E' : 'S',
      ss: settings.shipping_origin_postcode || '',
      d: destination.postal_code,
      c: '0',
      pt: 'Delivered',
    });
    const res = await fetch(`${BASE}/api/kinko/v1/invoice/charges/.json?${params}`, {
      headers: this.headers(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const charges = data?.charges || {};
    const inner = charges.data && typeof charges.data === 'object' ? charges.data['0'] || charges.data[0] : null;
    const rate = Number(charges.rate || inner?.rate || inner?.total || 0);
    if (!rate) return null;
    return {
      fee: round2(rate),
      estimated_days_min: 3,
      estimated_days_max: this.isExpress(method.name) ? 4 : 7,
      carrier: 'delhivery',
    };
  }

  async createShipment({ order, info, items, settings }) {
    if (!this.isConfigured()) {
      throw new Error('Delhivery is not configured. Add an API token in Admin > Shipping.');
    }
    const shipments = (items || []).map((i) => ({
      name: i.name,
      add: `${info.address_line1} ${info.address_line2 || ''}`.trim(),
      city: info.city,
      state: info.state,
      country: info.country,
      pin: info.postal_code,
      phone: info.phone,
      order: String(order.id),
      payment_mode: order.status === 'paid' ? 'Prepaid' : 'COD',
      total_amount: Number(order.total),
      quantity: Number(i.quantity),
      weight: String(Math.max(round2(order.weight / (items.length || 1)), 0.1)),
    }));

    const body = new URLSearchParams();
    body.append('format', 'json');
    body.append('pickup_name', settings.site_title || 'Store');
    body.append('pickup_address', settings.shipping_origin_postcode || '');
    body.append('pickup_pin', settings.shipping_origin_postcode || '');
    body.append('pickup_state', '');
    body.append('pickup_country', settings.shipping_origin_country || 'IN');
    body.append('pickup_phone', settings.contact_phone || '');
    body.append('client_name', settings.delhivery_client_name || '');
    body.append('shipments', JSON.stringify(shipments));

    const res = await fetch(`${BASE}/api/cmu/create.json`, {
      method: 'POST',
      headers: { Authorization: `Token ${this.settings.delhivery_api_token}` },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Delhivery create failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const pkg = data?.packages?.[0];
    if (!pkg?.waybill) {
      throw new Error('Delhivery did not return a waybill');
    }
    return {
      carrier: 'delhivery',
      tracking_number: String(pkg.waybill),
      tracking_url: `https://www.delhivery.com/track?bill=${pkg.waybill}`,
      events: [
        {
          event: 'Shipment created',
          location: settings.shipping_origin_postcode || '',
          notes: `Delhivery waybill ${pkg.waybill} created`,
        },
      ],
    };
  }

  async track({ tracking_number }) {
    if (!this.isConfigured()) return { events: [] };
    const res = await fetch(
      `${BASE}/api/p/packages/json/?waybill=${encodeURIComponent(tracking_number)}`,
      { headers: this.headers() }
    );
    if (!res.ok) return { events: [] };
    const data = await res.json();
    const shipment = data?.shipments?.[0];
    const scans = shipment?.scans || [];
    const events = scans.map((s) => ({
      event: s.scan_type || s.status || 'Scanned',
      location: s.location || '',
      notes: s.status || '',
      created_at: s.scan_time || null,
    }));
    return { events };
  }
}
