import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { Link } from 'react-router-dom'

const tabs = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'reported', label: 'Reported' },
]

const statusStyles = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  reported: 'bg-red-100 text-red-700',
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(0)

  function load() {
    setLoading(true)
    client
      .get('/admin/reviews', { params: { filter: filter || undefined, search: search || undefined } })
      .then(({ data }) => setReviews(data.reviews))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reviews'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter, search])

  async function moderate(review, approved) {
    setBusy(review.id)
    setError('')
    try {
      await client.patch(`/admin/reviews/${review.id}`, { approved })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed')
    } finally {
      setBusy(0)
    }
  }

  function statusOf(r) {
    if (r.reported) return 'reported'
    if (r.approved) return 'approved'
    return 'pending'
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review moderation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Approve or reject customer reviews before they appear on the storefront
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex border rounded-lg overflow-hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 text-sm font-medium ${filter === t.key ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search product, user or text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">No reviews found.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-amber-500 font-semibold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="font-medium">{r.user_name}</span>
                <span className="text-gray-400">{r.user_email}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[statusOf(r)]}`}>
                  {statusOf(r)}
                </span>
                {r.reported_at && (
                  <span className="text-xs text-red-500">Reported {new Date(r.reported_at).toLocaleString()}</span>
                )}
              </div>
              {r.title && <p className="font-semibold text-gray-800 mt-2">{r.title}</p>}
              {r.comment && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <Link to={`/product/${r.product_slug}`} target="_blank" className="text-blue-600 hover:underline">
                  {r.product_name}
                </Link>
                <span className="text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                <span className="flex-1" />
                {!r.approved && (
                  <button
                    onClick={() => moderate(r, 1)}
                    disabled={busy === r.id}
                    className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {r.approved && (
                  <button
                    onClick={() => moderate(r, 0)}
                    disabled={busy === r.id}
                    className="px-3 py-1.5 rounded border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
