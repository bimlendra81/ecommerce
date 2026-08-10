const DEFAULT_TTL_MS = 30_000;
const MAX_KEYS = 200;

const store = new Map();

export function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function set(key, value, ttlMs = DEFAULT_TTL_MS) {
  if (store.size >= MAX_KEYS && !store.has(key)) {
    store.delete(store.keys().next().value);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function del(key) {
  store.delete(key);
}

export function delPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clear() {
  store.clear();
}

const STOREFRONT_PREFIXES = [
  'home:',
  'products:',
  'product:',
  'categories:',
  'brands:',
  'slides:',
  'pricerange',
];

export function invalidateStorefront() {
  for (const prefix of STOREFRONT_PREFIXES) {
    delPrefix(prefix);
  }
}
