import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/adminClient'

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

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/admin/stats')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p className="text-gray-500">Loading dashboard...</p>

  const { stats, recentOrders, salesByDay } = data
  const maxRevenue = Math.max(...salesByDay.map((d) => Number(d.revenue)), 1)

  const cards = [
    { label: 'Revenue', value: `$${Number(stats.revenue).toFixed(2)}` },
    { label: 'Orders', value: stats.orderCount },
    { label: 'Products', value: stats.productCount },
    { label: 'Customers', value: stats.userCount },
    { label: 'Low stock', value: stats.lowStockCount },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Sales (last 7 days)</h2>
          {salesByDay.length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {salesByDay.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${Math.max((Number(d.revenue) / maxRevenue) * 100, 4)}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(d.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet</p>
          ) : (
            <ul className="divide-y">
              {recentOrders.map((o) => (
                <li key={o.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      <Link to={`/admin/orders`} className="hover:text-blue-600">
                        Order #{o.id}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-500">{o.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${Number(o.total).toFixed(2)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
