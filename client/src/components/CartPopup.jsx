import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  closeCartToast,
  selectCartPanelOpen,
  selectCartToast,
  selectCartCount,
} from '../features/cartSlice'
import CartPanelContent from './cart/CartPanelContent'

export default function CartPopup() {
  const dispatch = useDispatch()
  const toast = useSelector(selectCartToast)
  const panelOpen = useSelector(selectCartPanelOpen)
  const count = useSelector(selectCartCount)
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

  if (!toast || panelOpen) return null

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

      <CartPanelContent onClose={close} />
    </div>
  )
}
