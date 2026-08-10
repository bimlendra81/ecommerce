import { useState } from 'react'
import client from '../api/client'
import { Link } from 'react-router-dom'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { fieldErrors, validate, clear } = useFormErrors()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!validate({ email: [field.required('Email'), field.email()] }, { email })) return
    setLoading(true)
    try {
      const { data } = await client.post('/auth/forgot-password', { email })
      setMessage(data.message)
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Forgot password</h1>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
      {message && <p className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</p>}
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            clear('email')
          }}
          aria-invalid={Boolean(fieldErrors.email)}
          className="w-full border rounded p-3"
        />
        <FieldError name="email" errors={fieldErrors} />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded p-3 hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600 text-sm">
        Remembered it?{' '}
        <Link to="/login" className="text-primary underline">Back to login</Link>
      </p>
    </section>
  )
}
