import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { field, validateFields } from '../utils/validation'
import FieldError from '../components/FieldError'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const gateways = [
  { value: 'test', label: 'Test mode', hint: 'Instant confirmation, no keys required. Sandbox for development.' },
  { value: 'razorpay', label: 'Razorpay (India)', hint: 'Cards, UPI, netbanking and wallets via the Razorpay modal.' },
  { value: 'stripe', label: 'Stripe (International)', hint: 'Embedded card payment; UPI shown where Stripe enables it.' },
]

const emptyConfig = {
  payment_gateway: 'test',
  payment_currency: 'INR',
  razorpay_key_id: '',
  razorpay_key_secret: '',
  stripe_secret_key: '',
  stripe_publishable_key: '',
  stripe_webhook_secret: '',
}

export default function AdminPayments() {
  const [config, setConfig] = useState(emptyConfig)
  const [configured, setConfigured] = useState({ razorpay: false, stripe: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function load() {
    setLoading(true)
    client
      .get('/admin/payment-config')
      .then(({ data }) => {
        setConfigured(data.configured || { razorpay: false, stripe: false })
        setConfig({
          payment_gateway: data.gateway || 'test',
          payment_currency: data.currency || 'INR',
          razorpay_key_id: data.razorpay?.key_id || '',
          razorpay_key_secret: '',
          stripe_secret_key: '',
          stripe_publishable_key: data.stripe?.publishable_key || '',
          stripe_webhook_secret: '',
        })
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load payment config'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function setCfg(key, value) {
    setConfig((c) => ({ ...c, [key]: value }))
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function saveConfig() {
    setError('')
    setMessage('')
    const { fieldErrors: errors, isValid } = validateFields({
      payment_currency: [
        field.required('Currency'),
        field.exactLen(3, 'Currency'),
      ],
    }, config)
    setFieldErrors(errors)
    if (!isValid) return
    setSaving(true)
    try {
      await client.put('/admin/payment-config', {
        ...config,
        razorpay_key_secret: config.razorpay_key_secret || undefined,
        stripe_secret_key: config.stripe_secret_key || undefined,
        stripe_webhook_secret: config.stripe_webhook_secret || undefined,
      })
      setMessage('Payment configuration saved')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payment configuration')
    } finally {
      setSaving(false)
    }
  }

  const active = gateways.find((g) => g.value === config.payment_gateway) || gateways[0]
  const isConfigured = (g) => (config.payment_gateway === 'test' ? true : configured[g])

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {message && <p className="mb-4 text-green-600">{message}</p>}

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <header className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Payment gateway</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose the gateway used at checkout. UPI is available inside Razorpay (India) and through
            Stripe's embedded element where Stripe enables it.
          </p>
        </header>
        <div className="p-6 space-y-5">
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {gateways.map((g) => (
                  <label
                    key={g.value}
                    className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                      config.payment_gateway === g.value
                        ? 'border-blue-600 ring-2 ring-blue-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="gateway"
                        checked={config.payment_gateway === g.value}
                        onChange={() => setCfg('payment_gateway', g.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{g.label}</p>
                        <p className="text-xs text-gray-500">{g.hint}</p>
                        {g.value !== 'test' && (
                          <p className="text-[11px] mt-1">
                            {isConfigured(g.value) ? (
                              <span className="text-green-600 font-medium">● Configured</span>
                            ) : (
                              <span className="text-gray-400">○ Not configured</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <p className="text-sm font-semibold text-gray-700">Active: {active.label}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Currency</label>
                  <input
                    className={inputClass}
                    value={config.payment_currency}
                    onChange={(e) => setCfg('payment_currency', e.target.value)}
                    placeholder="INR / USD / EUR"
                    maxLength={3}
                  />
                  <FieldError name="payment_currency" errors={fieldErrors} />
                  <p className="text-xs text-gray-400 mt-1">3-letter ISO code for charges.</p>
                </div>
              </div>

              {config.payment_gateway === 'razorpay' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Razorpay Key ID</label>
                    <input
                      className={inputClass}
                      value={config.razorpay_key_id}
                      onChange={(e) => setCfg('razorpay_key_id', e.target.value)}
                      placeholder="rzp_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Razorpay Key Secret</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={config.razorpay_key_secret}
                      onChange={(e) => setCfg('razorpay_key_secret', e.target.value)}
                      placeholder={isConfigured('razorpay') ? '•••••••• (unchanged)' : 'Key secret'}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Leave blank to keep the existing secret. Razorpay verifies payments by signature — no webhook needed.
                    </p>
                  </div>
                </div>
              )}

              {config.payment_gateway === 'stripe' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe Secret key</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={config.stripe_secret_key}
                      onChange={(e) => setCfg('stripe_secret_key', e.target.value)}
                      placeholder={isConfigured('stripe') ? '•••••••• (unchanged)' : 'sk_test_...'}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe Publishable key</label>
                    <input
                      className={inputClass}
                      value={config.stripe_publishable_key}
                      onChange={(e) => setCfg('stripe_publishable_key', e.target.value)}
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe webhook signing secret</label>
                    <input
                      type="password"
                      className={inputClass}
                      value={config.stripe_webhook_secret}
                      onChange={(e) => setCfg('stripe_webhook_secret', e.target.value)}
                      placeholder="whsec_..."
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Required for order confirmation. Get it from <code>stripe listen --forward-to localhost:5000/api/payment/webhook</code> or the Stripe dashboard webhook endpoint.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={saveConfig}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save configuration'}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
