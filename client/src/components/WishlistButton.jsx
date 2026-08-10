import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addToWishlist, removeFromWishlist, selectIsWishlisted } from '../features/wishlistSlice'
import { selectIsAuthenticated } from '../features/authSlice'

export default function WishlistButton({ productId, className = '', label = false }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuth = useSelector(selectIsAuthenticated)
  const isWishlisted = useSelector(selectIsWishlisted(productId))

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuth) {
      navigate('/login')
      return
    }
    if (isWishlisted) {
      await dispatch(removeFromWishlist(productId)).unwrap()
    } else {
      await dispatch(addToWishlist(productId)).unwrap()
    }
  }

  return (
    <button
      onClick={toggle}
      style={{ color: isWishlisted ? '#dc2626' : undefined }}
      className={`flex items-center justify-center gap-1.5 rounded-full ${className}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={isWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {label && <span className="text-sm">{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>}
    </button>
  )
}
