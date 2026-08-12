import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { selectCartItems, selectCartTotal, clearCart } from '../features/cartSlice'
import { selectUser } from '../features/authSlice'
import {
  fetchShippingMethods,
  fetchAddresses,
  fetchQuote,
  createAddress,
  selectAddresses,
  selectQuote,
  selectQuoteLoading,
  selectAddressesLoading,
  clearQuote,
} from '../features/shippingSlice'
import { fetchPaymentConfig, selectPaymentConfig } from '../features/paymentSlice'
import { selectSettings } from '../features/settingsSlice'
import {
  MarketplaceCheckoutLayout,
  MinimalCheckoutLayout,
  EditorialCheckoutLayout,
} from '../components/checkout/CheckoutLayouts'
import client from '../api/client'
import { loadRazorpayScript } from '../utils/razorpay'
import { field, useFormErrors } from '../utils/validation'

const CHECKOUT_LAYOUTS = {
  marketplace: MarketplaceCheckoutLayout,
  minimal: MinimalCheckoutLayout,
  editorial: EditorialCheckoutLayout,
}

const PENDING_PAYMENT_KEY = 'ecom_checkout_pending'

function readPendingPayment() {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writePendingPayment(payload) {
  try {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage unavailable (e.g. private mode) — stay in-memory only
  }
}

function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY)
  } catch {
    // ignore
  }
}

const emptyAddress = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'IN',
}

export default function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartItems)
  const subtotal = useSelector(selectCartTotal)
  const user = useSelector(selectUser)
  const addresses = useSelector(selectAddresses)
  const quote = useSelector(selectQuote)
  const quoteLoading = useSelector(selectQuoteLoading)
  const addressesLoading = useSelector(selectAddressesLoading)
  const settings = useSelector(selectSettings)
  const paymentConfig = useSelector(selectPaymentConfig)

  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [addressId, setAddressId] = useState('')
  const [methodId, setMethodId] = useState('')
  const [shippoRateId, setShippoRateId] = useState('')
  const [shippoService, setShippoService] = useState('')
  const [shippoFee, setShippoFee] = useState(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState(emptyAddress)
  const [savingAddress, setSavingAddress] = useState(false)
  const {
    fieldErrors: newAddressErrors,
    validate: validateNewAddress,
    clear: clearNewAddressError,
    reset: resetNewAddressErrors,
  } = useFormErrors()
  const [stripePayment, setStripePayment] = useState(() => {
    const p = readPendingPayment()
    if (p?.gateway !== 'stripe') return null
    return { clientSecret: p.clientSecret, intentId: p.intentId, orderId: p.orderId, order: p.order }
  })
  const [stripePromise, setStripePromise] = useState(() => {
    const p = readPendingPayment()
    return p?.gateway === 'stripe' && p.publishableKey ? loadStripe(p.publishableKey) : null
  })
  const [razorpayPayment, setRazorpayPayment] = useState(() => {
    const p = readPendingPayment()
    return p?.gateway === 'razorpay' ? { order: p.order, payment: p.payment } : null
  })
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    dispatch(fetchShippingMethods())
    dispatch(fetchAddresses())
    dispatch(fetchPaymentConfig())
  }, [dispatch])

  useEffect(() => {
    const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
    if (!addressId && defaultAddr) {
      setAddressId(String(defaultAddr.id))
    }
  }, [addresses, addressId])

  useEffect(() => {
    if (showNewAddress) {
      const filled = newAddress.address_line1 && newAddress.city && newAddress.postal_code && newAddress.state
      if (filled) {
        dispatch(fetchQuote({ shipping_address: newAddress }))
      } else {
        dispatch(clearQuote())
      }
      return
    }
    if (!addressId) {
      dispatch(clearQuote())
      return
    }
    dispatch(fetchQuote({ address_id: Number(addressId) }))
  }, [dispatch, addressId, showNewAddress, newAddress])

  useEffect(() => {
    if (quote?.quotes?.length && !methodId) {
      const first = quote.quotes[0]
      setMethodId(String(first.method_id))
      if (first.shippo_rate_id) {
        setShippoRateId(first.shippo_rate_id)
        setShippoService(first.service || '')
        setShippoFee(first.fee)
      }
    }
  }, [quote, methodId])

  useEffect(() => {
    if (items.length === 0) {
      dispatch(clearQuote())
    }
  }, [items, dispatch])

  function selectAddress(id, address) {
    setAddressId(id)
    setNewAddress(address)
  }

  function selectMethod(id, quoteItem) {
    setMethodId(id)
    setShippoRateId(quoteItem?.shippo_rate_id || '')
    setShippoService(quoteItem?.service || '')
    setShippoFee(quoteItem?.fee)
  }

  function toggleShowNewAddress() {
    setShowNewAddress((v) => !v)
  }

  async function saveNewAddress() {
    setSavingAddress(true)
    setError('')
    const rules = {
      full_name: [field.required('Full name'), field.minLen(2, 'Full name'), field.maxLen(100, 'Full name')],
      phone: [field.required('Phone'), field.maxLen(30, 'Phone')],
      address_line1: [field.required('Address line 1'), field.minLen(2, 'Address line 1'), field.maxLen(255, 'Address line 1')],
      address_line2: [field.maxLen(255, 'Address line 2')],
      city: [field.required('City'), field.maxLen(100, 'City')],
      state: [field.required('State'), field.maxLen(100, 'State')],
      postal_code: [field.required('Postal code'), field.minLen(2, 'Postal code'), field.maxLen(20, 'Postal code')],
      country: [field.required('Country'), field.minLen(2, 'Country'), field.maxLen(100, 'Country')],
    }
    if (!validateNewAddress(rules, newAddress)) {
      setSavingAddress(false)
      return
    }
    try {
      const result = await dispatch(createAddress(newAddress)).unwrap()
      setAddressId(String(result.id))
      setShowNewAddress(false)
      setNewAddress(emptyAddress)
      resetNewAddressErrors()
    } catch (err) {
      setError(err)
    } finally {
      setSavingAddress(false)
    }
  }

  async function applyCoupon() {
    setCouponError('')
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code')
      return
    }
    setApplyingCoupon(true)
    try {
      const { data } = await client.post('/coupons/validate', {
        code: couponCode,
        subtotal,
      })
      setCoupon(data.coupon)
    } catch (err) {
      setCoupon(null)
      setCouponError(err.response?.data?.message || 'Invalid coupon')
    } finally {
      setApplyingCoupon(false)
    }
  }

  async function placeOrder() {
    setError('')
    if (!addressId && !showNewAddress) {
      setError('Please select a shipping address')
      return
    }
    if (showNewAddress) {
      const rules = {
        full_name: [field.required('Full name'), field.minLen(2, 'Full name'), field.maxLen(100, 'Full name')],
        phone: [field.required('Phone'), field.maxLen(30, 'Phone')],
        address_line1: [field.required('Address line 1'), field.minLen(2, 'Address line 1'), field.maxLen(255, 'Address line 1')],
        address_line2: [field.maxLen(255, 'Address line 2')],
        city: [field.required('City'), field.maxLen(100, 'City')],
        state: [field.required('State'), field.maxLen(100, 'State')],
        postal_code: [field.required('Postal code'), field.minLen(2, 'Postal code'), field.maxLen(20, 'Postal code')],
        country: [field.required('Country'), field.minLen(2, 'Country'), field.maxLen(100, 'Country')],
      }
      if (!validateNewAddress(rules, newAddress)) {
        setError('Please fix the highlighted address fields')
        return
      }
    }
    if (!methodId) {
      setError('Please select a shipping method')
      return
    }
    setPlacing(true)
    try {
      const body = { shipping_method_id: Number(methodId) }
      if (shippoRateId) {
        body.shippo_rate_id = shippoRateId
        body.shipping_service = shippoService
        body.shipping_fee = shippoFee
      }
      if (showNewAddress) {
        body.shipping_address = newAddress
      } else {
        body.address_id = Number(addressId)
      }
      if (coupon) {
        body.coupon_code = coupon.code
      }

      const { data } = await client.post('/orders', body)
      dispatch(clearCart())

      const { data: pay } = await client.post('/payment/create-order', {
        order_id: data.order.id,
      })

      if (pay.test) {
        await client.post('/payment/test-confirm', { order_id: data.order.id })
        navigate('/orders', { state: { success: true, orderId: data.order.id } })
        return
      }

      if (pay.gateway === 'stripe') {
        const stripeState = {
          clientSecret: pay.client_secret,
          intentId: pay.intent_id,
          orderId: pay.order_id,
          order: data.order,
        }
        setStripePayment(stripeState)
        setStripePromise(loadStripe(pay.publishable_key))
        writePendingPayment({ gateway: 'stripe', ...stripeState, publishableKey: pay.publishable_key })
        setPlacing(false)
        return
      }

      if (pay.gateway === 'razorpay') {
        await loadRazorpayScript()
        const rzpState = {
          order: data.order,
          payment: pay,
        }
        setRazorpayPayment(rzpState)
        writePendingPayment({ gateway: 'razorpay', ...rzpState })
        setPlacing(false)
        return
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order')
      setPlacing(false)
    }
  }

  async function confirmStripePayment() {
    await client.post('/payment/verify', {
      order_id: stripePayment.orderId,
      payment_intent_id: stripePayment.intentId,
    })
    clearPendingPayment()
    navigate('/orders', { state: { success: true, orderId: stripePayment.orderId } })
  }

  function cancelStripePayment() {
    setStripePayment(null)
    setStripePromise(null)
    clearPendingPayment()
    setPlacing(false)
    navigate('/orders')
  }

  async function confirmRazorpayPayment(response) {
    await client.post('/payment/verify', {
      order_id: razorpayPayment.order.id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    })
    clearPendingPayment()
    navigate('/orders', { state: { success: true, orderId: razorpayPayment.order.id } })
  }

  function cancelRazorpayPayment() {
    setRazorpayPayment(null)
    clearPendingPayment()
    setPlacing(false)
    navigate('/orders')
  }

  if (items.length === 0 && !stripePayment && !razorpayPayment) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
        <Link to="/search" className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark">
          Browse products
        </Link>
      </div>
    )
  }

  const o = {
    variant: settings.home_template,
    settings,
    items,
    subtotal,
    user,
    addresses,
    quote,
    quoteLoading,
    addressesLoading,
    error,
    placing,
    addressId,
    selectAddress,
    showNewAddress,
    toggleShowNewAddress,
    newAddress,
    setNewAddress,
    savingAddress,
    saveNewAddress,
    newAddressErrors,
    clearNewAddressError,
    methodId,
    selectMethod,
    placeOrder,
    couponCode,
    setCouponCode,
    coupon,
    couponError,
    clearCouponError: () => setCouponError(''),
    applyingCoupon,
    applyCoupon,
    paymentConfig,
    stripePayment,
    stripePromise,
    confirmStripePayment,
    cancelStripePayment,
    razorpayPayment,
    confirmRazorpayPayment,
    cancelRazorpayPayment,
  }

  const Layout = CHECKOUT_LAYOUTS[settings.home_template] || MarketplaceCheckoutLayout

  return <Layout o={o} />
}
