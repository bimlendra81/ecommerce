import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { removeFromCart, selectCartItems, selectCartTotal } from '../../features/cartSlice'
import { selectSettings } from '../../features/settingsSlice'
import MediaSlider from '../MediaSlider'

export default function CartPanelContent({ onClose }) {
  const dispatch = useDispatch()
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const settings = useSelector(selectSettings)

  const threshold = Number(settings.free_shipping_threshold || 0)
  const remaining = Math.max(0, threshold - total)
  const progress = threshold > 0 ? Math.min(100, (total / threshold) * 100) : 100

  if (items.length === 0) {
    return <p className="p-6 text-center text-sm text-gray-500">Your cart is empty.</p>
  }

  return (
    <>
      <ul className="max-h-44 overflow-y-auto divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.product_id} className="flex gap-3 items-center px-4 py-3">
            <div className="shrink-0 w-16 h-16">
              <MediaSlider
                media={item.media}
                fallback={item.image || 'https://placehold.co/200x200?text=Product'}
                aspectClass="aspect-square"
                containerClass="h-16 w-16"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${item.slug}`}
                onClick={onClose}
                className="font-medium text-sm truncate block hover:text-primary"
              >
                {item.name}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">
                ${Number(item.price).toFixed(2)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-800 shrink-0">
              ${(Number(item.price) * item.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => dispatch(removeFromCart(item.product_id))}
              className="text-gray-400 hover:text-red-600 text-base leading-none shrink-0"
              aria-label={`Remove ${item.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 pt-1">
        {remaining > 0 ? (
          <p className="text-xs text-gray-500">
            Add <span className="font-semibold text-gray-700">${remaining.toFixed(2)}</span> more for
            free shipping
          </p>
        ) : (
          <p className="text-xs text-emerald-600 font-medium">🎉 You've unlocked free shipping!</p>
        )}
        <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-2 border-t mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-500">Total</span>
        <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Link
          to="/cart"
          onClick={onClose}
          className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
        >
          View Cart
        </Link>
        <Link
          to="/checkout"
          onClick={onClose}
          className="flex-1 text-center bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-dark"
        >
          Checkout
        </Link>
      </div>
    </>
  )
}
