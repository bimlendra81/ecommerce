import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import client from '../api/client'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  shipped: 'bg-primary-soft text-primary-dark',
  in_transit: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  returned: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
}

const gatewayLabels = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  test: 'Test',
}

export default function Orders() {
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {location.state?.success && (
        <p className="mb-4 bg-green-100 text-green-700 p-3 rounded">
          Order #{location.state.orderId} placed successfully!
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading orders...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600 mb-4">You have no orders yet</p>
          <Link to="/search" className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="bg-white border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    Order #{order.id}
                    <span className="ml-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.item_count} item{order.item_count === 1 ? '' : 's'} · $
                    {Number(order.total).toFixed(2)}
                    {order.shipping_method ? (
                      <span className="text-gray-400"> · {order.shipping_method} shipping</span>
                    ) : null}
                    {order.payment_gateway ? (
                      <span className="text-gray-400"> · {gatewayLabels[order.payment_gateway] || order.payment_gateway}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                  <Link to={`/orders/${order.id}`} className="text-primary hover:underline text-sm">
                    Details
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
