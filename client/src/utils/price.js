export function saleActive(p) {
  if (p == null || p.sale_price == null || p.sale_price === '') return false
  if (!p.sale_ends_at) return true
  return new Date(p.sale_ends_at).getTime() > Date.now()
}

export function priceNow(p) {
  return saleActive(p) ? Number(p.sale_price) : Number(p.price)
}

export function discountPercent(p) {
  if (!saleActive(p) || Number(p.price) <= 0) return 0
  return Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)
}
