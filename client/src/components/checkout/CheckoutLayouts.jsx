import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import MediaSlider from '../MediaSlider'
import FieldError from '../FieldError'
import { loadRazorpayScript } from '../../utils/razorpay'

const INPUT_CLASSES = {
  marketplace:
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary',
  minimal:
    'w-full bg-transparent border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-gray-900',
  editorial:
    'w-full border border-gray-900 px-3 py-2 text-sm font-medium focus:outline-none focus:bg-gray-50',
}

const CARD_SELECTED = {
  marketplace: 'border-primary ring-2 ring-primary-soft',
  minimal: 'border-gray-900',
  editorial: 'border border-gray-300 shadow-[0_6px_24px_-8px_rgba(0,0,0,0.25)]',
}

const CARD_IDLE = {
  marketplace: 'border-gray-200 hover:border-gray-300',
  minimal: 'border-gray-200 hover:border-gray-900',
  editorial: 'border border-gray-200 hover:border-gray-300',
}

const RADIO_ACCENT = {
  marketplace: 'accent-primary',
  minimal: 'accent-gray-900',
  editorial: 'accent-black',
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currency || 'USD' }).format(Number(amount) || 0)
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`
  }
}

function CheckoutItemRow({ item, variant }) {
  const nameCls =
    variant === 'marketplace' ? 'font-medium' : variant === 'minimal' ? 'font-semibold' : 'font-bold'
  const priceCls =
    variant === 'marketplace'
      ? 'font-semibold w-20 text-right'
      : variant === 'minimal'
        ? 'font-semibold w-20 text-right'
        : 'font-black w-20 text-right'
  const thumb =
    variant === 'marketplace'
      ? 'w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100'
      : 'w-16 h-16 shrink-0 border overflow-hidden'
  return (
    <div className={variant === 'marketplace' ? 'py-4 px-5 flex items-center gap-4' : 'py-5 flex items-center gap-5'}>
      <div className={thumb}>
        <MediaSlider media={item.media} fallback={item.image} aspectClass="aspect-square" containerClass={thumb} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={nameCls}>{item.name}</p>
        <p className="text-gray-500 text-sm">
          ${Number(item.price).toFixed(2)} each{item.brand ? ` · ${item.brand}` : ''}
        </p>
      </div>
      <span className="text-sm text-gray-500 font-medium">Qty {item.quantity}</span>
      <span className={priceCls}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
    </div>
  )
}

function SectionHeading({ o, num, title }) {
  const v = o.variant
  return (
    <p
      className={
        v === 'marketplace'
          ? 'px-5 py-4 font-semibold border-b border-gray-100'
          : v === 'minimal'
            ? 'uppercase tracking-[0.25em] text-xs text-gray-400 font-bold mb-6'
            : 'uppercase tracking-[0.3em] text-xs text-gray-400 font-bold mb-6'
      }
    >
      {v === 'marketplace' ? title : `${num} — ${title}`}
    </p>
  )
}

function AddressSection({ o }) {
  const v = o.variant
  const accent = RADIO_ACCENT[v]
  const addBtn =
    v === 'marketplace'
      ? 'text-primary hover:underline text-sm font-medium'
      : v === 'minimal'
        ? 'text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4'
        : 'text-sm font-semibold text-gray-600 border-b border-gray-300 pb-0.5 hover:text-black'
  return (
    <section
      className={
        v === 'marketplace'
          ? 'bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden'
          : ''
      }
    >
      {v === 'marketplace' ? (
        <h2 className="px-5 py-4 font-semibold border-b border-gray-100">Shipping address</h2>
      ) : (
        <SectionHeading o={o} num="03" title="Shipping address" />
      )}
      <div className={v === 'marketplace' ? 'p-5 space-y-3' : 'space-y-3'}>
        {o.addressesLoading ? (
          <p className="text-sm text-gray-500">Loading addresses...</p>
        ) : (
          o.addresses.map((a) => {
            const selected = o.addressId === String(a.id)
            return (
              <label
                key={a.id}
                className={`block cursor-pointer transition-colors ${selected ? CARD_SELECTED[v] : CARD_IDLE[v]} ${v === 'marketplace' ? 'border rounded-xl p-4' : v === 'minimal' ? 'border p-4' : 'p-4'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="address"
                    checked={selected}
                    onChange={() => o.selectAddress(String(a.id), a)}
                    className={`mt-1 ${accent}`}
                  />
                  <div className="text-sm">
                    <p className={v === 'editorial' ? 'font-black' : 'font-medium'}>
                      {a.full_name}
                      {a.is_default ? <span className="ml-2 text-xs text-green-600">Default</span> : null}
                    </p>
                    <p className="text-gray-600 mt-0.5">
                      {a.address_line1}
                      {a.address_line2 ? `, ${a.address_line2}` : ''}
                    </p>
                    <p className="text-gray-600">
                      {a.city}, {a.state} {a.postal_code}
                    </p>
                    <p className="text-gray-500">
                      {a.country} · {a.phone}
                    </p>
                  </div>
                </div>
              </label>
            )
          })
        )}

        <button type="button" onClick={o.toggleShowNewAddress} className={addBtn}>
          {o.showNewAddress ? 'Use saved address' : '+ Add a new address'}
        </button>

        {o.showNewAddress && <NewAddressForm o={o} />}
      </div>
    </section>
  )
}

function NewAddressForm({ o }) {
  const v = o.variant
  const input = INPUT_CLASSES[v]
  const saveBtn =
    v === 'marketplace'
      ? 'bg-primary text-white rounded-lg px-4 py-2 text-sm hover:bg-primary-dark disabled:opacity-50'
      : v === 'minimal'
        ? 'bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50'
        : 'bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 disabled:opacity-50'
  const wrap =
    v === 'marketplace'
      ? 'border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50'
      : 'border border-gray-200 p-4 space-y-3 bg-gray-50'
  return (
    <div className={wrap}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            className={input}
            placeholder="Full name"
            value={o.newAddress.full_name}
            onChange={(e) => { o.setNewAddress({ ...o.newAddress, full_name: e.target.value }); o.clearNewAddressError('full_name') }}
          />
          <FieldError name="full_name" errors={o.newAddressErrors} />
        </div>
        <div>
          <input
            className={input}
            placeholder="Phone"
            value={o.newAddress.phone}
            onChange={(e) => { o.setNewAddress({ ...o.newAddress, phone: e.target.value }); o.clearNewAddressError('phone') }}
          />
          <FieldError name="phone" errors={o.newAddressErrors} />
        </div>
      </div>
      <div>
        <input
          className={input}
          placeholder="Address line 1"
          value={o.newAddress.address_line1}
          onChange={(e) => { o.setNewAddress({ ...o.newAddress, address_line1: e.target.value }); o.clearNewAddressError('address_line1') }}
        />
        <FieldError name="address_line1" errors={o.newAddressErrors} />
      </div>
      <div>
        <input
          className={input}
          placeholder="Address line 2 (optional)"
          value={o.newAddress.address_line2}
          onChange={(e) => { o.setNewAddress({ ...o.newAddress, address_line2: e.target.value }); o.clearNewAddressError('address_line2') }}
        />
        <FieldError name="address_line2" errors={o.newAddressErrors} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            className={input}
            placeholder="City"
            value={o.newAddress.city}
            onChange={(e) => { o.setNewAddress({ ...o.newAddress, city: e.target.value }); o.clearNewAddressError('city') }}
          />
          <FieldError name="city" errors={o.newAddressErrors} />
        </div>
        <div>
          <input
            className={input}
            placeholder="State"
            value={o.newAddress.state}
            onChange={(e) => { o.setNewAddress({ ...o.newAddress, state: e.target.value }); o.clearNewAddressError('state') }}
          />
          <FieldError name="state" errors={o.newAddressErrors} />
        </div>
        <div>
          <input
            className={input}
            placeholder="Postal code"
            value={o.newAddress.postal_code}
            onChange={(e) => { o.setNewAddress({ ...o.newAddress, postal_code: e.target.value }); o.clearNewAddressError('postal_code') }}
          />
          <FieldError name="postal_code" errors={o.newAddressErrors} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            className={input}
            placeholder="Country"
            value={o.newAddress.country}
            onChange={(e) => { o.setNewAddress({ ...o.newAddress, country: e.target.value }); o.clearNewAddressError('country') }}
          />
          <FieldError name="country" errors={o.newAddressErrors} />
        </div>
        <button
          type="button"
          onClick={o.saveNewAddress}
          disabled={o.savingAddress}
          className={saveBtn}
        >
          {o.savingAddress ? 'Saving...' : 'Save & use this address'}
        </button>
      </div>
    </div>
  )
}

function ShippingSection({ o }) {
  const v = o.variant
  const accent = RADIO_ACCENT[v]
  const wrap =
    v === 'marketplace'
      ? 'bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden'
      : ''
  return (
    <section className={wrap}>
      {v === 'marketplace' ? (
        <h2 className="px-5 py-4 font-semibold border-b border-gray-100">Shipping method</h2>
      ) : (
        <SectionHeading o={o} num="04" title="Shipping method" />
      )}
      <div className={v === 'marketplace' ? 'p-5 space-y-2' : 'space-y-2'}>
        {o.quoteLoading ? (
          <p className="text-sm text-gray-500">Getting shipping rates...</p>
        ) : !o.quote ? (
          <p className="text-sm text-gray-500">Select an address to see shipping options.</p>
        ) : (
          o.quote.quotes.map((q) => {
            const selected = o.methodId === String(q.method_id)
            return (
              <label
                key={q.method_id}
                className={`block cursor-pointer transition-colors ${selected ? CARD_SELECTED[v] : CARD_IDLE[v]} ${v === 'marketplace' ? 'border rounded-xl p-4' : v === 'minimal' ? 'border p-4' : 'p-4'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={selected}
                    onChange={() => o.selectMethod(String(q.method_id), q)}
                    className={`mt-1 ${accent}`}
                  />
                  <div className="flex-1 text-sm">
                    <p className={v === 'editorial' ? 'font-black' : 'font-medium'}>
                      {q.name}
                      {q.carrier && q.carrier !== 'manual' ? (
                        <span className={`ml-2 text-xs text-gray-500 ${v === 'editorial' ? 'font-medium' : ''}`}>
                          via {q.carrier}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-gray-500">
                      {q.estimated_days_min === q.estimated_days_max
                        ? `${q.estimated_days_min} day`
                        : `${q.estimated_days_min}-${q.estimated_days_max} days`}
                      {q.description ? ` · ${q.description}` : ''}
                    </p>
                    {q.rate_error ? (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Estimated rate — live rate unavailable ({q.rate_error})
                      </p>
                    ) : null}
                  </div>
                  <span className={`${v === 'editorial' ? 'font-black' : 'font-semibold'} ${q.free ? 'text-green-600' : ''}`}>
                    {q.free ? 'Free' : formatMoney(q.fee, q.currency)}
                  </span>
                </div>
              </label>
            )
          })
        )}
      </div>
    </section>
  )
}

function ItemsSection({ o }) {
  const v = o.variant
  return (
    <section className={v === 'marketplace' ? 'bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden' : ''}>
      {v === 'marketplace' ? (
        <h2 className="px-5 py-4 font-semibold border-b border-gray-100">Items</h2>
      ) : (
        <SectionHeading o={o} num="02" title="Items" />
      )}
      <ul className={v === 'marketplace' ? 'divide-y divide-gray-100' : 'border-t border-gray-200 divide-y divide-gray-200'}>
        {o.items.map((item) => (
          <li key={item.product_id}>
            <CheckoutItemRow item={item} variant={v} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function PaymentProgress({ o }) {
  const v = o.variant
  const payment = o.stripePayment || o.razorpayPayment
  if (!payment?.order) return null
  const order = payment.order
  const items = order.items || []
  const wrap =
    v === 'marketplace'
      ? 'bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden'
      : ''
  return (
    <section className={wrap}>
      {v === 'marketplace' ? (
        <h2 className="px-5 py-4 font-semibold border-b border-gray-100">Payment</h2>
      ) : (
        <SectionHeading o={o} num="02" title="Payment" />
      )}
      <div className={v === 'marketplace' ? 'p-5 space-y-4' : 'border-t border-gray-200 p-6 space-y-4'}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Order #{order.id}</p>
          <p className="text-sm font-semibold">
            {items.length} item{items.length === 1 ? '' : 's'} · ${Number(order.total).toFixed(2)}
          </p>
        </div>
        <ul className={v === 'marketplace' ? 'divide-y divide-gray-100' : 'divide-y divide-gray-200'}>
          {items.map((item) => (
            <li key={item.id} className={v === 'marketplace' ? 'py-3 flex justify-between gap-4' : 'py-3 flex justify-between gap-4'}>
              <span className="text-sm min-w-0">
                <span className={v === 'editorial' ? 'font-bold' : 'font-medium'}>{item.name}</span>
                <span className="text-gray-500"> × {item.quantity}</span>
              </span>
              <span className="text-sm font-medium shrink-0">${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className={v === 'marketplace' ? 'border-t border-gray-100 pt-3 flex justify-between' : 'border-t border-gray-200 pt-3 flex justify-between'}>
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold">${Number(order.total).toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Complete your payment below. Your order #{order.id} is confirmed as soon as payment succeeds.
        </p>
      </div>
    </section>
  )
}

function StripePaymentForm({ o }) {
  const stripe = useStripe()
  const elements = useElements()
  const v = o.variant
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  async function pay(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setError('')
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: window.location.href },
    })
    if (result.error) {
      setError(result.error.message || 'Payment failed')
      setPaying(false)
      return
    }
    try {
      await o.confirmStripePayment()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment')
      setPaying(false)
    }
  }

  const btn =
    v === 'marketplace'
      ? 'mt-4 w-full bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50'
      : v === 'minimal'
        ? 'mt-4 w-full bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800 disabled:opacity-50'
        : 'mt-4 w-full bg-black text-white px-6 py-3 text-sm font-bold hover:bg-gray-800 disabled:opacity-50'

  return (
    <form noValidate onSubmit={pay}>
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              name: o.user?.name || '',
              email: o.user?.email || '',
              phone: o.user?.phone || '',
            },
          },
        }}
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <button type="submit" disabled={!stripe || paying} className={btn}>
        {paying ? 'Processing payment...' : 'Pay Now'}
      </button>
      <button
        type="button"
        onClick={o.cancelStripePayment}
        className="mt-2 w-full text-center text-xs text-gray-500 hover:text-gray-700"
      >
        Cancel payment
      </button>
    </form>
  )
}

function StripePaymentSection({ o }) {
  if (!o.stripePayment || !o.stripePromise) return null
  return (
    <Elements stripe={o.stripePromise} options={{ clientSecret: o.stripePayment.clientSecret }}>
      <StripePaymentForm o={o} />
    </Elements>
  )
}

const FALLBACK_RAZORPAY_METHODS = { card: true, netbanking: true, upi: true }

const FALLBACK_RAZORPAY_BANKS = [
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICIC', name: 'ICICI Bank' },
  { code: 'SBIN', name: 'State Bank of India' },
  { code: 'UTIB', name: 'Axis Bank' },
  { code: 'KKBK', name: 'Kotak Bank' },
]

function parseExpiry(value) {
  const m = value.replace(/\s+/g, '').match(/^(\d{2})[/-]?(\d{2})$/)
  if (!m) return null
  return { month: m[1], year: m[2] }
}

function RazorpayInlineForm({ o }) {
  const v = o.variant
  const { payment } = o.razorpayPayment
  const [rzp, setRzp] = useState(null)
  const [enabled, setEnabled] = useState(null)
  const [banks, setBanks] = useState([])
  const [usedFallback, setUsedFallback] = useState(false)
  const [tab, setTab] = useState('card')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [bank, setBank] = useState('')
  const readyRef = useRef(false)
  const handledRef = useRef(false)

  useEffect(() => {
    if (!payment?.key_id || !payment?.razorpay_order_id) return
    let cancelled = false
    let instance = null

    const timer = setTimeout(() => {
      if (!readyRef.current) {
        readyRef.current = true
        setEnabled(FALLBACK_RAZORPAY_METHODS)
        setBanks(FALLBACK_RAZORPAY_BANKS)
        setUsedFallback(true)
      }
    }, 5000)

    async function init() {
      if (!window.Razorpay) await loadRazorpayScript()
      if (cancelled || !window.Razorpay) return
      instance = new window.Razorpay({
        key: payment.key_id,
        image: o.settings?.site_logo || undefined,
      })
      setRzp(instance)

      instance.once('ready', (response) => {
        clearTimeout(timer)
        readyRef.current = true
        setEnabled(response.methods)
        setBanks(instance?.methods?.netbanking || [])
      })

      instance.on('payment.success', async (resp) => {
        if (handledRef.current) return
        handledRef.current = true
        setError('')
        setPaying(true)
        try {
          await o.confirmRazorpayPayment(resp)
        } catch (err) {
          handledRef.current = false
          setError(err.response?.data?.message || 'Payment could not be verified. Please try again.')
          setPaying(false)
        }
      })

      instance.on('payment.error', (resp) => {
        handledRef.current = false
        setError(resp?.error?.description || 'Payment failed. Please try again.')
        setPaying(false)
      })
    }
    init()

    return () => {
      cancelled = true
      clearTimeout(timer)
      instance?.off?.('payment.success')
      instance?.off?.('payment.error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!payment?.key_id || !payment?.razorpay_order_id) {
    return (
      <div className="border-t border-gray-100 pt-4 mt-2">
        <p className="text-xs text-red-600">Payment could not be initialized. Please try placing your order again.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'card', label: 'Cards', visible: enabled ? !!enabled.card : true },
    { id: 'netbanking', label: 'Netbanking', visible: enabled ? !!enabled.netbanking : true },
    { id: 'upi', label: 'UPI / QR', visible: enabled ? !!enabled.upi : true },
  ]
  const activeTab = tabs.find((t) => t.id === tab && t.visible)?.id || tabs.find((t) => t.visible)?.id || 'card'

  const input = INPUT_CLASSES[v]
  const tabBtn = (active) =>
    v === 'marketplace'
      ? `flex-1 py-2 text-sm font-medium rounded-lg ${active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`
      : v === 'minimal'
        ? `flex-1 py-2 text-sm font-medium ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
        : `flex-1 py-2 text-sm font-bold ${active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`
  const payBtn =
    v === 'marketplace'
      ? 'mt-4 w-full bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50'
      : v === 'minimal'
        ? 'mt-4 w-full bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800 disabled:opacity-50'
        : 'mt-4 w-full bg-black text-white px-6 py-3 text-sm font-bold hover:bg-gray-800 disabled:opacity-50'

  function pay(e) {
    e.preventDefault()
    if (!rzp || paying) return
    setError('')
    const addr = o.addresses?.find((a) => String(a.id) === o.addressId)
    const contact = o.user?.phone || addr?.phone || ''
    if (!o.user?.email || !contact) {
      setError('Please add a contact phone and email to your account before paying.')
      return
    }
    const base = {
      amount: Math.round(Number(payment.amount) * 100),
      currency: payment.currency || 'INR',
      email: o.user.email,
      contact,
      order_id: payment.razorpay_order_id,
    }
    let data
    if (activeTab === 'card') {
      const expiry = parseExpiry(card.expiry)
      const month = expiry ? Number(expiry.month) : 0
      if (!card.name.trim() || !card.number.trim() || !card.cvv.trim() || !expiry || month < 1 || month > 12) {
        setError('Please fill in all card details correctly')
        return
      }
      data = {
        ...base,
        method: 'card',
        'card[name]': card.name.trim(),
        'card[number]': card.number.replace(/\s+/g, ''),
        'card[cvv]': card.cvv.trim(),
        'card[expiry_month]': expiry.month,
        'card[expiry_year]': expiry.year,
      }
    } else if (activeTab === 'netbanking') {
      if (!bank) {
        setError('Please select your bank')
        return
      }
      data = { ...base, method: 'netbanking', bank }
    } else {
      data = { ...base, method: 'upi', upi: { qr: true, timeout: 10 } }
    }
    setPaying(true)
    rzp.createPayment(data)
  }

  return (
    <form noValidate onSubmit={pay} className="border-t border-gray-100 pt-4 mt-2 space-y-3">
      <div className="flex gap-2">
        {tabs.filter((t) => t.visible).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setError('')
            }}
            className={tabBtn(activeTab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'card' && (
        <div className="space-y-3">
          <input
            className={input}
            placeholder="Name on card"
            autoComplete="cc-name"
            value={card.name}
            onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
          />
          <input
            className={input}
            placeholder="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            value={card.number}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D+/g, '').slice(0, 16)
              setCard((c) => ({ ...c, number: digits.replace(/(\d{4})(?=\d)/g, '$1 ') }))
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Expiry (MM/YY)"
              inputMode="numeric"
              autoComplete="cc-exp"
              value={card.expiry}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D+/g, '').slice(0, 4)
                const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
                setCard((c) => ({ ...c, expiry: formatted }))
              }}
            />
            <input
              className={input}
              placeholder="CVV"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              value={card.cvv}
              onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D+/g, '').slice(0, 4) }))}
            />
          </div>
        </div>
      )}

      {activeTab === 'netbanking' && (
        <div className="space-y-3">
          <select
            className={input}
            value={bank}
            onChange={(e) => {
              setBank(e.target.value)
              setError('')
            }}
          >
            <option value="">Select your bank</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          {usedFallback && (
            <p className="text-xs text-amber-600">Couldn't load your account's bank list — showing defaults. Refresh the page to reload all banks.</p>
          )}
        </div>
      )}

      {activeTab === 'upi' && (
        <p className="text-sm text-gray-600">
          Tap Pay Now to show a QR code. Scan it with any UPI app, approve the payment, and return to this page.
        </p>
      )}

      {usedFallback && (
        <p className="text-xs text-amber-600">Couldn't load all payment methods — showing a minimal set. Refresh the page to load all options.</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button type="submit" disabled={!rzp || paying} className={payBtn}>
        {paying ? 'Processing payment...' : 'Pay Now'}
      </button>
      <button
        type="button"
        onClick={o.cancelRazorpayPayment}
        className="mt-1 w-full text-center text-xs text-gray-500 hover:text-gray-700"
      >
        Cancel payment
      </button>
    </form>
  )
}

function OrderSummaryPanel({ o }) {
  const v = o.variant
  const selectedMethod = o.quote?.quotes?.find((q) => String(q.method_id) === o.methodId)
  const shippingFee = selectedMethod ? Number(selectedMethod.fee) : 0
  const shippingLabel =
    o.quote && !selectedMethod
      ? '—'
      : selectedMethod?.free
        ? 'Free'
        : `$${shippingFee.toFixed(2)}`
  const order = o.stripePayment?.order || o.razorpayPayment?.order || null
  const displaySubtotal = order ? Number(order.subtotal) : o.subtotal
  const displayShipping = order ? Number(order.shipping_fee) : shippingFee
  const displayShippingLabel = order
    ? displayShipping === 0
      ? 'Free'
      : `$${displayShipping.toFixed(2)}`
    : shippingLabel
  const displayDiscount = order ? Number(order.discount || 0) : o.coupon?.discount || 0
  const displayTax = order
    ? Number(order.tax_fee || 0)
    : o.settings?.tax_enabled === '1'
      ? Math.round(Math.max(o.subtotal - (o.coupon?.discount || 0), 0) * (Number(o.settings?.tax_rate) || 0) / 100 * 100) / 100
      : 0
  const taxInclusive = order ? false : o.settings?.tax_inclusive === '1'
  const displayTotal = order
    ? Number(order.total)
    : Math.max(o.subtotal - (o.coupon?.discount || 0), 0) + (taxInclusive ? 0 : displayTax) + shippingFee
  const gatewayLabel =
    { razorpay: 'Razorpay', stripe: 'Stripe', test: 'Test mode' }[o.paymentConfig?.gateway] ||
    o.paymentConfig?.gateway ||
    '—'
  const wrap =
    v === 'marketplace'
      ? 'bg-white border border-gray-100 rounded-2xl shadow-xl p-6 lg:sticky lg:top-24 space-y-4'
      : v === 'minimal'
        ? 'bg-white border border-gray-200 p-5 lg:sticky lg:top-24 shadow-sm'
        : 'lg:sticky lg:top-24 bg-white p-5 shadow-[0_8px_40px_-4px_rgba(0,0,0,0.25)] ring-1 ring-black/5'
  const title =
    v === 'marketplace' ? (
      <h2 className="font-bold text-lg">Order summary</h2>
    ) : (
      <p
        className={
          v === 'minimal'
            ? 'uppercase tracking-[0.25em] text-[10px] text-gray-400 font-bold mb-4'
            : 'uppercase tracking-[0.3em] text-[10px] text-gray-400 font-bold mb-4'
        }
      >
        05 — Summary
      </p>
    )
  const btn =
    v === 'marketplace'
      ? 'w-full bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-50'
      : v === 'minimal'
        ? 'mt-5 w-full bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800 disabled:opacity-50'
        : 'mt-4 w-full bg-black text-white px-6 py-3 text-sm font-bold hover:bg-gray-800 disabled:opacity-50'
  return (
    <aside className="lg:col-span-1">
      <div className={wrap}>
        {title}
        {!order && (
          <div>
            {o.coupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-green-700">
                  {o.coupon.code} · −${o.coupon.discount.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    o.setCouponCode('')
                    o.setCoupon(null)
                  }}
                  className="text-green-700 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={o.couponCode}
                  onChange={(e) => {
                    o.setCouponCode(e.target.value)
                    if (o.couponError) o.clearCouponError()
                  }}
                  placeholder="Coupon code"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={o.applyCoupon}
                  disabled={o.applyingCoupon}
                  className="px-4 py-2 text-sm font-medium border border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white disabled:opacity-50"
                >
                  {o.applyingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {o.couponError && <p className="text-xs text-red-600 mt-1">{o.couponError}</p>}
          </div>
        )}
        <dl className={v === 'marketplace' ? 'space-y-2 text-sm' : v === 'minimal' ? 'space-y-2 text-sm' : 'space-y-1.5 text-[13px] border-b border-gray-200 pb-3'}>
          <div className="flex justify-between">
            <dt className={v === 'editorial' ? 'text-gray-500' : 'text-gray-600'}>Subtotal</dt>
            <dd className="font-medium">${displaySubtotal.toFixed(2)}</dd>
          </div>
          {displayDiscount > 0 && (
            <div className="flex justify-between">
              <dt className={v === 'editorial' ? 'text-gray-500' : 'text-green-600'}>
                {o.coupon?.code || 'Coupon'}
              </dt>
              <dd className="font-medium text-green-600">−${displayDiscount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className={v === 'editorial' ? 'text-gray-500' : 'text-gray-600'}>Shipping</dt>
            <dd className="font-medium">{displayShippingLabel}</dd>
          </div>
          {displayTax > 0 && (
            <div className="flex justify-between">
              <dt className={v === 'editorial' ? 'text-gray-500' : 'text-gray-600'}>Tax</dt>
              <dd className="font-medium">
                ${displayTax.toFixed(2)}
                {taxInclusive ? <span className="text-xs text-gray-400 ml-1">(included)</span> : null}
              </dd>
            </div>
          )}
          <div
            className={`flex justify-between items-center ${
              v === 'marketplace'
                ? 'border-t border-gray-100 pt-2 text-base'
                : v === 'minimal'
                  ? 'border-t border-gray-200 pt-4 mt-4 text-lg font-bold tracking-tight'
                  : 'pt-3 mt-1 text-lg font-black tracking-tight'
            }`}
          >
            <dt className={v === 'minimal' ? '' : v === 'marketplace' ? 'font-semibold' : ''}>Total</dt>
            <dd className={v === 'marketplace' ? 'font-bold text-xl' : ''}>
              ${displayTotal.toFixed(2)}
            </dd>
          </div>
        </dl>

        <div className={v === 'marketplace' ? 'flex items-center justify-between text-xs text-gray-500' : 'mt-4 flex items-center justify-between text-xs text-gray-500'}>
          <span>Payment</span>
          <span className={v === 'editorial' ? 'font-bold' : 'font-medium'}>{gatewayLabel}</span>
        </div>

        <p className={`text-xs text-gray-500 ${v === 'minimal' ? 'mt-3' : v === 'editorial' ? 'mt-3' : ''}`}>
          Paying as {o.user?.name} ({o.user?.email})
        </p>

        {o.stripePayment ? (
          <StripePaymentSection o={o} />
        ) : o.razorpayPayment ? (
          <RazorpayInlineForm o={o} />
        ) : (
          <button
            onClick={o.placeOrder}
            disabled={o.placing}
            className={btn}
          >
            {o.placing ? 'Placing order...' : 'Place Order & Pay'}
          </button>
        )}
        {v !== 'marketplace' && (
          <p className={`text-[11px] text-gray-400 text-center ${v === 'editorial' ? 'mt-2.5 text-[10px] font-medium' : 'mt-3'}`}>
            🔒 Secure · ↩️ Returns · 🎧 Support
          </p>
        )}
        {v === 'marketplace' && (
          <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
            <div className="text-[11px] text-gray-500">
              <p className="text-lg mb-0.5">🔒</p>Secure
            </div>
            <div className="text-[11px] text-gray-500">
              <p className="text-lg mb-0.5">↩️</p>Returns
            </div>
            <div className="text-[11px] text-gray-500">
              <p className="text-lg mb-0.5">🎧</p>Support
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ============================================================
   Layout: Marketplace
   ============================================================ */

export function MarketplaceCheckoutLayout({ o }) {
  return (
    <section className="w-full pb-20">
      <section className="w-full px-4 md:px-8 lg:px-10 pt-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-8">
          <p className="text-sm text-gray-500">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/cart" className="hover:text-primary">Cart</Link>
            <span className="mx-2">/</span>
            Checkout
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Checkout</h1>
            <p className="text-gray-500 text-sm">
              Paying as {o.user?.name} · {o.user?.email}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full px-4 md:px-8 lg:px-10 pt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {o.stripePayment || o.razorpayPayment ? (
              <PaymentProgress o={o} />
            ) : (
              <>
                <ItemsSection o={o} />
                <AddressSection o={o} />
                <ShippingSection o={o} />
              </>
            )}
            {o.error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{o.error}</p>}
          </div>
          <OrderSummaryPanel o={o} />
        </div>
      </section>
    </section>
  )
}

/* ============================================================
   Layout: Minimal Premium
   ============================================================ */

export function MinimalCheckoutLayout({ o }) {
  return (
    <section className="w-full pb-16">
      <section className="w-full px-6 md:px-10 pt-14 pb-10">
        <p className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">01 — Checkout</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Checkout</h1>
        <p className="text-gray-500 mt-3 max-w-xl">
          Paying as {o.user?.name} · {o.user?.email}
        </p>
      </section>

      <section className="w-full px-6 md:px-10">
        <div className="grid lg:grid-cols-3 gap-14">
          <div className="lg:col-span-2 space-y-12">
            {o.stripePayment || o.razorpayPayment ? (
              <PaymentProgress o={o} />
            ) : (
              <>
                <ItemsSection o={o} />
                <AddressSection o={o} />
                <ShippingSection o={o} />
              </>
            )}
            {o.error && <p className="bg-red-100 text-red-700 p-3 text-sm">{o.error}</p>}
          </div>
          <OrderSummaryPanel o={o} />
        </div>
      </section>
    </section>
  )
}

/* ============================================================
   Layout: Bold Editorial
   ============================================================ */

export function EditorialCheckoutLayout({ o }) {
  return (
    <section className="w-full pb-0">
      <section className="w-full px-4 md:px-8 py-6 border-b border-black/10">
        <p className="uppercase tracking-[0.3em] text-[10px] text-gray-400 font-bold">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/cart" className="hover:text-gray-700">Cart</Link>
          <span className="mx-2">/</span>
          Checkout
        </p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none mt-2">
          Check<span className="italic text-accent">out</span>
        </h1>
        <p className="mt-2 text-xs text-gray-500">
          Paying as {o.user?.name} · {o.user?.email}
        </p>
      </section>

      <section className="w-full px-4 md:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {o.stripePayment || o.razorpayPayment ? (
              <PaymentProgress o={o} />
            ) : (
              <>
                <ItemsSection o={o} />
                <AddressSection o={o} />
                <ShippingSection o={o} />
              </>
            )}
            {o.error && (
              <p className="bg-red-50 border border-red-600 text-red-600 p-3 text-sm font-medium">
                {o.error}
              </p>
            )}
          </div>
          <OrderSummaryPanel o={o} />
        </div>
      </section>
    </section>
  )
}
