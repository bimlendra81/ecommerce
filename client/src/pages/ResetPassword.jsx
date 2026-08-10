import { useState } from 'react'
import client from '../api/client'
import { Link, useSearchParams } from 'react-router-dom'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { fieldErrors, validate, clear } = useFormErrors()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    const rules = {
      password: [field.required('Password'), field.minLen(6, 'Password')],
      confirm: [field.required('Confirm password'), field.matches('password', 'Confirm password')],
    }
    if (!validate(rules, { password, confirm })) return
    setLoading(true)
    try {
      const { data } = await client.post('/auth/reset-password', { token, password })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">This reset link is invalid or missing.</p>
        <Link to="/forgot-password" className="text-primary underline">Request a new link</Link>
      </section>
    )
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Set a new password</h1>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
      {message && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          <p>{message}</p>
          <Link to="/login" className="underline">Go to login</Link>
        </div>
      )}
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password"
          required
          minLength={6}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            clear('password')
            if (confirm) clear('confirm')
          }}
          aria-invalid={Boolean(fieldErrors.password)}
          className="w-full border rounded p-3"
        />
        <FieldError name="password" errors={fieldErrors} />
        <input
          type="password"
          placeholder="Confirm new password"
          required
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            clear('confirm')
          }}
          aria-invalid={Boolean(fieldErrors.confirm)}
          className="w-full border rounded p-3"
        />
        <FieldError name="confirm" errors={fieldErrors} />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded p-3 hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </section>
  )
}
