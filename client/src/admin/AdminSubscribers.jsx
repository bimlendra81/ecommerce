import { useEffect, useState } from 'react'
import client from '../api/adminClient'

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  function load() {
    setLoading(true)
    client
      .get('/admin/subscribers', { params: { search: search || undefined, showInactive: showInactive ? '1' : undefined } })
      .then(({ data }) => setSubscribers(data.subscribers))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load subscribers'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, showInactive])

  async function remove(s) {
    if (!confirm(`Delete ${s.email}?`)) return
    try {
      await client.delete(`/admin/subscribers/${s.id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subscriber')
    }
  }

  async function exportCsv() {
    const rows = subscribers.map((s) => [s.email, s.active ? 'active' : 'inactive', s.created_at])
    const csv = ['email,status,created_at', ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Newsletter subscribers</h1>
          <p className="text-sm text-gray-500 mt-0.5">People who signed up via the newsletter form</p>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 px-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : subscribers.length === 0 ? (
        <p className="text-gray-500">No subscribers found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
