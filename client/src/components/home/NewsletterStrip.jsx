import { useState } from 'react'
import client from '../../api/client'
import { field, useFormErrors } from '../../utils/validation'
import FieldError from '../FieldError'

export default function NewsletterStrip({ variant = 'gradient', eyebrow }) {
  const [status, setStatus] = useState('idle')
  const [email, setEmail] = useState('')
  const { fieldErrors, validate, clear } = useFormErrors()

  const errorClass =
    variant === 'solid' || variant === 'gradient'
      ? 'text-sm font-semibold text-red-200 mt-2'
      : 'text-sm font-medium text-red-600 mt-2'

  async function submit(e) {
    e.preventDefault()
    if (!validate({ email: [field.required('Email'), field.email()] }, { email })) return
    setStatus('loading')
    try {
      await client.post('/newsletter', { email })
      setStatus('done')
      setEmail('')
    } catch (err) {
      setStatus('error')
    }
  }

  const doneMsg =
    status === 'done' ? (
      <p className={variant === 'solid' ? 'text-sm font-semibold text-white' : 'text-sm font-medium text-green-600'}>
        Thanks — you're on the list!
      </p>
    ) : status === 'error' ? (
      <p className={variant === 'solid' ? 'text-sm font-semibold text-white' : 'text-sm font-medium text-red-500'}>
        Couldn't subscribe. Please try again.
      </p>
    ) : null

  if (variant === 'minimal') {
    return (
      <section className="w-full px-6 md:px-10 py-20">
        <div className="max-w-xl mx-auto text-center">
          <p className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">Newsletter</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Join the list</h2>
          <p className="text-gray-500 mt-3">Exclusive deals and new arrivals, delivered weekly.</p>
          {doneMsg ? (
            doneMsg
          ) : (
            <>
              <form noValidate
                className="mt-8 flex items-center gap-3 border-b-2 border-gray-200 focus-within:border-primary transition-colors"
                onSubmit={submit}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clear('email')
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent py-3 placeholder-gray-400 focus:outline-none"
                />
                <button className="text-primary font-semibold text-sm shrink-0 uppercase tracking-wide">
                  {status === 'loading' ? '...' : 'Subscribe'}
                </button>
              </form>
              <FieldError name="email" errors={fieldErrors} className={errorClass} />
            </>
          )}
        </div>
      </section>
    )
  }

  if (variant === 'solid') {
    return (
      <section className="bg-primary text-white">
        <div className="w-full px-4 md:px-8 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-bold tracking-[0.3em] text-white/70 uppercase mb-3">{eyebrow || '04 / Newsletter'}</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Get the good stuff.</h2>
            <p className="text-white/75 mt-3">Exclusive drops, deals and stories. Once a week, never spam.</p>
          </div>
          {doneMsg ? (
            doneMsg
          ) : (
            <>
              <form noValidate className="flex gap-2" onSubmit={submit}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clear('email')
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-full px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none"
                />
                <button className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors">
                  {status === 'loading' ? '...' : 'Subscribe'}
                </button>
              </form>
              <FieldError name="email" errors={fieldErrors} className={errorClass} />
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-accent px-8 py-12 text-center text-white mb-5">
      <h2 className="text-2xl md:text-3xl font-extrabold">Stay in the loop</h2>
      <p className="text-white/85 mt-2">Get exclusive deals and new arrivals straight to your inbox.</p>
      {doneMsg ? (
        <div className="mt-6">{doneMsg}</div>
      ) : (
        <>
          <form noValidate className="mt-6 max-w-md mx-auto flex gap-2" onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clear('email')
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              placeholder="Enter your email"
              className="flex-1 rounded-full px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button className="bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </form>
          <FieldError name="email" errors={fieldErrors} className={errorClass} />
        </>
      )}
    </div>
  )
}
