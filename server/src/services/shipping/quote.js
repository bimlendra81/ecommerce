import { PROVIDERS } from './index.js';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export async function computeWeight({ items, settings }) {
  const defaultWeight = Number(settings.default_weight_grams) || 500;
  return (items || []).reduce((sum, i) => {
    const unit = Number(i.weight_grams) || defaultWeight;
    return sum + unit * Number(i.quantity);
  }, 0);
}

// Sentinel method id used for the synthetic "Shippo (International)"
// checkout option that appears when Shippo is the active provider.
export const SHIPPO_INTERNATIONAL_METHOD_ID = 2147483647;

export function estimateInternationalFee({ weight } = {}) {
  const kg = Math.max(Number(weight) || 500, 100) / 1000;
  return round2(Math.min(15 + kg * 5, 200));
}

export async function quoteShippoInternational({ adapter, weight, destination, settings }) {
  if (!adapter || adapter.name !== 'shippo' || !adapter.isConfigured()) return null;
  let rate = null;
  try {
    rate = await adapter.rateFor({
      method: { name: 'Shippo International' },
      weight,
      destination,
      settings,
    });
  } catch (err) {
    rate = { error: err.message || 'Rate fetch failed' };
  }
  const hasLive = Boolean(rate && rate.fee != null && !rate.error);
  return {
    method_id: SHIPPO_INTERNATIONAL_METHOD_ID,
    name: 'Shippo (International)',
    description: hasLive
      ? 'Live rates, labels and tracking worldwide'
      : 'Estimated rate, labels and tracking worldwide',
    fee: hasLive ? round2(rate.fee) : estimateInternationalFee({ weight }),
    estimated_days_min: hasLive ? rate.estimated_days_min : 7,
    estimated_days_max: hasLive ? rate.estimated_days_max : 14,
    carrier: hasLive ? rate.carrier || 'shippo' : 'shippo',
    provider: 'shippo',
    rate_error: hasLive ? null : (rate?.error || 'Live rate unavailable'),
  };
}

export async function quoteMethods({ methods, weight, destination, adapter, settings }) {
  const quoted = [];
  for (const method of methods) {
    let rate = null;
    try {
      rate = await adapter.rateFor({ method, weight, destination, settings });
    } catch (err) {
      rate = { error: err.message || 'Rate fetch failed' };
    }
    quoted.push({
      method_id: method.id,
      name: method.name,
      description: method.description,
      fee: rate && rate.fee != null ? round2(rate.fee) : round2(method.fee),
      estimated_days_min: rate ? rate.estimated_days_min : method.estimated_days_min,
      estimated_days_max: rate ? rate.estimated_days_max : method.estimated_days_max,
      carrier: rate && !rate.error ? rate.carrier : 'manual',
      provider: PROVIDERS[adapter.name] ? adapter.name : 'manual',
      rate_error: rate && rate.error ? rate.error : null,
    });
  }
  return quoted;
}

export function applyFreeShipping(methods, subtotal, threshold) {
  const t = Number(threshold);
  if (!t || subtotal >= t) {
    return methods.map((m) => (m.shippo_rate_id ? m : { ...m, fee: 0, free: true }));
  }
  return methods;
}
