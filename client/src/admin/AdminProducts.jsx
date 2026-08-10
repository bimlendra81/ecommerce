import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/adminClient'
import { resolveAssetUrl } from '../utils/media'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  function reload() {
    setRefresh((r) => r + 1)
  }

  useEffect(() => {
    setLoading(true)
    client
      .get('/admin/products', { params: { search: search || undefined, page, showDeleted: showDeleted ? '1' : undefined } })
      .then(({ data }) => {
        setProducts(data.products)
        setTotal(data.total)
        setPages(data.pages)
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [search, page, refresh, showDeleted])

  function handleSearch(value) {
    setSearch(value)
    setPage(1)
  }

  async function toggleActive(product) {
    const fd = new FormData()
    fd.append('active', product.active ? '0' : '1')
    await client.put(`/admin/products/${product.id}`, fd)
    reload()
  }

  async function remove(product) {
    if (!confirm(`Delete "${product.name}"?`)) return
    await client.delete(`/admin/products/${product.id}`)
    reload()
  }

  async function restore(product) {
    await client.post(`/admin/products/${product.id}/restore`)
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Product
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-80"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => {
              setShowDeleted(e.target.checked)
              setPage(1)
            }}
          />
          Show deleted (trash)
        </label>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={resolveAssetUrl(p.image)} alt="" className="w-10 h-10 rounded object-cover" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.slug}</p>
                        {(p.media || []).filter((m) => m.type === 'video').length > 0 && (
                          <p className="text-xs text-blue-500">▶ {(p.media || []).filter((m) => m.type === 'video').length} video</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category || '—'}</td>
                  <td className="px-4 py-3">{p.brand || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={p.sale_price != null && p.sale_price !== '' ? 'font-semibold text-red-600' : ''}>
                      ${Number(p.price).toFixed(2)}
                    </span>
                    {p.sale_price != null && p.sale_price !== '' && (
                      <span className="ml-1 text-xs text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                        ON SALE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${showDeleted ? 'bg-red-100 text-red-600' : p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {showDeleted ? 'Deleted' : p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {showDeleted ? (
                      <button onClick={() => restore(p)} className="text-green-600 hover:underline">
                        Restore
                      </button>
                    ) : (
                      <>
                        <Link to={`/admin/products/${p.id}/edit`} className="text-blue-600 hover:underline mr-3">
                          Edit
                        </Link>
                        <button onClick={() => toggleActive(p)} className="text-yellow-600 hover:underline mr-3">
                          {p.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => remove(p)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">{total} product{total === 1 ? '' : 's'}</p>
      {pages > 1 && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
