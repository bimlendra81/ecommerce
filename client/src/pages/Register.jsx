import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginStart, loginSuccess, loginFailure } from '../features/authSlice'
import client from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isLoading = useSelector((s) => s.auth.isLoading)
  const { fieldErrors, validate, clear } = useFormErrors()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const rules = {
      name: [field.required('Name'), field.minLen(2, 'Name'), field.maxLen(100, 'Name')],
      email: [field.required('Email'), field.email()],
      phone: [field.phone('Phone')],
      password: [field.required('Password'), field.minLen(6, 'Password')],
      confirm: [field.required('Confirm password'), field.matches('password', 'Confirm password')],
    }
    if (!validate(rules, { name, email, phone, password, confirm })) return
    dispatch(loginStart())
    try {
      const { data } = await client.post('/auth/register', { name, email, phone, password })
      dispatch(loginSuccess(data))
      navigate('/')
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Registration failed'))
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
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
        <input
          type="password"
          placeholder="Password (min 6 chars)"
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
          placeholder="Confirm password"
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
          disabled={isLoading}
          className="w-full bg-primary text-white rounded p-3 hover:bg-primary-dark disabled:opacity-50"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary underline">Login</Link>
      </p>
    </section>
  )
}
