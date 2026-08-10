import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGetProductQuery } from '../api/storefrontApi'
import { addToCart, openCartToast } from '../features/cartSlice'
import { selectIsAuthenticated } from '../features/authSlice'
import { selectSettings } from '../features/settingsSlice'
import { deleteReview } from '../features/reviewSlice'
import { priceNow } from '../utils/price'
import {
  MarketplaceProductLayout,
  MinimalProductLayout,
  EditorialProductLayout,
} from '../components/product/ProductLayouts'

const PRODUCT_LAYOUTS = {
  marketplace: MarketplaceProductLayout,
  minimal: MinimalProductLayout,
  editorial: EditorialProductLayout,
}

export default function ProductDetail() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentData, isLoading, refetch } = useGetProductQuery(slug)
  const product = currentData?.product
  const isAuth = useSelector(selectIsAuthenticated)
  const canReview = Boolean(currentData?.canReview)
  const myReview = currentData?.myReview || null
  const settings = useSelector(selectSettings)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedFbt, setSelectedFbt] = useState([])

  useEffect(() => {
    setShowReviewForm(false)
    setMessage('')
    setError('')
    setQuantity(1)
  }, [slug])

  useEffect(() => {
    const fbtIds = (product?.frequentlyBoughtTogether || []).map((f) => f.id)
    setSelectedFbt(fbtIds)
  }, [product?.id, product?.frequentlyBoughtTogether])

  const returnDays = product?.return_days ?? settings.return_days
  const fbt = product?.frequentlyBoughtTogether || []
  const combinedTotal = useMemo(() => {
    const base = priceNow(product)
    const fbtItems = product?.frequentlyBoughtTogether || []
    const extra = fbtItems
      .filter((f) => selectedFbt.includes(f.id))
      .reduce((sum, f) => sum + priceNow(f), 0)
    return base + extra
  }, [product, selectedFbt])

  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const r of product?.reviews || []) {
      if (counts[r.rating] !== undefined) counts[r.rating] += 1
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return { counts, total }
  }, [product])

  async function handleAddToCart() {
    setMessage('')
    setError('')
    if (!isAuth) {
      navigate('/login')
      return
    }
    try {
      await dispatch(addToCart({ product_id: product.id, quantity })).unwrap()
      setMessage('Added to cart')
      dispatch(
        openCartToast({
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
        })
      )
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to add to cart')
    }
  }

  async function handleBuyNow() {
    setError('')
    if (!isAuth) {
      navigate('/login')
      return
    }
    try {
      await dispatch(addToCart({ product_id: product.id, quantity })).unwrap()
      navigate('/checkout')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to add to cart')
    }
  }

  async function handleAddAllToCart() {
    setError('')
    if (!isAuth) {
      navigate('/login')
      return
    }
    try {
      await dispatch(addToCart({ product_id: product.id, quantity: 1 })).unwrap()
      for (const f of fbt) {
        if (selectedFbt.includes(f.id)) {
          await dispatch(addToCart({ product_id: f.id, quantity: 1 })).unwrap()
        }
      }
      dispatch(
        openCartToast({
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        })
      )
      setMessage('All selected items added to cart')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to add to cart')
    }
  }

  function toggleFbt(id) {
    setSelectedFbt((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function refreshProduct() {
    await refetch()
  }

  async function handleReviewSubmitted() {
    setShowReviewForm(false)
    await refreshProduct()
  }

  async function handleReviewDeleted() {
    await dispatch(deleteReview(slug)).unwrap()
    setShowReviewForm(false)
    await refreshProduct()
  }

  if (isLoading) {
    return <p className="text-center py-20 text-gray-500">Loading product...</p>
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">Product not found</p>
        <Link to="/search" className="text-primary underline">Back to search</Link>
      </div>
    )
  }

  const inStock = product.stock > 0

  const p = {
    product,
    settings,
    returnDays,
    quantity,
    setQuantity,
    inStock,
    message,
    error,
    isAuth,
    handleAddToCart,
    handleBuyNow,
    fbt,
    selectedFbt,
    toggleFbt,
    combinedTotal,
    handleAddAllToCart,
    distribution,
    canReview,
    myReview,
    showReviewForm,
    setShowReviewForm,
    handleReviewSubmitted,
    handleReviewDeleted,
  }

  const Layout = PRODUCT_LAYOUTS[settings.home_template] || MarketplaceProductLayout

  return <Layout p={p} />
}
