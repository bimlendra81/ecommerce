import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../features/adminSlice'
import client from '../api/client'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector((s) => s.admin.isLoading)
  const { fieldErrors, validate, clear } = useFormErrors()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const rules = {
      email: [field.required('Email'), field.email()],
      password: [field.required('Password'), field.minLen(6, 'Password')],
    }
    if (!validate(rules, { email, password })) return
    dispatch(loginStart())
    try {
      const { data } = await client.post('/auth/login', { email, password })
      if (data.user.role !== 'admin') {
        dispatch(loginFailure('Admin access required'))
        setError('This account is not an admin')
        return
      }
      dispatch(loginSuccess(data))
      navigate('/admin')
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Login failed'))
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Sign in to manage your store</p>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin email"
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
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clear('password')
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            className="w-full border rounded p-3"
          />
          <FieldError name="password" errors={fieldErrors} />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white rounded p-3 hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/" className="text-blue-600 underline">← Back to shop</Link>
        </p>
      </div>
    </section>
  )
}
