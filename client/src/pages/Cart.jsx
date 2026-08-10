import { useEffect } from 'react'
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
import { useGetHomeQuery } from '../api/storefrontApi'
import { selectIsAuthenticated, selectUser } from '../features/authSlice'
import { selectSettings } from '../features/settingsSlice'
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

  useEffect(() => {
    dispatch(fetchCart())
  }, [dispatch])

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
  const shippingFee = 9.99
  const shippingFree = total >= freeThreshold
  const taxEstimate = total * 0.07
  const grandTotal = total + (shippingFree ? 0 : shippingFee) + taxEstimate

  const c = {
    items,
    count,
    total,
    freeThreshold,
    shippingFee,
    shippingFree,
    taxEstimate,
    grandTotal,
    updateQty,
    removeItem,
    handleAddToCart,
    recommended: recommended.length > 0 ? recommended : popularProducts,
  }

  const Layout = CART_LAYOUTS[settings.home_template] || MarketplaceCartLayout

  return <Layout c={c} />
}
