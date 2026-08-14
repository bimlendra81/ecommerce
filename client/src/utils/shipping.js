export function bestValueQuote(quotes) {
  if (!quotes.length) return null
  const fees = quotes.map((q) => Number(q.fee) || 0)
  const minFee = Math.min(...fees)
  const maxFee = Math.max(...fees)
  const days = quotes.map((q) => ((Number(q.estimated_days_min) || 0) + (Number(q.estimated_days_max) || 0)) / 2)
  const minDays = Math.min(...days)
  const maxDays = Math.max(...days)
  let best = null
  let bestScore = Infinity
  for (const q of quotes) {
    const fee = Number(q.fee) || 0
    const day = ((Number(q.estimated_days_min) || 0) + (Number(q.estimated_days_max) || 0)) / 2
    const feeRatio = maxFee > minFee ? (fee - minFee) / (maxFee - minFee) : 0
    const dayRatio = maxDays > minDays ? (day - minDays) / (maxDays - minDays) : 0
    const score = feeRatio + dayRatio
    if (score < bestScore) {
      bestScore = score
      best = q
    }
  }
  return best
}
