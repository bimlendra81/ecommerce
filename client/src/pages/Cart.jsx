import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  addToCart,
  openCartToast,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  selectCartLoading,
} from '../features/cartSlice'
import {
  fetchAddresses,
  fetchQuote,
  createAddress,
  selectAddresses,
  selectQuote,
  selectQuoteLoading,
  selectAddressesLoading,
  clearQuote,
} from '../features/shippingSlice'
import { useGetHomeQuery } from '../api/storefrontApi'
import { selectIsAuthenticated, selectUser } from '../features/authSlice'
import { selectSettings } from '../features/settingsSlice'
import { bestValueQuote } from '../utils/shipping'
import { field, useFormErrors } from '../utils/validation'
import {
  MarketplaceCartLayout,
  MinimalCartLayout,
  EditorialCartLayout,
} from '../components/cart/CartLayouts'

const CART_LAYOUTS = {
  marketplace: MarketplaceCartLayout,
  minimal: MinimalCartLayout,
  editorial: EditorialCartLayout,
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

export default function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartItems)
  const count = useSelector(selectCartCount)
  const total = useSelector(selectCartTotal)
  const isLoading = useSelector(selectCartLoading)
  const user = useSelector(selectUser)
  const { data: homeData } = useGetHomeQuery(user ? `u:${user.id}` : 'anon')
  const recommended = homeData?.recommended || []
  const popularProducts = homeData?.popularProducts || []
  const isAuth = useSelector(selectIsAuthenticated)
  const settings = useSelector(selectSettings)
  const addresses = useSelector(selectAddresses)
  const quote = useSelector(selectQuote)
  const quoteLoading = useSelector(selectQuoteLoading)
  const addressesLoading = useSelector(selectAddressesLoading)

  const cartSignature = items.map((i) => `${i.product_id}x${i.quantity}`).join(',')

  const [error, setError] = useState('')
  const [addressId, setAddressId] = useState('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState(emptyAddress)
  const [savingAddress, setSavingAddress] = useState(false)
  const {
    fieldErrors: newAddressErrors,
    validate: validateNewAddress,
    clear: clearNewAddressError,
    reset: resetNewAddressErrors,
  } = useFormErrors()

  useEffect(() => {
    dispatch(fetchCart())
  }, [dispatch])

  useEffect(() => {
    if (isAuth) {
      dispatch(fetchAddresses())
    }
  }, [dispatch, isAuth])

  useEffect(() => {
    const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
    if (isAuth && !addressId && defaultAddr) {
      setAddressId(String(defaultAddr.id))
    }
  }, [addresses, addressId, isAuth])

  useEffect(() => {
    if (!isAuth || cartSignature === '') {
      dispatch(clearQuote())
      return
    }
    if (showNewAddress) {
      const filled = newAddress.address_line1 && newAddress.city && newAddress.postal_code && newAddress.state
      if (filled) {
        dispatch(clearQuote())
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
    dispatch(clearQuote())
    dispatch(fetchQuote({ address_id: Number(addressId) }))
  }, [dispatch, isAuth, cartSignature, addressId, showNewAddress, newAddress])

  function updateQty(productId, quantity) {
    dispatch(updateCartItem({ product_id: productId, quantity }))
  }

  function removeItem(productId) {
    dispatch(removeFromCart(productId))
  }

  async function handleAddToCart(product) {
    if (!isAuth) {
      navigate('/login')
      return
    }
    try {
      await dispatch(addToCart({ product_id: product.id, quantity: 1 })).unwrap()
      dispatch(
        openCartToast({
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        })
      )
    } catch {
      // keep silent; toast handled by API errors elsewhere
    }
  }

  function selectAddress(id, address) {
    setAddressId(id)
    setNewAddress(address)
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

  if (isLoading && items.length === 0) {
    return <p className="text-center py-20 text-gray-500">Loading cart...</p>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
        <Link to="/search" className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark">
          Browse products
        </Link>
      </div>
    )
  }

  const freeThreshold = Number(settings.free_shipping_threshold) || 50
  const quotes = quote?.quotes || []
  const effectiveQuote = bestValueQuote(quotes)
  const shippingFree = (quote != null && quotes.length === 0) || Boolean(effectiveQuote?.free)
  const shippingResolved = !quoteLoading && quote != null && (shippingFree || effectiveQuote != null)
  const shippingFee = shippingFree ? 0 : effectiveQuote ? Number(effectiveQuote.fee) || 0 : 0
  let shippingEta = ''
  if (effectiveQuote && (effectiveQuote.estimated_days_min != null || effectiveQuote.estimated_days_max != null)) {
    const mn = effectiveQuote.estimated_days_min
    const mx = effectiveQuote.estimated_days_max
    shippingEta = mn === mx ? `${mn} day` : `${mn}-${mx} days`
  }
  let shippingHint = ''
  if (!isAuth) {
    shippingHint = 'Sign in to continue'
  } else if (quoteLoading) {
    shippingHint = 'Getting shipping rates...'
  } else if (!quote) {
    shippingHint = 'Select a shipping address to see shipping options'
  }
  const taxEnabled = settings.tax_enabled === '1'
  const taxRate = Number(settings.tax_rate) || 0
  const taxEstimate = taxEnabled ? Math.round(total * (taxRate / 100) * 100) / 100 : 0
  const grandTotal = total + (shippingFree ? 0 : shippingFee) + taxEstimate

  const c = {
    items,
    count,
    total,
    freeThreshold,
    shippingFee,
    shippingFree,
    shippingResolved,
    shippingHint,
    shippingCurrency: effectiveQuote?.currency || 'USD',
    shippingMethodName: effectiveQuote?.name || '',
    shippingEta,
    taxEstimate,
    grandTotal,
    updateQty,
    removeItem,
    handleAddToCart,
    recommended: recommended.length > 0 ? recommended : popularProducts,
  }

  const o = isAuth
    ? {
        variant: settings.home_template,
        addresses,
        quote,
        quoteLoading,
        addressesLoading,
        error,
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
      }
    : null

  const Layout = CART_LAYOUTS[settings.home_template] || MarketplaceCartLayout

  return <Layout c={c} o={o} />
}
