// Box-fit parcel calculation: smallest catalog box that fits the cart items.
const CM_PER_IN = 2.54;

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function toCm(value, unit) {
  const v = Number(value) || 0;
  return String(unit || 'cm').toLowerCase() === 'in' ? round2(v * CM_PER_IN) : v;
}

export function computeParcel({ items, settings = {} }) {
  let boxes = [];
  try {
    const raw = settings.shipping_boxes;
    const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
    if (Array.isArray(arr)) boxes = arr;
  } catch { /* ignore invalid catalog */ }

  const clearance = Number(settings.shipping_clearance_factor) > 1 ? Number(settings.shipping_clearance_factor) : 1.15;
  const defaultWeight = Number(settings.default_weight_grams) || 500;

  let totalWeight = 0;
  let totalVolume = 0;
  let maxDim = 0;
  let widestTwo = 0;
  let maxLength = 0;

  for (const it of items || []) {
    const qty = Math.max(Number(it.quantity) || 1, 1);
    const L = toCm(it.length_cm ?? it.length, it.dimension_unit);
    const W = toCm(it.width_cm ?? it.width, it.dimension_unit);
    const H = toCm(it.height_cm ?? it.height, it.dimension_unit);
    totalWeight += (Number(it.weight_grams) || defaultWeight) * qty;
    if (L > 0 && W > 0 && H > 0) {
      totalVolume += L * W * H * qty;
      maxDim = Math.max(maxDim, L, W, H);
      maxLength = Math.max(maxLength, L * qty, W * qty, H * qty);
      const d = [L, W, H].sort((a, b) => a - b);
      widestTwo = Math.max(widestTwo, d[0] + d[1]);
    }
  }

  const requiredVolume = totalVolume * clearance;
  const fitBoxes = boxes
    .map((b) => ({ ...b, volume: Number(b.length) * Number(b.width) * Number(b.height) }))
    .filter((b) => b.volume > 0)
    .sort((a, b) => a.volume - b.volume);

  let chosen = null;
  for (const b of fitBoxes) {
    const minFace = Math.min(b.length, b.width, b.height);
    if (b.volume >= requiredVolume && b.length >= maxDim && b.width >= maxDim && b.height >= maxDim && minFace >= widestTwo) {
      chosen = b;
      break;
    }
  }

  if (!chosen) {
    return {
      boxName: null,
      length_cm: round2(Math.max(maxLength, maxDim)),
      width_cm: round2(Math.max(maxDim, 15)),
      height_cm: round2(Math.max(maxDim, 10)),
      totalProductWeightGrams: Math.round(totalWeight),
      packagingWeightGrams: 0,
      parcelWeightGrams: Math.round(totalWeight),
    };
  }

  const tare = Math.round(Number(chosen.weight_grams) || 0);
  return {
    boxName: chosen.name || null,
    length_cm: Number(chosen.length),
    width_cm: Number(chosen.width),
    height_cm: Number(chosen.height),
    totalProductWeightGrams: Math.round(totalWeight),
    packagingWeightGrams: tare,
    parcelWeightGrams: Math.round(totalWeight) + tare,
  };
}