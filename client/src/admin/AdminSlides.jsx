import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { validateFields, field } from '../utils/validation'
import FieldError from '../components/FieldError'

const emptyForm = {
  title: '',
  subtitle: '',
  link: '',
  sort_order: '0',
  active: '1',
}

export default function AdminSlides() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  function load() {
    setLoading(true)
    client
      .get('/admin/slides')
      .then(({ data }) => setSlides(data.slides))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load slides'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setShowForm(true)
    setFieldErrors({})
  }

  function openEdit(slide) {
    setEditing(slide)
    setForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      link: slide.link || '',
      sort_order: String(slide.sort_order),
      active: String(slide.active),
    })
    setImageFile(null)
    setShowForm(true)
    setFieldErrors({})
  }

  async function save(e) {
    e.preventDefault()
    const { fieldErrors: errors, isValid } = validateFields({
      title: [field.required('Title'), field.maxLen(200, 'Title')],
    }, form)
    const imageErrors = {}
    if (!imageFile && !editing?.image) {
      imageErrors.image = 'An image is required'
    }
    setFieldErrors({ ...errors, ...imageErrors })
    if (!isValid || imageErrors.image) return
    setSaving(true)
    setError('')
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('subtitle', form.subtitle)
    fd.append('link', form.link)
    fd.append('sort_order', form.sort_order || '0')
    fd.append('active', form.active)
    if (imageFile) fd.append('image', imageFile)
    try {
      if (editing) {
        await client.put(`/admin/slides/${editing.id}`, fd)
      } else {
        await client.post('/admin/slides', fd)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save slide')
    } finally {
      setSaving(false)
    }
  }

  async function remove(slide) {
    if (!confirm(`Delete slide "${slide.title || 'untitled'}"?`)) return
    await client.delete(`/admin/slides/${slide.id}`)
    load()
  }

  async function restore(slide) {
    await client.post(`/admin/slides/${slide.id}/restore`)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Home Slides</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Slide
        </button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : slides.length === 0 ? (
        <p className="text-gray-500">No slides yet. Add one to show a banner on the home page.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {slides.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-gray-100 relative">
                <img src={s.image} alt={s.title || ''} className="w-full h-full object-cover" />
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {s.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold">{s.title || 'Untitled'}</p>
                {s.subtitle && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.subtitle}</p>}
                <p className="text-xs text-gray-400 mt-2">Order: {s.sort_order}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(s)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                  {s.deleted_at && (
                    <button onClick={() => restore(s)} className="text-green-600 hover:underline">
                      Restore
                    </button>
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
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Slide' : 'Add Slide'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded p-2"
              />
              <FieldError name="title" errors={fieldErrors} />
              <textarea
                placeholder="Subtitle"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full border rounded p-2"
                rows={2}
              />
              <input
                placeholder="Link (e.g. /search?category=electronics)"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full border rounded p-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Order"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className="border rounded p-2"
                />
                <select
                  value={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.value })}
                  className="border rounded p-2"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500">Image (required)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  className="w-full border rounded p-2"
                />
                <FieldError name="image" errors={fieldErrors} />
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
