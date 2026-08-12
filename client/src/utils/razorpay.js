let razorpayScriptPromise = null

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve()
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/razorpay.js'
      s.onload = () => resolve()
      document.body.appendChild(s)
    })
  }
  return razorpayScriptPromise
}
