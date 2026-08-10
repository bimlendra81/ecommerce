import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  fetchWishlist,
  removeFromWishlist,
  selectWishlistItems,
  selectWishlistLoading,
} from '../features/wishlistSlice'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const dispatch = useDispatch()
  const items = useSelector(selectWishlistItems)
  const isLoading = useSelector(selectWishlistLoading)

  useEffect(() => {
    dispatch(fetchWishlist())
  }, [dispatch])

  if (isLoading && items.length === 0) {
    return <p className="text-center py-20 text-gray-500">Loading wishlist...</p>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600 mb-4">Your wishlist is empty</p>
        <Link to="/search" className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark">
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">
        My Wishlist <span className="text-gray-400 text-lg font-normal">({items.length})</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.product_id} className="relative">
            <button
              onClick={() => dispatch(removeFromWishlist(item.product_id))}
              className="absolute -top-2 -left-2 z-10 bg-white border border-gray-200 text-gray-500 hover:text-red-600 rounded-full h-8 w-8 flex items-center justify-center shadow"
              aria-label={`Remove ${item.name} from wishlist`}
              title="Remove"
            >
              ✕
            </button>
            <ProductCard product={{ ...item, id: item.product_id }} />
          </div>
        ))}
      </div>
    </section>
  )
}
