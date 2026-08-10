import { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settingsSlice'
import client from '../api/client'
import { field, useFormErrors } from '../utils/validation'
import FieldError from '../components/FieldError'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'

export default function Contact() {
  const settings = useSelector(selectSettings)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { fieldErrors, validate, clear } = useFormErrors()

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    clear(key)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const rules = {
      name: [field.required('Name'), field.minLen(2, 'Name'), field.maxLen(100, 'Name')],
      email: [field.required('Email'), field.email('Email')],
      message: [field.required('Message'), field.minLen(10, 'Message'), field.maxLen(2000, 'Message')],
    }
    if (!validate(rules, form)) return
    setSending(true)
    try {
      const { data } = await client.post('/contact', form)
      setSuccess(data.message)
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-600 mb-8">
        Have a question about an order, a product, or our services? We're here to help.
      </p>

      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <div className="space-y-4 text-gray-700">
          <div>
            <h2 className="font-semibold">Email</h2>
            <a href={`mailto:${settings.contact_email}`} className="text-primary hover:underline">
              {settings.contact_email}
            </a>
          </div>
          <div>
            <h2 className="font-semibold">Phone</h2>
            <a href={`tel:${settings.contact_phone}`} className="text-primary hover:underline">
              {settings.contact_phone}
            </a>
          </div>
          <div>
            <h2 className="font-semibold">Support hours</h2>
            <p>Monday to Friday, 9:00 AM – 6:00 PM</p>
          </div>
        </div>
      </div>

      <form noValidate onSubmit={submit} className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold">Send us a message</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-3 rounded">{success}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
          <FieldError name="name" errors={fieldErrors} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
          <FieldError name="email" errors={fieldErrors} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            rows="4"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            maxLength={2000}
            className={inputClass}
            placeholder="How can we help?"
          ></textarea>
          <FieldError name="message" errors={fieldErrors} />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </section>
  )
}
