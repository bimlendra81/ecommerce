import { pool } from '../../config/db.js';
import { getCachedSettings, invalidateSettings } from '../../utils/settingsCache.js';
import { ManualAdapter } from './manual.js';
import { ShiprocketAdapter } from './shiprocket.js';
import { DelhiveryAdapter } from './delhivery.js';
import { ShippoAdapter } from './shippo.js';

export const PROVIDERS = {
  manual: ManualAdapter,
  shiprocket: ShiprocketAdapter,
  delhivery: DelhiveryAdapter,
  shippo: ShippoAdapter,
};

export const PROVIDER_LABELS = {
  manual: 'Manual',
  shiprocket: 'Shiprocket',
  delhivery: 'Delhivery',
  shippo: 'Shippo',
};

export async function loadSettings() {
  return getCachedSettings();
}

export async function getSetting(name, fallback = '') {
  const settings = await loadSettings();
  const value = settings[name];
  return value === undefined || value === null ? fallback : value;
}

export function providerIsConfigured(provider, settings) {
  switch (provider) {
    case 'shiprocket':
      return Boolean(settings.shiprocket_token || (settings.shiprocket_email && settings.shiprocket_password));
    case 'delhivery':
      return Boolean(settings.delhivery_api_token);
    case 'shippo':
      return Boolean(settings.shippo_token);
    default:
      return true;
  }
}

export async function getShippingAdapter() {
  const settings = await loadSettings();
  const provider = settings.shipping_provider || 'manual';
  const Adapter = PROVIDERS[provider] || ManualAdapter;
  const adapter = new Adapter(settings);
  return { adapter, provider, configured: providerIsConfigured(provider, settings), settings };
}

export async function saveSetting(name, value) {
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [name, String(value ?? '')]
  );
  invalidateSettings();
}
