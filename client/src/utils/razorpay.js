let razorpayScriptPromise = null

function razorpayReady() {
  const R = window.Razorpay
  return Boolean(R && typeof R.prototype?.open === 'function')
}

export function loadRazorpayScript() {
  if (razorpayReady()) return Promise.resolve()
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.async = true
      s.onload = () => {
        razorpayScriptPromise = null
        resolve()
      }
      s.onerror = () => {
        razorpayScriptPromise = null
        reject(new Error('Razorpay checkout script failed to load'))
      }
      document.body.appendChild(s)
    })
  }
  return razorpayScriptPromise
}
