export function isSaleActive(p) {
  if (p.sale_price == null || p.sale_price === '') return false;
  if (!p.sale_ends_at) return true;
  return new Date(p.sale_ends_at).getTime() > Date.now();
}

export function effectivePrice(p) {
  return isSaleActive(p) ? Number(p.sale_price) : Number(p.price);
}

export function isSaleActiveSql() {
  return "sale_price IS NOT NULL AND (sale_ends_at IS NULL OR sale_ends_at > NOW())";
}
