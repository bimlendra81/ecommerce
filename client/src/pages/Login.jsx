import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginStart, loginSuccess, loginFailure, selectUser } from '../features/authSlice'
import client from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isLoading = useSelector((s) => s.auth.isLoading)
  const [error, setError] = useState(null)
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
      dispatch(loginSuccess(data))
      navigate('/')
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Login failed'))
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  if (user) {
    return (
      <div className="text-center py-16">
        <p className="text-lg">Signed in as {user.name}</p>
        <Link to="/" className="text-primary underline">Go to shop</Link>
      </div>
    )
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
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
          className="w-full bg-primary text-white rounded p-3 hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        No account?{' '}
        <Link to="/register" className="text-primary underline">Register</Link>
      </p>
      <p className="mt-1 text-center text-sm">
        <Link to="/forgot-password" className="text-gray-500 hover:text-primary underline">Forgot password?</Link>
      </p>
    </section>
  )
}
