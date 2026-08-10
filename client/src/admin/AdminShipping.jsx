import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { field, validateFields } from '../utils/validation'
import FieldError from '../components/FieldError'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const providers = [
  { value: 'manual', label: 'Manual', hint: 'Flat fees from the shipping methods below' },
  { value: 'shiprocket', label: 'Shiprocket (India)', hint: 'Live rates, shipments and tracking for India' },
  { value: 'delhivery', label: 'Delhivery (India)', hint: 'Live rates, shipments and tracking for India' },
  { value: 'shippo', label: 'Shippo (International)', hint: 'Live rates, labels and tracking worldwide' },
]

const emptyMethod = {
  name: '',
  description: '',
  fee: '',
  estimated_days_min: '',
  estimated_days_max: '',
  active: '1',
  sort_order: '',
}

export default function AdminShipping() {
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [testingShippo, setTestingShippo] = useState(false)
  const [shippoTestResult, setShippoTestResult] = useState(null)
  const [configFieldErrors, setConfigFieldErrors] = useState({})
  const [methodFieldErrors, setMethodFieldErrors] = useState({})

  const [config, setConfig] = useState({
    shipping_provider: 'manual',
    shipping_origin_name: '',
    shipping_origin_street1: '',
    shipping_origin_street2: '',
    shipping_origin_city: '',
    shipping_origin_state: '',
    shipping_origin_postcode: '',
    shipping_origin_country: 'IN',
    default_weight_grams: '500',
    shipping_boxes: '',
    shipping_clearance_factor: '1.0',
    shippo_label_file_type: 'PDF',
    shiprocket_email: '',
    shiprocket_password: '',
    delhivery_api_token: '',
    delhivery_client_name: '',
    shippo_token: '',
  })

  const [methodForm, setMethodForm] = useState(emptyMethod)
  const [editingId, setEditingId] = useState(null)

  function load() {
    setLoading(true)
    Promise.all([
      client.get('/admin/shipping-methods'),
      client.get('/admin/settings'),
    ])
      .then(([methodsRes, settingsRes]) => {
        setMethods(methodsRes.data.methods)
        const s = settingsRes.data.settings
        setConfig({
          shipping_provider: s.shipping_provider || 'manual',
          shipping_origin_name: s.shipping_origin_name || '',
          shipping_origin_street1: s.shipping_origin_street1 || '',
          shipping_origin_street2: s.shipping_origin_street2 || '',
          shipping_origin_city: s.shipping_origin_city || '',
          shipping_origin_state: s.shipping_origin_state || '',
          shipping_origin_postcode: s.shipping_origin_postcode || '',
          shipping_origin_country: s.shipping_origin_country || 'IN',
          default_weight_grams: s.default_weight_grams || '500',
          shipping_boxes: s.shipping_boxes || '',
          shipping_clearance_factor: s.shipping_clearance_factor || '1.0',
          shippo_label_file_type: s.shippo_label_file_type || 'PDF',
          shiprocket_email: s.shiprocket_email || '',
          shiprocket_password: '',
          delhivery_api_token: s.delhivery_api_token || '',
          delhivery_client_name: s.delhivery_client_name || '',
          shippo_token: s.shippo_token || '',
        })
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load shipping config'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function setCfg(key, value) {
    setConfig((c) => ({ ...c, [key]: value }))
    setConfigFieldErrors((prev) => {
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
      shipping_origin_postcode: [field.maxLen(20, 'Pickup postcode')],
      shipping_origin_country: [field.maxLen(100, 'Pickup country')],
      default_weight_grams: [field.number('Default weight'), field.min(0, 'Default weight')],
    }, config)
    setConfigFieldErrors(errors)
    if (!isValid) return
    setSaving(true)
    try {
      const { shipping_provider, shipping_origin_name, shipping_origin_street1, shipping_origin_street2, shipping_origin_city, shipping_origin_state, shipping_origin_postcode, shipping_origin_country, default_weight_grams, shipping_boxes, shipping_clearance_factor, shippo_label_file_type, shiprocket_email, shiprocket_password, delhivery_api_token, delhivery_client_name, shippo_token } = config
      const payload = {
        shipping_provider,
        shipping_origin_name,
        shipping_origin_street1,
        shipping_origin_street2,
        shipping_origin_city,
        shipping_origin_state,
        shipping_origin_postcode,
        shipping_origin_country,
        default_weight_grams,
        shipping_boxes,
        shipping_clearance_factor,
        shippo_label_file_type,
        shiprocket_email,
        shiprocket_password,
        delhivery_api_token,
        delhivery_client_name,
        shippo_token,
      }
      await client.put('/admin/shipping-config', payload)
      setMessage('Shipping configuration saved')
      setConfig((c) => ({ ...c, shiprocket_password: '' }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save shipping configuration')
    } finally {
      setSaving(false)
    }
  }

  async function testShippo() {
    setTestingShippo(true)
    setShippoTestResult(null)
    try {
      const { data } = await client.post('/admin/shipping-test/shippo')
      if (data?.ok) {
        const fee = data.result?.fee
        setShippoTestResult({ ok: true, quote: fee != null ? `Found rates — from $${Number(fee).toFixed(2)}` : 'Connection OK' })
      } else {
        setShippoTestResult({ ok: false, error: data?.error || 'Test failed' })
      }
    } catch (err) {
      setShippoTestResult({ ok: false, error: err.response?.data?.error || err.response?.data?.message || 'Failed to reach the test endpoint' })
    } finally {
      setTestingShippo(false)
    }
  }

  function startEdit(m) {
    setEditingId(m.id)
    setMethodFieldErrors({})
    setMethodForm({
      name: m.name,
      description: m.description || '',
      fee: String(m.fee),
      estimated_days_min: m.estimated_days_min ?? '',
      estimated_days_max: m.estimated_days_max ?? '',
      active: m.active ? '1' : '0',
      sort_order: m.sort_order ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setMethodForm(emptyMethod)
  }

  async function saveMethod(e) {
    e.preventDefault()
    setError('')
    const { fieldErrors: errors, isValid } = validateFields({
      name: [field.required('Name'), field.maxLen(100, 'Name')],
      fee: [field.required('Fee'), field.number('Fee'), field.min(0, 'Fee')],
    }, methodForm)
    setMethodFieldErrors(errors)
    if (!isValid) return
    setSaving(true)
    try {
      if (editingId) {
        await client.put(`/admin/shipping-methods/${editingId}`, methodForm)
      } else {
        await client.post('/admin/shipping-methods', methodForm)
      }
      cancelEdit()
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save shipping method')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(m) {
    await client.put(`/admin/shipping-methods/${m.id}`, { ...m, active: m.active ? '0' : '1' })
    load()
  }

  async function removeMethod(m) {
    if (!confirm(`Delete shipping method "${m.name}"?`)) return
    await client.delete(`/admin/shipping-methods/${m.id}`)
    load()
  }

  const activeProvider = providers.find((p) => p.value === config.shipping_provider) || providers[0]

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Shipping</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {message && <p className="mb-4 text-green-600">{message}</p>}

      {/* Provider switcher */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <header className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Carrier provider</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Switch between Indian and international shipping APIs. Live rates are used when
            credentials are configured; otherwise configured method fees apply as a fallback.
          </p>
        </header>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {providers.map((p) => (
              <label
                key={p.value}
                className={`block border rounded-lg p-4 cursor-pointer transition-colors ${config.shipping_provider === p.value ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="provider"
                    checked={config.shipping_provider === p.value}
                    onChange={() => setCfg('shipping_provider', p.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.hint}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <p className="text-sm font-semibold text-gray-700">Active: {activeProvider.label}</p>

          {/* Credentials */}
          {config.shipping_provider === 'shiprocket' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Shiprocket email</label>
                <input className={inputClass} value={config.shiprocket_email} onChange={(e) => setCfg('shiprocket_email', e.target.value)} placeholder="login@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Shiprocket password</label>
                <input type="password" className={inputClass} value={config.shiprocket_password} onChange={(e) => setCfg('shiprocket_password', e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                <p className="text-xs text-gray-400 mt-1">Saved securely; used to obtain an API token.</p>
              </div>
            </div>
          )}

          {config.shipping_provider === 'delhivery' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Delhivery API token</label>
                <input className={inputClass} value={config.delhivery_api_token} onChange={(e) => setCfg('delhivery_api_token', e.target.value)} placeholder="API token" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Client name</label>
                <input className={inputClass} value={config.delhivery_client_name} onChange={(e) => setCfg('delhivery_client_name', e.target.value)} placeholder="e.g. your store name" />
              </div>
            </div>
          )}

          {config.shipping_provider === 'shippo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Shippo API token</label>
                <input className={inputClass} value={config.shippo_token} onChange={(e) => setCfg('shippo_token', e.target.value)} placeholder="shippo_test_..." />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Origin address (required for live rates)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name / Company</label>
                    <input className={inputClass} value={config.shipping_origin_name} onChange={(e) => setCfg('shipping_origin_name', e.target.value)} placeholder="Your store/company name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Street address</label>
                    <input className={inputClass} value={config.shipping_origin_street1} onChange={(e) => setCfg('shipping_origin_street1', e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Apt / Suite (optional)</label>
                    <input className={inputClass} value={config.shipping_origin_street2} onChange={(e) => setCfg('shipping_origin_street2', e.target.value)} placeholder="Suite 100" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    <input className={inputClass} value={config.shipping_origin_city} onChange={(e) => setCfg('shipping_origin_city', e.target.value)} placeholder="New York" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">State (2 letters)</label>
                    <input className={inputClass} value={config.shipping_origin_state} onChange={(e) => setCfg('shipping_origin_state', e.target.value)} placeholder="NY" maxLength="2" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Postcode</label>
                    <input className={inputClass} value={config.shipping_origin_postcode} onChange={(e) => setCfg('shipping_origin_postcode', e.target.value)} placeholder="10001" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Country</label>
                    <input className={inputClass} value={config.shipping_origin_country} onChange={(e) => setCfg('shipping_origin_country', e.target.value)} placeholder="US / IN / ..." />
                  </div>
                </div>
              </div>
              <button
                onClick={testShippo}
                disabled={testingShippo}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold"
              >
                {testingShippo ? 'Testing...' : 'Test Shippo connection'}
              </button>
              {shippoTestResult && (
                <p className={`text-xs ${shippoTestResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {shippoTestResult.ok ? `Connected — ${shippoTestResult.quote}` : shippoTestResult.error}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup postcode</label>
              <input className={inputClass} value={config.shipping_origin_postcode} onChange={(e) => setCfg('shipping_origin_postcode', e.target.value)} placeholder="e.g. 560001" />
              <FieldError name="shipping_origin_postcode" errors={configFieldErrors} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup country</label>
              <input className={inputClass} value={config.shipping_origin_country} onChange={(e) => setCfg('shipping_origin_country', e.target.value)} placeholder="IN / US / ..." />
              <FieldError name="shipping_origin_country" errors={configFieldErrors} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default weight (grams)</label>
              <input type="number" min="0" className={inputClass} value={config.default_weight_grams} onChange={(e) => setCfg('default_weight_grams', e.target.value)} placeholder="500" />
              <FieldError name="default_weight_grams" errors={configFieldErrors} />
              <p className="text-xs text-gray-400 mt-1">Used when a product has no weight set.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Shipping boxes</label>
              <textarea
                rows={3}
                className={inputClass}
                value={config.shipping_boxes}
                onChange={(e) => setCfg('shipping_boxes', e.target.value)}
                placeholder='JSON array of box sizes, e.g. [{"length":40,"width":30,"height":20,"maxWeight":5000}]'
              />
              <p className="text-xs text-gray-400 mt-1">Used to find the best box fit for live rates.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Clearance factor</label>
              <input type="number" min="1" step="0.01" className={inputClass} value={config.shipping_clearance_factor} onChange={(e) => setCfg('shipping_clearance_factor', e.target.value)} placeholder="1.0" />
              <p className="text-xs text-gray-400 mt-1">Multiply weight by this factor for volumetric padding.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Label file type (Shippo)</label>
              <select className={inputClass} value={config.shippo_label_file_type} onChange={(e) => setCfg('shippo_label_file_type', e.target.value)}>
                <option value="PDF">PDF</option>
                <option value="ZPL">ZPL</option>
                <option value="PNG">PNG</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Format of purchased shipping labels.</p>
            </div>
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
          >
            {saving ? 'Saving...' : 'Save provider settings'}
          </button>
        </div>
      </section>

      {/* Methods CRUD */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <header className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Shipping methods</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Methods offered at checkout. Fees are used in manual mode and as a fallback when carrier rates are unavailable.
          </p>
        </header>
        <div className="p-6">
          <form noValidate onSubmit={saveMethod} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-gray-50 border rounded-lg p-4">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input required className={inputClass} placeholder="Name (e.g. Standard)" value={methodForm.name} onChange={(e) => { setMethodForm({ ...methodForm, name: e.target.value }); setMethodFieldErrors((prev) => { if (!('name' in prev)) return prev; const next = { ...prev }; delete next.name; return next }) }} />
                <FieldError name="name" errors={methodFieldErrors} />
              </div>
              <div>
                <input className={inputClass} placeholder="Description" value={methodForm.description} onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="number" min="0" step="0.01" required className={inputClass} placeholder="Fee ($)" value={methodForm.fee} onChange={(e) => { setMethodForm({ ...methodForm, fee: e.target.value }); setMethodFieldErrors((prev) => { if (!('fee' in prev)) return prev; const next = { ...prev }; delete next.fee; return next }) }} />
                <FieldError name="fee" errors={methodFieldErrors} />
              </div>
              <div>
                <input type="number" min="0" className={inputClass} placeholder="Sort order" value={methodForm.sort_order} onChange={(e) => setMethodForm({ ...methodForm, sort_order: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" className={inputClass} placeholder="ETA min (days)" value={methodForm.estimated_days_min} onChange={(e) => setMethodForm({ ...methodForm, estimated_days_min: e.target.value })} />
              <input type="number" min="0" className={inputClass} placeholder="ETA max (days)" value={methodForm.estimated_days_max} onChange={(e) => setMethodForm({ ...methodForm, estimated_days_max: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={methodForm.active === '1'} onChange={(e) => setMethodForm({ ...methodForm, active: e.target.checked ? '1' : '0' })} />
                Active
              </label>
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add method'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-4 py-2 border rounded text-sm hover:bg-gray-100">
                  Cancel
                </button>
              )}
            </div>
          </form>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <ul className="divide-y border rounded-lg">
              {methods.map((m) => (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500">
                      ${Number(m.fee).toFixed(2)}
                      {m.estimated_days_min || m.estimated_days_max ? ` · ${m.estimated_days_min}-${m.estimated_days_max} days` : ''}
                      {m.description ? ` · ${m.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {m.active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => startEdit(m)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => toggleActive(m)} className="text-yellow-600 hover:underline">
                      {m.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => removeMethod(m)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
