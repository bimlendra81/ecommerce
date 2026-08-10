import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  closeCartToast,
  removeFromCart,
  selectCartToast,
  selectCartItems,
  selectCartTotal,
  selectCartCount,
} from '../features/cartSlice'
import { selectSettings } from '../features/settingsSlice'
import MediaSlider from './MediaSlider'

export default function CartPopup() {
  const dispatch = useDispatch()
  const toast = useSelector(selectCartToast)
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const count = useSelector(selectCartCount)
  const settings = useSelector(selectSettings)
  const timer = useRef(null)
  const hovering = useRef(false)
  const [closing, setClosing] = useState(false)

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      dispatch(closeCartToast())
      setClosing(false)
    }, 280)
  }, [closing, dispatch])

  useEffect(() => {
    if (!toast || hovering.current) return
    clearTimeout(timer.current)
    timer.current = setTimeout(close, 6000)
    return () => clearTimeout(timer.current)
  }, [toast, dispatch, close])

  if (!toast) return null

  const threshold = Number(settings.free_shipping_threshold || 0)
  const remaining = Math.max(0, threshold - total)
  const progress = threshold > 0 ? Math.min(100, (total / threshold) * 100) : 100

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border-2 border-primary overflow-hidden ${
        closing ? 'cart-popup-out' : 'cart-popup-in'
      }`}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => {
        hovering.current = false
        clearTimeout(timer.current)
        timer.current = setTimeout(close, 3000)
      }}
    >
      <div className="flex items-start justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        <p className="text-emerald-700 font-semibold text-sm">
          Added to cart ✓ <span className="font-normal text-emerald-600">({count} in cart)</span>
        </p>
        <button
          onClick={close}
          className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">Your cart is empty.</p>
      ) : (
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
                    onClick={() => dispatch(closeCartToast())}
                    className="font-medium text-sm truncate block hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ${Number(item.price).toFixed(2)} × {item.quantity}
                  </p>                </div>
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
              onClick={() => dispatch(closeCartToast())}
              className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              View Cart
            </Link>
            <Link
              to="/checkout"
              onClick={() => dispatch(closeCartToast())}
              className="flex-1 text-center bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-dark"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
