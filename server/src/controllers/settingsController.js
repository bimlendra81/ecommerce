import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import { UPLOAD_DIR } from '../utils/upload.js';
import { getCachedSettings, invalidateSettings } from '../utils/settingsCache.js';
import { get, set } from '../utils/cache.js';

const PUBLIC_TTL_MS = 60_000;

const PUBLIC_KEYS = new Set([
  'site_title',
  'site_logo',
  'site_favicon',
  'site_tagline',
  'footer_logo',
  'home_features',
  'home_template',
  'theme',
  'facebook_url',
  'instagram_url',
  'free_shipping_threshold',
  'return_days',
  'contact_email',
  'contact_phone',
  'tax_enabled',
  'tax_rate',
  'tax_inclusive',
]);

const DEFAULTS = {
  site_title: 'Shop',
  site_logo: '',
  site_favicon: '',
  site_tagline: 'Quality products at great prices. Shop our curated catalog with fast delivery and easy returns.',
  footer_logo: '',
  home_features: JSON.stringify([
    { icon: '🚚', title: 'Free Shipping', text: 'On orders over {threshold}' },
    { icon: '🔒', title: 'Secure Payment', text: '100% protected checkout' },
    { icon: '🎧', title: '24/7 Support', text: 'We are here to help' },
  ]),
  theme: JSON.stringify({ selected: 'ocean', primary: '', accent: '' }),
  home_template: 'marketplace',
  facebook_url: '',
  instagram_url: '',
  free_shipping_threshold: '50',
  return_days: '30',
  contact_email: 'support@example.com',
  contact_phone: '+1 800 000 0000',
  tax_enabled: '0',
  tax_rate: '0',
  tax_inclusive: '0',
  shipping_provider: 'manual',
  default_weight_grams: '500',
  shipping_origin_name: '',
  shipping_origin_street1: '',
  shipping_origin_street2: '',
  shipping_origin_city: '',
  shipping_origin_state: '',
  shipping_origin_postcode: '',
  shipping_origin_country: 'IN',
  shipping_origin_email: '',
  shipping_origin_phone: '',
  shipping_parcel_length: '10',
  shipping_parcel_width: '10',
  shipping_parcel_height: '10',
  shipping_boxes: JSON.stringify([
    { name: 'S', length: 30, width: 20, height: 10, weight_grams: 120 },
    { name: 'M', length: 40, width: 30, height: 15, weight_grams: 180 },
    { name: 'L', length: 50, width: 35, height: 25, weight_grams: 260 },
    { name: 'XL', length: 60, width: 45, height: 35, weight_grams: 380 },
  ]),
  shipping_clearance_factor: '1.15',
  shippo_label_file_type: 'PDF',
  shiprocket_email: '',
  shiprocket_password: '',
  shiprocket_token: '',
  delhivery_api_token: '',
  delhivery_client_name: '',
  shippo_token: '',
  payment_gateway: 'test',
  payment_currency: 'INR',
  razorpay_key_id: '',
  razorpay_key_secret: '',
  stripe_secret_key: '',
  stripe_publishable_key: '',
  stripe_webhook_secret: '',
  reviews_auto_approve: '1',
  smtp_host: '',
  smtp_port: '587',
  smtp_secure: '0',
  smtp_user: '',
  smtp_password: '',
  smtp_from: '',
};

async function getAll() {
  const rows = await getCachedSettings();
  const settings = { ...DEFAULTS };
  for (const [name, value] of Object.entries(rows)) {
    settings[name] = value;
  }
  return settings;
}

async function upsert(name, value) {
  await pool.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [name, String(value)]
  );
}

export async function getPublicSettings(req, res, next) {
  try {
    const cached = get('settings:public');
    if (cached) {
      res.setHeader('Cache-Control', `public, max-age=${PUBLIC_TTL_MS / 1000}`);
      return res.json(cached);
    }
    const all = await getAll();
    const settings = {};
    for (const key of PUBLIC_KEYS) {
      settings[key] = all[key];
    }
    const payload = { settings };
    set('settings:public', payload, PUBLIC_TTL_MS);
    res.setHeader('Cache-Control', `public, max-age=${PUBLIC_TTL_MS / 1000}`);
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function getAllSettings(req, res, next) {
  try {
    res.json({ settings: await getAll() });
  } catch (err) {
    next(err);
  }
}

function deleteUploadedFile(url) {
  if (url && url.includes('/uploads/')) {
    const filename = url.split('/uploads/')[1];
    fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
  }
}

export async function updateSettings(req, res, next) {
  try {
    const old = await getAll();

    for (const [key, value] of Object.entries(req.body)) {
      if (key in DEFAULTS) {
        await upsert(key, value ?? '');
      }
    }

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.files.logo[0].filename}`;
        await upsert('site_logo', url);
        deleteUploadedFile(old.site_logo);
      }
      if (req.files.favicon && req.files.favicon[0]) {
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.files.favicon[0].filename}`;
        await upsert('site_favicon', url);
        deleteUploadedFile(old.site_favicon);
      }
      if (req.files.footer_logo && req.files.footer_logo[0]) {
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.files.footer_logo[0].filename}`;
        await upsert('footer_logo', url);
        deleteUploadedFile(old.footer_logo);
      }
    }

    invalidateSettings();
    res.json({ settings: await getAll() });
  } catch (err) {
    next(err);
  }
}
