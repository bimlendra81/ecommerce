import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, selectUser } from '../features/authSlice'
import client from '../api/client'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function Profile() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(user?.avatar || '')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { fieldErrors, validate, clear } = useFormErrors()

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const rules = {
      name: [field.required('Name'), field.minLen(2, 'Name'), field.maxLen(100, 'Name')],
      phone: [field.phone('Phone')],
    }
    if (!validate(rules, { name, phone })) return
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('phone', phone)
      if (avatar) formData.append('avatar', avatar)
      const { data } = await client.put('/auth/profile', formData)
      dispatch(setUser(data.user))
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">My Profile</h1>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 p-3 rounded mb-4">Profile updated</p>}
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <span className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
              {name.charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Avatar</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>
        <input
          type="text"
          placeholder="Full name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            clear('name')
          }}
          aria-invalid={Boolean(fieldErrors.name)}
          className="w-full border rounded p-3"
        />
        <FieldError name="name" errors={fieldErrors} />
        <input
          type="email"
          placeholder="Email"
          disabled
          value={user?.email || ''}
          className="w-full border rounded p-3 bg-gray-100 text-gray-500"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            clear('phone')
          }}
          aria-invalid={Boolean(fieldErrors.phone)}
          className="w-full border rounded p-3"
        />
        <FieldError name="phone" errors={fieldErrors} />
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-primary text-white rounded p-3 hover:bg-primary-dark disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}
