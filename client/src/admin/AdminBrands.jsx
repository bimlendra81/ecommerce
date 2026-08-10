import { useEffect, useState } from 'react'
import client from '../api/adminClient'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const { fieldErrors, validate, clear } = useFormErrors()

  function load() {
    setLoading(true)
    client
      .get('/admin/brands')
      .then(({ data }) => setBrands(data.brands))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load brands'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    if (!validate({ name: [field.required('Name'), field.minLen(1, 'Name'), field.maxLen(100, 'Name')] }, { name })) {
      setSaving(false)
      return
    }
    try {
      if (editing) {
        await client.put(`/admin/brands/${editing.id}`, { name })
      } else {
        await client.post('/admin/brands', { name })
      }
      setName('')
      setEditing(null)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(brand) {
    const active = brand.active ? '0' : '1'
    await client.put(`/admin/brands/${brand.id}`, { name: brand.name, active })
    load()
  }

  async function remove(brand) {
    if (!confirm(`Delete "${brand.name}"? Products under it will lose their brand.`)) return
    await client.delete(`/admin/brands/${brand.id}`)
    load()
  }

  async function restore(brand) {
    await client.post(`/admin/brands/${brand.id}/restore`)
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Brands</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form noValidate onSubmit={save} className="flex gap-2 mb-6 items-start">
        <div className="flex-1">
          <input
            required
            placeholder={editing ? `Editing: ${editing.name}` : 'New brand name'}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clear('name')
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            className="w-full border rounded px-3 py-2"
          />
          <FieldError name="name" errors={fieldErrors} />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setName('')
            }}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="bg-white rounded-lg shadow divide-y">
          {brands.map((b) => (
            <li key={b.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-gray-500">/{b.slug}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {b.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {
                    setEditing(b)
                    setName(b.name)
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button onClick={() => toggleActive(b)} className="text-yellow-600 hover:underline">
                  {b.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => remove(b)} className="text-red-600 hover:underline">
                  Delete
                </button>
                {b.deleted_at && (
                  <button onClick={() => restore(b)} className="text-green-600 hover:underline">
                    Restore
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
