import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/adminClient'
import { resolveAssetUrl } from '../utils/media'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  in_transit: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  out_for_delivery: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  returned: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDateLabel(dayStr) {
  if (!dayStr) return ''
  try {
    // Expecting YYYY-MM-DD or ISO string
    const cleanStr = String(dayStr).split('T')[0]
    const parts = cleanStr.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const dateObj = new Date(year, month, day)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      }
    }
    const d = new Date(dayStr)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    }
  } catch (err) {
    // fallback string return
  }
  return String(dayStr)
}

function formatDayName(dayStr) {
  if (!dayStr) return ''
  try {
    const cleanStr = String(dayStr).split('T')[0]
    const parts = cleanStr.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const dateObj = new Date(year, month, day)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString(undefined, { weekday: 'short' })
      }
    }
  } catch (err) {
    // fallback
  }
  return String(dayStr)
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [hoveredBar, setHoveredBar] = useState(null)

  useEffect(() => {
    client
      .get('/admin/stats')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard statistics'))
  }, [])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Loading dashboard statistics...</span>
      </div>
    )
  }

  const { stats, recentOrders = [], salesByDay = [], topProducts = [], statusCounts = [] } = data
  const maxRevenue = Math.max(...salesByDay.map((d) => Number(d.revenue) || 0), 1)

  const cards = [
    {
      label: 'Total Revenue',
      value: `$${(Number(stats.revenue) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'All-time paid revenue',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Total Orders',
      value: (stats.orderCount || 0).toLocaleString(),
      sub: `${stats.pendingOrderCount || 0} pending processing`,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      label: 'Avg Order Value',
      value: `$${(Number(stats.avgOrderValue) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Per completed order',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'Total Products',
      value: (stats.productCount || 0).toLocaleString(),
      sub: `${stats.lowStockCount || 0} low stock alert`,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      label: 'Customers',
      value: (stats.userCount || 0).toLocaleString(),
      sub: 'Registered accounts',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
  ]

  const total7DayRevenue = salesByDay.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0)
  const total7DayOrders = salesByDay.reduce((sum, d) => sum + (Number(d.orders) || 0), 0)

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time performance stats and recent activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.label}</p>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales (last 7 days) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Sales (last 7 days)</h2>
                <p className="text-xs text-gray-500">Daily revenue and total order volume</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">${total7DayRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{total7DayOrders} orders in 7 days</p>
              </div>
            </div>

            {/* Interactive Bar Chart */}
            <div className="relative pt-6 pb-2">
              <div className="flex items-end gap-3 h-52">
                {salesByDay.map((d, index) => {
                  const rev = Number(d.revenue) || 0
                  const heightPercent = Math.max((rev / maxRevenue) * 100, 6)
                  const isHovered = hoveredBar === index

                  return (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center relative group"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-14 z-10 bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 shadow-lg whitespace-nowrap pointer-events-none">
                          <p className="font-semibold text-center">{formatDateLabel(d.day)}</p>
                          <p className="text-emerald-400 text-center">${rev.toFixed(2)} ({d.orders} orders)</p>
                        </div>
                      )}

                      {/* Bar */}
                      <div className="w-full bg-gray-100 rounded-t-lg h-full flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isHovered ? 'bg-blue-700 shadow-md' : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span className="text-xs font-medium text-gray-600 mt-2">
                        {formatDayName(d.day)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Showing continuous 7-day revenue stream</span>
            <Link to="/admin/orders" className="text-blue-600 hover:underline font-semibold">
              View all orders &rarr;
            </Link>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Order Status</h2>
            <p className="text-xs text-gray-500 mb-4">Current order fulfillment distribution</p>

            {statusCounts.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No orders recorded</p>
            ) : (
              <div className="space-y-3">
                {statusCounts.map((s) => {
                  const badgeStyle = statusColors[s.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                  return (
                    <div key={s.status} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50 bg-gray-50/50">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${badgeStyle}`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{s.count} orders</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 text-right">
            <Link to="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline">
              Manage status &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Top Selling Products</h2>
              <p className="text-xs text-gray-500">Best performers by units sold</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No product sales yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={resolveAssetUrl(p.image) || 'https://via.placeholder.com/40'}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{p.total_sold} sold</p>
                    <p className="text-xs text-emerald-600 font-medium">${Number(p.total_revenue).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
              <p className="text-xs text-gray-500">Latest customer purchases</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline">
              View all orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No orders recorded yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((o) => {
                const badgeStyle = statusColors[o.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                return (
                  <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        <Link to={`/admin/orders`} className="hover:text-blue-600">
                          Order #{o.id}
                        </Link>
                      </p>
                      <p className="text-xs text-gray-500">{o.user_name || o.user_email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">${Number(o.total).toFixed(2)}</p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${badgeStyle}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}