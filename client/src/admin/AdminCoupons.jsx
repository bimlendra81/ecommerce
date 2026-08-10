import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

const emptyForm = {
  code: '',
  type: 'percent',
  value: '',
  min_order_amount: '',
  max_discount: '',
  per_user_limit: '1',
  starts_at: '',
  expires_at: '',
  active: '1',
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

const labelClass = 'block text-sm font-semibold text-gray-700 mb-1'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const { fieldErrors, validate, clear } = useFormErrors()

  function load() {
    setLoading(true)
    client
      .get('/admin/coupons')
      .then(({ data }) => setCoupons(data.coupons))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load coupons'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function startEdit(c) {
    setEditing(c)
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value ?? ''),
      min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : '',
      max_discount: c.max_discount != null ? String(c.max_discount) : '',
      per_user_limit: String(c.per_user_limit ?? '1'),
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      active: String(c.active),
    })
  }

  function resetForm() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const rules = {
      code: [field.required('Code'), field.maxLen(50, 'Code')],
      value: [
        field.required('Discount'),
        field.number('Discount'),
        field.min(0, 'Discount'),
        ...(form.type === 'percent' ? [field.max(100, 'Discount')] : []),
      ],
      min_order_amount: [field.number('Minimum order'), field.min(0, 'Minimum order')],
      max_discount: [field.number('Max discount'), field.min(0, 'Max discount')],
      per_user_limit: [field.int('Per-user limit'), field.min(1, 'Per-user limit')],
      expires_at: [
        (v, values) => {
          if (!v || !values.starts_at) return null
          return new Date(v) > new Date(values.starts_at)
            ? null
            : 'Expires must be after Starts'
        },
      ],
    }
    if (!validate(rules, form)) {
      setSaving(false)
      return
    }
    try {
      const payload = {
        ...form,
        value: form.type === 'percent' ? Math.min(Number(form.value) || 0, 100) : Number(form.value) || 0,
      }
      if (editing) {
        await client.put(`/admin/coupons/${editing.id}`, payload)
      } else {
        await client.post('/admin/coupons', payload)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c) {
    const active = c.active ? '0' : '1'
    await client.put(`/admin/coupons/${c.id}`, { ...formFor(c), active })
    load()
  }

  function formFor(c) {
    return {
      code: c.code,
      type: c.type,
      value: c.value,
      min_order_amount: c.min_order_amount,
      max_discount: c.max_discount,
      per_user_limit: c.per_user_limit,
      starts_at: c.starts_at,
      expires_at: c.expires_at,
    }
  }

  async function remove(c) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return
    await client.delete(`/admin/coupons/${c.id}`)
    load()
  }

  async function restore(c) {
    await client.post(`/admin/coupons/${c.id}/restore`)
    load()
  }

  function fmt(v) {
    if (v == null) return '—'
    const d = new Date(v)
    return d.toLocaleString()
  }

  const shown = coupons.filter((c) => (showDeleted ? Boolean(c.deleted_at) : !c.deleted_at))

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Discount codes customers can apply at checkout
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Show deleted
        </label>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-4">
            {editing ? `Edit coupon: ${editing.code}` : 'New coupon'}
          </h2>
          <form noValidate onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Code *</label>
                <input
                  required
                  placeholder="e.g. SAVE10"
                  value={form.code}
                  onChange={(e) => {
                    setForm({ ...form, code: e.target.value })
                    clear('code')
                  }}
                  aria-invalid={Boolean(fieldErrors.code)}
                  className={inputClass}
                />
                <FieldError name="code" errors={fieldErrors} />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={inputClass}
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  {form.type === 'percent' ? 'Discount (%) *' : 'Discount ($) *'}
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={form.value}
                  onChange={(e) => {
                    setForm({ ...form, value: e.target.value })
                    clear('value')
                  }}
                  aria-invalid={Boolean(fieldErrors.value)}
                  className={inputClass}
                />
                <FieldError name="value" errors={fieldErrors} />
              </div>
              <div>
                <label className={labelClass}>Minimum order ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="None"
                  value={form.min_order_amount}
                  onChange={(e) => {
                    setForm({ ...form, min_order_amount: e.target.value })
                    clear('min_order_amount')
                  }}
                  aria-invalid={Boolean(fieldErrors.min_order_amount)}
                  className={inputClass}
                />
                <FieldError name="min_order_amount" errors={fieldErrors} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Max discount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="None"
                  value={form.max_discount}
                  onChange={(e) => {
                    setForm({ ...form, max_discount: e.target.value })
                    clear('max_discount')
                  }}
                  aria-invalid={Boolean(fieldErrors.max_discount)}
                  className={inputClass}
                />
                <FieldError name="max_discount" errors={fieldErrors} />
                <p className="text-xs text-gray-500 mt-1">Only for percent coupons.</p>
              </div>
              <div>
                <label className={labelClass}>Per-user limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.per_user_limit}
                  onChange={(e) => {
                    setForm({ ...form, per_user_limit: e.target.value })
                    clear('per_user_limit')
                  }}
                  aria-invalid={Boolean(fieldErrors.per_user_limit)}
                  className={inputClass}
                />
                <FieldError name="per_user_limit" errors={fieldErrors} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Starts</label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => {
                    setForm({ ...form, starts_at: e.target.value })
                    clear('starts_at')
                    if (form.expires_at) clear('expires_at')
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Expires</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => {
                    setForm({ ...form, expires_at: e.target.value })
                    clear('expires_at')
                  }}
                  aria-invalid={Boolean(fieldErrors.expires_at)}
                  className={inputClass}
                />
                <FieldError name="expires_at" errors={fieldErrors} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.value })}
                className={inputClass}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
              >
                {saving ? 'Saving...' : editing ? 'Update coupon' : 'Create coupon'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 self-start">
          <h2 className="font-bold text-gray-800 mb-2">How coupons work</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Percent coupons cap the discount at <b>Max discount</b> when set.</li>
            <li>• A coupon is only usable once the order subtotal meets <b>Minimum order</b>.</li>
            <li>• <b>Per-user limit</b> counts how many times each customer can use it.</li>
            <li>• Leave <b>Starts / Expires</b> blank for no time restriction.</li>
            <li>• Customers enter the code at checkout; discounts are applied before shipping.</li>
          </ul>
        </section>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.type === 'percent' ? `${c.value}%` : `$${Number(c.value).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {c.min_order_amount != null ? `$${Number(c.min_order_amount).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">{fmt(c.expires_at)}</td>
                  <td className="px-4 py-3">{c.times_used}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.deleted_at ? 'bg-red-100 text-red-600' : c.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {c.deleted_at ? 'Deleted' : c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {!c.deleted_at && (
                      <>
                        <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => toggleActive(c)} className="text-yellow-600 hover:underline mr-3">
                          {c.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => remove(c)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </>
                    )}
                    {c.deleted_at && (
                      <button onClick={() => restore(c)} className="text-green-600 hover:underline">
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No {showDeleted ? 'deleted' : ''} coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
