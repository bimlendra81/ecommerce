const UPLOAD_URL = (import.meta.env.VITE_UPLOAD_URL || 'https://ecommerce-production-8160.up.railway.app').replace(/\/+$/, '')

export function resolveAssetUrl(url) {
  if (!url) return url
  if (/^(https?:)?\/\//i.test(url) || /^(data:|blob:)/i.test(url)) return url
  return `${UPLOAD_URL}/${url.replace(/^\/+/, '')}`
}

export function resolveMediaItem(item) {
  if (!item) return item
  return { ...item, url: resolveAssetUrl(item.url) }
}
