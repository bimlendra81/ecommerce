import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

const emptyForm = { name: '', image: '', featured: false, featured_order: 0 }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const { fieldErrors, validate, clear } = useFormErrors()

  function load() {
    setLoading(true)
    client
      .get('/admin/categories', { params: { showDeleted: showDeleted ? '1' : undefined } })
      .then(({ data }) => setCategories(data.categories))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [showDeleted])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setShowForm(true)
  }

  function openEdit(category) {
    setEditing(category)
    setForm({
      name: category.name,
      image: category.image || '',
      featured: !!category.featured,
      featured_order: category.featured_order || 0,
    })
    setImageFile(null)
    setShowForm(true)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const rules = {
      name: [field.required('Name'), field.minLen(1, 'Name'), field.maxLen(100, 'Name')],
      featured_order: [field.int('Featured order'), field.min(0, 'Featured order')],
    }
    if (!validate(rules, { name: form.name, featured_order: form.featured_order })) {
      setSaving(false)
      return
    }
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('featured', form.featured ? '1' : '0')
    fd.append('featured_order', form.featured_order || '0')
    if (imageFile) fd.append('image', imageFile)
    else if (form.image) fd.append('image', form.image)
    try {
      if (editing) {
        await client.put(`/admin/categories/${editing.id}`, fd)
      } else {
        await client.post('/admin/categories', fd)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function remove(category) {
    if (!confirm(`Delete "${category.name}"? Products in it will lose their category.`)) return
    await client.delete(`/admin/categories/${category.id}`)
    load()
  }

  async function restore(category) {
    await client.post(`/admin/categories/${category.id}/restore`)
    load()
  }

  async function toggleFeatured(category) {
    const fd = new FormData()
    fd.append('featured', category.featured ? '0' : '1')
    try {
      await client.put(`/admin/categories/${category.id}/feature`, fd)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update featured status')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organize products with named, image-backed groups</p>
        </div>
        {!showDeleted && (
          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Category
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Show deleted (trash)
        </label>
        <span className="text-sm text-gray-500">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</span>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">No categor{showDeleted ? 'ies in trash' : 'ies yet'}.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-36 bg-gray-100 relative">
                <img
                  src={c.image || 'https://placehold.co/600x400?text=No+Image'}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
                {showDeleted && (
                  <span className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Deleted
                  </span>
                )}
                {!showDeleted && c.featured === 1 && (
                  <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-xs font-semibold">
                    ★ Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">/{c.slug} · {c.product_count} products</p>
                <div className="mt-3 flex gap-3 text-sm">
                  {showDeleted ? (
                    <button onClick={() => restore(c)} className="text-green-600 hover:underline">
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleFeatured(c)}
                        className={`hover:underline ${c.featured === 1 ? 'text-amber-600' : 'text-gray-600'}`}
                        title={c.featured === 1 ? 'Unmark featured' : 'Mark featured'}
                      >
                        {c.featured === 1 ? '★ Featured' : '☆ Featured'}
                      </button>
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => remove(c)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20" onClick={() => setShowForm(false)}>
          <form noValidate
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
          >
            <h2 className="text-xl font-bold mb-4">{editing ? `Edit: ${editing.name}` : 'Add Category'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  required
                  placeholder="e.g. Electronics"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value })
                    clear('name')
                  }}
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <FieldError name="name" errors={fieldErrors} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Image</label>
                {(form.image || imageFile) && (
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : form.image}
                    alt="Category preview"
                    className="h-24 w-full object-cover rounded-lg border mb-2"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 border rounded-lg px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured on home
                </label>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Featured order</label>
                  <input
                    type="number"
                    min="0"
                    value={form.featured_order}
                    onChange={(e) => {
                      setForm({ ...form, featured_order: e.target.value })
                      clear('featured_order')
                    }}
                    aria-invalid={Boolean(fieldErrors.featured_order)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <FieldError name="featured_order" errors={fieldErrors} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
