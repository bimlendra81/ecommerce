import { pool } from '../config/db.js';
import { get, set, del } from './cache.js';

const SETTINGS_TTL_MS = 60_000;

export async function getCachedSettings() {
  const cached = get('settings');
  if (cached) return cached;

  const [rows] = await pool.query('SELECT name, value FROM settings');
  const settings = {};
  for (const row of rows) {
    settings[row.name] = row.value;
  }
  set('settings', settings, SETTINGS_TTL_MS);
  return settings;
}

export function invalidateSettings() {
  del('settings');
  del('settings:public');
}
