import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import client from '../api/adminClient'
import RichTextEditor from '../components/RichTextEditor'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'
import { resolveAssetUrl } from '../utils/media'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category_id: '',
  brand_id: '',
  active: '1',
  return_days: '',
  weight_grams: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  sale_price: '',
  sale_ends_at: '',
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

const labelClass = 'block text-sm font-semibold text-gray-700 mb-1'

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editingId = id ? parseInt(id, 10) : null
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [videoFiles, setVideoFiles] = useState([])
  const [imageUrls, setImageUrls] = useState('')
  const [videoUrls, setVideoUrls] = useState('')
  const [mediaList, setMediaList] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(editingId))
  const { fieldErrors, validate, clear } = useFormErrors()

  useEffect(() => {
    client.get('/admin/categories').then(({ data }) => setCategories(data.categories)).catch(() => {})
    client.get('/admin/brands').then(({ data }) => setBrands(data.brands)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!editingId) return
    client
      .get(`/admin/products/${editingId}`)
      .then(({ data }) => {
        const p = data.product
        setForm({
          name: p.name,
          description: p.description || '',
          price: p.price,
          stock: p.stock,
          category_id: p.category_id || '',
          brand_id: p.brand_id || '',
          active: String(p.active),
          return_days: p.return_days != null ? String(p.return_days) : '',
          weight_grams: p.weight_grams != null ? String(p.weight_grams) : '',
          length_cm: p.length_cm != null ? String(p.length_cm) : '',
          width_cm: p.width_cm != null ? String(p.width_cm) : '',
          height_cm: p.height_cm != null ? String(p.height_cm) : '',
          sale_price: p.sale_price != null && p.sale_price !== '' ? String(p.sale_price) : '',
          sale_ends_at: p.sale_ends_at ? p.sale_ends_at.slice(0, 16) : '',
        })
        setMediaList((p.media || []).map((m) => ({ type: m.type, url: m.url })))
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load product'))
      .finally(() => setLoading(false))
  }, [editingId])

  function mediaPayload() {
    const urls = []
    for (const url of imageUrls.split('\n')) {
      const u = url.trim()
      if (u) urls.push({ type: 'image', url: u })
    }
    for (const url of videoUrls.split('\n')) {
      const u = url.trim()
      if (u) urls.push({ type: 'video', url: u })
    }
    return JSON.stringify([...mediaList, ...urls])
  }

  function urlList(label) {
    return (value) => {
      if (value == null || String(value).trim() === '') return null
      const bad = String(value)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .find((u) => !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=#]*)?$/i.test(u))
      return bad ? `${label} is not a valid URL: ${bad}` : null
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const rules = {
      name: [field.required('Product name'), field.minLen(1, 'Product name'), field.maxLen(255, 'Product name')],
      price: [field.required('Price'), field.number('Price'), field.min(0, 'Price')],
      stock: [field.int('Stock'), field.min(0, 'Stock')],
      sale_price: [field.number('Sale price'), field.min(0, 'Sale price')],
      return_days: [field.int('Return days'), field.min(0, 'Return days')],
      weight_grams: [field.number('Weight'), field.min(0, 'Weight')],
      length_cm: [field.number('Length'), field.min(0, 'Length')],
      width_cm: [field.number('Width'), field.min(0, 'Width')],
      height_cm: [field.number('Height'), field.min(0, 'Height')],
      sale_ends_at: [
        (v) => {
          if (!v) return null
          return new Date(v) > new Date() ? null : 'Sale end must be in the future'
        },
      ],
      imageUrls: [urlList('Image URL')],
      videoUrls: [urlList('Video URL')],
    }
    if (!validate(rules, { ...form, imageUrls, videoUrls })) {
      setSaving(false)
      return
    }
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('price', form.price)
    fd.append('stock', form.stock)
    fd.append('category_id', form.category_id || '')
    fd.append('brand_id', form.brand_id || '')
    fd.append('active', form.active)
    fd.append('return_days', form.return_days || '')
    fd.append('weight_grams', form.weight_grams || '')
    fd.append('length_cm', form.length_cm || '')
    fd.append('width_cm', form.width_cm || '')
    fd.append('height_cm', form.height_cm || '')
    fd.append('sale_price', form.sale_price || '')
    fd.append('sale_ends_at', form.sale_ends_at || '')
    fd.append('media', mediaPayload())
    if (imageFile) fd.append('image', imageFile)
    for (const f of imageFiles) fd.append('images', f)
    for (const f of videoFiles) fd.append('videos', f)

    try {
      if (editingId) {
        await client.put(`/admin/products/${editingId}`, fd)
      } else {
        await client.post('/admin/products', fd)
      }
      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Loading product...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/admin/products" className="text-sm text-blue-600 hover:underline">
            ← Back to products
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            {editingId ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {editingId ? `Updating product #${editingId}` : 'Create a new product in your store'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form noValidate onSubmit={save}>
        {/* Basic info */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Basic information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Name and description shown to customers</p>
          </header>
          <div className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Product name *</label>
              <input
                required
                placeholder="e.g. Wireless Headphones"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value })
                  clear('name')
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                className={inputClass}
              />
              <FieldError name="name" errors={fieldErrors} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Describe the product, features, materials..."
              />
            </div>
          </div>
        </section>

        {/* Pricing & inventory */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Pricing & inventory</h2>
            <p className="text-xs text-gray-500 mt-0.5">Price, stock, return window and availability</p>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Price ($) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: e.target.value })
                  clear('price')
                }}
                aria-invalid={Boolean(fieldErrors.price)}
                className={inputClass}
              />
              <FieldError name="price" errors={fieldErrors} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.stock}
                onChange={(e) => {
                  setForm({ ...form, stock: e.target.value })
                  clear('stock')
                }}
                aria-invalid={Boolean(fieldErrors.stock)}
                className={inputClass}
              />
              <FieldError name="stock" errors={fieldErrors} />
            </div>
            <div>
              <label className={labelClass}>Sale price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Blank = no sale"
                value={form.sale_price}
                onChange={(e) => {
                  setForm({ ...form, sale_price: e.target.value })
                  clear('sale_price')
                }}
                aria-invalid={Boolean(fieldErrors.sale_price)}
                className={inputClass}
              />
              <FieldError name="sale_price" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                If set, this is the price customers pay. Original price shows as a strike-through.
              </p>
            </div>
            <div>
              <label className={labelClass}>Sale ends</label>
              <input
                type="datetime-local"
                value={form.sale_ends_at}
                onChange={(e) => {
                  setForm({ ...form, sale_ends_at: e.target.value })
                  clear('sale_ends_at')
                }}
                aria-invalid={Boolean(fieldErrors.sale_ends_at)}
                className={inputClass}
              />
              <FieldError name="sale_ends_at" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Leave blank for an open-ended sale.
              </p>
            </div>
            <div>
              <label className={labelClass}>Return days</label>
              <input
                type="number"
                min="0"
                placeholder="Blank = store default"
                value={form.return_days}
                onChange={(e) => {
                  setForm({ ...form, return_days: e.target.value })
                  clear('return_days')
                }}
                aria-invalid={Boolean(fieldErrors.return_days)}
                className={inputClass}
              />
              <FieldError name="return_days" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use the store-wide default from Settings.
              </p>
            </div>
            <div>
              <label className={labelClass}>Weight (grams)</label>
              <input
                type="number"
                min="0"
                placeholder="Blank = store default"
                value={form.weight_grams}
                onChange={(e) => {
                  setForm({ ...form, weight_grams: e.target.value })
                  clear('weight_grams')
                }}
                aria-invalid={Boolean(fieldErrors.weight_grams)}
                className={inputClass}
              />
              <FieldError name="weight_grams" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                Used for carrier shipping rates. Blank uses the store default from Admin {'>'} Shipping.
              </p>
            </div>
            <div>
              <label className={labelClass}>Length (cm)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.length_cm}
                onChange={(e) => {
                  setForm({ ...form, length_cm: e.target.value })
                  clear('length_cm')
                }}
                aria-invalid={Boolean(fieldErrors.length_cm)}
                className={inputClass}
              />
              <FieldError name="length_cm" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                Used to pick the right box for live carrier rates.
              </p>
            </div>
            <div>
              <label className={labelClass}>Width (cm)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.width_cm}
                onChange={(e) => {
                  setForm({ ...form, width_cm: e.target.value })
                  clear('width_cm')
                }}
                aria-invalid={Boolean(fieldErrors.width_cm)}
                className={inputClass}
              />
              <FieldError name="width_cm" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                Used to pick the right box for live carrier rates.
              </p>
            </div>
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.height_cm}
                onChange={(e) => {
                  setForm({ ...form, height_cm: e.target.value })
                  clear('height_cm')
                }}
                aria-invalid={Boolean(fieldErrors.height_cm)}
                className={inputClass}
              />
              <FieldError name="height_cm" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">
                Used to pick the right box for live carrier rates.
              </p>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.value })}
                className={inputClass}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {/* Category & brand */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Organization</h2>
            <p className="text-xs text-gray-500 mt-0.5">Group this product by category and brand</p>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className={inputClass}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                className={inputClass}
              >
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Product media</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Images and videos shown in the gallery (first image becomes the thumbnail)
            </p>
          </header>
          <div className="p-6 space-y-5">
            {mediaList.length > 0 && (
              <div>
                <label className={labelClass}>
                  Current media ({mediaList.length}) — click × to remove
                </label>
                <ul className="flex flex-wrap gap-3 mt-2">
                  {mediaList.map((m, i) => (
                    <li key={i} className="relative">
                      {m.type === 'video' ? (
                        <span className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xl border">
                          ▶
                        </span>
                      ) : (
                        <img
                          src={resolveAssetUrl(m.url)}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover border"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaList(mediaList.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm leading-none hover:bg-red-700 shadow"
                        aria-label="Remove media"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Primary image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  className={`${inputClass} file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-1 file:text-xs`}
                />
                {imageFile && (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="mt-2 w-20 h-20 rounded-lg object-cover border"
                  />
                )}
              </div>
              <div>
                <label className={labelClass}>Gallery images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles([...e.target.files])}
                  className={`${inputClass} file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-1 file:text-xs`}
                />
                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageFiles.map((f, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(f)}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Videos</label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => setVideoFiles([...e.target.files])}
                  className={`${inputClass} file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:px-3 file:py-1 file:text-xs`}
                />
                {videoFiles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {videoFiles.length} video{videoFiles.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Image URLs (one per line)</label>
                <textarea
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrls}
                  onChange={(e) => {
                    setImageUrls(e.target.value)
                    clear('imageUrls')
                  }}
                  aria-invalid={Boolean(fieldErrors.imageUrls)}
                  className={`${inputClass} min-h-20`}
                  rows={3}
                />
                <FieldError name="imageUrls" errors={fieldErrors} />
              </div>
              <div>
                <label className={labelClass}>Video URLs (one per line)</label>
                <textarea
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrls}
                  onChange={(e) => {
                    setVideoUrls(e.target.value)
                    clear('videoUrls')
                  }}
                  aria-invalid={Boolean(fieldErrors.videoUrls)}
                  className={`${inputClass} min-h-20`}
                  rows={3}
                />
                <FieldError name="videoUrls" errors={fieldErrors} />
              </div>
            </div>
          </div>
        </section>

        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-6 py-3 border border-gray-300 bg-white rounded-full shadow-lg hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
          >
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  )
}
