import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  selectAddresses,
  selectAddressesLoading,
} from '../features/shippingSlice'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'

const emptyForm = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'IN',
  is_default: false,
}

export default function Addresses() {
  const dispatch = useDispatch()
  const addresses = useSelector(selectAddresses)
  const loading = useSelector(selectAddressesLoading)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const { fieldErrors, validate, clear, reset } = useFormErrors()

  useEffect(() => {
    dispatch(fetchAddresses())
  }, [dispatch])

  function startEdit(address) {
    setEditing(address)
    setForm({
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: Boolean(address.is_default),
    })
    setError('')
    reset()
  }

  function startNew() {
    setEditing('new')
    setForm(emptyForm)
    setError('')
    reset()
  }

  function cancel() {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    reset()
  }

  async function save() {
    setError('')
    const addressRules = {
      full_name: [field.required('Full name'), field.minLen(2, 'Full name'), field.maxLen(100, 'Full name')],
      phone: [field.required('Phone'), field.maxLen(30, 'Phone')],
      address_line1: [field.required('Address line 1'), field.minLen(2, 'Address line 1'), field.maxLen(255, 'Address line 1')],
      address_line2: [field.maxLen(255, 'Address line 2')],
      city: [field.required('City'), field.maxLen(100, 'City')],
      state: [field.required('State'), field.maxLen(100, 'State')],
      postal_code: [field.required('Postal code'), field.minLen(2, 'Postal code'), field.maxLen(20, 'Postal code')],
      country: [field.required('Country'), field.minLen(2, 'Country'), field.maxLen(100, 'Country')],
    }
    if (!validate(addressRules, form)) return
    try {
      if (editing === 'new') {
        await dispatch(createAddress(form)).unwrap()
      } else {
        await dispatch(updateAddress({ id: editing.id, ...form })).unwrap()
      }
      cancel()
    } catch (err) {
      setError(err)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this address?')) return
    await dispatch(deleteAddress(id)).unwrap()
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Saved addresses</h1>
          <p className="text-gray-500 text-sm mt-1">Reuse these during checkout</p>
        </div>
        {editing !== 'new' && (
          <button onClick={startNew} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-sm font-medium">
            + Add address
          </button>
        )}
      </div>

      {error && <p className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</p>}

      {(editing === 'new' || editing) && (
        <div className="bg-white border rounded-lg p-5 mb-6 space-y-3">
          <h2 className="font-semibold">{editing === 'new' ? 'New address' : 'Edit address'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input className={inputClass} placeholder="Full name" value={form.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); clear('full_name') }} />
              <FieldError name="full_name" errors={fieldErrors} />
            </div>
            <div>
              <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); clear('phone') }} />
              <FieldError name="phone" errors={fieldErrors} />
            </div>
          </div>
          <div>
            <input className={inputClass} placeholder="Address line 1" value={form.address_line1} onChange={(e) => { setForm({ ...form, address_line1: e.target.value }); clear('address_line1') }} />
            <FieldError name="address_line1" errors={fieldErrors} />
          </div>
          <div>
            <input className={inputClass} placeholder="Address line 2 (optional)" value={form.address_line2} onChange={(e) => { setForm({ ...form, address_line2: e.target.value }); clear('address_line2') }} />
            <FieldError name="address_line2" errors={fieldErrors} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input className={inputClass} placeholder="City" value={form.city} onChange={(e) => { setForm({ ...form, city: e.target.value }); clear('city') }} />
              <FieldError name="city" errors={fieldErrors} />
            </div>
            <div>
              <input className={inputClass} placeholder="State" value={form.state} onChange={(e) => { setForm({ ...form, state: e.target.value }); clear('state') }} />
              <FieldError name="state" errors={fieldErrors} />
            </div>
            <div>
              <input className={inputClass} placeholder="Postal code" value={form.postal_code} onChange={(e) => { setForm({ ...form, postal_code: e.target.value }); clear('postal_code') }} />
              <FieldError name="postal_code" errors={fieldErrors} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <input className={inputClass} placeholder="Country" value={form.country} onChange={(e) => { setForm({ ...form, country: e.target.value }); clear('country') }} />
              <FieldError name="country" errors={fieldErrors} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="accent-primary" />
              Set as default
            </label>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={save} className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark text-sm font-medium">Save</button>
            <button onClick={cancel} className="border border-gray-300 px-5 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading addresses...</p>
      ) : addresses.length === 0 && editing !== 'new' ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <p className="text-gray-600 mb-4">No saved addresses yet</p>
          <Link to="/checkout" className="text-primary underline text-sm">Go to checkout</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="bg-white border rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {a.full_name}
                    {a.is_default ? <span className="ml-2 text-xs text-green-600">Default</span> : null}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}</p>
                  <p className="text-gray-600 text-sm">{a.city}, {a.state} {a.postal_code}</p>
                  <p className="text-gray-500 text-sm">{a.country} · {a.phone}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => startEdit(a)} className="text-primary hover:underline text-sm">Edit</button>
                  <button onClick={() => remove(a.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
