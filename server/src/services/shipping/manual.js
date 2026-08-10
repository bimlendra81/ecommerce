import { loadSettings } from './index.js';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export class ManualAdapter {
  constructor(settings = {}) {
    this.settings = settings;
  }

  get name() {
    return 'manual';
  }

  isConfigured() {
    return true;
  }

  // Fee comes straight from the configured shipping method.
  async rateFor({ method }) {
    return {
      fee: round2(method.fee),
      estimated_days_min: method.estimated_days_min,
      estimated_days_max: method.estimated_days_max,
      carrier: 'manual',
    };
  }

  async createShipment({ order, info }) {
    const settings = await loadSettings();
    const trackingNumber = `LOC${order.id}${Date.now().toString().slice(-6)}`;
    return {
      carrier: 'manual',
      tracking_number: trackingNumber,
      tracking_url: '',
      estimated_days_min: info.estimated_days_min,
      estimated_days_max: info.estimated_days_max,
      events: [
        {
          event: 'Shipped',
          location: settings.shipping_origin_postcode || '',
          notes: 'Shipment created manually',
        },
      ],
    };
  }

  async track() {
    return { events: [] };
  }
}
