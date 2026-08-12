import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

const statuses = ['pending', 'paid', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed', 'cancelled']

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  shipped: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  returned: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const inputClass =
  'w-full border rounded px-3 py-2 text-sm'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [actionError, setActionError] = useState('')
  const [shippingForm, setShippingForm] = useState({})
  const [eventForm, setEventForm] = useState({ event: '', location: '', notes: '' })
  const [parcelForm, setParcelForm] = useState({ length_cm: '', width_cm: '', height_cm: '', weight_grams: '' })
  const [busyKey, setBusyKey] = useState('')
  const { fieldErrors, validate, clear } = useFormErrors()

  function loadOrders() {
    client
      .get('/admin/orders', { params: { status: statusFilter || undefined, search: search || undefined, showDeleted: showDeleted ? '1' : undefined } })
      .then(({ data }) => setOrders(data.orders))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
  }

  useEffect(() => {
    setLoading(true)
    client
      .get('/admin/orders', { params: { status: statusFilter || undefined, search: search || undefined, showDeleted: showDeleted ? '1' : undefined } })
      .then(({ data }) => setOrders(data.orders))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [statusFilter, search, showDeleted])

  async function refreshOrder(orderId) {
    const { data } = await client.get(`/admin/orders/${orderId}`)
    setExpanded(data.order)
    setShippingForm({
      carrier: data.order.shipping?.carrier || '',
      tracking_number: data.order.shipping?.tracking_number || '',
      tracking_url: data.order.shipping?.tracking_url || '',
      notes: data.order.shipping?.notes || '',
      estimated_delivery: data.order.shipping?.estimated_delivery
        ? String(data.order.shipping.estimated_delivery).slice(0, 10)
        : '',
    })
  }

  async function run(key, fn) {
    setActionError('')
    setBusyKey(key)
    try {
      await fn()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed')
    } finally {
      setBusyKey('')
    }
  }

  async function updateStatus(order, status) {
    await run(`status-${order.id}`, async () => {
      await client.patch(`/admin/orders/${order.id}`, { status })
      loadOrders()
    })
  }

  async function toggleDetail(order) {
    if (expanded?.id === order.id) {
      setExpanded(null)
      return
    }
    setActionError('')
    await refreshOrder(order.id)
  }

  async function saveShippingInfo(orderId) {
    if (!validate({ tracking_url: [field.url('Tracking URL')] }, shippingForm)) return
    const payload = {}
    for (const k of ['carrier', 'tracking_number', 'tracking_url', 'notes', 'estimated_delivery']) {
      if (shippingForm[k] !== undefined && shippingForm[k] !== '') payload[k] = shippingForm[k]
    }
    await run('shipping-info', async () => {
      await client.patch(`/admin/orders/${orderId}/shipping`, payload)
      await refreshOrder(orderId)
    })
  }

  async function shipOrder(orderId) {
    await run('ship', async () => {
      await client.post(`/admin/orders/${orderId}/shipping/ship`)
      loadOrders()
      await refreshOrder(orderId)
    })
  }

  async function syncTracking(orderId) {
    await run('sync', async () => {
      await client.post(`/admin/orders/${orderId}/shipping/sync`)
      await refreshOrder(orderId)
    })
  }

  async function buyLabel(orderId) {
    await run('label', async () => {
      await client.post(`/admin/orders/${orderId}/shipping/label`)
      await refreshOrder(orderId)
    })
  }

  async function saveParcelOverride(orderId) {
    await run('parcel', async () => {
      await client.patch(`/admin/orders/${orderId}/shipping/parcel`, {
        length_cm: parcelForm.length_cm,
        width_cm: parcelForm.width_cm,
        height_cm: parcelForm.height_cm,
        weight_grams: parcelForm.weight_grams,
      })
      setParcelForm({ length_cm: '', width_cm: '', height_cm: '', weight_grams: '' })
      await refreshOrder(orderId)
    })
  }

  async function refundOrder(orderId) {
    const amountInput = window.prompt('Refund amount (leave empty for full refund):')
    if (amountInput === null) return
    const body = {}
    const amount = Number(amountInput)
    if (amountInput.trim() !== '' && !Number.isNaN(amount)) {
      body.amount = amount
    }
    await run('refund', async () => {
      await client.post(`/admin/orders/${orderId}/refund`, body)
      loadOrders()
      await refreshOrder(orderId)
    })
  }

  async function addEvent(orderId) {
    if (!validate({ event: [field.required('Event'), field.minLen(2, 'Event'), field.maxLen(200, 'Event')] }, eventForm)) return
    await run('event', async () => {
      await client.post(`/admin/orders/${orderId}/shipping/events`, {
        event: eventForm.event.trim(),
        location: eventForm.location,
        notes: eventForm.notes,
      })
      setEventForm({ event: '', location: '', notes: '' })
      await refreshOrder(orderId)
    })
  }

  const shipping = expanded?.shipping

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by id, name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 px-2">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Deleted
        </label>
      </div>

      {(error || actionError) && (
        <p className="mb-4 text-red-600">
          {error} {actionError && `· ${actionError}`}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders found</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    Order #{o.id}
                    <span className="ml-3 text-sm text-gray-500">
                      {new Date(o.created_at).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {o.user_name} ({o.user_email}) · {o.item_count} item{o.item_count === 1 ? '' : 's'} · $
                    {Number(o.total).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o, e.target.value)}
                    disabled={busyKey === `status-${o.id}`}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <button onClick={() => toggleDetail(o)} className="text-blue-600 hover:underline text-sm">
                    {expanded?.id === o.id ? 'Hide' : 'View'}
                  </button>
                  {showDeleted ? (
                    <button
                      onClick={async () => {
                        await client.post(`/admin/orders/${o.id}/restore`)
                        loadOrders()
                      }}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete order #${o.id}?`)) return
                        await client.delete(`/admin/orders/${o.id}`)
                        loadOrders()
                      }}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {expanded?.id === o.id && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold text-sm mb-2">Items</h3>
                  <ul className="divide-y">
                    {expanded.items.map((item) => (
                      <li key={item.id} className="py-2 flex justify-between text-sm">
                        <span>
                          {item.name} × {item.quantity}
                          {item.weight_grams ? (
                            <span className="text-gray-400"> ({item.weight_grams}g each)</span>
                          ) : null}
                        </span>
                        <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 text-sm text-gray-600">
                    <p>
                      Subtotal <span className="font-medium">${Number(expanded.subtotal || 0).toFixed(2)}</span> · Shipping{' '}
                      <span className="font-medium">${Number(expanded.shipping_fee || 0).toFixed(2)}</span> · Total{' '}
                      <span className="font-medium">${Number(expanded.total).toFixed(2)}</span>
                    </p>
                    <p className="mt-1">
                      Method:{' '}
                      <span className="font-medium">{shipping?.method_name || '—'}</span>
                    </p>
                    {shipping && (
                      <p className="mt-1 text-xs">
                        Ship to: {shipping.full_name}, {shipping.address_line1}
                        {shipping.address_line2 ? `, ${shipping.address_line2}` : ''}, {shipping.city},{' '}
                        {shipping.state} {shipping.postal_code}, {shipping.country} · {shipping.phone}
                      </p>
                    )}
                  </div>

                  {expanded.payments?.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-semibold mb-1">Payments</p>
                      {expanded.payments.map((p) => (
                        <p key={p.id} className="flex items-center gap-2">
                          <span>
                            {p.gateway} · {p.txn_id} · {p.status} · ${Number(p.amount).toFixed(2)}
                          </span>
                          {p.refund_status === 'refunded' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Refunded{p.refund_amount ? ` · $${Number(p.refund_amount).toFixed(2)}` : ''}
                              {p.refund_txn_id ? ` · ${p.refund_txn_id}` : ''}
                            </span>
                          )}
                          {p.refund_status === 'requested' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              Refund requested
                            </span>
                          )}
                          {p.refund_status === 'none' &&
                            ['paid', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(expanded.status) && (
                              <button
                                onClick={() => refundOrder(expanded.id)}
                                disabled={busyKey === 'refund'}
                                className="text-red-600 hover:underline text-xs disabled:opacity-50"
                              >
                                Refund
                              </button>
                            )}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-semibold text-sm mb-2">Shipping</h3>
                    {!shipping ? (
                      <p className="text-sm text-gray-500">
                        No shipping info for this order.
                      </p>
                    ) : (
                      <div className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          {shipping.shipped_at && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              Shipped {new Date(shipping.shipped_at).toLocaleString()}
                            </span>
                          )}
                          {shipping.delivered_at && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                              Delivered {new Date(shipping.delivered_at).toLocaleString()}
                            </span>
                          )}
                          <span className="text-gray-500">
                            Carrier: {shipping.carrier || '—'} · Tracking:{' '}
                            {shipping.tracking_number ? (
                              shipping.tracking_url ? (
                                <a href={shipping.tracking_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                  {shipping.tracking_number}
                                </a>
                              ) : (
                                shipping.tracking_number
                              )
                            ) : (
                              '—'
                            )}
                          </span>
                          {shipping.label_url && (
                            <a href={shipping.label_url} target="_blank" rel="noreferrer" className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200">
                              View shipping label
                            </a>
                          )}
                          {shipping.shipping_status === 'label_created' && !shipping.label_url && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
                              Label created
                            </span>
                          )}
                          {shipping.shipping_status === 'error' && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700" title={shipping.shipping_error}>
                              Label error{shipping.shipping_error ? `: ${shipping.shipping_error}` : ''}
                            </span>
                          )}
                        </div>

                        {shipping.events?.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {shipping.events.map((ev) => (
                              <li key={ev.id} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <div>
                                  <p className="text-gray-800">{ev.event}</p>
                                  {(ev.location || ev.notes) && (
                                    <p className="text-xs text-gray-500">
                                      {[ev.location, ev.notes].filter(Boolean).join(' · ')}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    {new Date(ev.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {shipping.shippo_rate_id && (
                            <button
                              onClick={() => buyLabel(o.id)}
                              disabled={busyKey === 'label'}
                              className="px-3 py-1.5 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                            >
                              {busyKey === 'label' ? 'Buying label...' : 'Buy shipping label'}
                            </button>
                          )}
                          {!shipping.shipped_at && !shipping.shippo_rate_id && (
                            <button
                              onClick={() => shipOrder(o.id)}
                              disabled={busyKey === 'ship'}
                              className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                              {busyKey === 'ship' ? 'Shipping...' : 'Create shipment'}
                            </button>
                          )}
                          {shipping.tracking_number && (
                            <button
                              onClick={() => syncTracking(o.id)}
                              disabled={busyKey === 'sync'}
                              className="px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                              {busyKey === 'sync' ? 'Syncing...' : 'Sync tracking'}
                            </button>
                          )}
                        </div>

                        {shipping.shippo_rate_id && (
                          <div className="mt-4 border-t pt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Parcel override (re-buy label to apply)
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              <input type="number" className={inputClass} placeholder="L cm" value={parcelForm.length_cm} onChange={(e) => setParcelForm({ ...parcelForm, length_cm: e.target.value })} />
                              <input type="number" className={inputClass} placeholder="W cm" value={parcelForm.width_cm} onChange={(e) => setParcelForm({ ...parcelForm, width_cm: e.target.value })} />
                              <input type="number" className={inputClass} placeholder="H cm" value={parcelForm.height_cm} onChange={(e) => setParcelForm({ ...parcelForm, height_cm: e.target.value })} />
                              <input type="number" className={inputClass} placeholder="Weight g" value={parcelForm.weight_grams} onChange={(e) => setParcelForm({ ...parcelForm, weight_grams: e.target.value })} />
                            </div>
                            <button
                              onClick={() => saveParcelOverride(o.id)}
                              disabled={busyKey === 'parcel'}
                              className="mt-2 px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                              {busyKey === 'parcel' ? 'Saving...' : 'Save parcel override'}
                            </button>
                          </div>
                        )}

                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Update tracking
                            </p>
                            <div className="space-y-2">
                              <input
                                className={inputClass}
                                placeholder="Carrier"
                                value={shippingForm.carrier || ''}
                                onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value })}
                              />
                              <input
                                className={inputClass}
                                placeholder="Tracking number"
                                value={shippingForm.tracking_number || ''}
                                onChange={(e) => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                              />
                              <input
                                className={inputClass}
                                placeholder="Tracking URL"
                                value={shippingForm.tracking_url || ''}
                                onChange={(e) => {
                                  setShippingForm({ ...shippingForm, tracking_url: e.target.value })
                                  clear('tracking_url')
                                }}
                                aria-invalid={Boolean(fieldErrors.tracking_url)}
                              />
                              <FieldError name="tracking_url" errors={fieldErrors} />
                              <input
                                type="date"
                                className={inputClass}
                                value={shippingForm.estimated_delivery || ''}
                                onChange={(e) => setShippingForm({ ...shippingForm, estimated_delivery: e.target.value })}
                              />
                              <textarea
                                className={inputClass}
                                rows={2}
                                placeholder="Notes"
                                value={shippingForm.notes || ''}
                                onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                              />
                              <button
                                onClick={() => saveShippingInfo(o.id)}
                                disabled={busyKey === 'shipping-info'}
                                className="px-3 py-1.5 rounded border border-blue-600 text-blue-600 text-xs font-semibold hover:bg-blue-50 disabled:opacity-50"
                              >
                                {busyKey === 'shipping-info' ? 'Saving...' : 'Save tracking'}
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Add event
                            </p>
                            <div className="space-y-2">
                              <input
                                className={inputClass}
                                placeholder="Event (e.g. In transit)"
                                value={eventForm.event}
                                onChange={(e) => {
                                  setEventForm({ ...eventForm, event: e.target.value })
                                  clear('event')
                                }}
                                aria-invalid={Boolean(fieldErrors.event)}
                              />
                              <FieldError name="event" errors={fieldErrors} />
                              <input
                                className={inputClass}
                                placeholder="Location"
                                value={eventForm.location}
                                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                              />
                              <textarea
                                className={inputClass}
                                rows={2}
                                placeholder="Notes"
                                value={eventForm.notes}
                                onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                              />
                              <button
                                onClick={() => addEvent(o.id)}
                                disabled={busyKey === 'event'}
                                className="px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                              >
                                {busyKey === 'event' ? 'Adding...' : 'Add event'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
