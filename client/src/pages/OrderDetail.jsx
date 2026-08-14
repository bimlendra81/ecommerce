import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'

const statusSteps = ['pending', 'paid', 'shipped', 'in_transit', 'out_for_delivery', 'delivered']
const terminalStatuses = ['cancelled', 'returned', 'failed']
const paymentGatewayLabels = { razorpay: 'Razorpay', stripe: 'Stripe', test: 'Test mode' }

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load order'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-center py-16 text-gray-500">Loading order...</p>
  if (error || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
        <Link to="/orders" className="text-primary underline">Back to orders</Link>
      </div>
    )
  }

  const shipping = order.shipping
  const stepIndex = statusSteps.indexOf(order.status)
  const terminal = terminalStatuses.includes(order.status)
  const terminalColors = {
    cancelled: 'bg-red-100 text-red-700',
    returned: 'bg-orange-100 text-orange-700',
    failed: 'bg-red-100 text-red-700',
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/orders" className="text-primary hover:underline text-sm">← Back to orders</Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${terminalColors[order.status] || 'bg-green-100 text-green-700'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>
      <p className="text-gray-600 mt-1">
        Placed on {new Date(order.created_at).toLocaleString()}
      </p>

      {/* Status progress */}
      {!terminal && (
        <div className="mt-6 bg-white border rounded-lg p-5">
          <ol className="flex items-center justify-between">
            {statusSteps.map((s, i) => (
              <li key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIndex ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-xs capitalize ${i <= stepIndex ? 'text-primary-dark font-medium' : 'text-gray-500'}`}>{s.replace(/_/g, ' ')}</span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < stepIndex ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <ul className="mt-6 divide-y border rounded-lg overflow-hidden">
        {order.items.map((item) => (
          <li key={item.id} className="py-4 px-4 flex items-center justify-between bg-white">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-gray-600 text-sm">
                ${Number(item.price).toFixed(2)} x {item.quantity}
              </p>
            </div>
            <span className="font-semibold">${(Number(item.price) * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {/* Shipping block */}
      {shipping && (
        <div className="mt-6 bg-white border rounded-lg p-5">
          <h2 className="font-bold mb-3">Shipping</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Method</dt>
              <dd className="font-medium">{shipping.method_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Fee</dt>
              <dd className="font-medium">{Number(shipping.fee) > 0 ? `$${Number(shipping.fee).toFixed(2)}` : 'Free'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Address</dt>
              <dd className="text-gray-700">
                {shipping.full_name}<br />
                {shipping.address_line1}{shipping.address_line2 ? `, ${shipping.address_line2}` : ''}<br />
                {shipping.city}, {shipping.state} {shipping.postal_code}<br />
                {shipping.country} · {shipping.phone}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Tracking</dt>
              <dd className="text-gray-700">
                {shipping.tracking_number ? (
                  <>
                    <p>
                      {shipping.carrier && shipping.carrier !== 'manual' ? `${shipping.carrier} · ` : ''}
                      {shipping.service ? `${shipping.service} · ` : ''}
                      {shipping.tracking_number}
                    </p>
                    {shipping.tracking_url && (
                      <a href={shipping.tracking_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Track on carrier site
                      </a>
                    )}
                  </>
                ) : (
                  'Not shipped yet'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Shipping label</dt>
              <dd className="text-gray-700">
                {shipping.shipping_status === 'label_created' ? (
                  <>
                    <p className="inline-flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Label created
                      </span>
                      {shipping.label_url && (
                        <a href={shipping.label_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          View label
                        </a>
                      )}
                    </p>
                  </>
                ) : (
                  'Not created yet'
                )}
              </dd>
            </div>
          </dl>

          {shipping.events?.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Tracking timeline</h3>
              <ol className="space-y-3">
                {shipping.events.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{ev.event}</p>
                      {ev.location && <p className="text-gray-500 text-xs">{ev.location}</p>}
                      {ev.notes && ev.notes !== ev.event && <p className="text-gray-500 text-xs">{ev.notes}</p>}
                      <p className="text-gray-400 text-xs">{new Date(ev.created_at).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {order.payment && (
        <div className="mt-6 bg-white border rounded-lg p-5">
          <h2 className="font-bold mb-3">Payment</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Method</dt>
              <dd className="font-medium">{paymentGatewayLabels[order.payment.gateway] || order.payment.gateway}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  order.payment.payment_status === 'paid' ? 'bg-green-100 text-green-700'
                    : order.payment.payment_status === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.payment.payment_status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-medium">${Number(order.payment.amount).toFixed(2)} {order.payment.currency}</dd>
            </div>
            {order.payment.txn_id && (
              <div>
                <dt className="text-gray-500">Transaction ID</dt>
                <dd className="font-medium break-all">{order.payment.txn_id}</dd>
              </div>
            )}
            {order.payment.created_at && (
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium">{new Date(order.payment.created_at).toLocaleString()}</dd>
              </div>
            )}
            {order.payment.refund_status && order.payment.refund_status !== 'none' && (
              <div>
                <dt className="text-gray-500">Refund</dt>
                <dd>
                  {order.payment.refund_status === 'refunded' ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Refunded{order.payment.refund_amount ? ` · $${Number(order.payment.refund_amount).toFixed(2)}` : ''}
                      {order.payment.refund_txn_id ? ` · ${order.payment.refund_txn_id}` : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      Refund requested
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="mt-6 text-right space-y-1">
        <p className="text-gray-600 text-sm">Subtotal: ${Number(order.subtotal ?? order.total).toFixed(2)}</p>
        {order.coupon && (
          <p className="text-gray-600 text-sm">
            Coupon ({order.coupon.code}):{' '}
            <span className="text-green-600">−${Number(order.discount || 0).toFixed(2)}</span>
          </p>
        )}
        <p className="text-gray-600 text-sm">Shipping: {Number(order.shipping_fee) > 0 ? `$${Number(order.shipping_fee).toFixed(2)}` : 'Free'}</p>
        {Number(order.tax_fee || 0) > 0 && (
          <p className="text-gray-600 text-sm">Tax: ${Number(order.tax_fee).toFixed(2)}</p>
        )}
        <p className="text-xl font-bold">Total: ${Number(order.total).toFixed(2)}</p>
      </div>
    </section>
  )
}